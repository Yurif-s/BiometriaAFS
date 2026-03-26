import { IsOptional, IsNumber, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class FindAlunoDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  id?: number;

  @IsOptional()
  @IsString()
  matricula?: string;

  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  turma_id?: number;
}