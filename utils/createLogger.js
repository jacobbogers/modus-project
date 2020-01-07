module.exports = function createLogger(map = {}){

    const createDummyFacility = prop => text => {
        const errMsg = `[${prop}] is not a defined logging facility, defaulting to console.log ${text}`;
        console.warn(errMsg);
        return errMsg;
    }

    return new Proxy({},{
        [Symbol.toPrimitive]: function ( /*hint*/) {
            return 'Object [logger]'; 
        },
        set: function () {
            throw new TypeError(`cannot use assignment in this context`);
        },
        get: function (target /* the primer, or fn in the chain */, prop, receiver /* Proxy */) {
            if (prop === Symbol.toPrimitive) {
                return this[prop];
            }
            const fn = map[prop];
            if (fn){
                return fn;
            }
            return createDummyFacility(prop);
        }
    });
}