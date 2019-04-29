const Splitter = artifacts.require("Splitter");

module.exports = function(deployer, network, accounts) {
    return deployer.deploy(Splitter, accounts[1], accounts[2]);
};
