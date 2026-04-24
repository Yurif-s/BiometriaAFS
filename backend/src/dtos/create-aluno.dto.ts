import { IsString, IsNumber, IsNotEmpty, IsDateString } from 'class-validator';

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
  @IsNotEmpty({ message: 'Data de entrada é obrigatória' })
  entrada!: string;

  @IsDateString()
  @IsNotEmpty({ message: 'Data de saída é obrigatória' })
  saida!: string;

  @IsNumber()
  @IsNotEmpty({ message: 'ID da turma é obrigatório' })
  turma_id!: number;
}
