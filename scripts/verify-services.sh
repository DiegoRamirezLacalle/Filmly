#!/bin/bash
# Script de verificación de servicios Docker
# Uso: ./scripts/verify-services.sh

set -e

echo "🔍 Verificando servicios Filmly..."
echo "=================================="
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contador de servicios
TOTAL=0
SUCCESS=0
FAIL=0

# Función para verificar URL
check_service() {
    local name=$1
    local url=$2
    
    TOTAL=$((TOTAL + 1))
    printf "%-25s " "$name"
    
    if curl -f -s "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ OK${NC}"
        SUCCESS=$((SUCCESS + 1))
    else
        echo -e "${RED}❌ FAIL${NC}"
        FAIL=$((FAIL + 1))
    fi
}

# Verificar servicios principales
echo "📡 Healthchecks:"
check_service "Gateway" "http://localhost:8080/health"
check_service "API Users" "http://localhost:5001/health"
check_service "API Catalog" "http://localhost:5000/health"
check_service "Elasticsearch" "http://localhost:9200"
echo ""

# Verificar frontend
echo "🌐 Frontend:"
check_service "React App" "http://localhost:3000"
echo ""

# Verificar contenedores
echo "🐳 Contenedores Docker:"
CONTAINERS=$(docker ps --format "{{.Names}}" | grep "infra-" | wc -l)
echo "Contenedores corriendo: $CONTAINERS"

if [ "$CONTAINERS" -ge 7 ]; then
    echo -e "${GREEN}✅ Todos los contenedores están corriendo${NC}"
else
    echo -e "${YELLOW}⚠️  Se esperaban 7+ contenedores${NC}"
fi
echo ""

# Resumen
echo "=================================="
echo "📊 Resumen:"
echo "  Total verificados: $TOTAL"
echo -e "  ${GREEN}Exitosos: $SUCCESS${NC}"
echo -e "  ${RED}Fallidos: $FAIL${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}🎉 Todos los servicios están funcionando correctamente!${NC}"
    exit 0
else
    echo -e "${RED}⚠️  Algunos servicios no están disponibles${NC}"
    echo "Verifica los logs con: docker compose -f infra/docker-compose.dev.yml logs"
    exit 1
fi
