const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ChainLuckToken", function () {
    let token, owner, addr1, lotteryMock;

    beforeEach(async function () {
        [owner, addr1, lotteryMock] = await ethers.getSigners();
        const ChainLuckToken = await ethers.getContractFactory("ChainLuckToken");
        token = await ChainLuckToken.deploy(owner.address);
        await token.waitForDeployment();
    });

    it("Should have correct name and symbol", async function () {
        expect(await token.name()).to.equal("ChainLuck");
        expect(await token.symbol()).to.equal("CLK");
    });

    it("Should mint initial supply to designated wallet", async function () {
        const INITIAL_WALLET = "0x7E6599B9342db422CA6b3DF895593682d87824bE";
        const decimals = await token.decimals();
        const expectedSupply = ethers.parseUnits("3000000", decimals);
        expect(await token.balanceOf(INITIAL_WALLET)).to.equal(expectedSupply);
    });

    it("Should set lottery contract correctly", async function () {
        await token.setLotteryContract(lotteryMock.address);
        expect(await token.lotteryContract()).to.equal(lotteryMock.address);
    });

    it("Should restrict setLotteryContract to owner", async function () {
        await expect(
            token.connect(addr1).setLotteryContract(lotteryMock.address)
        ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
    });


});
