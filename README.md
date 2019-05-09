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
truffle test
// By using the following mnemonic with ganache the address of the contract will be already the same as in app.js. 
ganache-cli --accounts=3 --host=0.0.0.0 --m "dream feel bracket hill river gate farm naive paddle script destroy word"
truffle migrate
./node_modules/.bin/webpack-cli --mode development
php -S 0.0.0.0:8000 -t ./build/app
```
