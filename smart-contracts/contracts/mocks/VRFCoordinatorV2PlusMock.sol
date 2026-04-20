// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";
import "@chainlink/contracts/src/v0.8/vrf/dev/interfaces/IVRFCoordinatorV2Plus.sol";

/**
 * @title VRFCoordinatorV2PlusMock
 * @notice Mock del VRF Coordinator para tests locales con Hardhat.
 *         Implementa la interfaz completa IVRFCoordinatorV2Plus + IVRFSubscriptionV2Plus
 *         para ser compatible con VRFConsumerBaseV2Plus (que usa Lottery.sol).
 */
contract VRFCoordinatorV2PlusMock is IVRFCoordinatorV2Plus {
    uint256 private s_nextRequestId = 1;
    mapping(uint256 => address) private s_consumers;

    event RandomWordsRequested(uint256 indexed requestId, address indexed consumer);
    event RandomWordsFulfilled(uint256 indexed requestId, bool success);

    // ── IVRFCoordinatorV2Plus ─────────────────────────────────────────────

    function requestRandomWords(
        VRFV2PlusClient.RandomWordsRequest calldata /* req */
    ) external override returns (uint256 requestId) {
        requestId = s_nextRequestId++;
        s_consumers[requestId] = msg.sender;
        emit RandomWordsRequested(requestId, msg.sender);
    }

    /// @notice Llamada por el test para simular que Chainlink entrega el random word
    function fulfillRandomWords(uint256 requestId, address consumer) external {
        uint256[] memory randomWords = new uint256[](1);
        randomWords[0] = uint256(
            keccak256(abi.encode(requestId, block.timestamp, block.prevrandao))
        );
        VRFConsumerBaseV2Plus(consumer).rawFulfillRandomWords(requestId, randomWords);
        emit RandomWordsFulfilled(requestId, true);
    }

    // ── IVRFSubscriptionV2Plus stubs ──────────────────────────────────────

    function createSubscription() external override returns (uint256 subId) {
        subId = 1;
    }

    function addConsumer(uint256 /* subId */, address /* consumer */) external override {}

    function removeConsumer(uint256 /* subId */, address /* consumer */) external override {}

    function cancelSubscription(uint256 /* subId */, address /* to */) external override {}

    function acceptSubscriptionOwnerTransfer(uint256 /* subId */) external override {}

    function requestSubscriptionOwnerTransfer(
        uint256 /* subId */,
        address /* newOwner */
    ) external override {}

    function getSubscription(uint256 /* subId */)
        external
        view
        override
        returns (
            uint96 balance,
            uint96 nativeBalance,
            uint64 reqCount,
            address owner,
            address[] memory consumers
        )
    {
        return (
            type(uint96).max,   // balance LINK
            type(uint96).max,   // balance native
            0,
            msg.sender,
            new address[](0)
        );
    }

    function pendingRequestExists(uint256 /* subId */)
        external
        view
        override
        returns (bool)
    {
        return false;
    }

    function getActiveSubscriptionIds(
        uint256 /* startIndex */,
        uint256 /* maxCount */
    ) external view override returns (uint256[] memory) {
        return new uint256[](0);
    }

    function fundSubscriptionWithNative(uint256 /* subId */)
        external
        payable
        override
    {}

    // ── Función de ayuda para tests (no parte de la interfaz) ─────────────

    function fundSubscription(uint256 /* subId */, uint96 /* amount */) external {}
}
