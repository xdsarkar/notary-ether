$(document).ready(function() {
  notary_init();
  var success = "#responseText";
  var error = "#errorText";
  $(error).hide();
  $(success).hide();
  
  // Config
  var ipfsHost = 'localhost';
  var ipfsAPIPort = '5001';
  var ipfsWebPort = '8080';

  // IPFS
  var ipfs = window.IpfsApi(ipfsHost, ipfsAPIPort);
  // var ipfs = ipfsAPI('localhost', '5001', {protocol: 'http'});
  ipfs.swarm.peers(function(err, response) 
  {
    if (err) console.error(err);
    else {
      //console.log("IPFS - connected to " + response.Strings.length + " peers");
      console.log(response);
    }
  });

  window.ipfs = ipfs;
  window.web3 = web3;
  window.ipfsDataHost = "http://" + ipfsHost + ':' + ipfsWebPort + "/ipfs";
});

function hashForFile(callback) {
  input_text = document.getElementById("inValue").value;
  out_text = document.getElementById("newValue").value;
  input_file = document.getElementById("hashFile");

  if (input_text === "" && !input_file.files[0]) {
    alert("Please complete the two fields");
  }
  else if(input_text === "") {
    alert("Please enter a wallet address")
  }
  else if(!input_file.files[0]) {
    alert("Please select a file first");
  }

  else {
    file = input_file.files[0];
    filename = file.name;
    fr = new FileReader();
    fr.onload = function (e) {
      content = e.target.result;
      var shaObj = new jsSHA("SHA-256", "ARRAYBUFFER");
      shaObj.update(content);
      xhex = { 
        hash: "0x" + shaObj.getHash("HEX"),
        owner: input_text,
        newOwner: out_text
      }
    };
    const Buffer = window.IpfsApi().Buffer;
    fr.readAsArrayBuffer(file);
    fr.onloadend = () => this.convertToBuffer(fr);
    convertToBuffer = async(fr) => {
      const buffer = await Buffer.from(fr.result);
      window.ipfs.add(buffer, function(err, result) {
        if (err) 
        {
          console.error('Error sending file: ', err);
          return callback(error,null);
        } 
        else if (result && result[0] && result[0].Hash) {
          //var imageURL = window.ipfsDataHost + "/" + result[0].Hash;
          localStorage.setItem(xhex.hash, result[0].Hash);
          callback(null, xhex, result[0].Hash);
        } 
        else return callback(error,null);
      });
    };
  }
};

function send () {
  hashForFile(function (err, xhex, dHex) {
    notary_send(xhex, dHex, function(err, tx, obj) {
      var success = "#responseText";
      var error = "#errorText";
      if(obj.blockNumber == 0) {
        $(error).hide();
        $(success).html("<p>File <b>[successfully]</b> fingreprinted onto Ethereum blockchain.</p>"
        + "<p><b>File Name:</b> " + filename +"</p>"
        + "<p><b>File Hash Value:</b> " + xhex.hash +"</p>"
        + "<p><b>Transaction ID:</b> " + tx +"</p>"
        + "<p><b>Available at contract address:</b> " + address +"</p>"
        + "<p><b>Signing owner address:</b> " + xhex.owner +"</p>"
        + "<p><b>Please alow a few minutes for transaction to be mined.</b></p>").css("overflow", "auto");
        $(success).show();
      }
      else if(obj.blockNumber != 0) {
        $(success).hide();
        $(error).html("<p>File <b>[already]</b> fingreprinted onto Ethereum blockchain.</p>"
        + "<p><b>File Name:</b> " + filename +"</p>"
        + "<p><b>File Hash Value:</b> " + xhex.hash +"</p>"
        + "<p><b>Block No.</b>: " + obj.blockNumber +"</p>"
        + "<p><b>Available at contract address:</b> " + address +"</p>"
        + "<p><b>Please alow a few minutes for transaction to be mined.</b></p>").css("overflow", "auto");
        $(error).show();
      }
    });
  });
};

function find () {
  hashForFile(function (err, xhex) {
    notary_find(xhex, function(err, resultObj) {
      var success = "#responseText";
      var error = "#errorText";
      if(resultObj.blockNumber != 0) {
        $(error).hide();
        urlObject = localStorage.getItem(xhex.hash);
        imageURL = window.ipfsDataHost + "/" + urlObject;
        console.log(imageURL);
        $(success).html("<p>File fingerprint <b>[found]</b> on Ethereum blockchain.</p>"
        + "<p><b>File Name:</b> " + filename +"</p>"
        + "<p><b>File Hash Value:</b> " + xhex.hash + "</p>"
        + "<p><b>Block No.</b>: " + resultObj.blockNumber + "</p>"
        + "<p><b>Timestamp:</b> " + resultObj.mineTime + "</p>"
        + "<p><b>IPFS: </b>" + "<a href=" + imageURL + " download>((Download))</a></p>").css("overflow", "hidden");
        $(success).show();
      } else {
        $(success).hide();
        $(error).html("<p>File fingerprint <b>[not found]</b> on Ethereum blockchain.</p>"
        + "<p><b>File Name:</b> " + filename +"</p>"
        + "<p><b>File Hash Value:</b> " + xhex.hash + "</p>").css("overflow", "hidden");
        $(error).show();
      }
    });
  });
};

function transfer () {
  hashForFile(function (err, xhex) {
    notary_transfer(xhex, function(err, tx, obj) {
      var success = "#responseText";
      var error = "#errorText";
        $(error).hide();
        $(success).html("<p>File fingerprint <b>[found]</b> and transferred ownership on Ethereum blockchain.</p>"
        + "<p><b>File Name:</b> " + filename +"</p>"
        + "<p><b>File Hash Value:</b> " + xhex.hash + "</p>"
        + "<p><b>Transaction ID:</b> " + tx +"</p>"
        + "<p><b>Previous Owner:</b> " + xhex.owner +"</p>"
        + "<p><b>New Owner:</b> " + xhex.newOwner +"</p>"); 
        $(success).show();
    });
  });
};

function listing () {
  read_docs = document.getElementById("getDocs").value;
  notary_listing(read_docs, function(err, array) {
    var arrayLength = array.length;
    var theTable = document.createElement('tbody');
    for (var i = 0, tr, td; i < arrayLength; i++) {
      tr = document.createElement('tr');
      td = document.createElement('td');
      urlObject = localStorage.getItem(array[i]);
      imageURL = window.ipfsDataHost + "/" + urlObject;
      link = document.createElement('a');
      link.setAttribute('href', imageURL);
      link.append(array[i]);
      td.appendChild(link);
      tr.appendChild(td);
      theTable.appendChild(tr);
    }
    document.getElementById('table').appendChild(theTable);
  });
};

function addFile(buffer) {
  
}