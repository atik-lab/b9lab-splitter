require("file-loader?name=./web3.js!./web3.js");
require("file-loader?name=../index.html!../index.html");
require("file-loader?name=../css/normalize.css!../css/normalize.css");
require("file-loader?name=../css/skeleton.css!../css/skeleton.css");

// Prepare splitter instance
const splitterAddress = '0xA1ea75f21bb28B23d686d36A7231A6c8EE1D9F49';
const splitterJson = require("../../build/contracts/Splitter.json");
const splitterContractFactory = web3.eth.contract(splitterJson.abi);
const splitterInstance = splitterContractFactory.at(splitterAddress);

window.onload = async function () {
    if (typeof web3 !== 'undefined') {
        // Don't lose an existing provider, like Mist or Metamask
        web3 = new Web3(web3.currentProvider);
        await ethereum.enable(); // Introduced in last versions of Metamask.
    } else {
        // set the provider you want from Web3.providers
        web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
    }
    splitter.init();
};

module.exports = {
    init: function () {
        // update my balance and balance table every second
        setInterval(function() {
            splitter.updateContractBalance();
            splitter.updateMyBalance();
            splitter.updateBalanceTable();
        }, 5000);
        splitter.updateContractBalance();
        splitter.updateMyBalance();
        splitter.updateBalanceTable();
    },
    // Update in the frontend the balance of the contract
    updateContractBalance: function () {
        web3.eth.getBalance(splitterAddress, function (error, balance) {
            if (error) {
                console.error(error);
            } else {
                document.getElementById("ContractBalance").innerText = web3.fromWei(balance, "ether");
            }
        });
    },
    // Show to the ui all the beneficiaries and their balances
    updateMyBalance: function () {
        splitterInstance.getMyBalance.call(function (error, result) {
            if (error) {
                console.log(error);
            } else {
                if (typeof result === 'undefined') {
                    result = 0;
                }
                document.getElementById("WithdrawBalance").value = web3.fromWei(result.toString());
            }
        });
    },
    // Show to the user his balance available to withdraw
    updateBalanceTable: function () {
        document.getElementById("BalanceTableBody").innerHTML = '';
        splitterInstance.getAddressLookupCount.call(function (error, addressCount) {
            if (error) {
                console.log(error);
            } else {
                for (let i = 0; i < addressCount; i++) {
                    splitterInstance.addressLookup.call(i, function (error, address) {
                        if (error) {
                            console.log(error);
                        } else {
                            splitterInstance.beneficiaries.call(address, function (error, result) {
                                if (error) {
                                    console.log(error);
                                } else {
                                    result = '<tr><td>' + address + '</td><td>' + web3.fromWei(result.toString()) + '</td></tr>';
                                    document.getElementById("BalanceTableBody").innerHTML += result;
                                }
                            });
                        }
                    });
                }
            }
        });
    },
    split: function () {
        let amount = document.getElementById("SplitAmount").value;
        let beneficiary1 = document.getElementById("SplitBeneficiary1").value;
        let beneficiary2 = document.getElementById("SplitBeneficiary2").value;
        splitterInstance.split(beneficiary1, beneficiary2, {
            from: splitter.getMyAddress(),
            value: web3.toWei(amount, "ether")
        }, function (error, tx) {
            if (error) {
                alert("Error! Check console");
                console.error(error);
            } else {
                alert("Split successful");
            }
        });
    },
    withdraw: function () {
        splitterInstance.withdraw({
            from: splitter.getMyAddress()
        }, function (error, tx) {
            if (error) {
                alert("Error! Check console");
                console.error(error);
            } else {
                alert("Withdraw successful");
            }
        });
    },
    getMyAddress: function ()
    {
        return web3.eth.accounts[0];
    }
};