# Blockchain Module

This module implements the MVP blockchain integration for issuing immutable certificate metadata on Polygon Amoy.

## Contract
- Source: [educhain/contracts/CertificateRegistry.sol](../../educhain/contracts/CertificateRegistry.sol)
- ABI: [src/blockchain/contracts/abi/CertificateRegistry.json](./contracts/abi/CertificateRegistry.json)

## Environment Variables
- BLOCKCHAIN_NETWORK
- BLOCKCHAIN_RPC_URL
- BLOCKCHAIN_CONTRACT_ADDRESS

## Endpoints
- POST /blockchain/register
- POST /blockchain/verify
- GET /blockchain/transactions/:certificateId
- GET /blockchain/status/:certificateId
- GET /blockchain/health
