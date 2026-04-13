#!/bin/bash
# ┌─────────────────────────────────────────────────────────────────┐
# │  ERP Dev Runner — Todos los servicios en una sola terminal      │
# │  Uso: ./scripts/dev.sh [all|gateway|erp|tickets|frontend]       │
# └─────────────────────────────────────────────────────────────────┘

# --- Colores por servicio ---
C_GATEWAY='\033[0;31m'   # Rojo
C_ERP='\033[0;34m'       # Azul
C_TICKETS='\033[1;33m'   # Amarillo
C_FRONTEND='\033[0;32m'  # Verde
C_SYS='\033[0;35m'       # Morado (sistema)
NC='\033[0m'
BOLD='\033[1m'

# Matar todos los procesos hijos al presionar Ctrl+C
trap 'echo -e "\n${C_SYS}[SYSTEM]${NC} Deteniendo todos los servicios..."; kill 0' SIGINT SIGTERM

BASE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MODE="${1:-all}"

# ─── Función para prefixear logs ─────────────────────────────────
prefix_log() {
  local color="$1"
  local name="$2"
  while IFS= read -r line; do
    printf "${color}[%-12s]${NC} %s\n" "$name" "$line"
  done
}

# ─── Verificar que existan los directorios ───────────────────────
check_dir() {
  if [ ! -d "$1" ]; then
    echo -e "${C_SYS}[SYSTEM]${NC} ⚠  No se encontró: $1 (omitiendo)"
    return 1
  fi
  return 0
}

echo ""
echo -e "${BOLD}  ╔══════════════════════════════════════════╗${NC}"
echo -e "${BOLD}  ║        ERP Development Runner            ║${NC}"
echo -e "${BOLD}  ╚══════════════════════════════════════════╝${NC}"
echo -e "  ${C_SYS}Base:${NC} $BASE"
echo -e "  ${C_SYS}Modo:${NC} $MODE"
echo -e "  ${C_SYS}Log :${NC} Ctrl+C para detener todo"
echo ""
echo -e "  ${C_GATEWAY}[API-GATEWAY ]${NC} → Puerto 3000"
echo -e "  ${C_ERP}[BACKEND-ERP ]${NC} → Puerto 3001"
echo -e "  ${C_TICKETS}[TICKETS-SVC ]${NC} → Puerto 3002"
echo -e "  ${C_FRONTEND}[FRONTEND    ]${NC} → Puerto 4200"
echo ""
echo -e "  $(date '+%H:%M:%S') — Iniciando servicios...\n"

# ─── Lanzar servicios según modo ─────────────────────────────────
PIDS=()

start_gateway() {
  if check_dir "$BASE/backend/api-gateway"; then
    (cd "$BASE/backend/api-gateway" && npm run dev 2>&1 | prefix_log "$C_GATEWAY" "API-GATEWAY") &
    PIDS+=($!)
    echo -e "${C_SYS}[SYSTEM]${NC} ✓ API Gateway iniciado (PID: $!)"
  fi
}

start_erp() {
  if check_dir "$BASE/backend/backend-erp"; then
    (cd "$BASE/backend/backend-erp" && npm run start:dev 2>&1 | prefix_log "$C_ERP" "BACKEND-ERP") &
    PIDS+=($!)
    echo -e "${C_SYS}[SYSTEM]${NC} ✓ Backend ERP iniciado (PID: $!)"
  fi
}

start_tickets() {
  if check_dir "$BASE/backend/tickets-service"; then
    (cd "$BASE/backend/tickets-service" && npm run dev 2>&1 | prefix_log "$C_TICKETS" "TICKETS-SVC") &
    PIDS+=($!)
    echo -e "${C_SYS}[SYSTEM]${NC} ✓ Tickets Service iniciado (PID: $!)"
  fi
}

start_frontend() {
  if check_dir "$BASE/frontend"; then
    (cd "$BASE/frontend" && ng serve 2>&1 | prefix_log "$C_FRONTEND" "FRONTEND") &
    PIDS+=($!)
    echo -e "${C_SYS}[SYSTEM]${NC} ✓ Frontend iniciado (PID: $!)"
  fi
}

case "$MODE" in
  all)      start_gateway; start_erp; start_tickets; start_frontend ;;
  gateway)  start_gateway ;;
  erp)      start_erp ;;
  tickets)  start_tickets ;;
  frontend) start_frontend ;;
  backend)  start_gateway; start_erp; start_tickets ;;
  *)
    echo "Uso: $0 [all|backend|gateway|erp|tickets|frontend]"
    exit 1
    ;;
esac

echo ""
wait  # Esperar a que todos los procesos terminen
