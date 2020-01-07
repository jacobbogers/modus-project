'use strict';

module.exports = function (instance, stopAtPrototype = 'EventEmitter') {
    function bindRecursive (obj) {
        const proto = Object.getPrototypeOf(obj);
        if (proto.constructor.name === stopAtPrototype) {
            return;
        }
        Object.getOwnPropertyNames(proto).forEach(prop => {
            if (typeof proto[prop] === 'function' && prop !== 'constructor') {
                if (!instance.hasOwnProperty(prop)) {
                    instance[prop] = proto[prop].bind(instance);
                }
            }
        });
        return bindRecursive(proto);
    }
    bindRecursive(instance);
};
