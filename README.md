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

Bob and carol addresses are in 2_deploy_contracts.js. Alice will be the address that deploys de contract.
app.js inside web3/js also contains addresses that might be needed to be modified.

Ether can be send directly to the contract to be split only by alice, and then bob and carol can withdraw their part calling withdraw.

Below you can use the ganache command with the seed to not have to modify the 2_deploy_contracts.js and app.js files.

## Mnemonic for ganache

```
ganache-cli --accounts=3 --host=0.0.0.0 --m "dream feel bracket hill river gate farm naive paddle script destroy word"
```

```
splitter addr    0xA1ea75f21bb28B23d686d36A7231A6c8EE1D9F49
alice addr       0xf6ff4bfdda194ecc1b8d8ee10b1d2d762e3ae1ba
bob addr         0x8e40dd200b0faa0d6f50220ab9a295c1773dd1ca
carol addr       0xc99932d93843b8fe108d7bbb58ececbd184a1603
```

## Useful commands

```
// get contract abi and bin
solc --combined-json abi,bin ../contracts/Splitter.sol | jq
// get deployed contract
Splitter.deployed().then(console.log)
// send wei to contract
Splitter.deployed().then(i => i.send(10, {from: '0xf6ff4bfdda194ecc1b8d8ee10b1d2d762e3ae1ba'}))
// get contract balance
web3.eth.getBalance(Splitter.address)
// call variable
Splitter.deployed().then(i => i.toWithdrawn1.call().then(v => console.log(v.toString(10))))
// call function with transaction
Splitter.deployed().then(i => i.withdraw.sendTransaction({from: '0x8e40dd200b0faa0d6f50220ab9a295c1773dd1ca'}))
```