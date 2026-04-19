const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Desplegando contratos con la cuenta:", deployer.address);

    // 1. Desplegamos el Token
    console.log("Desplegando nuevo ChainLuckToken...");
    const ChainLuckToken = await hre.ethers.getContractFactory("ChainLuckToken");
    const chainLuckToken = await ChainLuckToken.deploy(deployer.address);
    await chainLuckToken.waitForDeployment();
    const tokenAddress = await chainLuckToken.getAddress();
    console.log(`NUEVO ChainLuckToken desplegado en: ${tokenAddress}`);

    // 2. Parámetros de Chainlink VRF (Arbitrum Sepolia)
    const vrfCoordinator = "0x5CE8D5A2BC84beb22a398CCA51996F7930313D61";
    // Usamos BigInt para asegurar que el ID de suscripción largo no pierda precisión
    const subscriptionId = BigInt(process.env.VRF_SUBSCRIPTION_ID); 
    const keyHash = "0x1770bdc7eec7771f7ba4ffd640f34260d7f095b79c92d34a5b2551d6f6cfd2be";

    // 3. Desplegar Lotería
    console.log("Desplegando Lotería...");
    const Lottery = await hre.ethers.getContractFactory("Lottery");
    const lottery = await Lottery.deploy(
        tokenAddress,
        vrfCoordinator,
        subscriptionId,
        keyHash
    );
    await lottery.waitForDeployment();
    const lotteryAddress = await lottery.getAddress();
    console.log(`Lottery desplegada en: ${lotteryAddress}`);

    const targetWallet = "0x7E6599B9342db422CA6b3DF895593682d87824bE";

    // 4. Desplegar TokenSale
    console.log("Desplegando TokenSale...");
    const rate = 1000; // 1 ETH = 1000 CLK
    const TokenSale = await hre.ethers.getContractFactory("TokenSale");
    const tokenSale = await TokenSale.deploy(
        tokenAddress,
        rate,
        deployer.address // Dueño temporal para configuración
    );
    await tokenSale.waitForDeployment();
    const saleAddress = await tokenSale.getAddress();
    console.log(`TokenSale desplegada en: ${saleAddress}`);

    // 5. Configurar la Lotería en el Token
    console.log("Configurando el contrato de Lotería en el contrato del Token...");
    const tx1 = await chainLuckToken.setLotteryContract(lotteryAddress);
    await tx1.wait();

    // 6. Transferir el 80% de tokens al contrato de Venta (TokenSale)
    console.log(`Transfiriendo el 80% (2,400,000 tokens) al contrato TokenSale...`);
    const saleAmount = hre.ethers.parseUnits("2400000", 18);
    const txSale = await chainLuckToken.transferToSaleContract(saleAddress, saleAmount);
    await txSale.wait();

    // 7. Transferir el 20% (600,000 tokens) al Wallet Principal
    console.log(`Transfiriendo el 20% (600,000 tokens) a ${targetWallet}...`);
    const ownerAmount = hre.ethers.parseUnits("600000", 18);
    const tx2 = await chainLuckToken.transfer(targetWallet, ownerAmount);
    await tx2.wait();

    // 8. Transferir Propiedad de todos los contratos al Wallet Principal
    console.log(`Transfiriendo propiedad de los contratos a ${targetWallet}...`);
    
    const txT = await chainLuckToken.transferOwnership(targetWallet);
    await txT.wait();

    const txL = await lottery.transferOwnership(targetWallet);
    await txL.wait();

    const txS = await tokenSale.transferOwnership(targetWallet);
    await txS.wait();

    console.log("--- DESPLIEGUE COMPLETO FINALIZADO CON ÉXITO ---");
    console.log(`Dirección Token: ${tokenAddress}`);
    console.log(`Dirección Lotería: ${lotteryAddress}`);
    console.log(`Dirección TokenSale: ${saleAddress}`);
    console.log(`Dueño Final: ${targetWallet}`);
    console.log(`Distribución: 20% al Dueño, 80% al contrato de Venta.`);
}

main().then(() => process.exit(0)).catch((error) => {
    console.error(error);
    process.exit(1);
});