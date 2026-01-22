// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract TizzyTreasury is Ownable {
    event FundsReceived(address indexed from, uint256 amount);
    event FundsWithdrawn(address indexed to, uint256 amount);
    
    constructor() Ownable(msg.sender) {}
    
    receive() external payable {
        emit FundsReceived(msg.sender, msg.value);
    }
    
    fallback() external payable {
        emit FundsReceived(msg.sender, msg.value);
    }
    
    function withdraw(address _to, uint256 _amount) external onlyOwner {
        require(_to != address(0), "Invalid recipient");
        require(_amount <= address(this).balance, "Insufficient balance");
        (bool sent, ) = _to.call{value: _amount}("");
        require(sent, "Withdrawal failed");
        emit FundsWithdrawn(_to, _amount);
    }
    
    function withdrawAll(address _to) external onlyOwner {
        require(_to != address(0), "Invalid recipient");
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds");
        (bool sent, ) = _to.call{value: balance}("");
        require(sent, "Withdrawal failed");
        emit FundsWithdrawn(_to, balance);
    }
    
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
