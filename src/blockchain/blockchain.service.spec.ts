import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BlockchainService } from './blockchain.service.js';
import { BlockchainProvider } from './blockchain.provider.js';
import { BlockchainTransaction } from './entities/blockchain-transaction.entity.js';

describe('BlockchainService', () => {
  let service: BlockchainService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlockchainService,
        {
          provide: BlockchainProvider,
          useValue: {
            getProviderConfig: jest.fn().mockResolvedValue({
              network: 'polygon-amoy',
              contractAddress: '0x0000000000000000000000000000000000000000',
              rpcUrl: 'https://rpc-amoy.polygon.technology/',
            }),
          },
        },
        {
          provide: 'BullQueue_blockchain',
          useValue: {
            add: jest.fn().mockResolvedValue({ id: 'job-001' }),
          },
        },
        {
          provide: getRepositoryToken(BlockchainTransaction),
          useValue: {
            findOne: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockReturnValue({
              certificateId: 'cert-001',
              certificateHash: 'hash-001',
              walletAddress: '0x1234567890123456789012345678901234567890',
              contractAddress: '0x0000000000000000000000000000000000000000',
              network: 'polygon-amoy',
              status: 'pending',
            }),
            save: jest.fn().mockResolvedValue({
              id: 'tx-001',
              certificateId: 'cert-001',
              certificateHash: 'hash-001',
              status: 'pending',
            }),
          },
        },
      ],
    }).compile();

    service = module.get<BlockchainService>(BlockchainService);
  });

  it('registers a certificate payload and returns a transaction reference', async () => {
    const result = await service.registerCertificate({
      certificateId: 'cert-001',
      studentId: 'student-001',
      courseId: 'course-001',
      issuedAt: '2026-07-10T00:00:00.000Z',
    });

    expect(result).toHaveProperty('certificateId', 'cert-001');
    expect(result).toHaveProperty('status', 'pending');
    expect(result).toHaveProperty('certificateHash');
  });
});
