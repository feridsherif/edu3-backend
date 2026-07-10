import { plainToInstance } from 'class-transformer';
import { IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';
import { validateSync } from 'class-validator';

enum NodeEnvironment {
  DEVELOPMENT = 'development',
  PRODUCTION = 'production',
  STAGING = 'staging',
}

class EnvironmentVariables {
  @IsString()
  @IsNotEmpty()
  DATABASE_URL: string;

  @IsString()
  @IsNotEmpty()
  JWT_ACCESS_SECRET: string;

  @IsString()
  @IsNotEmpty()
  JWT_REFRESH_SECRET: string;

  @IsString()
  @IsNotEmpty()
  JWT_ACCESS_EXPIRATION: string;

  @IsString()
  @IsNotEmpty()
  JWT_REFRESH_EXPIRATION: string;

  @IsString()
  @IsOptional()
  REDIS_HOST?: string;

  @IsString()
  @IsOptional()
  REDIS_PORT?: string;

  @IsString()
  @IsOptional()
  BLOCKCHAIN_NETWORK?: string;

  @IsString()
  @IsOptional()
  BLOCKCHAIN_RPC_URL?: string;

  @IsString()
  @IsOptional()
  BLOCKCHAIN_CONTRACT_ADDRESS?: string;

  @IsString()
  @IsOptional()
  BLOCKCHAIN_WALLET_ADDRESS?: string;

  @IsString()
  @IsOptional()
  BLOCKCHAIN_PRIVATE_KEY?: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(
      `Environment validation failed:\n${errors.map((e) => Object.values(e.constraints ?? {}).join(', ')).join('\n')}`,
    );
  }

  return validatedConfig;
}
