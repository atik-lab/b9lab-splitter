const Splitter = artifacts.require("Splitter");

module.exports = function(deployer, network, accounts) {
    deployer.then(() => {
        return deployer.deploy(Splitter, accounts[1], accounts[2]);
    });
};
