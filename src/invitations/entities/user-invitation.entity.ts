import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity.js';

@Entity('user_invitations')
export class UserInvitation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  user_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ unique: true })
  token: string;

  @Column('timestamp')
  expires_at: Date;

  @Column('timestamp', { nullable: true })
  accepted_at: Date | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}
