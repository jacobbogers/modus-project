module.exports = function bleedReadable(readable) {
    const data = [];
    readable.setEncoding('utf8')
    return new Promise((resolve, reject) => {
        readable.on('data', chunk => {
            data.push(chunk);
        });

        readable.on('end', () => {
            resolve([data.join(''), null]);
        });

        readable.on('close', () => {
            resolve([data.join(''), null]);
        });

        readable.on('error', err => {
            reject([null, err]);
        });
    });
};
