var contract = undefined;
var customProvider = undefined;
var address = ""; //add your deployed contract add
var abi = undefined;

function notary_init () {
  // Check if Web3 has been injected by the browser (Mist/MetaMask)
  if (typeof web3 !== 'undefined') {
    // Use existing gateway
    window.web3 = new Web3(web3.currentProvider);
  } else {
    console.log("No Ethereum interface injected into browser. Read-only access");
    let provider = new Web3.providers.HttpProvider("http://localhost:8545");
    web3 = new Web3(provider);
  }

  abi = [{
    "inputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "hash",
        "type": "bytes32"
      }
    ],
    "name": "addDocHash",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "hash",
        "type": "bytes32"
      }
    ],
    "name": "addDocStack",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "returnDocStack",
    "outputs": [
      {
        "name": "",
        "type": "bytes32[]"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {
        "name": "hash",
        "type": "bytes32"
      },
      {
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "findDocHash",
    "outputs": [
      {
        "name": "",
        "type": "uint256"
      },
      {
        "name": "",
        "type": "uint256"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "hash",
        "type": "bytes32"
      }
    ],
    "name": "deleteDocHash",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "setOwner",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  }];
  contract = new web3.eth.Contract(abi, address);
};

//sends a hash to the blockchain
function notary_send(xhex, dHex, callback) 
{
  contract.methods.findDocHash(xhex.hash, xhex.owner).call(function (error, result) 
  {
    if(error) callback(error, null, null);
    else 
    {
      var obj = { blockNumber: result[1] };
      if(obj.blockNumber != 0) callback(null, null, obj);
      else 
      {
        contract.methods.setOwner(xhex.owner).send({from: xhex.owner}, function(error, tx) {
          if(!error) {
            contract.methods.addDocHash(xhex.hash).send({from: xhex.owner}, function(error, tx) {
              if (error) callback(error, null, null);
              else {
                contract.methods.addDocStack(xhex.hash).send({from: xhex.owner}, function(error) {
                  if(!error) callback(null, tx, obj);
                });
              }
            });
          }
        });
      }
    }
  });
};

//looks up a hash on the blockchain
function notary_find (xhex, callback) 
{
  contract.methods.findDocHash(xhex.hash, xhex.owner).call(function (error, result) 
  {
    if(error) callback(error, null);
    else 
    {
      let resultObj = 
      {
        mineTime:  new Date(result[0] * 1000),
        blockNumber: result[1]
      }
      callback(null, resultObj);
    }
  });
};

//transfers a hash on the blockchain
function notary_transfer (xhex, callback) 
{
  contract.methods.findDocHash(xhex.hash, xhex.owner).call(function (error, result) 
  {
    if(error) callback(error, null, null);
    else 
    {
      var obj = { blockNumber: result[1] };
      if(obj.blockNumber == 0) callback(null, null, obj);
      else 
      {
        contract.methods.setOwner(xhex.owner).send({from: xhex.owner}, function(error, tx) {
          if(!error) {
            contract.methods.deleteDocHash(xhex.hash).send({from: xhex.owner}, function (error, tx) {
              if(!error) {
                contract.methods.setOwner(xhex.newOwner).send({from: xhex.newOwner}, function(error, tx) {
                  if(!error) {
                    contract.methods.addDocHash(xhex.hash).send({from: xhex.newOwner}, function(error, tx) {
                      if (error) callback(error, null, null);
                      else callback(null, tx, null);
                    });
                  }
                });
              }
            });
          }
        });
      }
    }
  });
}

function notary_listing (owner, callback) 
{
  contract.methods.returnDocStack(owner).call(function (error, result) {
    if(error) callback(error, null);
    else callback(null, result);
  });
}