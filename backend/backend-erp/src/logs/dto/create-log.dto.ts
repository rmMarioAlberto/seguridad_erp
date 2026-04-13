import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateLogDto {
  @IsString()
  servicio!: string;

  @IsString()
  endpoint!: string;

  @IsString()
  metodo!: string;

  @IsOptional()
  @IsInt()
  usuario_id?: number;

  @IsOptional()
  @IsString()
  ip?: string;

  @IsInt()
  status!: number;

  @IsOptional()
  @IsInt()
  duracion?: number;

  @IsOptional()
  @IsString()
  error?: string;
}
