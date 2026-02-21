const fs = require('fs');
const path = require('path');

try {
    const tokenAbi = require('../artifacts/contracts/ChainLuckToken.sol/ChainLuckToken.json').abi;
    const lotteryAbi = require('../artifacts/contracts/Lottery.sol/Lottery.json').abi;
    const saleAbi = require('../artifacts/contracts/TokenSale.sol/TokenSale.json').abi;

    const outDir = path.join(__dirname, '..', 'frontend', 'app', 'config');
    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }

    const content = `// Auto-generated ABIs
export const CHAINLUCK_TOKEN_ADDRESS = "0x0000000000000000000000000000000000000000"; // REPLACE WITH REAL CHAINLUCK TOKEN ADDRESS
export const LOTTERY_ADDRESS = "0x0000000000000000000000000000000000000000"; // REPLACE WITH REAL LOTTERY ADDRESS
export const TOKENSALE_ADDRESS = "0x0000000000000000000000000000000000000000"; // REPLACE WITH REAL TOKENSALE ADDRESS

import { arbitrumSepolia } from 'wagmi/chains';
export const TARGET_CHAIN_ID = arbitrumSepolia.id; // Switch to arbitrum.id for mainnet

export const CHAINLUCK_TOKEN_ABI = ${JSON.stringify(tokenAbi, null, 2)} as const;
export const LOTTERY_ABI = ${JSON.stringify(lotteryAbi, null, 2)} as const;
export const TOKENSALE_ABI = ${JSON.stringify(saleAbi, null, 2)} as const;
`;

    fs.writeFileSync(path.join(outDir, 'contracts.ts'), content);
    console.log('Successfully wrote ABIs to frontend config!');
} catch (error) {
    console.error('Failed to extract ABIs:', error.message);
}
