
//node
const { STATUS_CODES } = require('http');


//3rd party
const { Path } = require('path-parser');

//app
const bleedReadable = require('./bleedReadable');
const safe = require('./safe');
const stripCtrlCodes = require('./stripCtrlCodes');
const bindMethods = require('./bindMethods');
const asPromiseSafe = require('./asPromiseSafe');


// do not add event listeners twice
const wrap = s => (event, handler) => {
    if (s.listenerCount(event) > 0) {
        return;
    }
    s.on(event, handler);
};

function createHttpServerDecorator(
    logger,
    stateManager
) {
    return function decorateServerSocket(ss) {
        // protect against multiple calls of above function, make the call idempotent
        // TODO: make rebind logic when server failure
        const on = wrap(ss);

        const handlers = new Map(); // handlers

        let handler404;

        on('clientError', async (err, socket) => {
            const errMsg = `[http-local][dcr01][client-error][${stripCtrlCodes(String(err))}]`;
            logger.error(errMsg);
            await safe(promisify(socket.end)('HTTP/1.1 400 Bad Request\r\n\r\n'));
        });

        on('error', async err => {
            const errMsg = stripCtrlCodes('[http-local][dcr03][error]' + (err ? `[${String(err)}]` : ''));
            logger.error(errMsg);
        });

        on('close', async err => {
            const errMsg = stripCtrlCodes('[http-server][dcr04][close]' + (err ? `[${String(err)}]` : ''));
            logger.error(errMsg);
            stateManager.setState('closed');
            //TODO: any restart logic goes here
        });
        on('listening', () => {
            stateManager.setState('ready');
        });
        // seperate this from, incomming request
        on('request', async (req, res) => {
            const { method, url } = req;
            const actualVerb = method.toLowerCase();
            // loop over
            let matched = 0;
            for (const [pattern, set] of handlers) {
                for (const { handler, tester, verb } of set) {
                    if (actualVerb === verb) {
                        const urlParams = tester.test(url);
                        if (urlParams) {
                            matched++;
                            logger.log(`matched ${url}`);
                            handler(req, res, urlParams);
                        }
                    }
                }
            }
            // return 404 if no match was found
            if (matched === 0) {
                if (handler404 === undefined) {
                    res.statusCode = 404;
                    await safe(promisify(res.end)(STATUS_CODES[404]));
                }
                else {
                    const [, err] = await asPromiseSafe(handler404, req, res);
                    if (err) {
                        const errMsg = `[http-server][dcr06][catch-all function failed with error][${String(err)}]`;
                        logger.error(errMsg);
                    }
                }
            }
        });

        return {
            addMw(pattern, verb, handler) {
                const set = handlers.get(pattern) || new Set();
                set.add({ verb, handler, tester: new Path(pattern) });
                handlers.set(pattern, set);
            },
            removeMw(pattern, verb, handler) {
                let deleted = 0;
                const set = handlers.get(pattern);
                if (set) {
                    for (const app of set) {
                        if (app.verb === verb) {
                            if (handler === undefined) {
                                set.delete(app);
                                deleted++;
                            }
                            else if (app.handler === handler)
                                set.delete(app);
                            deleted++;
                        }
                    }
                }
                return deleted;
            },
            final(fn) {
                handler404 = fn;
            },
            getAllMw() {
                const rc = {};
                for (const [key, value] of handlers) {
                    rc[key] = Array.from(value);
                };
                return rc;
            },
            httpServer: ss
        };
    };
}

module.exports = createHttpServerDecorator;
