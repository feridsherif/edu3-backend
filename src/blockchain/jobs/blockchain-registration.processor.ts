import { Processor, Process } from '@nestjs/bull';
import type { Job, Queue } from 'bull';
import { Logger, Inject } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { BlockchainTransaction } from '../entities/blockchain-transaction.entity.js';
import { BlockchainProvider } from '../blockchain.provider.js';

export interface BlockchainRegistrationJobData {
  certificateId: string;
  certificateHash: string;
  issuerWallet: string;
  contractAddress: string;
}

@Processor('blockchain')
export class BlockchainRegistrationProcessor {
  private readonly logger = new Logger(BlockchainRegistrationProcessor.name);

  constructor(
    @InjectRepository(BlockchainTransaction)
    private blockchainTransactionRepository: Repository<BlockchainTransaction>,
    private blockchainProvider: BlockchainProvider,
  ) {}

  @Process('register-certificate')
  async registerCertificate(job: Job<BlockchainRegistrationJobData>) {
    this.logger.log(`Processing certificate registration: ${job.data.certificateId}`);

    let transaction = await this.blockchainTransactionRepository.findOne({
      where: { certificateId: job.data.certificateId },
    });

    if (!transaction) {
      transaction = this.blockchainTransactionRepository.create({
        certificateId: job.data.certificateId,
        certificateHash: job.data.certificateHash,
        walletAddress: job.data.issuerWallet,
        contractAddress: job.data.contractAddress,
        network: 'polygon-amoy',
        status: 'pending',
      });
    }

    try {
      const result = await this.blockchainProvider.registerCertificateOnChain(
        job.data.certificateId,
        job.data.certificateHash,
        job.data.issuerWallet,
      );

      transaction.status = result.status as any;
      transaction.transactionHash = result.transactionHash || undefined;
      transaction.blockNumber = result.blockNumber || undefined;
      transaction.retryCount = (transaction.retryCount || 0) + 1;

      if (result.status === 'confirmed') {
        transaction.confirmedAt = new Date();
      }

      if (result.status === 'failed') {
        transaction.failureReason = result.message;
      }

      await this.blockchainTransactionRepository.save(transaction);

      this.logger.log(
        `Certificate ${job.data.certificateId} registration: ${result.status}`,
      );

      return result;
    } catch (error) {
      transaction.failureReason = error instanceof Error ? error.message : 'Unknown error';
      transaction.retryCount = (transaction.retryCount || 0) + 1;
      transaction.status = 'failed';
      await this.blockchainTransactionRepository.save(transaction);

      this.logger.error(
        `Certificate ${job.data.certificateId} registration failed`,
        error instanceof Error ? error.stack : undefined,
      );

      throw error;
    }
  }
}
