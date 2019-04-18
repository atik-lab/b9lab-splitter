const Splitter = artifacts.require("Splitter");

const beneficiary1 = "0x3e23c98bfe03e3ed377d229e447bd2296b7e6966";
const beneficiary2 = "0x6cc1c28eb6e7a620bd17a690c23c09b2b86053ff";

module.exports = function(deployer) {
    deployer.then(() => {
        return deployer.deploy(Splitter, beneficiary1, beneficiary2);
    });
};
