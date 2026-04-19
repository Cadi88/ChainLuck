const hre = require("hardhat");
const { CHAINLUCK_TOKEN_ADDRESS } = require("../frontend/app/config/contracts.ts");

// To run this script:
// 1. Replace the ChainLuckToken address in frontend/app/config/contracts.ts first!
// 2. npx hardhat run scripts/deploySale.js --network arbitrumSepolia 
// (or arbitrum for mainnet)

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Desplegando TokenSale con la cuenta:", deployer.address);

    // Make sure they updated the token address in the config
    const tokenAddress = "0x0000000000000000000000000000000000000000"; // Reemplace con su token address si no funciona la importación

    // Tasa: 1 ETH = 1000 CLK (Ajustable)
    const rate = 1000;

    const targetWallet = "0x7E6599B9342db422CA6b3DF895593682d87824bE";

    console.log("Desplegando TokenSale...");
    const TokenSale = await hre.ethers.getContractFactory("TokenSale");
    const sale = await TokenSale.deploy(
        tokenAddress,
        rate,
        targetWallet // Initial owner
    );

    await sale.waitForDeployment();
    const saleAddress = await sale.getAddress();

    console.log(`TokenSale desplegado exitosamente en: ${saleAddress}`);
    console.log(`\n¡IMPORTANTE!`);
    console.log(`1. Copia esta dirección (${saleAddress}) y pégala en TOKENSALE_ADDRESS dentro de frontend/app/config/contracts.ts`);
    console.log(`2. Debes transferir algunos tokens CLK a este contrato (${saleAddress}) para que tenga liquidez para vender.`);
}

main().then(() => process.exit(0)).catch((error) => {
    console.error(error);
    process.exit(1);
});
