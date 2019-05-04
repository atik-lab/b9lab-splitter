pragma solidity >=0.4.21 <0.6.0;

import "./Pausable.sol";
import "./SafeMath.sol";

contract Splitter is Pausable {
    using SafeMath for uint;

    mapping(address => uint) public beneficiaries;
    address[] public addressLookup;

    event LogEtherPaid(address indexed beneficiary1, address indexed beneficiary2, uint amount);
    event LogEtherWithdraw(address indexed beneficiary, uint amount);

    /**
     * Avoid sending money directly to the contract
     */
    function() external payable {
        revert("Use split() to send money.");
    }

    /**
     * Alice sends ether to the contract with pay(), for it to be split,
     * half of it goes to Bob and the other half to Carol.
     */
    function split(address _beneficiary1, address _beneficiary2) external payable whenNotPaused {
        require(msg.value%2 == 0, "It's not allowed to send an odd value.");
        require(_beneficiary1 != _beneficiary2, "Beneficiaries must be different");
        require(_beneficiary1 != address(0), "Beneficiary1 address is malformed");
        require(_beneficiary2 != address(0), "Beneficiary2 address is malformed");
        require(msg.value > 0, "You must send something to split");
        uint _addedAmount = msg.value/uint(2);
        emit LogEtherPaid(_beneficiary1, _beneficiary2, msg.value);
        beneficiaries[_beneficiary1] = beneficiaries[_beneficiary1].add(_addedAmount);
        beneficiaries[_beneficiary2] = beneficiaries[_beneficiary2].add(_addedAmount);
        addressLookup.push(_beneficiary1);
        addressLookup.push(_beneficiary2);
    }

    /**
     * Beneficiaries can withdraw, all at once for the sake of simplicity
     */
    function withdraw() public whenNotPaused {
        uint _quantityToWithdraw;
        uint _toWithdraw = beneficiaries[msg.sender];
        require(_toWithdraw > 0, "Nothing to withdraw");
        emit LogEtherWithdraw(msg.sender, _quantityToWithdraw);
        beneficiaries[msg.sender] = 0;
        msg.sender.transfer(_toWithdraw);
    }

    /**
     * Public function to know how much there is to withdraw for requester.
     */
    function getMyBalance() public view returns(uint) {
        return beneficiaries[msg.sender];
    }

    /**
     * Returns the number of accounts that have/had money to withdraw.
     */
    function getAddressLookupCount() public view returns(uint) {
        return addressLookup.length;
    }
}
