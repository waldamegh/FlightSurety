var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');

contract('Flight Surety Tests', async (accounts) => {

  var config;
  var passengeer1;
  var passengeer2;
  var passengeer3;
  var passengeer4;
  var passengeer5;
  var airline2;
  var airline3;
  var airline4;
  var airline5;
  var flights = [{flightNumber: "F1", TS:1557093518 }, {flightNumber: "F2", TS:1557093518}, {flightNumber: "F3", TS:1557093518}]
  before('setup contract', async () => {
    config = await Test.Config(accounts);
    await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
    airline2 = accounts[2];
    airline3 = accounts[3];
    airline4 = accounts[4];
    airline5 = accounts[5];
    passengeer1 = accounts[6];
    passengeer2 = accounts[7];
    passengeer3 = accounts[8];
    passengeer4 = accounts[9];
    passengeer5 = accounts[10];
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

    // ACT
    try {
      await config.flightSuretyApp.registerAirline(airline2, { from: config.firstAirline });
    }
    catch (e) {
      
    }
    let result = await config.flightSuretyData.isRegistered.call(airline2);

    // ASSERT
    assert.equal(result, false, "Airline should not be able to register another airline if it hasn't provided funding");

  });

  it('(airline) cannot deposit less than 10 Ether', async () => {

    let reverted = false;
    let r="";
    // ACT
    try {
      r = await config.flightSuretyApp.fundAirline({ from: config.firstAirline, value: web3.utils.toWei("9", "ether"), gasPrice: 0 })
    }
    catch (e) {
      reverted = true
    }
    // ASSERT
    assert.equal(reverted, true, "Funds should be 10 Ether");

  });

  it('(airline) can deposit registration fund', async () => {

    // ACT
    try {
      await config.flightSuretyApp.fundAirline({ from: config.firstAirline, value: web3.utils.toWei('10', 'ether'), gasPrice: 0 });
    }
    catch (e) {
      console.log(e.message)
    }

    let result = await config.flightSuretyData.isFunded.call(config.firstAirline);

    assert.equal(result, true, "Error in funding ariline");


  });

  it('(airline) can register a new Airline', async () => {
    // ACT
    try {
      await config.flightSuretyApp.registerAirline(airline2, { from: config.firstAirline });
    }
    catch (e) {
      console.log(e)
    }

    let result = await config.flightSuretyData.isRegistered.call(airline2);

    assert.equal(result, true, "Error in registring a new ariline");


  });

  it('(airline) cannot register a new Airline if it is not funded', async () => {

    // ACT
    let reverted = false;
    try {
      await config.flightSuretyApp.registerAirline(airline3, { from: airline2 });
    }
    catch (e) {
      //console.log(e.message)
      reverted = true;
    }
    let result = await config.flightSuretyData.isRegistered.call(airline3);

    // ASSERT
    assert.equal(reverted, true, "Airline should not be able to register a new airline without sending funds");
    assert.equal(result, false, "Airline should not be able to register a new airline if it hasn't sent the fund");

  });

  it('(multiparty-consensus) Airline cannot vote without funding', async () => {
    
    let reverted = false;

    try {
      await config.flightSuretyApp.registerAirline(airline3, { from: airline2 });
    }
    catch (e) {
      //console.log(e.message);
      reverted = true
    }

    // ASSERT
    assert.equal(reverted, true, "Airline cannot vote without funding");

  });

  

  it('(multiparty-consensus) Airline is registered with 50% votes of registered airlines', async () => {
    
    await config.flightSuretyApp.fundAirline({ from: airline2, value: web3.utils.toWei('10', 'ether'), gasPrice: 0 })
    await config.flightSuretyApp.registerAirline(airline3, { from: airline2 });
    await config.flightSuretyApp.fundAirline({ from: airline3, value: web3.utils.toWei('10', 'ether'), gasPrice: 0 })
    
    let reverted = false;

    // ACT
    try {
      await config.flightSuretyApp.registerAirline(airline4, { from: config.firstAirline });
      await config.flightSuretyApp.registerAirline(airline4, { from: airline2 });
      await config.flightSuretyApp.registerAirline(airline4, { from: airline3 });
    }
    catch (e) {
      //console.log(e.message)
      reverted = true
    }
    let isAirline = await config.flightSuretyData.isRegistered.call(airline4);
    // ASSERT
    assert.equal(isAirline, true, "Airline is registered with 50% consensus");

  });
  
  it('(airline) can register passengers', async () => {

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

  it('(airline) can register a flight', async () => {


    // ACT
    try {
      await config.flightSuretyApp.registerFlight(config.firstAirline, flights[0].flightNumber, flights[0].TS, { from: config.firstAirline });
    }
    catch (e) {
      console.log(e)
    }

    let flightKey = await config.flightSuretyData.getFlightKey(config.firstAirline, flights[0].flightNumber, flights[0].TS, { from: config.firstAirline });
    let result = await config.flightSuretyApp.isFlight(flightKey, { from: config.firstAirline })

    assert.equal(result, true, "Error in registring flight");

  });

  it(`(airline) cannot register a flight twice `, async function () {

    let reverted = false;
    try {
      await config.flightSuretyApp.registerFlight(config.firstAirline, flights[0].flightNumber, flights[0].TS, { from: config.firstAirline });
    }
    catch (e) {
      reverted = true;
    }
    assert.equal(reverted, true, "This Flight is already registered");

  });

  it('(passenger) cannot purchase non-registered flight', async function () {
    let reverted = false;
    try {
      await config.flightSuretyData.buyInsurance(config.firstAirline, "F4", flights[0].TS, { from: passenger1, value: web3.utils.toWei("1", 'ether') });
    }
    catch (e) {
      //console.log(e.message);
      reverted = true;
    }
    assert.equal(reverted, true, "cannot purchase non-registered flight");
  });

  it('(passenger) cannot purchase flight insurance without funds', async function () {
    let reverted = false;
    try {
      await config.flightSuretyData.buyInsurance(config.firstAirline, flights[0].flightNumber, flights[0].TS, { from: passenger1, value: web3.utils.toWei("0", 'ether') });
    }
    catch (e) {
      //console.log(e.message);
      reverted = true;
    }
    assert.equal(reverted, true, "Passenger canot purchase flight insurance without funds");
  });


  it('(passenger) cannot pay more than 1 Ether for purchasing flight insurance.', async () => {
    
    let reverted = false;

    try {
      await config.flightSuretyApp.buyInsurence(config.firstAirline, flights[0].flightNumber, flights[0].TS, { from: passengeer1, value: web3.utils.toWei('2', 'ether'), gasPrice: 0 });
    }
    catch (e) {
      //console.log(e.message);
      reverted = true
    }

    // ASSERT
    assert.equal(reverted, true, "Airline cannot vote without funding");

  });


  it('(passenger) can buy an incurence with up to 1 ether', async () => {

    var balanceBefore =  (await web3.eth.getBalance(passengeer1))
    let result1 = "";
    // ACT
    try {
      result1 = await config.flightSuretyApp.buyInsurence(config.firstAirline, flights[0].flightNumber, flights[0].TS, { from: passengeer1, value: web3.utils.toWei('1', 'ether'), gasPrice: 0 });
    }
    catch (e) {
      console.log(e)
    }

    var balanceAfter =  (await web3.eth.getBalance(passengeer1))
   
    assert.equal(result1.logs[0].event, "insurancePurchased", "Error in buying insurence");
    assert.equal(balanceAfter, (web3.utils.toBN(balanceBefore)-(web3.utils.toWei('1', 'ether'))).toString(), "Error")
  });


  it('(Insurance) Insurance amount is credited by 1.5 x', async function () {
    let flightKey = await config.flightSuretyData.getFlightKey(config.firstAirline, flights[0].flightNumber, flights[0].TS, { from: config.firstAirline });
    let result="";
    try {
      result= await config.flightSuretyData.creditInsurees(flightKey, {from: passengeer1})
    } catch (e) {
      console.log(e)
    }

    assert.equal(result.logs[0].event , "PassengerCreditUpdated", "Error in creditIncurence")
  });


});
