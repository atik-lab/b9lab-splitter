const Splitter = artifacts.require("Splitter.sol");
Promise = require("bluebird");

contract('Main test', accounts => {
    const [ alice, bob, carol ] = accounts;
    describe("Check if the setup is correct to pass the tests", function() {
        it("The accounts have enough balance", async function() {
            assert.isAtLeast(parseFloat(web3.utils.fromWei(await web3.eth.getBalance(alice), 'ether')), 1);
        });
    });
    describe("Splitting ETH", function () {
        let instance;
        let quantity, quantityBN, halfQuantity, halfQuantityBN;
        beforeEach("Deploy and prepare", function() {
            quantity = web3.utils.toWei('0.1', 'ether');
            quantityBN = web3.utils.toBN(quantity);
            halfQuantity = web3.utils.toWei('0.05', 'ether');
            halfQuantityBN = web3.utils.toBN(halfQuantity);
            return Splitter.new(bob, carol, {from: alice})
                .then(_i => instance = _i);
        });
        it("Alice cannot send ETH to the contract", function() {
            return instance.send({from: alice, value: quantity})
                .catch(error => {
                    assert(error, "Expected an error.");
                });
        });
        it("Alice splits ETH", async function() {
            let initialBalanceBN = web3.utils.toBN(await web3.eth.getBalance(instance.address));
            let txObj = await instance.split(bob, carol, {from: alice, value: quantity});
            assert.strictEqual(txObj.logs.length, 1, "Only one event is expected");
            let newBalanceBN = web3.utils.toBN(await web3.eth.getBalance(instance.address));
            assert.strictEqual(initialBalanceBN.add(quantityBN).toString(), newBalanceBN.toString(), "Contract does not have the ether we sent.");
            let toWithdraw1 = web3.utils.toBN(await instance.beneficiaries(bob));
            let toWithdraw2 = web3.utils.toBN(await instance.beneficiaries(carol));
            assert.strictEqual(toWithdraw1.toString(), halfQuantityBN.toString(), "toWithdraw1 should had been increased correctly.");
            assert.strictEqual(toWithdraw2.toString(), halfQuantityBN.toString(), "toWithdraw1 should had been increased correctly.");
        });
        it("Cannot send ETH while paused", async function () {
            let txObj = await instance.pause({from: alice});
            assert.strictEqual(txObj.logs.length, 1, "Only one event is expected");
            return instance.split(bob, carol, {from: alice, value: quantity})
                .catch(error => {
                    assert(error, "Expected an error as the contract is paused.");
                })
                .then(txObj2 => {
                    return instance.unpause({from: alice})
                })
                .then(txObj3 => {
                    return instance.split(bob, carol, {from: alice, value: quantity})
                });
        });
    });
    describe("Withdrawing ETH from the contract", function () {
        let instance;
        let quantity, quantityBN, halfQuantity, halfQuantityBN;
        beforeEach("Deploy and prepare", function() {
            quantity = web3.utils.toWei('0.1', 'ether');
            quantityBN = web3.utils.toBN(quantity);
            halfQuantity = web3.utils.toWei('0.05', 'ether');
            halfQuantityBN = web3.utils.toBN(halfQuantity);
            return Splitter.new(bob, carol, {from: alice})
                .then(_i => instance = _i);
        });
        it("Bob can withdraw", async function() {
            await instance.split(bob, carol, {from: alice, value: quantity});
            let bobInitialBalanceBN = web3.utils.toBN(await web3.eth.getBalance(bob));
            let txObj = await instance.withdraw({from: bob});
            assert.strictEqual(txObj.logs.length, 1, "Only one event is expected");
            // calculate transaction cost
            let gasUsed = web3.utils.toBN(txObj.receipt.gasUsed);
            let tx = await web3.eth.getTransaction(txObj.tx);
            let gasPrice = web3.utils.toBN(tx.gasPrice);
            let transactionCostBN = gasPrice.mul(gasUsed);
            // get new balance and compare
            let bobNewBalanceBN = web3.utils.toBN(await web3.eth.getBalance(bob));
            let newBalanceCalculation = bobInitialBalanceBN.sub(transactionCostBN).add(halfQuantityBN);
            assert.strictEqual(newBalanceCalculation.toString(), bobNewBalanceBN.toString(), "Bob balance does not match");
            // balance: 0
            let toWithdraw = web3.utils.toBN(await instance.beneficiaries(bob));
            assert.strictEqual(toWithdraw.toString(), "0", "Balance should be 0 after withdrawing");
        });
    });
});