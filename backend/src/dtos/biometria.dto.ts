import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class LeituraBiometriaDto {
  @IsInt()
  @Min(1)
  @Max(127)
  biometria: number;
}

export class CancelarBiometriaDto {
  @IsInt()
  @Min(1)
  @Max(127)
  id: number;

  @IsOptional()
  @IsString()
  reason?: string;
}
