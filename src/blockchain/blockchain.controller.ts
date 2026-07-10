import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { BlockchainService } from './blockchain.service.js';
import { RegisterCertificateDto } from './dto/register-certificate.dto.js';
import { VerifyCertificateDto } from './dto/verify-certificate.dto.js';

@Controller('blockchain')
export class BlockchainController {
  constructor(private readonly blockchainService: BlockchainService) {}

  @Post('register')
  register(@Body() dto: RegisterCertificateDto) {
    return this.blockchainService.registerCertificate(dto);
  }

  @Post('verify')
  verify(@Body() dto: VerifyCertificateDto) {
    return this.blockchainService.verifyCertificate(dto.certificateId, dto.certificateHash);
  }

  @Get('transactions/:certificateId')
  getTransactions(@Param('certificateId') certificateId: string) {
    return this.blockchainService.getTransactions(certificateId);
  }

  @Get('status/:certificateId')
  getStatus(@Param('certificateId') certificateId: string) {
    return this.blockchainService.getStatus(certificateId);
  }

  @Get('health')
  health() {
    return this.blockchainService.healthCheck();
  }
}
