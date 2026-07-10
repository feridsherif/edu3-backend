import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('blockchain_transactions')
@Index(['certificateId'])
@Index(['transactionHash'])
export class BlockchainTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  certificateId: string;

  @Column({ nullable: true })
  transactionHash: string;

  @Column({ nullable: true })
  blockNumber: number;

  @Column({ default: 'polygon-amoy' })
  network: string;

  @Column()
  contractAddress: string;

  @Column()
  walletAddress: string;

  @Column()
  certificateHash: string;

  @Column({ default: 'pending' })
  status: 'pending' | 'submitted' | 'confirmed' | 'failed';

  @Column({ default: 0 })
  retryCount: number;

  @Column({ nullable: true })
  confirmedAt: Date;

  @Column({ nullable: true, type: 'text' })
  failureReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
