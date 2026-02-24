const fs = require('fs');
const path = require('path');

const contractsDir = path.join(__dirname, '../smart-contracts/artifacts/contracts');
const configPath = path.join(__dirname, 'app/config/contracts.ts');

function getAbi(name) {
    const filePath = path.join(contractsDir, `${name}.sol`, `${name}.json`);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return JSON.stringify(data.abi);
}

const content = `
export const LOTTERY_ADDRESS = '0x2a1352A900fe259e99f4e662153AfABcb6D0c4D4';
export const CHAINLUCK_TOKEN_ADDRESS = '0x619ED25d4A600f8618C9a3eDdE6629324335cFE1';
export const TOKENSALE_ADDRESS = '0x0000000000000000000000000000000000000000';

export const LOTTERY_ABI = ${getAbi('Lottery')} as const;
export const CHAINLUCK_TOKEN_ABI = ${getAbi('ChainLuckToken')} as const;
export const TOKENSALE_ABI = ${getAbi('TokenSale')} as const;
`;

fs.writeFileSync(configPath, content);
console.log('Successfully wrote ABIs to contracts.ts');
