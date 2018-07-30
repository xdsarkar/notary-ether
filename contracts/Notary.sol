pragma solidity ^0.4.4;

contract Notary {
  
  struct Record {
    uint mineTime;
    uint blockNumber;
  }

  address private owner;
  
  function Notary() public {
    owner = msg.sender;
  }

  mapping (address => mapping (bytes32 => Record)) private docHashes;
  mapping (address => bytes32[]) private docStack;

  function addDocHash (bytes32 hash) public {
    Record memory newRecord = Record(now, block.number);
    docHashes[owner][hash] = newRecord;
  }

  function addDocStack (bytes32 hash) public {
    docStack[owner].push(hash);
  }

  function returnDocStack (address newOwner) view public returns (bytes32[]) {
    return (docStack[newOwner]);
  }

  function findDocHash (bytes32 hash, address newOwner) public constant returns(uint, uint) {
    return (docHashes[newOwner][hash].mineTime, docHashes[newOwner][hash].blockNumber);
  }

  function deleteDocHash (bytes32 hash) public {
    delete docHashes[owner][hash];
  }
  
  function setOwner(address newOwner) public {
    owner = newOwner;
  }

}