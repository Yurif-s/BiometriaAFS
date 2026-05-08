import { IsString, IsNumber, IsNotEmpty, IsDateString, IsOptional } from 'class-validator';

export class CreateAlunoDto {
  @IsString()
  @IsNotEmpty({ message: 'Matrícula é obrigatória' })
  matricula!: string;

  @IsString()
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  nome!: string;

  @IsNumber()
  @IsNotEmpty({ message: 'ID da biometria é obrigatório' })
  biometria!: number;

  @IsDateString()
  @IsOptional()
  entrada?: string;

  @IsDateString()
  @IsOptional()
  saida?: string;

  @IsNumber()
  @IsNotEmpty({ message: 'ID da turma é obrigatório' })
  turma_id!: number;
}