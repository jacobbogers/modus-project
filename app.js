const http = require('http');
// "promisify" from util doesnt work on response.end() doesnt work with reponse.end
const promisifyNativeObjectMethod = require('./utils/promisifyNativeObjectMethod');

const colors = require('colors/safe');

const safe = require('./utils/safe');
const createServer = require('./utils/server/createServer');
const createLogger = require('./utils/createLogger');
const State = require('./utils/State');
const bleedReadable = require('./utils/bleedReadable');
const createHttpsRequest = require('./utils/client/createHttpsRequest');
const createHttpClient = require('./utils/client/createHttpClient');
const JSONParseSafe = require('./utils/JSONParseSafe');

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


const host = process.env.NGTSA_HOST || 'one.nhtsa.gov'; //
const ngtsaRequest = createHttpClient(createHttpsRequest, logger, { host });

// middleware helper, fetch safetyratings

async function fetchSafetyRating(vehicleDataArray){
    const host = process.env.NGTSA_HOST || 'one.nhtsa.gov'; //
    //T https://one.nhtsa.gov/webapi/api/SafetyRatings/VehicleId/<VehicleId>?format=json
    // no await so fire fetching data in parallel
    for(const vehicle of vehicleDataArray){
        const path = `/webapi/api/SafetyRatings/VehicleId/${vehicle.VehicleId}?format=json`;
        vehicle.promise = ngtsaRequest('get', path, {}, ''); 
    }
    // process 
    for(const vehicle of vehicleDataArray){
        const [resultRaw, error] = await vehicle.promise;
        delete vehicle.promise;
        if (error) {
            continue; //Skip
        }
        const apiResult = JSONParseSafe(resultRaw);
        if (!apiResult) {
            continue; //Skip
        }
        vehicle.CrashRating = apiResult.Results[0].OverallRating;
    }
}

// general middleware handler
async function middleware(req, resp, params) {
    //checks
    const method = req.method.toLowerCase();
    let apiPath;
    if (!['post', 'get'].includes(method)) {
        throw new Error(`wrong http-verb used, ${method}`);
    }
    const withRating = params.withRating ? params.withRating.toLowerCase() : undefined;
    if (!['true', 'false'].includes(withRating)) {
        throw new Error(`wrong withRating value, not true or false, [${withRating}]`);
    }
    //post
    if (method === 'post') { // get the body
        const [bodyRaw, error] = await bleedReadable(req);
        if (error) {
            throw error; // let default handler handle it
        }
        const body = JSONParseSafe(bodyRaw); // if the json is invalid it will throw , logged and final handler will be called
        if (!body) {
            throw new Error(`Could not parse request body ${bodyRaw}`);
        }
        const { modelYear, manufacturer, model } = body;
        if (!modelYear || !manufacturer || !model) {
            throw new Error(`json body must contain "modelYear", "manufacturer" and "model"`);
        }
        apiPath = `/webapi/api/SafetyRatings/modelyear/${modelYear}/make/${manufacturer}/model/${model}?format=json`;
    }
    else { //get
        const { year, manufacturer, model } = params;
        if (!year || !manufacturer || !model) {
            throw new Error(`request params must contain "modelYear", "manufacturer" and "model"`);
        }
        apiPath = `/webapi/api/SafetyRatings/modelyear/${year}/make/${manufacturer}/model/${model}?format=json`;
    }
 
    const [resultRaw, error] = await ngtsaRequest('get', apiPath, {}, '');
    if (error) {
        throw error;
    }
    const apiResult = JSONParseSafe(resultRaw);
    if (!apiResult) {
        throw new Error(`Could not parse "nhtsa" response data: ${resultRaw}`);
    }
    const response = {
        Count: 0,
        Results: []
    }
    // how many results do we have?
    if (apiResult.Count > 0 && Array.isArray(apiResult.Results) && apiResult.Results.length > 0) {
        response.Results = apiResult.Results.map(car => ({ Description: car.VehicleDescription, VehicleId: car.VehicleId }));
        response.Count = response.Results.length;
    }

    if (withRating === 'true') {
        await fetchSafetyRating(response.Results);
    }

    const responseData = JSON.stringify(response);
    resp.writeHead(200, {
        'Content-Type': 'application/json',
        'Content-Length': responseData.length
    });
    await safe(promisifyNativeObjectMethod(resp, 'end', responseData));
}


async function startServer() {

    const state = new State();

    const { addMw, final, httpServer } = createServer(createServerSocket, logger, state);

    // register "middlewares"

    final(async (req, resp) => {
        resp.statusCode = 404;
        const data = JSON.stringify({
            Count: 0,
            Results: []
        });
        resp.writeHead(200, {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        });
        await safe(promisifyNativeObjectMethod(resp, 'end', data));
    });

   

    addMw('/vehicles/:year/:manufacturer/:model?:withRating', 'get', middleware);
    addMw('/vehicles/:year/:manufacturer/:model', 'get', middleware);
    addMw('/vehicles', 'post', middleware);

    // startup
    httpServer.listen(8080);
    await state.waitForState('ready');
    logger.info('Server listening on 8080');
}

startServer();