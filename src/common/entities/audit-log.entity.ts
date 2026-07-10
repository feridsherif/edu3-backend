import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('audit_logs')
export class AuditLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    
    @Column({ type: 'varchar', length: 100 })
    action: string;

   
    @Column({ type: 'varchar', length: 50 })
    resourceType: string;


    @Column({ type: 'uuid', nullable: true, name: 'resource_id' })
    resourceId: string | null;

    @Column({ type: 'varchar', length: 255, nullable: true, name: 'resource_name' })
    resourceName: string | null;


    @Column({ type: 'json', nullable: true })
    payload: Record<string, unknown> | null;

    
    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'actor_id' })
    actor: User;

    @Column({ name: 'actor_id', type: 'uuid', nullable: true })
    actorId: string | null;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
