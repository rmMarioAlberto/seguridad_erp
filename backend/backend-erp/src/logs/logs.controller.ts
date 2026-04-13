import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateLogDto } from './dto/create-log.dto';
import { LogsService } from './logs.service';

@ApiTags('Logs / Internal')
@Controller('internal/logs')
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Post()
  @ApiOperation({ summary: 'Guardar un log (uso interno)' })
  createLog(@Body() dto: CreateLogDto) {
    return this.logsService.create(dto);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Ver logs' })
  getLogs(@Query() filters: any) {
    return this.logsService.findAll(filters);
  }

  @Get('metricas')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Ver métricas' })
  getMetricas() {
    return this.logsService.getMetricas();
  }

  @Get('summary')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Obtener resumen estadístico' })
  getSummary() {
    return this.logsService.getStatsSummary();
  }
}
