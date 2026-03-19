import { IsString, IsNumber, IsNotEmpty } from 'class-validator';

export class CreateTurmaDto {
  @IsString()
  @IsNotEmpty({ message: 'Nome da turma é obrigatório' })
  nome: string;

  @IsNumber()
  @IsNotEmpty({ message: 'Ano é obrigatório' })
  ano: number;
}
