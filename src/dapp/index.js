import DOM from './dom';
import Contract from './contract';
import './flightsurety.css';


(async () => {

    let result = null;

    let contract = new Contract('localhost', () => {

        // Read transaction
        contract.isOperational((error, result) => {
            console.log(error, result);
            display('Operational Status', 'Check if contract is operational', [{ label: 'Operational Status', error: error, value: result }]);
        });

        DOM.elid('submit-fund').addEventListener('click', () => {
            let airlineAddress = DOM.elid('airline-address').value;
            let fund = DOM.elid('fund').value;
            contract.fundAirline(airlineAddress, fund, (error, result) => {
                console.log("fundAirline: Error=> " + error + " , Result=> " + result);
                display('Fund Airline', 'result', [{ label: 'fundAirline ', error: error, value: result }]);
            });
        });
        DOM.elid('rigister-airline').addEventListener('click', () => {
            let airlineAddress1 = DOM.elid('airline-address-1').value;
            let airlineAddress2 = DOM.elid('airline-address-2').value;
            contract.registerAirline(airlineAddress1, airlineAddress2, (error, result) => {
                console.log("registerAirline: Error=> " + error + " , Result=> " + result);
                display('Register Airline', 'result', [{ label: 'registerAirline ', error: error, value: result }]);
            });
        });


        DOM.elid('submit-incurence').addEventListener('click', () => {
            let flightNumber = DOM.elid('flight-number').value;
            let passengerAddress = DOM.elid('passenger-address').value;
            let fund = DOM.elid('amount').value;
            contract.buyInsurence(flightNumber, passengerAddress, fund, (error, result) => {
                console.log("submit-incurence: Error=> " + error + " , Result=> " + result);
                display('Buy Incurence', 'result', [{ label: 'Buy Incurence ', error: error, value: result }]);
            });
        });

        DOM.elid('submit-payout').addEventListener('click', () => {
            let passengerAddressPayout = DOM.elid('passenger-address-payout').value;
            contract.payout(passengerAddressPayout, (error, result) => {
                console.log("passengerAddressPayout: Error=> " + error + " , Result=> " + result);
                display('Payout', 'result', [{ label: 'Payout ', error: error, value: result }]);
            });
        });

        contract.registerPassengers((error, result) => {
            console.log("registerPassengers: Error=> " + error + " , Result=> " + result);
            //display('registerPassengers', 'result', [{ label: 'registerPassengers ', error: error, value: result }]);
        });

        contract.registerFlights((error, result) => {
            console.log("registerFlights: Error=> " + error + " , Result=> " + result);
            //display('registerFlights', 'result', [{ label: 'registerFlights ', error: error, value: result }]);
        });

        contract.getAirlines((result) => {
            console.log("getAirlines: Result=> " + result);
            result.forEach(element => {
                var node = document.createElement("LI");                 
                var textnode = document.createTextNode(element);         
                node.appendChild(textnode);                             
                document.getElementById("airlineList").appendChild(node);
            });
        });
        contract.getPassengers((result) => {
            console.log("getPassengers: Result=> " + result);
            result.forEach(element => {
                var node = document.createElement("LI");                 
                var textnode = document.createTextNode(element);         
                node.appendChild(textnode);                             
                document.getElementById("passengerList").appendChild(node);
            });
        });
        contract.getFlights((result) => {
            console.log("getFlights: Result=> " + JSON.stringify(result));
            result.forEach(element => {
                var node = document.createElement("LI");                 
                var textnode = document.createTextNode(JSON.stringify(element));         
                node.appendChild(textnode);                             
                document.getElementById("flightList").appendChild(node);
            });
        });

        // User-submitted transaction
        DOM.elid('submit-oracle').addEventListener('click', () => {
            let flight = DOM.elid('flight-number').value;
            let airlinef = DOM.elid('airlineAddr').value;
            // Write transaction
            contract.fetchFlightStatus(airlinef,flight, (error, result) => {
                display('Oracles', 'Trigger oracles', [{ label: 'Fetch Flight Status', error: error, value: result.flight + '   ,    ' + result.timestamp }]);
            });
        })

    });


})();


function display(title, description, results) {
    let displayDiv = DOM.elid("display-wrapper");
    let section = DOM.section();
    section.appendChild(DOM.h2(title));
    section.appendChild(DOM.h5(description));
    results.map((result) => {
        let row = section.appendChild(DOM.div({ className: 'row' }));
        row.appendChild(DOM.div({ className: 'col-sm-4 field' }, result.label));
        row.appendChild(DOM.div({ className: 'col-sm-8 field-value' }, result.error ? String(result.error) : String(result.value)));
        section.appendChild(row);
    })
    displayDiv.append(section);

}
