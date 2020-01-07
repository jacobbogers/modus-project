const EventEmitter = require('events');

const bindMethods = require('./bindMethods');

module.exports = class State extends EventEmitter {
    constructor(initialState = 'init') {
        super();
        this.state = initialState;
        bindMethods(this);
    }

    setState(newState, ...args) {
        this.state = newState;
        this.emit(newState, ...args);
    }

    getState() {
        return this.state;
    }

    waitForState(value, ts) {
        const start = Date.now();
        return new Promise(resolve => {
            // create unique function instance
            const fireOnce = () => {
                resolve([true, undefined]);
            };
            if (ts) {
                setTimeout(() => {
                    const actual = Date.now() - start;
                    this.removeListener(value, fireOnce);
                    resolve([undefined, { ts, actual }]);
                }, ts);
            }
            this.once(value, fireOnce);
        });
    }
}