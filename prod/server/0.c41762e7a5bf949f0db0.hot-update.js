exports.id=0,exports.modules={"./src/server/server.js":function(e,o,n){"use strict";n.r(o);var t=n("./build/contracts/FlightSuretyApp.json"),c=n("./build/contracts/FlightSuretyData.json"),r=n("./src/server/config.json"),s=n("web3"),a=n.n(s),l=n("express"),i=n.n(l),u=r.localhost,h=new a.a(new a.a.providers.WebsocketProvider(u.url.replace("http","ws")));h.eth.defaultAccount=h.eth.accounts[0];var f=new h.eth.Contract(t.abi,u.appAddress),d=new h.eth.Contract(c.abi,u.dataAddress),g={},m=[0,10,20,30,40,50];console.log("Server App"),h.eth.getAccounts().then(function(e){console.log("Number of aacounts: "+e.length),console.log(e[0]),d.methods.authorizeCaller(u.appAddress).send({from:e[0],gas:4e6}).then(function(e){console.log("Contrct Address ( ".concat(u.appAddress," ) is an authorized contract"))}).catch(function(e){console.log("Error1: "+e)}),console.log("Oracle Registration:"),f.methods.REGISTRATION_FEE().call().then(function(o){console.log("Registration fee: ".concat(h.utils.fromWei(o,"ether")," ether"));for(var n=function(n){f.methods.registerOracle().send({from:e[n],value:o,gas:4e6}).then(function(o){f.methods.getMyIndexes().call({from:e[n]}).then(function(o){g[e[n]]=o,console.log("Oracle #".concat(n," , Acoount(").concat(e[n]," , Indices: ").concat(o))}).catch(function(e){console.log("Error2:"+e)})}).catch(function(e){console.log("Error3:"+e)})},t=30;t<=50;t++)n(t)}).catch(function(e){console.log("Error4:"+e)})}).catch(function(e){console.log("Error5:"+e)}),f.events.OracleRequest({fromBlock:0},function(e,o){var n;e?console.log(e):function(){var e=o.returnValues.index,t=o.returnValues.airline,c=o.returnValues.flight,r=o.returnValues.timestamp;for(n in g)g[n].includes(e)&&function(){var o=m[Math.floor(6*Math.random())];f.methods.submitOracleResponse(e,t,c,r,o).send({from:n,gas:1e6}).then(function(n){console.log("Oracle response: \n            Index: ".concat(e," , \n            Airline: ").concat(t," ,\n            Flight: ").concat(c," ,\n            Timestamp: ").concat(r," ,\n            Status Code: ").concat(o,"\n            "))}).catch(function(e){console.log("Error6:"+e)})}()}()}),f.events.FlightStatusInfo({fromBlock:0},function(e,o){e?console.log(e):console.log("FlightStatusInfo event: \n    Index: ".concat(o.returnValues.index," , \n    Airline: ").concat(o.returnValues.airline," ,\n    Flight: ").concat(o.returnValues.flight," ,\n    Timestamp: ").concat(o.returnValues.timestamp,"\n    "))});var p=i()();p.get("/api",function(e,o){o.send({message:"An API for use with your Dapp!"})}),o.default=p}};