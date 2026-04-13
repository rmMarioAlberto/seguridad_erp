import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class SetPermissionsDto {
  @ApiProperty({
    example: ['tickets:add', 'tickets:move'],
    description: 'Lista de permisos a asignar al usuario en el grupo',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  permisos!: string[];
}
