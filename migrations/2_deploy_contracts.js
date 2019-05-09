const Splitter = artifacts.require("Splitter");

module.exports = function(deployer) {
    return deployer.deploy(Splitter);
};
