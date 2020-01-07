const http = require('http');
// "promisify" from util doesnt work on response.end() doesnt work with reponse.end
const promisifyNativeObjectMethod = require('./utils/promisifyNativeObjectMethod');

const colors = require('colors/safe');

const safe = require('./utils/safe');
const createServer = require('./utils/createServer');
const createLogger = require('./utils/createLogger');
const State = require('./utils/State');
const bleedReadable = require('./utils/bleedReadable');
const createHttpRequest = require('./utils/createHttpRequest');
const createHttpClient = require('./utils/createHttpClient');


async function startServer() {
    // composition makes things testable
    function createServerSocket() {
        return http.createServer(); // in case of testing this would be replaced by a mock
    }

    function format(text) {
        return `[${new Date().toUTCString()}]: ${text}`
    }

    // the logger is now pluggable, use log4j or something else
    const logger = createLogger({
        log: text => console.log(colors.green(format(text))),
        error: text => console.log(colors.red(format(text))),
        warn: text => console.log(colors.yellow(format(text))),
        info: text => console.log(colors.cyan(format(text))),
    })

    const state = new State();

    const { addMw, final, httpServer } = createServer(createServerSocket, logger, state);

    final(async (req, resp) => {
        resp.statusCode = 404;
        await safe(promisifyNativeObjectMethod(resp, 'end', http.STATUS_CODES[404]));
    });

    addMw('/something', 'get', async (req, resp) => {
        resp.statusCode = 404;
        await safe(promisifyNativeObjectMethod(resp, 'end', http.STATUS_CODES[404]));
    });


    addMw('/something-else', 'post', async (req, resp) => {
        const [data, error] = await safe(bleedReadable(req));
        console.log(data, error);
        console.log(req.headers);
        resp.statusCode = 200;
        await safe(promisifyNativeObjectMethod(resp, 'end', 'hello-world'));
        //const createHttpRequest = require('./utils/createHttpRequest');
        //const createHttpClient = require('./utils/createHttpClient');
    });

    httpServer.listen(8080);
    await state.waitForState('ready');
    logger.info('Server listening on 8080');
}

startServer();