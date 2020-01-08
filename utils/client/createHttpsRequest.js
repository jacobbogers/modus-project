const https = require('https');

const agent = new https.Agent({
    keepAlive: true,
    maxFreeSockets: 1000,
});

module.exports = function createHttpsRequest(host, port, method, path, headers) {
    const finalOptions = {
        agent,
        host,
        port,
        path,
        method,
        setHost: false, // otherwise it will overwrite the "host" header
        headers,
    };
    // always FORCE host regardless of "setHost" setting
    // node is not fully http complient doesnt put a host header in there automaticly
    finalOptions.headers.host = port ? `${host}:${port}` : `${host}`;
    return https.request(finalOptions);
};
