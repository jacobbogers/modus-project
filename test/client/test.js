'use strict';

const URL = require('url');

const mocha = require('mocha');
const chaiAsPromised = require('chai-as-promised');
const chai = require('chai');

chai.should();
chai.use(chaiAsPromised);
const { expect } = chai;

const State = require('../../utils/State');
const createLogger = require('../../utils/createLogger');
const createHttpsRequest = require('../../utils/client/createHttpsRequest');
const createHttpClient = require('../../utils/client/createHttpClient');

//const apiHost = `https://one.nhtsa.gov/`
//const webapi/api/SafetyRatings/modelyear/`; 

describe('external api-test', function () {
    const logs = [];
    const logger = createLogger({
        log: text => logs.push(text),
        error: text => logs.push(text),
        warn: text => logs.push(text),
        info: text => logs.push(text),
    });

    describe('stateManager', async () => {
        it('fetch vehicles tesla model 3 from 2019', async () => {
            // https://one.nhtsa.gov/webapi/api/SafetyRatings/modelyear/2018/make/tesla/model/MODEL%203
            const host = 'one.nhtsa.gov';
            const path = '/webapi/api/SafetyRatings/modelyear/2018/make/tesla/model/model 3?format=json';
            const send = createHttpClient(createHttpsRequest, logger, { host });
            const [result, error] = await send('get', path, {}, '');
            const parsedResult = JSON.parse(result);
            expect(error).to.be.undefined;
            expect(parsedResult).to.deep.equal({
                Count: 2,
                Message: 'Results returned successfully',
                Results:
                    [{
                        VehicleDescription: '2018 Tesla Model 3 4 DR AWD',
                        VehicleId: 12816
                    },
                    {
                        VehicleDescription: '2018 Tesla Model 3 4 DR RWD',
                        VehicleId: 12778
                    }]
            });
        });
    });
});