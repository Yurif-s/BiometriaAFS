import { IsString, IsNumber, IsOptional} from 'class-validator';

export class UpdateTurmaDto {
  @IsString()
  @IsOptional()
  nome?: string;

  @IsNumber()
  @IsOptional()
  ano?: number;
}