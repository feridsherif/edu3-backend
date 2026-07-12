import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class AnswerDto {
    @IsString()
    @IsNotEmpty()
    questionId: string;

    @IsString()
    @IsNotEmpty()
    answerId: string;
}

export class SubmitQuizDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => AnswerDto)
    answers: AnswerDto[];
}
