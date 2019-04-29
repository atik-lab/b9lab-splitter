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

### Setup

app.js inside web3/js contains the contract address that might need to be modified.

Ether can be send only by Alice with pay(), and then bob and carol can withdraw their half calling withdraw().

By using the following mnemonic with ganache the address of the contract will be already the same as in app.js. 

```
ganache-cli --accounts=3 --host=0.0.0.0 --m "dream feel bracket hill river gate farm naive paddle script destroy word"
```

## Useful commands

```
// get contract abi and bin
solc --combined-json abi,bin ../contracts/Splitter.sol | jq
```
