import { Injectable, Logger, Inject } from '@nestjs/common';
import { createHash } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { BlockchainProvider } from './blockchain.provider.js';
import { RegisterCertificateDto } from './dto/register-certificate.dto.js';
import { BlockchainException } from './exceptions/blockchain.exception.js';
import { BlockchainTransaction } from './entities/blockchain-transaction.entity.js';

@Injectable()
export class BlockchainService {
  private readonly logger = new Logger(BlockchainService.name);

  constructor(
    private readonly blockchainProvider: BlockchainProvider,
    @InjectQueue('blockchain')
    private blockchainQueue: Queue,
    @InjectRepository(BlockchainTransaction)
    private blockchainTransactionRepository: Repository<BlockchainTransaction>,
  ) {}

  async registerCertificate(dto: RegisterCertificateDto) {
    try {
      const certificateHash = this.generateCertificateHash(dto);
      const providerConfig = await this.blockchainProvider.getProviderConfig();

      this.logger.log(`Registering certificate ${dto.certificateId} on ${providerConfig.network}`);

      // Check if already registered
      const existing = await this.blockchainTransactionRepository.findOne({
        where: { certificateId: dto.certificateId },
      });

      if (existing) {
        this.logger.warn(`Certificate ${dto.certificateId} already registered`);
        return {
          certificateId: dto.certificateId,
          certificateHash,
          contractAddress: providerConfig.contractAddress,
          network: providerConfig.network,
          status: existing.status,
          transactionHash: existing.transactionHash,
          message: `Certificate already in status: ${existing.status}`,
        };
      }

      // Create transaction record
      const transaction = await this.blockchainTransactionRepository.save(
        this.blockchainTransactionRepository.create({
          certificateId: dto.certificateId,
          certificateHash,
          walletAddress: process.env.BLOCKCHAIN_WALLET_ADDRESS || '0x0000000000000000000000000000000000000000',
          contractAddress: providerConfig.contractAddress,
          network: providerConfig.network,
          status: 'pending',
        }),
      );

      // Enqueue the registration job
      await this.blockchainQueue.add(
        'register-certificate',
        {
          certificateId: dto.certificateId,
          certificateHash,
          issuerWallet: process.env.BLOCKCHAIN_WALLET_ADDRESS || '0x0000000000000000000000000000000000000000',
          contractAddress: providerConfig.contractAddress,
        },
        { jobId: dto.certificateId },
      );

      return {
        certificateId: dto.certificateId,
        certificateHash,
        contractAddress: providerConfig.contractAddress,
        network: providerConfig.network,
        status: 'pending',
        message: 'Certificate registration queued for blockchain submission.',
      };
    } catch (error) {
      this.logger.error('Failed to register certificate', error instanceof Error ? error.stack : undefined);
      throw new BlockchainException('Unable to register certificate on-chain.');
    }
  }

  async verifyCertificate(certificateId: string, certificateHash: string) {
    try {
      const transaction = await this.blockchainTransactionRepository.findOne({
        where: { certificateId },
      });

      if (!transaction) {
        return {
          certificateId,
          verified: false,
          status: 'not-found',
          message: 'Certificate not found in blockchain registry.',
        };
      }

      if (transaction.status === 'pending' || transaction.status === 'submitted') {
        return {
          certificateId,
          verified: false,
          status: 'pending',
          message: 'Certificate registration is pending on-chain confirmation.',
        };
      }

      if (transaction.status === 'failed') {
        return {
          certificateId,
          verified: false,
          status: 'failed',
          message: `Certificate registration failed: ${transaction.failureReason}`,
        };
      }

      const hashMatches = transaction.certificateHash === certificateHash;
      return {
        certificateId,
        verified: hashMatches,
        status: hashMatches ? 'verified' : 'failed',
        message: hashMatches ? 'Certificate hash matches the registered payload.' : 'Certificate hash does not match.',
      };
    } catch (error) {
      this.logger.error('Failed to verify certificate', error instanceof Error ? error.stack : undefined);
      throw new BlockchainException('Unable to verify certificate on-chain.');
    }
  }

  async getTransactions(certificateId: string) {
    const transaction = await this.blockchainTransactionRepository.findOne({
      where: { certificateId },
    });

    return {
      certificateId,
      transactions: transaction ? [transaction] : [],
      status: transaction?.status || 'not-found',
    };
  }

  async getStatus(certificateId: string) {
    const transaction = await this.blockchainTransactionRepository.findOne({
      where: { certificateId },
    });

    if (!transaction) {
      return {
        certificateId,
        status: 'not-found',
        message: 'No blockchain transaction recorded for this certificate.',
      };
    }

    return {
      certificateId,
      status: transaction.status,
      transactionHash: transaction.transactionHash,
      blockNumber: transaction.blockNumber,
      confirmedAt: transaction.confirmedAt,
      message: `Certificate status: ${transaction.status}`,
    };
  }

  async healthCheck() {
    return {
      ok: true,
      network: process.env.BLOCKCHAIN_NETWORK || 'polygon-amoy',
    };
  }

  private generateCertificateHash(payload: RegisterCertificateDto): string {
    const canonicalPayload = JSON.stringify({
      certificateId: payload.certificateId,
      studentId: payload.studentId,
      courseId: payload.courseId,
      issuedAt: payload.issuedAt,
    });

    return createHash('sha256').update(canonicalPayload).digest('hex');
  }
}
