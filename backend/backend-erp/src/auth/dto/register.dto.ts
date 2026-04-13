import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  MaxLength
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Juan Pérez', description: 'Nombre completo del usuario' })
  @IsString()
  nombre_completo!: string;

  @ApiProperty({ example: 'juanp', description: 'Nombre de usuario único' })
  @IsString()
  @MinLength(3)
  username!: string;

  @ApiProperty({ example: 'juan@empresa.com', description: 'Correo electrónico' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'secret123', description: 'Contraseña (mín. 6 caracteres)' })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({ example: '2024-01-15', description: 'Fecha de inicio (YYYY-MM-DD)' })
  @IsDateString()
  fecha_inicio!: string;

  @ApiPropertyOptional({ example: 'Av. Siempre Viva 123' })
  @IsOptional()
  @IsString()
  direccion?: string;

  @ApiPropertyOptional({ example: '+525550000000' })
  @IsOptional()
  @IsString()
  @MaxLength(13)
  telefono?: string;
}
