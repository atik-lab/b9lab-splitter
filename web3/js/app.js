// Prepare splitter instance
const splitterAddress = '0xA1ea75f21bb28B23d686d36A7231A6c8EE1D9F49';
const splitterContractFactory = web3.eth.contract(JSON.parse(Splitter.contracts["Splitter.sol:Splitter"].abi));
const splitterInstance = splitterContractFactory.at(splitterAddress);

// Prepare main variables
let aliceAddress = null;
let bobAddress = null;
let carolAddress = null;

window.onload = function () {
    if (typeof web3 !== 'undefined') {
        // Don't lose an existing provider, like Mist or Metamask
        web3 = new Web3(web3.currentProvider);
    } else {
        // set the provider you want from Web3.providers
        web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
    }
    init();
};

function init()
{
    // Charge addresses to the pertaining variables and show them to the user
    document.getElementById("SplitterAddress").innerText = splitterAddress;
    splitterInstance.owner.call(function (error, result) {
        if (error) {
            console.log(error);
        } else {
            aliceAddress = result;
            document.getElementById("AliceAddress").innerText = aliceAddress;
        }
    });
    splitterInstance.beneficiary1.call(function (error, result) {
        if (error) {
            console.log(error);
        } else {
            bobAddress = result;
            document.getElementById("BobAddress").innerText = bobAddress;
        }
    });
    splitterInstance.beneficiary2.call(function (error, result) {
        if (error) {
            console.log(error);
        } else {
            carolAddress = result;
            document.getElementById("CarolAddress").innerText = carolAddress;
        }
    });
    setInterval(function() {
        updateAllBalances();
    }, 500);  // every 0.5 seconds
}

function updateAllBalances()
{
    updateBalance(splitterAddress, "SplitterBalance");
    updateBalance(aliceAddress, "AliceBalance");
    updateBalance(bobAddress, "BobBalance");
    updateBalance(carolAddress, "CarolBalance");
    updateWithdraw();
}

// Updates balance on ui on id element with address balance
function updateBalance(address, id)
{
    web3.eth.getBalance(address, function(error, balance) {
        if (error) {
            console.error(error);
        } else {
            document.getElementById(id).innerText = web3.fromWei(balance, "ether");
        }
    });
}

// Show to the user the balances to withdraw
function updateWithdraw()
{
    splitterInstance.toWithdraw1.call(function (error, result) {
        if (error) {
            console.log(error);
        } else {
            document.getElementById("toWithdraw1").innerText = web3.fromWei(result.toString());
        }
    });
    splitterInstance.toWithdraw2.call(function (error, result) {
        if (error) {
            console.log(error);
        } else {
            document.getElementById("toWithdraw2").innerText = web3.fromWei(result.toString());
        }
    });
}

function split() {
    let amount = document.getElementById("SplitAmount").value;
    web3.eth.sendTransaction({
        from: getMyAddress(),
        to: splitterAddress,
        value: web3.toWei(amount, "ether")
    }, function(error, tx) {
        if (error) {
            alert("Error! Check console");
            console.error(error);
        } else {
            alert("Split successful");
        }
    });
}

function withdraw() {
    splitterInstance.withdraw({
        from: getMyAddress()
    }, function (error, tx) {
        if (error) {
            alert("Error! Check console");
            console.error(error);
        } else {
            alert("Withdraw successful");
        }
    });
}

// Get Metamask address
function getMyAddress()
{
    return web3.eth.accounts[0];
}
