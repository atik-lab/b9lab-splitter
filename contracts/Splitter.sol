pragma solidity >=0.4.21 <0.6.0;

import "contracts/Pausable.sol";

contract Splitter is Pausable {
    address public beneficiary1;
    address public beneficiary2;
    uint public toWithdraw1; // amount available to withdraw for beneficiary 1
    uint public toWithdraw2; // amount available to withdraw for beneficiary 2

    event LogEtherAdded(uint amount);
    event LogEtherWithdraw1(uint amount);
    event LogEtherWithdraw2(uint amount);

    /**
     * Alice constructs the contract with both of the beneficiaries.
     * Alice will be the owner of the contract and the payer, and if ownership is transferred then
     * the new owner will be the new payer.
     */
    constructor(address _beneficiary1, address _beneficiary2) public {
        require(_beneficiary1 != _beneficiary2, "Beneficiaries must be different");
        require(_beneficiary1 != address(0), "Beneficiary1 address is malformed");
        require(_beneficiary2 != address(0), "Beneficiary2 address is malformed");
        beneficiary1 = _beneficiary1;
        beneficiary2 = _beneficiary2;
    }

    /**
     * Alice sends ether to the contract with pay(), for it to be split,
     * half of it goes to Bob and the other half to Carol.
     */
    function pay() external payable whenNotPaused onlyOwner {
        require(msg.value%2 == 0, "It's not allowed to send an odd value.");
        uint _addedAmount = msg.value/uint(2);
        toWithdraw1 += _addedAmount;
        toWithdraw2 += _addedAmount;
        emit LogEtherAdded(msg.value);
    }

    /**
     * Beneficiaries can withdraw, all at once for the sake of simplicity
     */
    function withdraw() public whenNotPaused {
        uint _quantityToWithdraw;
        if (msg.sender == beneficiary1) {
            _quantityToWithdraw = toWithdraw1;
            require(_quantityToWithdraw > 0, "Nothing to withdraw");
            toWithdraw1 = 0;  // Force to zero the balance before transfer to avoid re-entrance vulnerability
            emit LogEtherWithdraw1(_quantityToWithdraw);
            msg.sender.transfer(_quantityToWithdraw);
        } else if (msg.sender == beneficiary2) {
            _quantityToWithdraw = toWithdraw2;
            require(_quantityToWithdraw > 0, "Nothing to withdraw");
            toWithdraw2 = 0;
            emit LogEtherWithdraw2(_quantityToWithdraw);
            msg.sender.transfer(_quantityToWithdraw);
        } else {
            revert("Only beneficiaries can withdraw");
        }
    }
}
