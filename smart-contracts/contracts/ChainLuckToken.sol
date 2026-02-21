// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

contract ChainLuckToken is ERC20, Ownable, ERC20Permit {
    // Role for the lottery contract (kept for future extensibility or other permissions)
    address public lotteryContract;

    constructor(address initialOwner)
        ERC20("ChainLuck", "CLK")
        Ownable(initialOwner)
        ERC20Permit("ChainLuck")
    {
        _mint(msg.sender, 3000000 * 10 ** decimals());
    }

    function setLotteryContract(address _lottery) external onlyOwner {
        lotteryContract = _lottery;
    }
}
                                                                                                                                                        