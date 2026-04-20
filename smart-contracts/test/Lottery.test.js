const { expect } = require("chai");
const { ethers } = require("hardhat");

// ─────────────────────────────────────────────────────────────────────────────
// Lottery.test.js  – Suite completa de pruebas para el sistema ChainLuck
//
// Simula múltiples wallets (owner, jugador1, jugador2) en una red local
// Hardhat, sin necesitar a ningún usuario real para validar el flujo.
// ─────────────────────────────────────────────────────────────────────────────

describe("Lottery System – Suite Completa", function () {
    // ── Variables compartidas ──────────────────────────────────────────────
    let lottery, token, vrfMock;
    let owner, player1, player2, player3, attacker;
    const subscriptionId = 1n;

    const KEY_HASH = "0xd89b2bf150e3b9e13446986c571fb9d3208123f8fb99f643ac6cdf47b0041be2";

    // Estados del enum LotteryState
    const STATE_CLOSED      = 0;
    const STATE_OPEN        = 1;
    const STATE_CALCULATING = 2;

    // Precio de ticket por defecto para las pruebas: 10 CLK
    const TICKET_PRICE = ethers.parseEther("10");

    // ── Helper: obtener el requestId del evento emitido por endLottery ──────
    async function getRequestIdFromTx(tx) {
        const receipt = await tx.wait();
        // El VRF Mock emite RandomWordsRequested; tomamos el requestId del evento
        const iface = vrfMock.interface;
        for (const log of receipt.logs) {
            try {
                const parsed = iface.parseLog(log);
                if (parsed && parsed.name === "RandomWordsRequested") {
                    return parsed.args[0]; // requestId
                }
            } catch (_) {}
        }
        // Si no encontramos el evento, asumimos requestId = 1 (primer request)
        return 1n;
    }

    // ── beforeEach: despliega todo desde cero antes de cada test ──────────
    beforeEach(async function () {
        // Hardhat genera 20 wallets locales; tomamos las 5 primeras
        [owner, player1, player2, player3, attacker] = await ethers.getSigners();

        // 1. Deploy del mock VRF Plus (compatible con VRFConsumerBaseV2Plus)
        const VRFMock = await ethers.getContractFactory("VRFCoordinatorV2PlusMock");
        vrfMock = await VRFMock.deploy();
        await vrfMock.waitForDeployment();

        // 2. Deploy del token CLK (owner = deployer)
        const Token = await ethers.getContractFactory("ChainLuckToken");
        token = await Token.deploy(owner.address);
        await token.waitForDeployment();

        // 3. Deploy del contrato Lottery
        const Lottery = await ethers.getContractFactory("Lottery");
        lottery = await Lottery.deploy(
            await token.getAddress(),
            await vrfMock.getAddress(),
            subscriptionId,
            KEY_HASH
        );
        await lottery.waitForDeployment();

        // 4. Vincular el token con la lotería
        await token.setLotteryContract(await lottery.getAddress());

        // 5. Distribuir tokens a los jugadores desde el owner
        //    (owner recibió el 20% = 600,000 CLK en el constructor del token)
        await token.connect(owner).transfer(player1.address, ethers.parseEther("1000"));
        await token.connect(owner).transfer(player2.address, ethers.parseEther("1000"));
        await token.connect(owner).transfer(player3.address, ethers.parseEther("500"));
    });

    // ═══════════════════════════════════════════════════════════════════════
    // BLOQUE 1 — Estado inicial y control del owner
    // ═══════════════════════════════════════════════════════════════════════
    describe("1. Estado inicial y control del owner", function () {
        it("Debe iniciar en estado CLOSED", async function () {
            expect(await lottery.lotteryState()).to.equal(STATE_CLOSED);
        });

        it("El pot inicial debe ser 0", async function () {
            expect(await lottery.currentPot()).to.equal(0n);
        });

        it("El owner puede iniciar la lotería", async function () {
            await expect(lottery.connect(owner).startLottery(TICKET_PRICE))
                .to.emit(lottery, "LotteryStarted");
            expect(await lottery.lotteryState()).to.equal(STATE_OPEN);
            expect(await lottery.ticketPrice()).to.equal(TICKET_PRICE);
        });

        it("Solo el owner puede iniciar la lotería", async function () {
            await expect(lottery.connect(player1).startLottery(TICKET_PRICE))
                .to.be.reverted;
        });

        it("No se puede iniciar si ya está OPEN", async function () {
            await lottery.startLottery(TICKET_PRICE);
            await expect(lottery.startLottery(TICKET_PRICE))
                .to.be.revertedWith("La loteria no esta cerrada");
        });

        it("Solo el owner puede terminar la lotería", async function () {
            await lottery.startLottery(TICKET_PRICE);
            await token.connect(player1).approve(await lottery.getAddress(), TICKET_PRICE);
            await lottery.connect(player1).buyTicket(TICKET_PRICE);

            await expect(lottery.connect(attacker).endLottery())
                .to.be.reverted;
        });
    });

    // ═══════════════════════════════════════════════════════════════════════
    // BLOQUE 2 — Flujo de aprobación y compra de tickets
    // ═══════════════════════════════════════════════════════════════════════
    describe("2. Aprobación de tokens y compra de tickets", function () {
        beforeEach(async function () {
            await lottery.startLottery(TICKET_PRICE);
        });

        it("Debe fallar si el jugador no aprobó tokens (allowance = 0)", async function () {
            await expect(
                lottery.connect(player1).buyTicket(TICKET_PRICE)
            ).to.be.reverted;
        });

        it("Debe fallar si el allowance es insuficiente", async function () {
            await token.connect(player1).approve(
                await lottery.getAddress(),
                ethers.parseEther("5") // Ticket cuesta 10
            );
            await expect(
                lottery.connect(player1).buyTicket(TICKET_PRICE)
            ).to.be.reverted;
        });

        it("Comprar 1 ticket actualiza el pot correctamente", async function () {
            await token.connect(player1).approve(await lottery.getAddress(), TICKET_PRICE);
            await lottery.connect(player1).buyTicket(TICKET_PRICE);

            expect(await lottery.currentPot()).to.equal(TICKET_PRICE);
        });

        it("Comprar múltiples tickets acumula el pot correctamente", async function () {
            const amount = TICKET_PRICE * 3n; // 30 CLK = 3 tickets
            await token.connect(player1).approve(await lottery.getAddress(), amount);
            await lottery.connect(player1).buyTicket(amount);

            expect(await lottery.currentPot()).to.equal(amount);
        });

        it("El pot acumula compras de DISTINTOS wallets (escenario multi-usuario)", async function () {
            // >>> Este test replica exactamente el bug reportado <<<
            // Simula: tu wallet + owner en otra ubicación + otro jugador
            const lotteryAddr = await lottery.getAddress();

            // player1 (tu wallet) aprueba y compra 2 tickets
            await token.connect(player1).approve(lotteryAddr, TICKET_PRICE * 2n);
            await lottery.connect(player1).buyTicket(TICKET_PRICE * 2n);
            expect(await lottery.currentPot()).to.equal(TICKET_PRICE * 2n);

            // player2 (el owner en otra wallet) aprueba y compra 1 ticket
            await token.connect(player2).approve(lotteryAddr, TICKET_PRICE);
            await lottery.connect(player2).buyTicket(TICKET_PRICE);
            // El pot debe acumular, NO quedarse en 0
            expect(await lottery.currentPot()).to.equal(TICKET_PRICE * 3n);

            // player3 compra 1 ticket más
            await token.connect(player3).approve(lotteryAddr, TICKET_PRICE);
            await lottery.connect(player3).buyTicket(TICKET_PRICE);
            expect(await lottery.currentPot()).to.equal(TICKET_PRICE * 4n);

            // El balance del contrato debe coincidir con el pot
            expect(await token.balanceOf(lotteryAddr)).to.equal(TICKET_PRICE * 4n);
        });

        it("El balance del jugador se reduce tras la compra", async function () {
            const balanceBefore = await token.balanceOf(player1.address);
            await token.connect(player1).approve(await lottery.getAddress(), TICKET_PRICE);
            await lottery.connect(player1).buyTicket(TICKET_PRICE);
            const balanceAfter = await token.balanceOf(player1.address);

            expect(balanceAfter).to.equal(balanceBefore - TICKET_PRICE);
        });

        it("Cantidad no múltiplo del precio debe fallar", async function () {
            const badAmount = ethers.parseEther("15");
            await token.connect(player1).approve(await lottery.getAddress(), badAmount);
            await expect(
                lottery.connect(player1).buyTicket(badAmount)
            ).to.be.revertedWith("La cantidad debe ser multiplo del precio del ticket");
        });

        it("Cantidad inferior al precio debe fallar", async function () {
            const badAmount = ethers.parseEther("5");
            await token.connect(player1).approve(await lottery.getAddress(), badAmount);
            await expect(
                lottery.connect(player1).buyTicket(badAmount)
            ).to.be.revertedWith("Cantidad insuficiente");
        });

        it("No se puede comprar con la lotería cerrada", async function () {
            // Desplegamos una lotería nueva (en estado CLOSED)
            const Lottery = await ethers.getContractFactory("Lottery");
            const freshLottery = await Lottery.deploy(
                await token.getAddress(),
                await vrfMock.getAddress(),
                subscriptionId,
                KEY_HASH
            );
            await freshLottery.waitForDeployment();

            await token.connect(player1).approve(await freshLottery.getAddress(), TICKET_PRICE);
            await expect(
                freshLottery.connect(player1).buyTicket(TICKET_PRICE)
            ).to.be.revertedWith("La loteria no esta abierta");
        });

        it("Emite el evento TicketPurchased con datos correctos", async function () {
            await token.connect(player1).approve(await lottery.getAddress(), TICKET_PRICE);
            await expect(
                lottery.connect(player1).buyTicket(TICKET_PRICE)
            ).to.emit(lottery, "TicketPurchased")
                .withArgs(player1.address, TICKET_PRICE);
        });
    });

    // ═══════════════════════════════════════════════════════════════════════
    // BLOQUE 3 — Cierre y selección de ganador (VRF Mock)
    // ═══════════════════════════════════════════════════════════════════════
    describe("3. Fin de ronda y selección de ganador", function () {
        beforeEach(async function () {
            await lottery.startLottery(TICKET_PRICE);
        });

        it("No se puede terminar sin jugadores", async function () {
            await expect(lottery.endLottery())
                .to.be.revertedWith("No hay jugadores en la loteria");
        });

        it("endLottery pasa al estado CALCULATING_WINNER", async function () {
            await token.connect(player1).approve(await lottery.getAddress(), TICKET_PRICE);
            await lottery.connect(player1).buyTicket(TICKET_PRICE);

            await lottery.endLottery();
            expect(await lottery.lotteryState()).to.equal(STATE_CALCULATING);
        });

        it("El VRF selecciona un ganador, transfiere el pot y cierra la lotería", async function () {
            const lotteryAddr = await lottery.getAddress();

            await token.connect(player1).approve(lotteryAddr, TICKET_PRICE * 3n);
            await lottery.connect(player1).buyTicket(TICKET_PRICE * 3n);

            await token.connect(player2).approve(lotteryAddr, TICKET_PRICE * 2n);
            await lottery.connect(player2).buyTicket(TICKET_PRICE * 2n);

            expect(await lottery.currentPot()).to.equal(TICKET_PRICE * 5n);

            const bal1Before = await token.balanceOf(player1.address);
            const bal2Before = await token.balanceOf(player2.address);

            const tx = await lottery.endLottery();
            const requestId = await getRequestIdFromTx(tx);

            await expect(
                vrfMock.fulfillRandomWords(requestId, lotteryAddr)
            ).to.emit(lottery, "LotteryEnded");

            // Estado CLOSED, pot = 0, contrato sin fondos
            expect(await lottery.lotteryState()).to.equal(STATE_CLOSED);
            expect(await lottery.currentPot()).to.equal(0n);
            expect(await token.balanceOf(lotteryAddr)).to.equal(0n);

            // Exactamente uno de los dos ganó
            const bal1After = await token.balanceOf(player1.address);
            const bal2After = await token.balanceOf(player2.address);
            const player1Won = bal1After > bal1Before;
            const player2Won = bal2After > bal2Before;

            expect(player1Won || player2Won).to.be.true;
            expect(player1Won && player2Won).to.be.false;
        });

        it("El historial registra al ganador correcto", async function () {
            const lotteryAddr = await lottery.getAddress();
            await token.connect(player1).approve(lotteryAddr, TICKET_PRICE);
            await lottery.connect(player1).buyTicket(TICKET_PRICE);
            const lotteryId = await lottery.lotteryId();

            const tx = await lottery.endLottery();
            const requestId = await getRequestIdFromTx(tx);
            await vrfMock.fulfillRandomWords(requestId, lotteryAddr);

            // Con un solo jugador, player1 es el ganador garantizado
            const winner = await lottery.lotteryHistory(lotteryId);
            expect(winner).to.equal(player1.address);
        });
    });

    // ═══════════════════════════════════════════════════════════════════════
    // BLOQUE 4 — Aislamiento entre rondas
    // ═══════════════════════════════════════════════════════════════════════
    describe("4. Rondas consecutivas – el pot no lleva saldo de rondas anteriores", function () {
        it("Ronda 2 comienza con pot = 0 y precio distinto al de ronda 1", async function () {
            const lotteryAddr = await lottery.getAddress();

            // === RONDA 1 ===
            await lottery.startLottery(TICKET_PRICE);
            await token.connect(player1).approve(lotteryAddr, TICKET_PRICE * 2n);
            await lottery.connect(player1).buyTicket(TICKET_PRICE * 2n);

            const tx1 = await lottery.endLottery();
            const reqId1 = await getRequestIdFromTx(tx1);
            await vrfMock.fulfillRandomWords(reqId1, lotteryAddr);

            expect(await lottery.lotteryState()).to.equal(STATE_CLOSED);
            expect(await lottery.currentPot()).to.equal(0n);

            // === RONDA 2 ===
            const newPrice = ethers.parseEther("5");
            await lottery.startLottery(newPrice);

            // El pot debe arrancar en 0
            expect(await lottery.currentPot()).to.equal(0n);
            expect(await lottery.ticketPrice()).to.equal(newPrice);

            await token.connect(player2).approve(lotteryAddr, newPrice);
            await lottery.connect(player2).buyTicket(newPrice);

            // Solo el pot de esta ronda
            expect(await lottery.currentPot()).to.equal(newPrice);
        });
    });

    // ═══════════════════════════════════════════════════════════════════════
    // BLOQUE 5 — Seguridad y casos extremos
    // ═══════════════════════════════════════════════════════════════════════
    describe("5. Seguridad y edge cases", function () {
        it("No se puede comprar más de 100 tickets por transacción (protección DoS)", async function () {
            await lottery.startLottery(TICKET_PRICE);
            const tooMany = TICKET_PRICE * 101n;
            // Dar fondos extra a player1
            await token.connect(owner).transfer(player1.address, ethers.parseEther("2000"));
            await token.connect(player1).approve(await lottery.getAddress(), tooMany);
            await expect(
                lottery.connect(player1).buyTicket(tooMany)
            ).to.be.revertedWith("Maximo 100 tickets por transaccion");
        });

        it("El attacker no puede llamar endLottery", async function () {
            await lottery.startLottery(TICKET_PRICE);
            await token.connect(player1).approve(await lottery.getAddress(), TICKET_PRICE);
            await lottery.connect(player1).buyTicket(TICKET_PRICE);

            await expect(lottery.connect(attacker).endLottery()).to.be.reverted;
        });

        it("No se puede hacer buyTicket en estado CALCULATING_WINNER", async function () {
            await lottery.startLottery(TICKET_PRICE);
            await token.connect(player1).approve(await lottery.getAddress(), TICKET_PRICE * 2n);
            await lottery.connect(player1).buyTicket(TICKET_PRICE);
            await lottery.endLottery();

            await expect(
                lottery.connect(player1).buyTicket(TICKET_PRICE)
            ).to.be.revertedWith("La loteria no esta abierta");
        });

        it("setTicketPrice solo accesible por el owner", async function () {
            await expect(
                lottery.connect(attacker).setTicketPrice(ethers.parseEther("1"))
            ).to.be.reverted;
        });

        it("La pausa bloquea buyTicket", async function () {
            await lottery.startLottery(TICKET_PRICE);
            await token.connect(player1).approve(await lottery.getAddress(), TICKET_PRICE);
            await lottery.connect(owner).pause();

            await expect(
                lottery.connect(player1).buyTicket(TICKET_PRICE)
            ).to.be.reverted;
        });

        it("Unpause restaura la compra de tickets", async function () {
            await lottery.startLottery(TICKET_PRICE);
            await token.connect(player1).approve(await lottery.getAddress(), TICKET_PRICE);
            await lottery.connect(owner).pause();
            await lottery.connect(owner).unpause();

            await expect(
                lottery.connect(player1).buyTicket(TICKET_PRICE)
            ).to.not.be.reverted;
        });
    });
});
