import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'alberto1 o alberto@email.com',
    description: 'Nombre de usuario o correo electrónico',
  })
  @IsString()
  @MinLength(3)
  username!: string;

  @ApiProperty({ example: 'secret123', description: 'Contraseña del usuario' })
  @IsString()
  @MinLength(6)
  password!: string;
}
