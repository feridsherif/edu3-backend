import { HttpException, HttpStatus } from '@nestjs/common';

export class BlockchainException extends HttpException {
  constructor(message: string, status = HttpStatus.BAD_GATEWAY) {
    super(message, status);
  }
}
