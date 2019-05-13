# FlightSurety

FlightSurety is a sample application project for Udacity's Blockchain course.

### Versions

* Solidity: v0.5.0 
* Truffle: v5.0.0 
* Ganache CLI: v6.1.8
* Node: v8.16.0

## Install

This repository contains Smart Contract code in Solidity (using Truffle), tests (also using Truffle), dApp scaffolding (using HTML, CSS and JS) and server app scaffolding.

To install, download or clone the repo, then:

`npm install`
`truffle compile`

![image](https://imgur.com/pYx9gEq.png)

## Develop Client

To run truffle tests:

`truffle test ./test/flightSurety.js`

![image](https://imgur.com/xDhxuRg.png)

`truffle test ./test/oracles.js`

To use the dapp:

`ganache-cli -m "candy maple cake sugar pudding cream honey rich smooth crumble sweet treat" -a 50`
`truffle migrate`
![image](https://imgur.com/sdr0gDh.png)
`npm run dapp`
![image](https://imgur.com/LJ3O4xg.png)
![image](https://imgur.com/5uiXyln.png)

To view dapp:

`http://localhost:8000`

## Develop Server

`npm run server`
![image](https://imgur.com/VFwM2x3.png)
`truffle test ./test/oracles.js`

## Deploy

To build dapp for prod:
`npm run dapp:prod`

Deploy the contents of the ./dapp folder


## Resources

* [How does Ethereum work anyway?](https://medium.com/@preethikasireddy/how-does-ethereum-work-anyway-22d1df506369)
* [BIP39 Mnemonic Generator](https://iancoleman.io/bip39/)
* [Truffle Framework](http://truffleframework.com/)
* [Ganache Local Blockchain](http://truffleframework.com/ganache/)
* [Remix Solidity IDE](https://remix.ethereum.org/)
* [Solidity Language Reference](http://solidity.readthedocs.io/en/v0.4.24/)
* [Ethereum Blockchain Explorer](https://etherscan.io/)
* [Web3Js Reference](https://github.com/ethereum/wiki/wiki/JavaScript-API)