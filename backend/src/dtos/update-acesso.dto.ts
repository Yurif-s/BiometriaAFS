import { IsString, IsOptional, IsDateString } from 'class-validator';

export class UpdateAcessoDto {
  @IsString()
  @IsOptional()
  tipo?: string;

  @IsDateString()
  @IsOptional()
  horario?: string | Date;
}
