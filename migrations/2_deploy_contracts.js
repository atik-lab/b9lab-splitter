const Splitter = artifacts.require("Splitter");

const beneficiary1 = "0x8e40dd200b0faa0d6f50220ab9a295c1773dd1ca";
const beneficiary2 = "0xc99932d93843b8fe108d7bbb58ececbd184a1603";

module.exports = function(deployer) {
    deployer.then(() => {
        return deployer.deploy(Splitter, beneficiary1, beneficiary2);
    });
};
