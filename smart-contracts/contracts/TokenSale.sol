// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TokenSale is Ownable {
    IERC20 public token;
    uint256 public rate; // How many CLK tokens per 1 ETH

    event TokensPurchased(address indexed buyer, uint256 amountOfETH, uint256 amountOfTokens);

    constructor(address _token, uint256 _rate, address initialOwner) Ownable(initialOwner) {
        require(_token != address(0), "Token address cannot be 0");
        require(_rate > 0, "Rate must be > 0");
        token = IERC20(_token);
        rate = _rate;
    }

    // Function to buy tokens
    function buyTokens() public payable {
        require(msg.value > 0, "Send ETH to buy tokens");
        
        uint256 amountToBuy = msg.value * rate;
        require(token.balanceOf(address(this)) >= amountToBuy, "Not enough tokens in reserve");
        
        token.transfer(msg.sender, amountToBuy);
        emit TokensPurchased(msg.sender, msg.value, amountToBuy);
    }

    // Admin function to set the rate
    function setRate(uint256 _newRate) public onlyOwner {
        require(_newRate > 0, "Rate must be > 0");
        rate = _newRate;
    }

    // Admin function to withdraw collected ETH
    function withdrawETH() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No ETH to withdraw");
        payable(owner()).transfer(balance);
    }

    // Admin function to withdraw unsold tokens
    function withdrawUnsoldTokens() public onlyOwner {
        uint256 tokenBalance = token.balanceOf(address(this));
        require(tokenBalance > 0, "No tokens to withdraw");
        token.transfer(owner(), tokenBalance);
    }
}
