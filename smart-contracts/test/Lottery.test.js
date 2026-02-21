const { expect } = require("chai");
const { ethers } = require("hardhat");
const helpers = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("Lottery System", function () {
    let lottery, token, owner, addr1, addr2, vrfCoordinatorMock;
    let subscriptionId;

    // Chainlink VRF Constants
    const BASE_FEE = "100000000000000000"; // 0.1 LINK
    const GAS_PRICE_LINK = "1000000000"; // 1 gwei
    const KEY_HASH = "0xd89b2bf150e3b9e13446986c571fb9d3208123f8fb99f643ac6cdf47b0041be2";

    // Enum values: CLOSED = 0, OPEN = 1, CALCULATING_WINNER = 2
    const STATE_CLOSED = 0;
    const STATE_OPEN = 1;
    const STATE_CALCULATING = 2;

    const INITIAL_WALLET = "0x7E6599B9342db422CA6b3DF895593682d87824bE";

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();

        // 1. Deploy VRFCoordinatorV2Mock
        const VRFCoordinatorV2Mock = await ethers.getContractFactory("VRFCoordinatorV2Mock");
        vrfCoordinatorMock = await VRFCoordinatorV2Mock.deploy(BASE_FEE, GAS_PRICE_LINK);
        await vrfCoordinatorMock.waitForDeployment();
        const vrfCoordinatorAddress = await vrfCoordinatorMock.getAddress();

        // 2. Create Subscription
        const tx = await vrfCoordinatorMock.createSubscription();
        const receipt = await tx.wait();
        subscriptionId = 1;

        // 3. Fund Subscription
        await vrfCoordinatorMock.fundSubscription(subscriptionId, "100000000000000000000"); // 100 LINK

        // 4. Deploy ChainLuckToken
        const ChainLuckToken = await ethers.getContractFactory("ChainLuckToken");
        token = await ChainLuckToken.deploy(owner.address);
        await token.waitForDeployment();
        const tokenAddress = await token.getAddress();

        // 5. Deploy Lottery
        const Lottery = await ethers.getContractFactory("Lottery");
        lottery = await Lottery.deploy(
            tokenAddress,
            vrfCoordinatorAddress,
            subscriptionId,
            KEY_HASH,
            owner.address
        );
        await lottery.waitForDeployment();
        const lotteryAddress = await lottery.getAddress();

        // 6. Add Consumer
        await vrfCoordinatorMock.addConsumer(subscriptionId, lotteryAddress);

        // 7. Set Lottery on Token
        await token.setLotteryContract(lotteryAddress);

        // 8. Distribute tokens from INITIAL_WALLET
        // Impersonate INITIAL_WALLET
        await helpers.impersonateAccount(INITIAL_WALLET);
        const initialSigner = await ethers.getSigner(INITIAL_WALLET);

        // Fund INITIAL_WALLET with ETH so it can pay for gas
        await helpers.setBalance(INITIAL_WALLET, ethers.parseEther("1.0"));

        // Transfer tokens to addr1 and addr2
        await token.connect(initialSigner).transfer(addr1.address, ethers.parseEther("1000"));
        await token.connect(initialSigner).transfer(addr2.address, ethers.parseEther("1000"));
    });

    it("Should initialize in CLOSED state", async function () {
        expect(await lottery.lotteryState()).to.equal(STATE_CLOSED);
    });

    it("Should start lottery correctly", async function () {
        const ticketPrice = ethers.parseEther("10"); // 10 CLK
        await lottery.startLottery(ticketPrice);
        expect(await lottery.lotteryState()).to.equal(STATE_OPEN);
        expect(await lottery.ticketPrice()).to.equal(ticketPrice);
    });

    it("Should fail to start if already OPEN", async function () {
        const ticketPrice = ethers.parseEther("10");
        await lottery.startLottery(ticketPrice);
        await expect(lottery.startLottery(ticketPrice)).to.be.revertedWith("Lottery is not closed");
    });

    it("Should allow buying tickets and track pot", async function () {
        const ticketPrice = ethers.parseEther("10");
        await lottery.startLottery(ticketPrice);

        await token.connect(addr1).approve(await lottery.getAddress(), ethers.parseEther("100"));

        await lottery.connect(addr1).buyTicket(ethers.parseEther("20")); // Buy 2 tickets

        // Check pot
        expect(await lottery.currentPot()).to.equal(ethers.parseEther("20"));

        // Check contract balance
        expect(await token.balanceOf(await lottery.getAddress())).to.equal(ethers.parseEther("20"));
    });

    it("Should fail to buy tickets if CLOSED", async function () {
        // No need to start
        await expect(
            lottery.connect(addr1).buyTicket(ethers.parseEther("10"))
        ).to.be.revertedWith("Lottery is not open");
    });

    it("Should transition to CALCULATING_WINNER on endLottery", async function () {
        const ticketPrice = ethers.parseEther("10");
        await lottery.startLottery(ticketPrice);

        await token.connect(addr1).approve(await lottery.getAddress(), ethers.parseEther("100"));
        await lottery.connect(addr1).buyTicket(ethers.parseEther("10"));

        await lottery.endLottery();
        expect(await lottery.lotteryState()).to.equal(STATE_CALCULATING);
    });

    it("Should fulfill random words, pick winner, transfer pot, and CLOSE", async function () {
        const ticketPrice = ethers.parseEther("10");
        await lottery.startLottery(ticketPrice);

        // Addr1 buys 1 ticket
        // addr1 has 1000
        await token.connect(addr1).approve(await lottery.getAddress(), ethers.parseEther("100"));
        await lottery.connect(addr1).buyTicket(ethers.parseEther("10"));

        // Addr2 buys 1 ticket
        // addr2 has 1000
        await token.connect(addr2).approve(await lottery.getAddress(), ethers.parseEther("100"));
        await lottery.connect(addr2).buyTicket(ethers.parseEther("10"));

        // Contract Pot: 20
        expect(await lottery.currentPot()).to.equal(ethers.parseEther("20"));

        // End Lottery
        const tx = await lottery.endLottery();
        await tx.wait();

        const requestId = 1; // First request in mock

        // Fulfill randomness
        await expect(
            vrfCoordinatorMock.fulfillRandomWords(requestId, await lottery.getAddress())
        ).to.emit(lottery, "LotteryEnded");

        // State should be CLOSED
        expect(await lottery.lotteryState()).to.equal(STATE_CLOSED);

        // Pot should be 0
        expect(await lottery.currentPot()).to.equal(0);

        // Winner verification
        expect(await token.balanceOf(await lottery.getAddress())).to.equal(0);

        const balance1 = await token.balanceOf(addr1.address);
        const balance2 = await token.balanceOf(addr2.address);

        // One should have 1000 - 10 + 20 = 1010, the other 990
        const winnerFound = (balance1 == ethers.parseEther("1010") || balance2 == ethers.parseEther("1010"));
        expect(winnerFound).to.be.true;
    });
});
