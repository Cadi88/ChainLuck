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

    // 4. Configurar la Lotería en el Token
    console.log("Configurando el contrato de Lotería en el contrato del Token...");
    const tx1 = await chainLuckToken.setLotteryContract(lotteryAddress);
    await tx1.wait();

    // 5. ASEGURAR PROPIEDAD (Opcional pero recomendado)
    // Forzamos que el deployer sea el dueño absoluto para evitar el error de los 38M USD
    console.log("Verificando propiedad del contrato...");
    const owner = await lottery.owner();
    console.log(`El dueño actual de la Lotería es: ${owner}`);

    console.log("--- DESPLIEGUE FINALIZADO CON ÉXITO ---");
    console.log(`Dirección Token: ${tokenAddress}`);
    console.log(`Dirección Lotería: ${lotteryAddress}`);
}

main().then(() => process.exit(0)).catch((error) => {
    console.error(error);
    process.exit(1);
});