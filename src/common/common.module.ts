import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { AuditLogService } from './services/audit-log.service';
import { AuditLogsController } from './controllers/audit-logs.controller';

@Module({
    imports: [TypeOrmModule.forFeature([AuditLog])],
    controllers: [AuditLogsController],
    providers: [AuditLogService],
    exports: [AuditLogService],
})
export class CommonModule { }
