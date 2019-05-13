import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import FlightSuretyData from '../../build/contracts/FlightSuretyData.json';
import Config from './config.json';
import Web3 from 'web3';

export default class Contract {
    constructor(network, callback) {

        let config = Config[network];
        this.web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
        //this.web3 = new Web3(new Web3.providers.HttpProvider(config.url));
        this.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
        this.flightSuretyData = new this.web3.eth.Contract(FlightSuretyData.abi, config.dataAddress);
        this.appAddress = config.dataAddress;
        this.initialize(callback);
        this.owner = null;
        this.airlines = [];
        this.passengers = [];
        this.flights = [{ flightNumber: "F1", Timestamp: 1557093518 }, { flightNumber: "F2", Timestamp: 1557093518 }, { flightNumber: "F3", Timestamp: 1557093518 },
        { flightNumber: "F4", Timestamp: 1557093518 }, { flightNumber: "F5", Timestamp: 1557093518 }]
    }

    initialize(callback) {
        this.web3.eth.getAccounts((error, accts) => {

            this.owner = accts[0];
            console.log("Owner Address:" + this.owner);
            console.log("authorize contract Address:" + this.appAddress);
            this.flightSuretyData.methods.authorizeCaller(this.appAddress).send({ from: this.owner },
                (error, result) => { console.log("authorizeCaller: Error=> " + error + " , Result=> " + result); });

            let counter = 1;

            while (this.airlines.length < 5) {
                this.airlines.push(accts[counter++]);
            }
            console.log("Airline Adressess:" + JSON.stringify(this.airlines))
            while (this.passengers.length < 5) {
                this.passengers.push(accts[counter++]);
            }
            console.log("Passengers Adresse:" + JSON.stringify(this.passengers))

            callback();
        });

    }

    fundAirline(airlineAddress, fund, callback) {
        let self = this;
        self.flightSuretyApp.methods.fundAirline().send({ from: airlineAddress.toString(), value: self.web3.utils.toWei(fund.toString(), 'ether'), gas:3000000 },
            (error, result) => {  callback(error, result); });
    }

    registerAirline(airlineAddress1, airlineAddress2, callback) {
        let self = this;
        self.flightSuretyApp.methods.registerAirline(airlineAddress2.toString()).send({ from: airlineAddress1.toString() , gas:3000000},
            (error, result) => { callback(error, result); });
    }

    registerPassengers(callback) {
        let self = this;
        for (let i = 0; i < self.passengers.length; i++) {
            self.flightSuretyApp.methods.registerPassenger(self.passengers[i]).send({ from: self.airlines[0] , gas:3000000}, (error, result) => {callback(error, result); });
        }
    }

    registerFlights(callback) {
        let self = this;
        for (let i = 0; i < self.flights.length; i++) {
            self.flightSuretyApp.methods.registerFlight(self.airlines[0],self.flights[i].flightNumber,1557093518).send({ from: self.airlines[0], gas:3000000 }, (error, result) => {callback(error, result); });
        }
    }


    buyInsurence(flightNumber, passengerAddress, fund, callback){
        let self = this;
        self.flightSuretyApp.methods.buyInsurence(self.airlines[0], flightNumber.toString(), 1557093518).send({ from: passengerAddress.toString(), value: self.web3.utils.toWei(fund.toString(), 'ether'), gas:3000000},
            (error, result) => { callback(error, result); });
    }

    payout(passengerAddressPayout, callback){
        let self = this;
        self.flightSuretyApp.methods.payout().send({ from: passengerAddressPayout.toString(), gas:3000000},
            (error, result) => { callback(error, result); });
    }

    getFlights(callback){
        let self = this;
        callback(self.flights);
    }

    getAirlines(callback){
        let self = this;
        callback(self.airlines);
    }

    getPassengers(callback){
        let self = this;
        callback(self.passengers);
    }

    isOperational(callback) {
        let self = this;
        self.flightSuretyApp.methods
            .isOperational()
            .call({ from: self.owner }, callback);
    }

    fetchFlightStatus(airlinef,flight, callback) {
        let self = this;
        let payload = {
            airline: airlinef,
            flight: flight,
            timestamp: 1557093518//Math.floor(Date.now() / 1000)
        }
        self.flightSuretyApp.methods
            .fetchFlightStatus(payload.airline, payload.flight, payload.timestamp)
            .send({ from: self.owner }, (error, result) => {
                console.log("SSSS"+result)
                callback(error, payload);
            });
    }
}