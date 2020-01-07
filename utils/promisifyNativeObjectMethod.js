module.exports = function promisifyNativeObjectMethod (obj, method, ...args) {
    return new Promise((resolve, reject) => {
        try {
            obj[method](...args, (err, data) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(data);
            });
        } catch (err) {
            reject(err);
        }
    });
};
