// src/data-source.ts
import { DataSource } from 'typeorm';
import { User } from './users/entities/user.entity';
import { Role } from './rbac/entities/role.entity';
import { Permission } from './rbac/entities/permission.entity';
import { Department } from './departments/entities/department.entity';
import { BlockchainTransaction } from './blockchain/entities/blockchain-transaction.entity';
import * as dotenv from 'dotenv';
import * as path from 'path';


dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: false, // MUST be false in production
  logging: true,
  entities: [User, Role, Permission, Department, BlockchainTransaction],
  migrations: ['dist/migrations/*.js'],
  migrationsTableName: 'migrations',
});