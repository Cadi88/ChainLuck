// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";

contract Lottery is VRFConsumerBaseV2Plus {
    IERC20 public usageToken;

    uint256 public subscriptionId;
    bytes32 public keyHash;
    uint32 public callbackGasLimit = 100000;
    uint16 public requestConfirmations = 3;
    uint32 public numWords = 1;

    address[] public players;
    uint256 public lotteryId;
    mapping(uint256 => address) public lotteryHistory;
    uint256 public ticketPrice;
    uint256 public currentPot;

    enum LotteryState { CLOSED, OPEN, CALCULATING_WINNER }
    LotteryState public lotteryState;

    event LotteryStarted(uint256 indexed lotteryId, uint256 ticketPrice);
    event LotteryEnded(uint256 indexed lotteryId, address winner, uint256 requestId, uint256 amountWon);
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

    function startLottery(uint256 _ticketPrice) external onlyOwner {
        require(lotteryState == LotteryState.CLOSED, "Lottery is not closed");
        ticketPrice = _ticketPrice;
        lotteryState = LotteryState.OPEN;
        delete players;
        currentPot = 0;
        emit LotteryStarted(lotteryId, ticketPrice);
        emit LotteryStateChanged(LotteryState.OPEN);
    }

    function buyTicket(uint256 _amount) external {
        require(lotteryState == LotteryState.OPEN, "Lottery is not open");
        require(_amount >= ticketPrice, "Insufficient amount");
        require(_amount % ticketPrice == 0, "Amount must be multiple of ticket price");

        uint256 numTickets = _amount / ticketPrice;
        require(usageToken.transferFrom(msg.sender, address(this), _amount), "Transfer failed");

        for (uint256 i = 0; i < numTickets; i++) {
            players.push(msg.sender);
        }

        currentPot += _amount;
        emit TicketPurchased(msg.sender, _amount);
    }

    function endLottery() external onlyOwner {
        require(lotteryState == LotteryState.OPEN, "Lottery is not open");
        require(players.length > 0, "No players in lottery");
        
        lotteryState = LotteryState.CALCULATING_WINNER;
        emit LotteryStateChanged(LotteryState.CALCULATING_WINNER);
        
        s_vrfCoordinator.requestRandomWords(
            VRFV2PlusClient.RandomWordsRequest({
                keyHash: keyHash,
                subId: subscriptionId,
                requestConfirmations: requestConfirmations,
                callbackGasLimit: callbackGasLimit,
                numWords: numWords,
                extraArgs: VRFV2PlusClient._argsToBytes(VRFV2PlusClient.ExtraArgsV1({nativePayment: false}))
            })
        );
    }

    function fulfillRandomWords(uint256 requestId, uint256[] calldata randomWords) internal override {
        require(lotteryState == LotteryState.CALCULATING_WINNER, "Lottery not in calculating state");
        
        uint256 winnerIndex = randomWords[0] % players.length;
        address winner = players[winnerIndex];
        
        lotteryHistory[lotteryId] = winner;
        uint256 amountToTransfer = currentPot;
        currentPot = 0;
        
        lotteryState = LotteryState.CLOSED;
        emit LotteryStateChanged(LotteryState.CLOSED);

        require(usageToken.transfer(winner, amountToTransfer), "Transfer failed");
        emit LotteryEnded(lotteryId, winner, requestId, amountToTransfer);
        lotteryId++;
    }

    // Funciones adicionales necesarias
    function setTicketPrice(uint256 _ticketPrice) external onlyOwner {
        ticketPrice = _ticketPrice;
    }

    function setSubscriptionId(uint256 _subscriptionId) external onlyOwner {
        subscriptionId = _subscriptionId;
    }
}