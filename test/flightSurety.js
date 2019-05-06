var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');


contract('Flight Surety Tests', async (accounts) => {




  var config;
  var ts = 1557093518;
  var passengeer1;
  var passengeer2;
  var passengeer3;
  var passengeer4;
  var passengeer5;
  var airline2;
  var airline3;
  var airline4;
  var airline5;
  before('setup contract', async () => {
    config = await Test.Config(accounts);
    await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
    passengeer1 = accounts[6];
    passengeer2 = accounts[7];
    passengeer3 = accounts[8];
    passengeer4 = accounts[9];
    passengeer5 = accounts[10];
    airline2 = accounts[2];
    airline3 = accounts[3];
    airline4 = accounts[4];
    airline5 = accounts[5];
  });

  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/

  it(`(multiparty) has correct initial isOperational() value`, async function () {

    // Get operating status
    let status = await config.flightSuretyData.isOperational.call();
    assert.equal(status, true, "Incorrect initial operating status value");

  });

  it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {

    // Ensure that access is denied for non-Contract Owner account
    let accessDenied = false;
    try {
      await config.flightSuretyData.setOperatingStatus(false, { from: config.testAddresses[2] });
    }
    catch (e) {
      accessDenied = true;
    }
    assert.equal(accessDenied, true, "Access not restricted to Contract Owner");

  });

  it(`(multiparty) can allow access to setOperatingStatus() for Contract Owner account`, async function () {

    // Ensure that access is allowed for Contract Owner account
    let accessDenied = false;
    try {
      await config.flightSuretyData.setOperatingStatus(false);
    }
    catch (e) {
      accessDenied = true;
    }
    assert.equal(accessDenied, false, "Access not restricted to Contract Owner");

  });

  it(`(multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {

    await config.flightSuretyData.setOperatingStatus(false);

    let reverted = false;
    try {
      await config.flightSurety.setTestingMode(true);
    }
    catch (e) {
      reverted = true;
    }
    assert.equal(reverted, true, "Access not blocked for requireIsOperational");

    // Set it back for other tests to work
    await config.flightSuretyData.setOperatingStatus(true);

  });

  it('(airline) cannot register an Airline using registerAirline() if it is not funded', async () => {

    // ARRANGE
    let newAirline = accounts[2];

    // ACT
    try {
      await config.flightSuretyApp.registerAirline(newAirline, { from: config.firstAirline });
    }
    catch (e) {

    }
    let result = await config.flightSuretyData.isRegistered.call(newAirline);

    // ASSERT
    assert.equal(result, false, "Airline should not be able to register another airline if it hasn't provided funding");

  });

  it('Fund Airline', async () => {

    // ACT
    try {
      await config.flightSuretyApp.fundAirline({ from: config.firstAirline, value: web3.utils.toWei('10', 'ether'), gasPrice: 0 });
    }
    catch (e) {
      console.log(e)
    }

    let result = await config.flightSuretyData.isFunded.call(config.firstAirline);

    assert.equal(result, true, "Error in funding ariline");


  });

  it('Register Airline', async () => {
    // ACT
    try {
      await config.flightSuretyApp.registerAirline(airline2, { from: config.firstAirline });
    }
    catch (e) {
      console.log(e)
    }

    let result = await config.flightSuretyData.isRegistered.call(airline2);

    assert.equal(result, true, "Error in registring ariline");


  });

  it('Register passenger', async () => {

    let p = [passengeer1, passengeer2, passengeer3, passengeer4, passengeer5];
    // ACT
    try {
      for (let i=0 ; i<p.length ; i++){
      await config.flightSuretyApp.registerPassenger(p[i], { from: config.firstAirline });
      }
    }
    catch (e) {
      console.log(e)
    }

    let result = await config.flightSuretyData.isPassenger.call(passengeer1);

    assert.equal(result, true, "Error in registring passenger");

  });

  it('Register Flight', async () => {


    // ACT
    try {
      await config.flightSuretyApp.registerFlight(config.firstAirline, "F2", ts, { from: config.firstAirline });
    }
    catch (e) {
      console.log(e)
    }

    let flightKey = await config.flightSuretyData.getFlightKey(config.firstAirline, "F2", ts, { from: config.firstAirline });
    let result = await config.flightSuretyApp.isFlight(flightKey, { from: config.firstAirline })

    assert.equal(result, true, "Error in registring flight");

  });


  it('Buy Incurence', async () => {
    let result1 = "";
    // ACT
    try {
      result1 = await config.flightSuretyApp.buyInsurence(config.firstAirline, "F2", 1557093518, { from: passengeer1, value: web3.utils.toWei('1', 'ether'), gasPrice: 0 });
    }
    catch (e) {
      console.log(e)
    }
    assert.equal(result1.logs[0].event, "insurancePurchased", "Error in buying insurence");
   
  });


});
