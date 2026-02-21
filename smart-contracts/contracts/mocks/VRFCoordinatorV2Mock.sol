// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";

contract VRFCoordinatorV2Mock is VRFCoordinatorV2Interface {
    uint96 public constant BASE_FEE = 100000000000000000;
    uint96 public constant GAS_PRICE_LINK = 1000000000;

    error InvalidSubscription();
    error InsufficientBalance();
    error MustBeSubOwner(address owner);

    event RandomWordsRequested(
        bytes32 indexed keyHash,
        uint256 requestId,
        uint256 preSeed,
        uint64 indexed subId,
        uint16 minimumRequestConfirmations,
        uint32 callbackGasLimit,
        uint32 numWords,
        address indexed sender
    );
    event RandomWordsFulfilled(uint256 indexed requestId, uint256 outputSeed, uint96 payment, bool success);

    struct Subscription {
        uint96 balance;
        uint64 reqCount;
    }

    mapping(uint64 => Subscription) s_subscriptions;
    mapping(uint256 => address) s_consumers;
    
    uint64 s_currentSubId;
    uint256 s_nextRequestId = 1;

    constructor(uint96 _baseFee, uint96 _gasPriceLink) {
        // defined for compatibility, not used in simple mock
    }

    function getRequestConfig() external view override returns (uint16, uint32, bytes32[] memory) {
        return (3, 1000000, new bytes32[](0));
    }

    function createSubscription() external override returns (uint64) {
        s_currentSubId++;
        s_subscriptions[s_currentSubId] = Subscription({balance: 0, reqCount: 0});
        return s_currentSubId;
    }

    function getSubscription(uint64 subId)
        external
        view
        override
        returns (
            uint96 balance,
            uint64 reqCount,
            address owner,
            address[] memory consumers
        )
    {
        if (s_subscriptions[subId].reqCount == 0 && s_subscriptions[subId].balance == 0 && subId > s_currentSubId) {
            revert InvalidSubscription();
        }
        return (s_subscriptions[subId].balance, s_subscriptions[subId].reqCount, msg.sender, new address[](0));
    }

    function requestRandomWords(
        bytes32 keyHash,
        uint64 subId,
        uint16 minimumRequestConfirmations,
        uint32 callbackGasLimit,
        uint32 numWords
    ) external override returns (uint256 requestId) {
        requestId = s_nextRequestId++;
        s_consumers[requestId] = msg.sender;

        emit RandomWordsRequested(
            keyHash,
            requestId,
            100, // preSeed
            subId,
            minimumRequestConfirmations,
            callbackGasLimit,
            numWords,
            msg.sender
        );
        return requestId;
    }

    function fulfillRandomWords(uint256 requestId, address consumer) external {
        // Simple mock fulfillment
        uint256[] memory randomWords = new uint256[](1);
        randomWords[0] = uint256(keccak256(abi.encode(requestId, block.timestamp)));
        
        VRFConsumerBaseV2(consumer).rawFulfillRandomWords(requestId, randomWords);
        
        emit RandomWordsFulfilled(requestId, 123, 0, true);
    }

    // Stubs for other interface methods
    function requestSubscriptionOwnerTransfer(uint64 subId, address newOwner) external override {}
    function acceptSubscriptionOwnerTransfer(uint64 subId) external override {}
    function addConsumer(uint64 subId, address consumer) external override {}
    function removeConsumer(uint64 subId, address consumer) external override {}
    function cancelSubscription(uint64 subId, address to) external override {}
    function pendingRequestExists(uint64 subId) external view override returns (bool) { return false; }
    function fundSubscription(uint64 subId, uint96 amount) external {
        s_subscriptions[subId].balance += amount;
    }
}
