This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# ChainLuck (CLK) - Sistema de Lotería Descentralizada
ChainLuck es una plataforma de sorteos mensuales basada en la red de Arbitrum, que utiliza el token CLK como activo de gobernanza y distribución de dividendos.

## 1. Arquitectura del Proyecto
El sistema se divide en tres pilares fundamentales:

Contratos Inteligentes (Smart Contracts): Desarrollados en Solidity y desplegados en Arbitrum Sepolia (Testnet) y Arbitrum One (Mainnet).

Frontend: Interfaz de usuario construida en Next.js, desplegada en Vercel, que permite la conexión de billeteras y la interacción con los contratos.

Infinería y Herramientas: Uso de proveedores de nodos y exploradores para la transparencia de los datos.

Diagrama de Flujo del Contrato
## 2. Stack Tecnológico y Plataformas Asociadas
Para el desarrollo y mantenimiento del proyecto, se utilizan las siguientes herramientas:

Alchemy: Actúa como el Proveedor de RPC (Remote Procedure Call). Es el "puente" que permite que nuestra aplicación web y los scripts de despliegue se comuniquen con la blockchain de Arbitrum sin necesidad de correr un nodo propio.

Arbiscan: Es el Explorador de Bloques oficial de Arbitrum. Sirve para verificar transacciones, consultar balances de billeteras, leer el código de los contratos verificados y auditar la distribución de premios de la lotería.

Vercel: Plataforma de hosting para el frontend. Gestiona los despliegues automáticos (CI/CD) sincronizados con el repositorio de Git.

Arbitrum Bridge: Herramienta esencial para mover fondos (GAS) desde la red principal de Ethereum (L1) hacia Arbitrum (L2).

Sepolia PoW Faucet: Plataforma de minería para obtener ETH de prueba necesario para pagar las comisiones (gas) durante la fase de desarrollo.

## 3. Tokenomics (CLK)

Nombre: ChainLuck Token.


Símbolo: CLK.


Suministro Total: 3,000,000 CLK.


Red: Arbitrum.

Distribución Inicial:


80% (2,400,000 tokens): Destinados a la venta pública en 8 fases.


20% (600,000 tokens): Reservados para el propietario del proyecto.

Estrategia de Venta
La venta se realiza en 8 fases, donde cada fase pone a la venta el 10% del supply total (300,000 CLK). El precio se incrementa un 50% respecto a la fase anterior, iniciando en 1 USDC.

## 4. Mecánica de la Lotería
El sorteo se realiza una vez al mes mediante la venta de boletos a 1 USDC. La recaudación se distribuye de la siguiente forma:


50% - Premio Mayor: Depositado directamente en la billetera del ganador.


20% - Dividendos para Holders: Distribuido de forma equitativa entre todos los poseedores de tokens CLK.


30% - Fondo Operativo: Destinado a marketing, publicidad y utilidades del creador.

## 5. Proceso de Despliegue (Scripts)
El despliegue está automatizado para garantizar la seguridad y transparencia:

Despliegue del Token: Se crea el contrato ChainLuckToken.

Despliegue de Venta: Se crea el contrato TokenSale encargado de gestionar las fases de precio.

Transferencia Automatizada: El script de despliegue transfiere automáticamente el 80% del supply al contrato de venta y el 20% a la billetera del propietario. Esto asegura que los tokens de venta estén bloqueados en el contrato y no en una billetera privada.

Verificación: Los contratos se verifican en Arbiscan para que el código sea público y auditable.

## 6. Configuración de Desarrollo
Para trabajar en este repositorio, se requiere un archivo .env con las siguientes claves:

PRIVATE_KEY: Billetera del deployer (propietario).

ALCHEMY_API_KEY: URL de conexión al nodo de Arbitrum.

ARBISCAN_API_KEY: Para la verificación automática de contratos.

USDC_ADDRESS: Dirección del contrato USDC en la red correspondiente.

Billeteras Oficiales del Proyecto

Recepción de Venta CLK: 0x7E6599B9342db422CA6b3DF895593682d87824bE.


Recaudación de Boletos: 0xd186BA85f8ed6693b01498Df43d33cB07d18D7B0.
