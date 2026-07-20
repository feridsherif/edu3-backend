import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';

@Injectable()
export class AuditLogService {
    constructor(
        @InjectRepository(AuditLog)
        private readonly auditRepo: Repository<AuditLog>,
    ) { }

    async log(params: {
        action: string;
        resourceType: string;
        resourceId: string | null;
        actorId: string | null;
        resourceName?: string | null;
        payload?: Record<string, unknown>;
    }): Promise<void> {
        const entry = this.auditRepo.create({
            action: params.action,
            resourceType: params.resourceType,
            resourceId: params.resourceId,
            actorId: params.actorId,
            payload: params.payload ?? null,
        });
        await this.auditRepo.save(entry);
    }

    async findAll(options?: {
        limit?: number;
        offset?: number;
    }): Promise<{ data: AuditLog[]; total: number }> {
        const [data, total] = await this.auditRepo.findAndCount({
            order: { createdAt: 'DESC' },
            take: options?.limit ?? 50,
            skip: options?.offset ?? 0,
            relations: { actor: true },
        });
        return { data, total };
    }
}
