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

    it("Debe tener nombre y símbolo correctos", async function () {
        expect(await token.name()).to.equal("ChainLuck");
        expect(await token.symbol()).to.equal("CLK");
    });

    it("El supply total debe ser 3,000,000 CLK", async function () {
        const decimals = await token.decimals();
        const expectedSupply = ethers.parseUnits("3000000", decimals);
        expect(await token.totalSupply()).to.equal(expectedSupply);
    });

    it("El owner debe recibir el 20% del supply (600,000 CLK)", async function () {
        const decimals = await token.decimals();
        const expected = ethers.parseUnits("600000", decimals);
        expect(await token.balanceOf(owner.address)).to.equal(expected);
    });

    it("El contrato mismo debe retener el 80% del supply (2,400,000 CLK)", async function () {
        const decimals = await token.decimals();
        const expected = ethers.parseUnits("2400000", decimals);
        expect(await token.balanceOf(await token.getAddress())).to.equal(expected);
    });

    it("El owner puede asignar el contrato de lotería", async function () {
        await token.setLotteryContract(lotteryMock.address);
        expect(await token.lotteryContract()).to.equal(lotteryMock.address);
    });

    it("Solo el owner puede llamar setLotteryContract", async function () {
        await expect(
            token.connect(addr1).setLotteryContract(lotteryMock.address)
        ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
    });

    it("El owner puede transferir tokens al contrato de venta", async function () {
        const amount = ethers.parseEther("1000");
        const tokenAddr = await token.getAddress();

        // El owner transfiere 1000 CLK del contrato a sí mismo (simulando envío a sale)
        const balBefore = await token.balanceOf(tokenAddr);
        await token.transferToSaleContract(lotteryMock.address, amount);
        const balAfter = await token.balanceOf(tokenAddr);

        expect(balBefore - balAfter).to.equal(amount);
    });

    it("No se puede transferir al contrato de venta con address(0)", async function () {
        await expect(
            token.transferToSaleContract(ethers.ZeroAddress, ethers.parseEther("1000"))
        ).to.be.revertedWith("Direccion invalida");
    });
});
