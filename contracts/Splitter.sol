pragma solidity >=0.4.21 <0.6.0;

contract Splitter {
    address public splitter;
    address public beneficiary1;
    address public beneficiary2;
    uint public toWithdraw1; // amount available to withdraw for beneficiary 1
    uint public toWithdraw2; // amount available to withdraw for beneficiary 2

    event LogEtherAdded(uint amount);
    event LogEtherWithdraw1(uint amount);
    event LogEtherWithdraw2(uint amount);

    constructor(address _beneficiary1, address _beneficiary2) public {
        require(_beneficiary1 != _beneficiary2);
        // I decided that is the creator of the contract who is the splitter (it looks convenient)
        splitter = msg.sender;
        // beneficiaries
        beneficiary1 = _beneficiary1;
        beneficiary2 = _beneficiary2;
        // start with 0
        toWithdraw1 = toWithdraw2 = 0;
    }

    // Whenever Alice sends ether to the contract for it to be split,
    // half of it goes to Bob and the other half to Carol.
    function() external payable {
        require(msg.sender == splitter);
        uint _addedAmount = msg.value/uint(2);
        toWithdraw1 += _addedAmount;
        toWithdraw2 += _addedAmount;
        emit LogEtherAdded(msg.value);
    }

    // Beneficiaries can withdraw, all at once for the sake of simplicity
    function withdraw() public {
        require(msg.sender == beneficiary1 || msg.sender == beneficiary2);
        if (msg.sender == beneficiary1) {
            require(toWithdraw1 > 0);
            msg.sender.transfer(toWithdraw1);
            emit LogEtherWithdraw1(toWithdraw1);
            toWithdraw1 = 0;
        }
        if (msg.sender == beneficiary2) {
            require(toWithdraw2 > 0);
            msg.sender.transfer(toWithdraw2);
            emit LogEtherWithdraw2(toWithdraw2);
            toWithdraw2 = 0;
        }
    }
}
