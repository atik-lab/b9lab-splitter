const Splitter = artifacts.require("Splitter.sol");
Promise = require("bluebird");
const getBalancePromise = Promise.promisify(web3.eth.getBalance);

contract('Main test', accounts => {
    const alice = accounts[0];
    const bob = accounts[1];
    const carol = accounts[2];
    describe("Check if the setup is correct to pass the tests", function() {
        it("The accounts have enough balance", function() {
            return web3.eth.getBalance(alice)
                .then(balance => {
                    assert.isAtLeast(parseFloat(web3.utils.fromWei(balance, 'ether')), 1);
                });
        });
    });
    describe("The contract is well deployed", function () {
        let instance;
        beforeEach("Deploy and prepare", function() {
            return Splitter.new(bob, carol, {from: alice})
                .then(_i => {
                    instance = _i;
                });
        });
        it("Deployer is payer and is Alice", function() {
            return instance.isOwner.call()
                .then(isOwner => {
                    assert.isTrue(isOwner, "Deployer is not Alice");
                });
        });
        it("Beneficiary1 is Bob", function () {
            return instance.beneficiary1.call()
                .then(addr => {
                    assert.strictEqual(addr, bob, "Beneficiary1 is not Bob");
                });
        });
        it("Beneficiary2 is Carol", function () {
            return instance.beneficiary2.call()
                .then(addr => {
                    assert.strictEqual(addr, carol, "Beneficiary2 is not Carol");
                });
        });
    });
    describe("Sending ETH to the contract", function () {
        let instance;
        beforeEach("Deploy and prepare", function() {
            return Splitter.new(bob, carol, {from: alice})
                .then(_i => {
                    instance = _i;
                });
        });
        it("Alice can send ETH", function() {
            let initialBalance = null;
            let toWithdraw1 = null;
            let toWithdraw2 = null;
            let quantity = web3.utils.toWei('0.1', 'ether');
            let quantityBN = web3.utils.toBN(quantity);
            let halfQuantity = web3.utils.toWei('0.05', 'ether');
            let halfQuantityBN = web3.utils.toBN(halfQuantity);
            return getBalancePromise(instance.address)
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
                    return instance.pay({from: alice, value: quantity});
                })
                .then(txObj => {
                    assert.strictEqual(txObj.logs.length, 1, "Only one event is expected");
                    return getBalancePromise(instance.address)
                })
                .then(balance => {
                    let initialBalanceBN = web3.utils.toBN(initialBalance);
                    assert.strictEqual(initialBalanceBN.add(quantityBN).toString(), balance.toString(), "Contract does not have the ether we sent.");
                    return instance.toWithdraw1.call();
                })
                .then(_toWithdraw1 => {
                    assert.strictEqual(toWithdraw1.add(halfQuantityBN).toString(), _toWithdraw1.toString(), "toWithdraw1 should had been increased correctly.");
                    return instance.toWithdraw2.call();
                })
                .then(_toWithdraw2 => {
                    assert.strictEqual(toWithdraw2.add(halfQuantityBN).toString(), _toWithdraw2.toString(), "toWithdraw2 should had been increased correctly.");
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
                    return instance.pay({from: bob, value: quantity});
                })
                .catch(error => {
                    assert(error, "Expected an error when sending ether to the contract.");
                })
                .then(txObj => {
                    return getBalancePromise(Splitter.address)
                })
                .then(balance => {
                    let initialBalanceBN = web3.utils.toBN(initialBalance);
                    assert.strictEqual(initialBalanceBN.toString(), balance.toString(), "Contract should not had get any ether.");
                    return instance.toWithdraw1.call();
                })
                .then(_toWithdraw1 => {
                    assert.strictEqual(toWithdraw1.toString(), _toWithdraw1.toString(), "toWithdraw1 should be the same.");
                    return instance.toWithdraw2.call();
                })
                .then(_toWithdraw2 => {
                    assert.strictEqual(toWithdraw2.toString(), _toWithdraw2.toString(), "toWithdraw2 should be the same.");
                });
        });
    });
    describe("Withdrawing ETH from the contract", function () {
        let instance;
        beforeEach("Deploy and prepare", function() {
            return Splitter.new(bob, carol, {from: alice})
                .then(_i => {
                    instance = _i;
                });
        });
        it("Bob can withdraw", function() {
            let initialBalance = null;
            let transactionCost = null;
            let gasPrice = 2;
            let quantity = web3.utils.toWei('0.1', 'ether');
            let halfQuantity = web3.utils.toWei('0.05', 'ether');
            let halfQuantityBN = web3.utils.toBN(halfQuantity);
            return instance.pay({from: alice, value: quantity})
                .then(txObj => {
                    return getBalancePromise(bob)
                })
                .then(balance => {
                    initialBalance = balance;
                    return instance.withdraw({from: bob, gasPrice: gasPrice});
                })
                .then(txObj => {
                    transactionCost = txObj.receipt.gasUsed*gasPrice;
                    assert.strictEqual(txObj.logs.length, 1, "Only one event is expected");
                    return getBalancePromise(bob);
                })
                .then(balance => {
                    let _initialBalanceBN = web3.utils.toBN(initialBalance);
                    let _balanceBN = web3.utils.toBN(balance);
                    let _transactionCostBN = web3.utils.toBN(transactionCost);
                    assert.strictEqual(_initialBalanceBN.sub(_transactionCostBN).add(halfQuantityBN).toString(), _balanceBN.toString());
                    return instance.toWithdraw1.call();
                })
                .then(_toWithdraw1 => {
                    assert.strictEqual(_toWithdraw1.toString(), "0", "toWithdraw1 should be 0.");
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