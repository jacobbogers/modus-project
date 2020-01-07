module.exports = function writeToStreamAndEnd(writable, data) {
    
    return new Promise(resolve => {
        writable.on('error', err => {
            resolve([null, err]);
        });
        writable.on('abort', err => {
            resolve([null, `connection aborted with argument:[${String(err)}]`]);
        });
        writable.on('close', err => {
            resolve([null, `connection closed with error:[${String(err)}]`]);
        });
        writable.end(data, 'utf8', () => {
            resolve([true, null]);
        });
    });
};