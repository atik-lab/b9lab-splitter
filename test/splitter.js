const Splitter = artifacts.require("Splitter.sol");
Promise = require("bluebird");
const expectedExceptionPromise = require("../util/expected-exception-promise.js");

contract('Main test', accounts => {
    const [ alice, bob, carol ] = accounts;
    const quantity = web3.utils.toWei('0.1', 'ether');
    const quantityBN = web3.utils.toBN(quantity);
    const halfQuantity = web3.utils.toWei('0.05', 'ether');
    const halfQuantityBN = web3.utils.toBN(halfQuantity);

    describe("Check if the setup is correct to pass the tests", function() {
        let instance;

        beforeEach("Deploy and prepare", async function() {
            instance = await Splitter.new(bob, carol, {from: alice});
        });

        it("The accounts have enough balance", async function() {
            let aliceBalanceBN = web3.utils.toBN(await web3.eth.getBalance(alice));
            let minimum = web3.utils.toBN(web3.utils.toWei('1', 'ether'));
            assert.isTrue(aliceBalanceBN.gte(minimum));
        });

        it("The contract starts with 0 balance", async function() {
            assert.strictEqual(await web3.eth.getBalance(instance.address), '0');
        });
    });

    describe("Splitting ETH", function() {
        let instance;

        beforeEach("Deploy and prepare", async function() {
            instance = await Splitter.new(bob, carol, {from: alice});
        });

        it("Alice cannot send ETH to the contract", async function() {
            return await expectedExceptionPromise(function() {
                return instance.sendTransaction({from: alice, value: quantity});
            });
        });

        it("Alice splits ETH", async function() {
            let txObj = await instance.split(bob, carol, {from: alice, value: quantity});
            // Check event
            assert.strictEqual(txObj.logs.length, 1, "Only one event is expected");
            assert.strictEqual(txObj.logs[0].args['whodunnit'], alice, "Log event whodunnit not correct");
            assert.strictEqual(txObj.logs[0].args['beneficiary1'], bob, "Log event beneficiary1 not correct");
            assert.strictEqual(txObj.logs[0].args['amount1'].toString(), halfQuantityBN.add(quantityBN.mod(web3.utils.toBN(2))).toString(), "Log event amount not correct");
            assert.strictEqual(txObj.logs[0].args['beneficiary2'], carol, "Log event beneficiary2 not correct");
            assert.strictEqual(txObj.logs[0].args['amount2'].toString(), halfQuantity, "Log event amount not correct");
            // Check the correctness of the transaction
            let newBalanceBN = web3.utils.toBN(await web3.eth.getBalance(instance.address));
            assert.strictEqual(quantityBN.toString(), newBalanceBN.toString(), "Contract does not have the ether we sent.");
            let toWithdraw1 = web3.utils.toBN(await instance.beneficiaries(bob));
            let toWithdraw2 = web3.utils.toBN(await instance.beneficiaries(carol));
            assert.strictEqual(toWithdraw1.toString(), halfQuantityBN.toString(), "toWithdraw1 should had been increased correctly.");
            assert.strictEqual(toWithdraw2.toString(), halfQuantityBN.toString(), "toWithdraw1 should had been increased correctly.");
        });

        it("Cannot send ETH while paused", async function() {
            let txObj = await instance.pause({from: alice});
            assert.strictEqual(txObj.logs.length, 1, "Only one event is expected");
            await expectedExceptionPromise(function() {
                return instance.split(bob, carol, {from: alice, value: quantity})
            });
        });
    });

    describe("Withdrawing ETH from the contract", function() {
        let instance;

        beforeEach("Deploy and prepare", async function() {
            instance = await Splitter.new(bob, carol, {from: alice});
            await instance.split(bob, carol, {from: alice, value: quantity});
        });

        it("Bob can withdraw", async function() {
            let bobInitialBalanceBN = web3.utils.toBN(await web3.eth.getBalance(bob));
            let txObj = await instance.withdraw({from: bob});
            // Check the event
            assert.strictEqual(txObj.logs.length, 1, "Only one event is expected");
            assert.strictEqual(txObj.logs[0].args['beneficiary'], bob, "Log event address not correct");
            assert.strictEqual(txObj.logs[0].args['amount'].toString(), halfQuantity, "Log event address not correct");
            // Calculate transaction cost
            let gasUsed = web3.utils.toBN(txObj.receipt.gasUsed);
            let tx = await web3.eth.getTransaction(txObj.tx);
            let gasPrice = web3.utils.toBN(tx.gasPrice);
            let transactionCostBN = gasPrice.mul(gasUsed);
            // Get new balance and compare
            let bobNewBalanceBN = web3.utils.toBN(await web3.eth.getBalance(bob));
            let newBalanceCalculation = bobInitialBalanceBN.sub(transactionCostBN).add(halfQuantityBN);
            assert.strictEqual(newBalanceCalculation.toString(), bobNewBalanceBN.toString(), "Bob balance does not match");
            // Check that his new balance is 0
            let toWithdraw = web3.utils.toBN(await instance.beneficiaries(bob));
            assert.strictEqual(toWithdraw.toString(), "0", "Balance should be 0 after withdrawing");
        });
    });
});