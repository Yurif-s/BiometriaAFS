import { IsString, IsNotEmpty, IsInt, IsOptional, IsDateString } from 'class-validator';

export class CreateAcessoDto {
  @IsString()
  @IsNotEmpty()
  tipo: string;

  @IsInt()
  @IsNotEmpty()
  aluno_id: number;

  @IsDateString()
  @IsOptional()
  horario?: string | Date;
}
