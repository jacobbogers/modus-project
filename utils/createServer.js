'use strict';
const http = require('http');
const createHttpServerDecorator = require('./createHttpServerDecorator');



// use injection, its good for testing
function httpServer(createHttpServer, logger, stateManager){
    const server = createHttpServer();
    const decorator = createHttpServerDecorator(logger,stateManager);
    return decorator(server);
}

module.exports = httpServer;