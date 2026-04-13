# ERP Monorepo

Proyecto ERP con arquitectura de microservicios.

## Estructura

```
erp-monorepo/
├── frontend/          # Angular 21 → Puerto 4200
├── backend/
│   ├── api-gateway/   # Fastify API Gateway → Puerto 3000
│   ├── backend-erp/   # NestJS ERP Service  → Puerto 3001
│   └── tickets-service/ # Fastify Tickets   → Puerto 3002
├── docs/              # Documentación y requerimientos
└── scripts/
    └── dev.sh         # Script centralizado de desarrollo
```

## Inicio Rápido

```bash
# Levantar TODOS los servicios (logs unificados)
./scripts/dev.sh

# Levantar solo los backends
./scripts/dev.sh backend

# Levantar servicios individuales
./scripts/dev.sh gateway
./scripts/dev.sh erp
./scripts/dev.sh tickets
./scripts/dev.sh frontend
```

## Servicios

| Servicio | URL | Framework |
|---|---|---|
| API Gateway | http://localhost:3000 | Fastify |
| Backend ERP | http://localhost:3001 | NestJS |
| Tickets Service | http://localhost:3002 | Fastify |
| Frontend | http://localhost:4200 | Angular 21 |
