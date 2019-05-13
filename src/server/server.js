import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import FlightSuretyData from '../../build/contracts/FlightSuretyData.json';
import Config from './config.json';
import Web3 from 'web3';
import express from 'express';

let config = Config['localhost'];
let web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
web3.eth.defaultAccount = web3.eth.accounts[0];
let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
let flightSuretyData = new web3.eth.Contract(FlightSuretyData.abi, config.dataAddress);
let oracles = [];
let statusCode = [0, 10, 20, 30, 40, 50];

console.log("Server App");

web3.eth.getAccounts().then((accounts) => {
  //Authorize app contract
  console.log("Number of aacounts: " + accounts.length);
  console.log(accounts[30])
  flightSuretyData.methods.authorizeCaller(config.appAddress).send({ from: accounts[0] }).then(result => {
    console.log(`Contrct Address ( ${config.appAddress} ) is an authorized contract`);
  }).catch(error => {
    console.log("Error (authorizeCaller): " + error);
  });

  //Oracle registation
  console.log("Oracle Registration:")
  flightSuretyApp.methods.REGISTRATION_FEE().call().then(fee => {
    console.log(`Registration fee: ${web3.utils.fromWei(fee.toString(), 'ether')} Ether`)
    for (let i = 30; i < 50; i++) {
      //register oracles
      flightSuretyApp.methods.registerOracle().send({ from: accounts[i], value: fee, gas: 3000000 }, (error, reg_result) => {
        if (error) {
          console.log("Error (registerOracle):" + error);
        } else {
          // get indexes for each oracle 
          flightSuretyApp.methods.getMyIndexes().call({ from: accounts[i] }, (error, indices) => {
            if (error) {
              console.log("Error (getMyIndexes):" + error);
            } else {
              let oracle = { address: accounts[i], indices: indices };
              oracles.push(oracle);
              console.log(`Oracle #${i-29} , Acoount(${oracles[i-30].address}) , Indices: [${oracles[i-30].indices}]`);
            }
          });
        }
      });
    }
  }).catch(error => {
    console.log("Error (REGISTRATION_FEE):" + error);
  });
}).catch(error => {
  console.log("Error (getAccounts):" + error);
});

//Oracle Response
flightSuretyApp.events.OracleRequest({
  fromBlock: 0
}, function (error, event) {
  if (error) console.log(error)
  else {
    const index = event.returnValues.index;
    const airline = event.returnValues.airline;
    const flight = event.returnValues.flight;
    const timestamp = event.returnValues.timestamp;
    for (var key in oracles) {
      var indexes = oracles[key];
      if (indexes.includes(index)) {
        let randomStatusCode = statusCode[2]//statusCode[Math.floor(Math.random() * 6)];
        flightSuretyApp.methods.submitOracleResponse(index, airline, flight, timestamp, randomStatusCode)
          .send({ from: key, gas: 1000000 })
          .then(result => {
            console.log(`Oracle response: 
            Index: ${index} , 
            Airline: ${airline} ,
            Flight: ${flight} ,
            Timestamp: ${timestamp} ,
            Status Code: ${randomStatusCode}
            `);
          }).catch(error => {
            console.log("Error6:" + error)
          });
      }
    }
  }
});

flightSuretyApp.events.FlightStatusInfo({
  fromBlock: 0
}, function (error, event) {
  if (error) console.log(error)
  else {
    console.log(`FlightStatusInfo event: 
    Index: ${event.returnValues.index} , 
    Airline: ${event.returnValues.airline} ,
    Flight: ${event.returnValues.flight} ,
    Timestamp: ${event.returnValues.timestamp}
    `);
  }
});

const app = express();
app.get('/api', (req, res) => {
  res.send({
    message: 'An API for use with your Dapp!'
  })
})

export default app;