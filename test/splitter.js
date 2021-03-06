const Splitter = artifacts.require("Splitter.sol");
Promise = require("bluebird");
const expectedExceptionPromise = require("../util/expected-exception-promise.js");
const { toWei, toBN } = web3.utils;

contract('Main test', accounts => {
    const [ alice, bob, carol ] = accounts;
    const quantity = toWei('0.1', 'ether');
    const quantityBN = toBN(quantity);
    const halfQuantity = toWei('0.05', 'ether');
    const halfQuantityBN = toBN(halfQuantity);

    let instance;
    beforeEach("deploy and prepare", async function() {
        instance = await Splitter.new(bob, carol, {from: alice});
    });

    before("running check if the setup is correct to pass the tests", async function() {

        let aliceBalanceBN = toBN(await web3.eth.getBalance(alice));
        let minimum = toBN(toWei('1', 'ether'));
        instance = await Splitter.new(bob, carol, {from: alice});
        assert.isTrue(aliceBalanceBN.gte(minimum));
        assert.strictEqual(await web3.eth.getBalance(instance.address), '0');
    });

    describe("splitting ETH", function() {

        it("should not let Alice send Eth to the contract", async function() {
            return await expectedExceptionPromise(function() {
                return instance.sendTransaction({from: alice, value: quantity});
            });
        });

        it("should let alice split her ETH", async function() {
            let txObj = await instance.split(bob, carol, {from: alice, value: quantity});
            // Check event
            assert.strictEqual(txObj.logs.length, 1, "Only one event is expected");
            let args = txObj.logs[0].args;
            assert.strictEqual(args['whodunnit'], alice, "Log event whodunnit not correct");
            assert.strictEqual(args['beneficiary1'], bob, "Log event beneficiary1 not correct");
            assert.strictEqual(args['amount1'].toString(), halfQuantityBN.add(quantityBN.mod(toBN(2))).toString(), "Log event amount not correct");
            assert.strictEqual(args['beneficiary2'], carol, "Log event beneficiary2 not correct");
            assert.strictEqual(args['amount2'].toString(), halfQuantity, "Log event amount not correct");
            // Check the correctness of the transaction
            let newBalanceBN = toBN(await web3.eth.getBalance(instance.address));
            assert.strictEqual(quantityBN.toString(), newBalanceBN.toString(), "Contract does not have the ether we sent.");
            let toWithdraw1 = toBN(await instance.beneficiaries(bob));
            let toWithdraw2 = toBN(await instance.beneficiaries(carol));
            assert.strictEqual(toWithdraw1.toString(), halfQuantityBN.toString(), "toWithdraw1 should had been increased correctly.");
            assert.strictEqual(toWithdraw2.toString(), halfQuantityBN.toString(), "toWithdraw1 should had been increased correctly.");
        });

        it("should not send ETH while paused", async function() {
            let txObj = await instance.pause({from: alice});
            assert.strictEqual(txObj.logs.length, 1, "Only one event is expected");
            await expectedExceptionPromise(function() {
                return instance.split(bob, carol, {from: alice, value: quantity})
            });
        });
    });

    describe("withdrawing ETH from the contract", function() {

        beforeEach("deploy and prepare", async function() {
            await instance.split(bob, carol, {from: alice, value: quantity});
        });

        it("should let bob withdraw his ETH", async function() {
            let bobInitialBalanceBN = toBN(await web3.eth.getBalance(bob));
            let txObj = await instance.withdraw({from: bob});
            // Check the event
            assert.strictEqual(txObj.logs.length, 1, "Only one event is expected");
            assert.strictEqual(txObj.logs[0].args['beneficiary'], bob, "Log event address not correct");
            assert.strictEqual(txObj.logs[0].args['amount'].toString(), halfQuantity, "Log event address not correct");
            // Calculate transaction cost
            let gasUsed = toBN(txObj.receipt.gasUsed);
            let tx = await web3.eth.getTransaction(txObj.tx);
            let gasPrice = toBN(tx.gasPrice);
            let transactionCostBN = gasPrice.mul(gasUsed);
            // Get new balance and compare
            let bobNewBalanceBN = toBN(await web3.eth.getBalance(bob));
            let newBalanceCalculation = bobInitialBalanceBN.sub(transactionCostBN).add(halfQuantityBN);
            assert.strictEqual(newBalanceCalculation.toString(), bobNewBalanceBN.toString(), "Bob balance does not match");
            // Check that his new balance is 0
            let toWithdraw = toBN(await instance.beneficiaries(bob));
            assert.strictEqual(toWithdraw.toString(), "0", "Balance should be 0 after withdrawing");
        });
    });
});