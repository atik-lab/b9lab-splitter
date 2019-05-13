require("file-loader?name=../index.html!../index.html");
require("file-loader?name=../css/normalize.css!../css/normalize.css");
require("file-loader?name=../css/skeleton.css!../css/skeleton.css");
require("file-loader?name=../css/style.css!../css/style.css");
const Web3 = require("web3");
const splitterJson = require("../../build/contracts/Splitter.json");

let splitterInstance;
let web3, accounts, defaultAccount;

window.onload = async function() {
    if (window.ethereum) {
        web3 = new Web3(window.ethereum);
        try {
            await ethereum.enable();
            accounts = await web3.eth.getAccounts();
        } catch (error) {
            messageError('User denied account access...');
        }
    } else if (window.web3) { // Legacy dapp browsers...
        web3 = new Web3(web3.currentProvider);
        accounts = web3.eth.getAccounts().then(e => accounts = e);
    } else { // Non-dapp browsers...
        web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:8545"));
        accounts = web3.eth.getAccounts().then(e => accounts = e);
        messageError('Non-Ethereum browser detected. Download: https://metamask.io/');
    }
    defaultAccount = accounts[0];
    console.log("Web3 v" + web3.version);
    // Prepare contract
    const networkId = await web3.eth.net.getId();
    const deployedNetwork = splitterJson.networks[networkId];
    splitterInstance = new web3.eth.Contract(splitterJson.abi, deployedNetwork.address);
    // Initialize
    splitter.init();
};

module.exports = {
    init: function() {
        splitter.createBalanceTable();
        splitter.startWatcher();
    },
    split: function() {
        let amount = document.getElementById("SplitAmount").value;
        let beneficiary1 = document.getElementById("SplitBeneficiary1").value;
        let beneficiary2 = document.getElementById("SplitBeneficiary2").value;
        splitterInstance.methods.split(beneficiary1, beneficiary2).send({from: defaultAccount, value: web3.utils.toWei(amount, "ether")})
            .on('transactionHash', (transactionHash) => {
                messageSuccess("Transaction " + transactionHash);
            })
            .on('confirmation', (confirmationNumber, receipt) => {
                if (receipt.status === true && receipt.logs.length === 1) {
                    messageSuccess("Split successful");
                } else {
                    messageError("Transaction status: failed");
                }
            })
            .on('error', error => {
                messageError(error);
            });
    },
    withdraw: function() {
        splitterInstance.methods.withdraw().send({from: defaultAccount})
            .on('transactionHash', (transactionHash) => {
                messageSuccess("Transaction " + transactionHash);
            })
            .on('confirmation', (confirmationNumber, receipt) => {
                if (receipt.status === true && receipt.logs.length === 1) {
                    messageSuccess("Withdraw successful");
                } else {
                    messageError("Transaction status: failed");
                }
            })
            .on('error', error => {
                messageError("Error. Not enough balance? " + error);
            });
    },
    // Show to the user his balance available to withdraw
    createBalanceTable: function() {
        splitterInstance.getPastEvents('allEvents', {fromBlock: 0, toBlock: "latest"})
            .then(events => {
                for (let i = 0; i < events.length; i += 1) {
                    splitter.parseEvent(events[i]);
                }
            })
            .catch(error => {
                messageError("Error fetching events: " + error);
            })
    },
    // Watcher to update gui
    startWatcher: function() {
        splitterInstance.events.allEvents()
            .on('data', event => {
                splitter.parseEvent(event);
            })
            .on('error', error => {
                messageError("Error on event: " + error);
            });
    },
    // Update UI with the event
    parseEvent: function(event) {
        switch (event.event) {
            case 'LogEtherPaid':
                let amount1 = web3.utils.toBN(event.returnValues['amount1'].toString()); // BN !== BigNumber
                let amount2 = web3.utils.toBN(event.returnValues['amount2'].toString()); // BN !== BigNumber
                splitter.addBalanceInTable(event.returnValues['beneficiary1'], amount1);
                splitter.addBalanceInTable(event.returnValues['beneficiary2'], amount2);
                splitter.addToDOMElement('ContractBalance', amount1.add(amount2));
                if (event.returnValues['beneficiary1'] === defaultAccount) {
                    splitter.addToDOMElement('WithdrawBalance', amount1);
                }
                if (event.returnValues['beneficiary2'] === defaultAccount) {
                    splitter.addToDOMElement('WithdrawBalance', amount2);
                }
                break;
            case 'LogEtherWithdraw':
                let amount = web3.utils.toBN(event.returnValues['amount'].toString()); // BN !== BigNumber
                splitter.addBalanceInTable(event.returnValues['beneficiary'], amount.neg());
                splitter.addToDOMElement('ContractBalance', amount.neg());
                if (event.returnValues['beneficiary'] === defaultAccount) {
                    splitter.addToDOMElement('WithdrawBalance', amount.neg());
                }
                break;
            default:
                console.log(event);
        }
    },
    // Add balance in frontend
    addBalanceInTable: function(address, amount) {
        if (document.getElementById(address) !== null) {
            splitter.addToDOMElement(address + '_value', amount);
        } else {
            let newRow = '<tr><td id="' + address + '">' + address + '</td><td id="' + address + '_value">' + web3.utils.fromWei(amount.toString()) + '</td></tr>';
            document.getElementById("BalanceTableBody").innerHTML += newRow;
        }
    },
    // Change contract balance UI
    addToDOMElement: function(elementId, amount) {
        let oldAmount = web3.utils.toBN(web3.utils.toWei(document.getElementById(elementId).innerText));
        let newBalance = oldAmount.add(amount);
        document.getElementById(elementId).innerText = web3.utils.fromWei(newBalance.toString())
    }
};

/*
 * Messages and utils
 */

let messageIdCounter = 0;

function messageSuccess(message) {
    let messageBox = document.getElementById("MessageBox");
    let messageId = messageIdCounter;
    let div = document.createElement('div');
    div.id = 'message-id-' + messageId;
    div.className = 'message-success';
    div.innerText = message;
    messageBox.insertBefore(div, messageBox.firstChild);
    messageIdCounter++;
    setTimeout(function(){
        document.getElementById(div.id).remove();
    }, 1000*5); // Every second checkStatus
}

function messageError(message) {
    let messageBox = document.getElementById("MessageBox");
    let messageId = messageIdCounter;
    let div = document.createElement('div');
    div.id = 'message-id-' + messageId;
    div.className = 'message-error';
    div.innerText = message;
    messageBox.insertBefore(div, messageBox.firstChild);
    messageIdCounter++;
    setTimeout(function(){
        document.getElementById(div.id).remove();
    }, 1000*5); // Every second checkStatus
}
