'use strict';

const mocha = require('mocha');
const chaiAsPromised = require('chai-as-promised');
const chai = require('chai');

chai.should();
chai.use(chaiAsPromised);
const { expect } = chai;
const State = require('../../utils/State');
const createLogger = require('../../utils/createLogger');

describe('utilities/helpers', function () {
    describe('stateManager', async () => {
        it('check initial state', () => {
            const stateMan = new State();
            expect(stateMan.getState()).to.equal('init');
        });
        it('check initial state set to "ready"', () => {
            const stateMan = new State('ready');
            expect(stateMan.getState()).to.equal('ready');
        });
        it('set state to "step 1" wait for change', async () => {
            const stateMan = new State();
            const promiseWait = stateMan.waitForState('ready');
            stateMan.setState('ready');
            const result = await promiseWait;
            expect(result).to.deep.equal([true, undefined]);
        });
        it('set state to "step 1" but timeout after 10ms', async () => {
            const stateMan = new State();
            const [ ok, { ts, actual }] = await stateMan.waitForState('ready', 10);
            expect(ok).to.be.undefined;
            expect(ts).to.equal(10);
            expect(actual).to.at.least(10);
        });
    });
    describe('createLogger', async () => {
        
        const logger = createLogger({
            log: text => `LOG:${text}`,
            error: text =>  `ERR:${text}`,
            warn: text =>  `WRN:${text}`,
            info: text => `INFO:${text}`,
        });

        it('test defined logging functions', () => {
            const result = logger.log('hello world');
            expect(result).to.equal('LOG:hello world');
            
            const result1 = logger.error('hello world');
            expect(result1).to.equal('ERR:hello world');

            const result2 = logger.warn('hello world');
            expect(result2).to.equal('WRN:hello world');
        });
        it('test undefined logging functions', () => {
            const result = logger.doesnt_exist('hello world');
            expect(result).to.equal('[doesnt_exist] is not a defined logging facility, defaulting to console.log hello world');
        });
    });
});