import { IsString, IsNumber, IsNotEmpty, IsDateString, IsOptional } from 'class-validator';

export class CreateAlunoDto {
  @IsString()
  @IsNotEmpty({ message: 'Matrícula é obrigatória' })
  matricula: string;

  @IsString()
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  nome: string;

  @IsNumber()
  @IsNotEmpty({ message: 'Biometria é obrigatória' })
  biometria: number;

  @IsDateString()
  @IsNotEmpty({ message: 'Data de entrada é obrigatória' })
  entrada: string;

  @IsDateString()
  @IsOptional()
  saida?: string;

  @IsNumber()
  @IsNotEmpty({ message: 'Turma é obrigatória' })
  turma_id: number;
}