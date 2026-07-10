import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { BlockchainController } from './blockchain.controller.js';
import { BlockchainService } from './blockchain.service.js';
import { BlockchainProvider } from './blockchain.provider.js';
import { BlockchainRegistrationProcessor } from './jobs/blockchain-registration.processor.js';
import { BlockchainTransaction } from './entities/blockchain-transaction.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([BlockchainTransaction]),
    BullModule.registerQueue({
      name: 'blockchain',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: true,
      },
    }),
  ],
  controllers: [BlockchainController],
  providers: [BlockchainService, BlockchainProvider, BlockchainRegistrationProcessor],
  exports: [BlockchainService, BullModule],
})
export class BlockchainModule {}
