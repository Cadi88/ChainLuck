// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

contract ChainLuckToken is ERC20, Ownable, ERC20Permit {
    // Rol para el contrato de loteria (mantenido para futura extensibilidad u otros permisos)
    address public lotteryContract;

    constructor(
        address initialOwner
    ) ERC20("ChainLuck", "CLK") Ownable(initialOwner) ERC20Permit("ChainLuck") {
        uint256 totalTokens = 3000000 * 10 ** decimals();
        uint256 ownerAmount = (totalTokens * 20) / 100;
        uint256 contractAmount = totalTokens - ownerAmount;

        // 20% directamente al wallet del dueño
        _mint(initialOwner, ownerAmount);
        // 80% dentro del contrato
        _mint(address(this), contractAmount);
    }

    function setLotteryContract(address _lottery) external onlyOwner {
        lotteryContract = _lottery;
    }

    // Permite al dueño enviar los tokens retenidos (80%) al contrato TokenSale
    // cuando este sea desplegado, para que los usuarios puedan comprarlos.
    function transferToSaleContract(address saleContract, uint256 amount) external onlyOwner {
        require(saleContract != address(0), "Direccion invalida");
        require(balanceOf(address(this)) >= amount, "Saldo insuficiente en el contrato");
        _transfer(address(this), saleContract, amount);
    }
}
