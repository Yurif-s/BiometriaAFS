import { IsString, IsNumber, IsOptional, IsDateString } from 'class-validator';

export class UpdateAlunoDto {
  @IsString()
  @IsOptional()
  matricula?: string;

  @IsString()
  @IsOptional()
  nome?: string;

  @IsNumber()
  @IsOptional()
  biometria?: number;

  @IsDateString()
  @IsOptional()
  entrada?: string;

  @IsDateString()
  @IsOptional()
  saida?: string;

  @IsNumber()
  @IsOptional()
  turma_id?: number;
}