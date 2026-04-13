import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class AddMemberDto {
  @ApiProperty({ example: 2, description: 'ID del usuario a agregar al grupo' })
  @IsInt()
  @IsPositive()
  usuario_id!: number;
}
