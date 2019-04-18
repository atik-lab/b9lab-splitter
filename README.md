# b9lab Splitter

This is the first project of the Community Blockstars 2019 - Ethereum Developer Course.

## What to do

You will create a smart contract named Splitter whereby:

* There are 3 people: Alice, Bob and Carol.
* We can see the balance of the Splitter contract on the Web page.
* Whenever Alice sends ether to the contract for it to be split, half of it goes to Bob and the other half to Carol.
* We can see the balances of Alice, Bob and Carol on the Web page.
* Alice can use the Web page to split her ether.
* Add unit tests

## Useful commands

```
Splitter.deployed().then(console.log)
Splitter.deployed().then(i => i.send(10, {from: '0x46245954b8e7b5b932333f8bf87eabf56472be40'}))
web3.eth.getBalance(Splitter.address)
});
```