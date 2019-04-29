pragma solidity >=0.4.21 <0.6.0;

contract Splitter {
    address public payer;
    address public beneficiary1;
    address public beneficiary2;
    uint public toWithdraw1; // amount available to withdraw for beneficiary 1
    uint public toWithdraw2; // amount available to withdraw for beneficiary 2

    event LogEtherAdded(uint amount);
    event LogEtherWithdraw1(uint amount);
    event LogEtherWithdraw2(uint amount);

    constructor(address _beneficiary1, address _beneficiary2) public {
        require(_beneficiary1 != _beneficiary2, "Beneficiaries must be different");
        require(_beneficiary1 != address(0), "Beneficiary1 address is malformed");
        require(_beneficiary2 != address(0), "Beneficiary2 address is malformed");
        // I decided that is the creator of the contract who is the payer (it looks convenient)
        payer = msg.sender;
        // beneficiaries
        beneficiary1 = _beneficiary1;
        beneficiary2 = _beneficiary2;
    }

    // Alice sends ether to the contract with pay(), for it to be split,
    // half of it goes to Bob and the other half to Carol.
    function pay() external payable {
        require(msg.sender == payer, "Only payer can execute this function");
        require(msg.value > 0, "This function asks for some value to be sent.");
        uint _addedAmount = msg.value/uint(2);
        toWithdraw1 += _addedAmount;
        toWithdraw2 += _addedAmount;
        emit LogEtherAdded(msg.value);
    }

    // Beneficiaries can withdraw, all at once for the sake of simplicity
    function withdraw() public {
        require(msg.sender == beneficiary1 || msg.sender == beneficiary2, "Only beneficiaries can withdraw");
        uint _quantityToWithdraw;
        if (msg.sender == beneficiary1) {
            require(toWithdraw1 > 0, "Nothing to withdraw");
            _quantityToWithdraw = toWithdraw1;
            toWithdraw1 = 0;  // Force to zero the balance before transfer to avoid re-entrance vulnerability
            msg.sender.transfer(_quantityToWithdraw);
            emit LogEtherWithdraw1(toWithdraw1);
        }
        if (msg.sender == beneficiary2) {
            require(toWithdraw2 > 0, "Nothing to withdraw");
            _quantityToWithdraw = toWithdraw2;
            toWithdraw2 = 0;
            msg.sender.transfer(_quantityToWithdraw);
            emit LogEtherWithdraw2(toWithdraw2);
        }
    }
}
