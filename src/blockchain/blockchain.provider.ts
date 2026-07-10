import { Injectable, Logger } from '@nestjs/common';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { Contract, JsonRpcProvider, Wallet } from 'ethers';

@Injectable()
export class BlockchainProvider {
  private readonly logger = new Logger(BlockchainProvider.name);

  async getProviderConfig() {
    this.logger.log('Blockchain provider initialized');
    return {
      network: process.env.BLOCKCHAIN_NETWORK || 'polygon-amoy',
      contractAddress: process.env.BLOCKCHAIN_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000',
      rpcUrl: process.env.BLOCKCHAIN_RPC_URL || 'https://rpc-amoy.polygon.technology/',
    };
  }

  async getContract() {
    const config = await this.getProviderConfig();
    const provider = new JsonRpcProvider(config.rpcUrl);
    const abi = this.loadAbi();

    if (!process.env.BLOCKCHAIN_PRIVATE_KEY) {
      return {
        contract: new Contract(config.contractAddress, abi, provider),
        provider,
        wallet: null,
      };
    }

    const wallet = new Wallet(process.env.BLOCKCHAIN_PRIVATE_KEY, provider);
    return {
      contract: new Contract(config.contractAddress, abi, wallet),
      provider,
      wallet,
    };
  }

  async registerCertificateOnChain(certificateId: string, certificateHash: string, issuer: string) {
    const { contract, wallet } = await this.getContract();

    if (!wallet) {
      this.logger.warn('No blockchain private key configured; skipping on-chain registration.');
      return {
        status: 'pending',
        transactionHash: null,
        message: 'Blockchain wallet not configured for live submission.',
      };
    }

    const normalizedHash = certificateHash.startsWith('0x') ? certificateHash : `0x${certificateHash}`;

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        const tx = await contract.registerCertificate(certificateId, normalizedHash, issuer);
        const receipt = await tx.wait();
        return {
          status: receipt?.status === 1 ? 'confirmed' : 'failed',
          transactionHash: tx.hash,
          blockNumber: receipt?.blockNumber,
          message: 'Certificate registered on-chain.',
        };
      } catch (error) {
        this.logger.warn(`Blockchain registration attempt ${attempt} failed`, error instanceof Error ? error.message : undefined);
        if (attempt === 3) {
          return {
            status: 'failed',
            transactionHash: null,
            message: error instanceof Error ? error.message : 'Unknown registration error.',
          };
        }
      }
    }

    return {
      status: 'failed',
      transactionHash: null,
      message: 'Blockchain registration failed after retries.',
    };
  }

  private loadAbi() {
    const abiPath = resolve(process.cwd(), 'src/blockchain/contracts/abi/CertificateRegistry.json');
    const abiFile = readFileSync(abiPath, 'utf8');
    return JSON.parse(abiFile).abi;
  }
}
