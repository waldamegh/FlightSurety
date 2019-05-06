exports.id=0,exports.modules={"./src/server/server.js":function(e,o,n){"use strict";n.r(o);var t=n("./build/contracts/FlightSuretyApp.json"),r=n("./build/contracts/FlightSuretyData.json"),c=n("./src/server/config.json"),s=n("web3"),a=n.n(s),l=n("express"),i=n.n(l),u=c.localhost,d=new a.a(new a.a.providers.WebsocketProvider(u.url.replace("http","ws")));d.eth.defaultAccount=d.eth.accounts[0];var g=new d.eth.Contract(t.abi,u.appAddress),f=new d.eth.Contract(r.abi,u.dataAddress),h=[],p=[0,10,20,30,40,50];console.log("Server App"),d.eth.getAccounts().then(function(e){console.log("Number of aacounts: "+e.length),console.log(e[30]),f.methods.authorizeCaller(u.appAddress).send({from:e[0]}).then(function(e){console.log("Contrct Address ( ".concat(u.appAddress," ) is an authorized contract"))}).catch(function(e){console.log("Error (authorizeCaller): "+e)}),console.log("Oracle Registration:"),g.methods.REGISTRATION_FEE().call().then(function(o){console.log("Registration fee: ".concat(d.utils.fromWei(o.toString(),"ether")," Wei"));for(var n=function(n){g.methods.registerOracle().send({from:e[n],value:o,gas:3e6},function(o,t){o?console.log("Error (registerOracle):"+o):g.methods.getMyIndexes().call({from:e[n]},function(o,t){if(o)console.log("Error (getMyIndexes):"+o);else{var r={address:e[n],indices:t};h.push(r),console.log("Oracle #".concat(n-29," , Acoount(").concat(h[n-30].address,") , Indices: [").concat(h[n-30].indices,"]"))}})})},t=30;t<50;t++)n(t)}).catch(function(e){console.log("Error (REGISTRATION_FEE):"+e)})}).catch(function(e){console.log("Error (getAccounts):"+e)}),g.events.OracleRequest({fromBlock:0},function(e,o){var n;e?console.log(e):function(){var e=o.returnValues.index,t=o.returnValues.airline,r=o.returnValues.flight,c=o.returnValues.timestamp;for(n in h)h[n].includes(e)&&function(){var o=p[Math.floor(6*Math.random())];g.methods.submitOracleResponse(e,t,r,c,o).send({from:n,gas:1e6}).then(function(n){console.log("Oracle response: \n            Index: ".concat(e," , \n            Airline: ").concat(t," ,\n            Flight: ").concat(r," ,\n            Timestamp: ").concat(c," ,\n            Status Code: ").concat(o,"\n            "))}).catch(function(e){console.log("Error6:"+e)})}()}()}),g.events.FlightStatusInfo({fromBlock:0},function(e,o){e?console.log(e):console.log("FlightStatusInfo event: \n    Index: ".concat(o.returnValues.index," , \n    Airline: ").concat(o.returnValues.airline," ,\n    Flight: ").concat(o.returnValues.flight," ,\n    Timestamp: ").concat(o.returnValues.timestamp,"\n    "))});var m=i()();m.get("/api",function(e,o){o.send({message:"An API for use with your Dapp!"})}),o.default=m}};