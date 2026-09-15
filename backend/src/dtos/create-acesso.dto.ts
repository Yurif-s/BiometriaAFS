import { IsString, IsNotEmpty, IsInt, IsOptional, IsDateString, IsIn, Min } from 'class-validator';

export class CreateAcessoDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['Entrada', 'Saída'])
  tipo: string;

  @IsInt()
  @Min(1)
  @IsNotEmpty()
  aluno_id: number;

  @IsDateString({ strict: true })
  @IsOptional()
  horario?: string | Date;
}
