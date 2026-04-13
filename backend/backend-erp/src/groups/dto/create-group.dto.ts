import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateGroupDto {
  @ApiProperty({ example: 'Frontend Team', description: 'Nombre del grupo' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(255)
  nombre!: string;

  @ApiProperty({ example: 'Equipo de desarrollo frontend', required: false })
  @IsOptional()
  @IsString()
  descripcion?: string;
}
