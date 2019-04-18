pragma solidity >=0.4.21 <0.6.0;

contract Splitter {
    address public splitter;
    address public beneficiary1;
    address public beneficiary2;
    uint public toWithdrawn1; // amount available to withdrawn for beneficiary 1
    uint public toWithdrawn2; // amount available to withdrawn for beneficiary 2

    event LogEtherAdded(uint amount);
    event LogEtherWithdrawn1(uint amount);
    event LogEtherWithdrawn2(uint amount);

    constructor(address _beneficiary1, address _beneficiary2) public {
        require(_beneficiary1 != _beneficiary2);
        // I decided that is the creator of the contract who is the splitter (it looks convenient)
        splitter = msg.sender;
        // beneficiaries
        beneficiary1 = _beneficiary1;
        beneficiary2 = _beneficiary2;
        // start with 0
        toWithdrawn1 = toWithdrawn2 = 0;
    }

    // Whenever Alice sends ether to the contract for it to be split,
    // half of it goes to Bob and the other half to Carol.
    function() external payable {
        require(msg.sender == splitter);
        uint _addedAmount = msg.value/uint(2);
        toWithdrawn1 += _addedAmount;
        toWithdrawn2 += _addedAmount;
        emit LogEtherAdded(msg.value);
    }

    // Beneficiaries can withdraw, all at once for the sake of simplicity
    function withdraw() public {
        require(msg.sender == beneficiary1 || msg.sender == beneficiary2);
        if (msg.sender == beneficiary1) {
            require(toWithdrawn1 > 0);
            msg.sender.transfer(toWithdrawn1);
            emit LogEtherWithdrawn1(toWithdrawn1);
            toWithdrawn1 = 0;
        }
        if (msg.sender == beneficiary2) {
            require(toWithdrawn2 > 0);
            msg.sender.transfer(toWithdrawn2);
            emit LogEtherWithdrawn2(toWithdrawn2);
            toWithdrawn2 = 0;
        }
    }
}
