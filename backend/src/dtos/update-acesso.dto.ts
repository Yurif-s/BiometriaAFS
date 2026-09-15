import { IsString, IsOptional, IsDateString, IsIn } from 'class-validator';

export class UpdateAcessoDto {
  @IsString()
  @IsOptional()
  @IsIn(['Entrada', 'Saída'])
  tipo?: string;

  @IsDateString({ strict: true })
  @IsOptional()
  horario?: string | Date;
}
