const http = require('http');

const agent = new http.Agent({
    keepAlive: true,
    maxFreeSockets: 1000,
});

module.exports = function createHttpRequest(host, port, method, path, headers, proxyHost, proxyPort) {
    const finalOptions = {
        agent,
        host: proxyHost ? proxyHost : host,
        port: proxyHost ? proxyPort || 80 : port || 80,
        path,
        method,
        setHost: false, // otherwise it will overwrite the "host" header
        headers,
    };
    // always FORCE host regardless of "setHost" setting
    finalOptions.headers.host = port ? `${host}:${port}` : `${host}`;
    return http.request(finalOptions);
};
