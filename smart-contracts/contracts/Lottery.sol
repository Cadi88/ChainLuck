// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract Lottery is VRFConsumerBaseV2Plus, ReentrancyGuard, Pausable {
    IERC20 public usageToken;

    uint256 public subscriptionId;
    bytes32 public keyHash;
    uint32 public callbackGasLimit = 100000;
    uint16 public requestConfirmations = 3;
    uint32 public numWords = 1;
    uint256 public lastRequestTimestamp;
    uint256 public lastReqestId;

    address[] public players;
    uint256 public lotteryId;
    mapping(uint256 => address) public lotteryHistory;
    uint256 public ticketPrice;
    uint256 public currentPot;

    enum LotteryState {
        CLOSED,
        OPEN,
        CALCULATING_WINNER
    }
    LotteryState public lotteryState;

    event LotteryStarted(uint256 indexed lotteryId, uint256 ticketPrice);
    event LotteryEnded(
        uint256 indexed lotteryId,
        address winner,
        uint256 requestId,
        uint256 amountWon
    );
    event TicketPurchased(address indexed player, uint256 amount);
    event LotteryStateChanged(LotteryState newState);

    constructor(
        address _usageToken,
        address _vrfCoordinator,
        uint256 _subscriptionId,
        bytes32 _keyHash
    ) VRFConsumerBaseV2Plus(_vrfCoordinator) {
        usageToken = IERC20(_usageToken);
        subscriptionId = _subscriptionId;
        keyHash = _keyHash;
        lotteryId = 1;
        lotteryState = LotteryState.CLOSED;
    }

    function startLottery(
        uint256 _ticketPrice
    ) external onlyOwner whenNotPaused {
        require(
            lotteryState == LotteryState.CLOSED,
            "La loteria no esta cerrada"
        );
        ticketPrice = _ticketPrice;
        lotteryState = LotteryState.OPEN;
        delete players;
        currentPot = 0;
        emit LotteryStarted(lotteryId, ticketPrice);
        emit LotteryStateChanged(LotteryState.OPEN);
    }

    function buyTicket(uint256 _amount) external nonReentrant whenNotPaused {
        require(
            lotteryState == LotteryState.OPEN,
            "La loteria no esta abierta"
        );
        require(_amount >= ticketPrice, "Cantidad insuficiente");
        require(
            _amount % ticketPrice == 0,
            "La cantidad debe ser multiplo del precio del ticket"
        );

        uint256 numTickets = _amount / ticketPrice;
        require(numTickets <= 100, "Maximo 100 tickets por transaccion"); // Proteccion DoS por limite de gas
        require(
            usageToken.transferFrom(msg.sender, address(this), _amount),
            "Transferencia fallida"
        );

        for (uint256 i = 0; i < numTickets; i++) {
            players.push(msg.sender);
        }

        currentPot += _amount;
        emit TicketPurchased(msg.sender, _amount);
    }

    function endLottery() external onlyOwner nonReentrant whenNotPaused {
        require(
            lotteryState == LotteryState.OPEN,
            "La loteria no esta abierta"
        );
        require(players.length > 0, "No hay jugadores en la loteria");

        lotteryState = LotteryState.CALCULATING_WINNER;
        lastRequestTimestamp = block.timestamp; // Registramos el tiempo
        emit LotteryStateChanged(LotteryState.CALCULATING_WINNER);

        lastReqestId = s_vrfCoordinator.requestRandomWords(
            VRFV2PlusClient.RandomWordsRequest({
                keyHash: keyHash,
                subId: subscriptionId,
                requestConfirmations: requestConfirmations,
                callbackGasLimit: callbackGasLimit,
                numWords: numWords,
                extraArgs: VRFV2PlusClient._argsToBytes(
                    VRFV2PlusClient.ExtraArgsV1({nativePayment: false})
                )
            })
        );
    }

    function fulfillRandomWords(
        uint256 requestId,
        uint256[] calldata randomWords
    ) internal override {
        require(
            lotteryState == LotteryState.CALCULATING_WINNER,
            "La loteria esta calculando un ganador"
        );

        uint256 winnerIndex = randomWords[0] % players.length;
        address winner = players[winnerIndex];

        lotteryHistory[lotteryId] = winner;
        uint256 amountToTransfer = currentPot;
        currentPot = 0;

        lotteryState = LotteryState.CLOSED;
        emit LotteryStateChanged(LotteryState.CLOSED);

        require(
            usageToken.transfer(winner, amountToTransfer),
            "Transferencia fallida"
        );
        emit LotteryEnded(lotteryId, winner, requestId, amountToTransfer);
        lotteryId++;
    }

    function emergencyReset() external onlyOwner {
        require(
            lotteryState == LotteryState.CALCULATING_WINNER,
            "No esta calculando ganador"
        );
        require(
            block.timestamp > lastRequestTimestamp + 24 hours,
            "Espera 24h por el oraculo"
        );

        lotteryState = LotteryState.OPEN; // Volver a OPEN para no bloquear los fondos
        emit LotteryStateChanged(LotteryState.OPEN);
    }

    // Funciones de pausa de emergencia
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // Funciones adicionales necesarias
    function setTicketPrice(uint256 _ticketPrice) external onlyOwner {
        ticketPrice = _ticketPrice;
    }

    function setSubscriptionId(uint256 _subscriptionId) external onlyOwner {
        subscriptionId = _subscriptionId;
    }
}
