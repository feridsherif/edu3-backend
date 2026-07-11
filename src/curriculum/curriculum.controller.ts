import { Controller } from '@nestjs/common';
import { ApiBearerAuth } from 'node_modules/@nestjs/swagger/dist/decorators/api-bearer.decorator';

@Controller('curriculum')
@ApiBearerAuth()
export class CurriculumController {}
