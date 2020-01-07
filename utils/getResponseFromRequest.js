module.exports = async function getResponseFromRequest(clientReq) {
    return new Promise(resolve => {
        clientReq.on('response', incMessage => {
            resolve([incMessage, null]);
        });
        clientReq.on('abort', () => resolve([null, 'clientRequest(writable stream) was aborted']));
        clientReq.on('error', error => resolve([null, error]));
    });
};