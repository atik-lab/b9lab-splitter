const Splitter = artifacts.require("Splitter.sol");
Promise = require("bluebird");
const getBalancePromise = Promise.promisify(web3.eth.getBalance);

const alice = '0xf6FF4BFDDA194eCc1b8d8Ee10B1d2d762E3aE1Ba';
const bob = '0x8e40dD200b0FAA0D6f50220Ab9A295C1773dD1ca';
const carol = '0xc99932d93843B8FE108D7Bbb58Ececbd184A1603';

contract('Main test', accounts => {
    let instance;  // contract instance
    describe("Check if the setup is correct to pass the tests", function() {
        it("We are using the right seed", function() {
            assert.isTrue(accounts[0] === alice, "Not using the correct seed, read README/Setup.");
        });
        it("The accounts have enough balance", function() {
            return new Promise((resolve, reject) => {  // using real promises
                web3.eth.getBalance(accounts[0], function (error, balance) {
                    if (error) {
                        reject(error);
                    } else  {
                        assert.isAtLeast(parseFloat(web3.utils.fromWei(balance, 'ether')), 1);
                        resolve(balance);
                    }
                });
            });
        });
    });
    describe("The contract is well deployed", function () {
        it("Deployer is payer and is Alice", function() {
            return Splitter.deployed()
                .then(_i => {
                    instance = _i;
                    return _i.payer.call();
                })
                .then(addr => {
                    assert.isTrue(addr === alice, "Deployer is not Alice");
                });
        });
        it("Beneficiary1 is Bob", function () {
            return instance.beneficiary1.call()
                .then(addr => {
                    assert.isTrue(addr === bob, "Beneficiary1 is not Bob");
                });
        });
        it("Beneficiary2 is Carol", function () {
            return instance.beneficiary2.call()
                .then(addr => {
                    assert.isTrue(addr === carol, "Beneficiary2 is not Carol");
                });
        });
    });
    describe("Sending ETH to the contract", function () {
        it("Alice can send ETH", function() {
            let initialBalance = null;
            let toWithdraw1 = null;
            let toWithdraw2 = null;
            let quantity = web3.utils.toWei('0.1', 'ether');
            let quantityBN = web3.utils.toBN(quantity);
            let halfQuantity = web3.utils.toWei('0.05', 'ether');
            let halfQuantityBN = web3.utils.toBN(halfQuantity);
            return getBalancePromise(Splitter.address)  // using bluebird promises, much more convenient
                .then(balance => {
                    initialBalance = balance;
                    return instance.toWithdraw1.call();
                })
                .then(_toWithdraw1 => {
                    toWithdraw1 = _toWithdraw1;
                    return instance.toWithdraw2.call();
                })
                .then(_toWithdraw2 => {
                    toWithdraw2 = _toWithdraw2;
                    return instance.send(quantity, {from: alice});
                })
                .then(txObj => {
                    assert.strictEqual(txObj.logs.length, 1, "Only one event is expected");
                    return getBalancePromise(Splitter.address)
                })
                .then(balance => {
                    let initialBalanceBN = web3.utils.toBN(initialBalance);
                    assert.isTrue(initialBalanceBN.add(quantityBN).toString() === balance.toString(), "Contract does not have the ether we sent.");
                    return instance.toWithdraw1.call();
                })
                .then(_toWithdraw1 => {
                    assert.isTrue(toWithdraw1.add(halfQuantityBN).toString() === _toWithdraw1.toString(), "toWithdraw1 should had been increased correctly.");
                    return instance.toWithdraw2.call();
                })
                .then(_toWithdraw2 => {
                    assert.isTrue(toWithdraw2.add(halfQuantityBN).toString() === _toWithdraw2.toString(), "toWithdraw2 should had been increased correctly.");
                });
        });
        it("Bob cannot send ETH", function() {
            let initialBalance = null;
            let toWithdraw1 = null;
            let toWithdraw2 = null;
            let quantity = web3.utils.toWei('0.1', 'ether');
            return getBalancePromise(Splitter.address)
                .then(balance => {
                    initialBalance = balance;
                    return instance.toWithdraw1.call();
                })
                .then(_toWithdraw1 => {
                    toWithdraw1 = _toWithdraw1;
                    return instance.toWithdraw2.call();
                })
                .then(_toWithdraw2 => {
                    toWithdraw2 = _toWithdraw2;
                    return instance.send(quantity, {from: bob});
                })
                .catch(error => {
                    assert(error, "Expected an error when sending ether to the contract.");
                })
                .then(txObj => {
                    return getBalancePromise(Splitter.address)
                })
                .then(balance => {
                    let initialBalanceBN = web3.utils.toBN(initialBalance);
                    assert.isTrue(initialBalanceBN.toString() === balance.toString(), "Contract should not had get any ether.");
                    return instance.toWithdraw1.call();
                })
                .then(_toWithdraw1 => {
                    assert.isTrue(toWithdraw1.toString() === _toWithdraw1.toString(), "toWithdraw1 should be the same.");
                    return instance.toWithdraw2.call();
                })
                .then(_toWithdraw2 => {
                    assert.isTrue(toWithdraw2.toString() === _toWithdraw2.toString(), "toWithdraw2 should be the same.");
                });
        });
    });
    describe("Withdrawing ETH from the contract", function () {
        it("Bob can withdraw", function() {
            let initialBalance = null;
            return getBalancePromise(bob)
                .then(balance => {
                    initialBalance = balance;
                    return instance.withdraw({from: bob});
                })
                .then(txObj => {
                    assert.strictEqual(txObj.logs.length, 1, "Only one event is expected");
                    return getBalancePromise(bob);
                })
                .then(balance => {
                    assert.isTrue(balance > initialBalance);
                    return instance.toWithdraw1.call();
                })
                .then(_toWithdraw1 => {
                    assert.isTrue(_toWithdraw1.toString() === "0", "toWithdraw1 should be 0.");
                })
        });
        it("Alice cannot withdraw", function() {
            return instance.withdraw({from: alice})
                .catch(error => {
                    assert(error, "Expected an error when withdrawing from Alice to the contract.");
                })
        });
    });
});