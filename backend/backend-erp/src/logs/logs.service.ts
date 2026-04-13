import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLogDto } from './dto/create-log.dto';

@Injectable()
export class LogsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateLogDto) {
    return this.prisma.$transaction(async (tx) => {
      const log = await tx.log.create({ data: dto });

      if (dto.duracion !== undefined) {
        const existing = await tx.metrica.findUnique({
          where: {
            endpoint_metodo: { endpoint: dto.endpoint, metodo: dto.metodo },
          },
        });

        if (!existing) {
          await tx.metrica.create({
            data: {
              endpoint: dto.endpoint,
              metodo: dto.metodo,
              total_requests: 1,
              tiempo_respuesta_avg: dto.duracion,
            },
          });
        } else {
          const newAvg =
            (existing.tiempo_respuesta_avg! * existing.total_requests +
              dto.duracion) /
            (existing.total_requests + 1);

          await tx.metrica.update({
            where: {
              endpoint_metodo: { endpoint: dto.endpoint, metodo: dto.metodo },
            },
            data: {
              total_requests: { increment: 1 },
              tiempo_respuesta_avg: newAvg,
            },
          });
        }
      }

      return log;
    });
  }

  async findAll(filters: { servicio?: string; page?: string; limit?: string }) {
    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 50;
    const where = filters.servicio ? { servicio: filters.servicio } : {};

    return this.prisma.log.findMany({
      where,
      orderBy: { creado_en: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async getMetricas() {
    return this.prisma.metrica.findMany({
      orderBy: { total_requests: 'desc' },
    });
  }

  async getStatsSummary() {
    const [statusCounts, totalLogs, avgDuration] = await Promise.all([
      this.prisma.log.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      this.prisma.log.count(),
      this.prisma.log.aggregate({
        _avg: { duracion: true },
      }),
    ]);

    return {
      statusCounts: statusCounts.map((g) => ({
        status: g.status,
        count: g._count._all,
      })),
      totalLogs,
      avgDuration: avgDuration._avg.duracion || 0,
    };
  }
}
