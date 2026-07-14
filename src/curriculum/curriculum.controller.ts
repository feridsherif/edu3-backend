import { Controller } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('curriculum')
@ApiBearerAuth()
export class CurriculumController {}
