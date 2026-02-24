// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract TokenSale is Ownable, ReentrancyGuard, Pausable {
    IERC20 public token;
    uint256 public rate; // Cuantos tokens CLK por 1 ETH

    event TokensPurchased(
        address indexed buyer,
        uint256 amountOfETH,
        uint256 amountOfTokens
    );

    constructor(
        address _token,
        uint256 _rate,
        address initialOwner
    ) Ownable(initialOwner) {
        require(_token != address(0), "La direccion del token no puede ser 0");
        require(_rate > 0, "La tasa debe ser > 0");
        token = IERC20(_token);
        rate = _rate;
    }

    function buyTokens() public payable nonReentrant whenNotPaused {
        require(msg.value > 0, "Envia ETH para comprar tokens");

        uint256 amountToBuy = msg.value * rate;
        require(
            token.balanceOf(address(this)) >= amountToBuy,
            "No hay suficientes tokens en la reserva"
        );

        token.transfer(msg.sender, amountToBuy);
        emit TokensPurchased(msg.sender, msg.value, amountToBuy);
    }

    // Funciones de pausa de emergencia
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // Funcion de administrador para establecer la tasa
    function setRate(uint256 _newRate) public onlyOwner {
        require(_newRate > 0, "La tasa debe ser > 0");
        rate = _newRate;
    }

    // Funcion de administrador para retirar ETH recaudado
    function withdrawETH() public onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No hay ETH para retirar");
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "El pago de ETH fallo");
    }

    // Funcion de administrador para retirar tokens no vendidos
    function withdrawUnsoldTokens() public onlyOwner nonReentrant {
        uint256 tokenBalance = token.balanceOf(address(this));
        require(tokenBalance > 0, "No hay tokens para retirar");
        token.transfer(owner(), tokenBalance);
    }
}
