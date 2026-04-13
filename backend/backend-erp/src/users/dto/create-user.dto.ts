import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class CreateUserDto {
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

  @ApiProperty({ example: 'secret123', description: 'Contraseña (mín. 10 caracteres + especial)' })
  @IsString()
  @MinLength(10)
  @Matches(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]+/, {
    message: 'La contraseña debe contener al menos un carácter especial',
  })
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
  @Matches(/^\d+$/, { message: 'El teléfono solo debe contener números' })
  @MaxLength(13)
  telefono?: string;

  @ApiPropertyOptional({ example: [1, 2], description: 'Arreglo de IDs de permisos globales' })
  @IsOptional()
  permisos_globales?: number[];
}
