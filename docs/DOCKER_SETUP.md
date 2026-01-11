# Docker Setup & Deployment Guide

## 🎯 Quick Start (One Command)

```bash
docker compose -f infra/docker-compose.dev.yml up --build
```

## 📦 Services Overview

El proyecto corre **7 contenedores**:

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| frontend | 3000 | React + Vite |
| gateway | 8080 | API Gateway + Proxy |
| api-catalog | 5000 | Catálogo de películas |
| api-users | 5001 | Autenticación y usuarios |
| mongo | 27017 | Base de datos MongoDB |
| elasticsearch | 9200 | Motor de búsqueda |
| postgres | 5433 | Base de datos PostgreSQL (mapeado a 5433 para evitar conflictos) |

**Opcional:**
- kibana (5601) - Interface para Elasticsearch

## 🔧 Configuración de Puertos

### Puertos Expuestos (accesibles desde el host)

```yaml
# Frontend
3000:3000     ✅ http://localhost:3000

# Gateway (API pública)
8080:8080     ✅ http://localhost:8080

# Servicios internos (accesibles para debugging)
5000:5000     ⚠️ api-catalog (interno, solo para pruebas)
5001:5001     ⚠️ api-users (interno, solo para pruebas)

# Bases de datos (accesibles para clientes externos)
27017:27017   ⚠️ MongoDB
9200:9200     ⚠️ Elasticsearch
5433:5432     ⚠️ PostgreSQL (host:5433 → container:5432)
```

### ⚠️ Conflictos de Puertos Comunes

#### PostgreSQL (5432)

**Problema**: PostgreSQL local ya usa el puerto 5432

**Solución**: El docker-compose usa `5433:5432` (puerto 5433 en el host → 5432 en el contenedor)

```yaml
postgres:
  ports:
    - "5433:5432"  # ✅ No conflicto
```

**Conexión desde host**:
```bash
# Desde el host (herramientas externas)
psql -h localhost -p 5433 -U filmly -d filmly

# Desde contenedores Docker (variable DATABASE_URL)
postgresql://filmly:filmly@postgres:5432/filmly
```

#### MongoDB (27017)

Si tienes MongoDB local corriendo:

```bash
# Windows
net stop MongoDB

# Linux/Mac
sudo systemctl stop mongod

# O cambiar puerto en docker-compose:
# ports: ["27018:27017"]
```

#### Elasticsearch (9200)

```bash
# Ver qué proceso usa el puerto
# Windows
netstat -ano | findstr :9200

# Linux/Mac
lsof -ti:9200
```

## 💾 Volúmenes Persistentes

### Volúmenes Nombrados (Named Volumes)

```yaml
volumes:
  mongo_data:      # MongoDB data
  es_data:         # Elasticsearch indices
  pgdata:          # PostgreSQL data
```

**Ventajas**:
- ✅ Los datos persisten al reiniciar contenedores
- ✅ No se corrompen al hacer `docker compose down`
- ✅ Gestionados por Docker (ubicación optimizada)
- ✅ Funcionan igual en Windows, Linux, Mac

### Ubicación de los Datos

```bash
# Listar volúmenes
docker volume ls | grep infra

# Inspeccionar ubicación
docker volume inspect infra_mongo_data
docker volume inspect infra_es_data
docker volume inspect infra_pgdata
```

**Resultado típico**:
```json
{
  "Mountpoint": "/var/lib/docker/volumes/infra_mongo_data/_data"
}
```

### Comandos de Gestión

```bash
# Ver tamaño de volúmenes
docker system df -v

# Eliminar UN volumen específico (⚠️ borra datos)
docker volume rm infra_mongo_data

# Eliminar TODOS los volúmenes del proyecto (⚠️ CUIDADO)
docker compose -f infra/docker-compose.dev.yml down -v

# Backup de MongoDB
docker exec infra-mongo-1 mongodump --out=/dump
docker cp infra-mongo-1:/dump ./backup-mongo

# Restaurar MongoDB
docker cp ./backup-mongo infra-mongo-1:/dump
docker exec infra-mongo-1 mongorestore /dump
```

## 🔄 Workflows Comunes

### Arranque Limpio (First Time)

```bash
# 1. Clonar repo
git clone <repo-url>
cd Filmly

# 2. Levantar todo
docker compose -f infra/docker-compose.dev.yml up --build

# 3. Esperar a que todos los healthchecks pasen
# Ver logs: docker compose -f infra/docker-compose.dev.yml logs -f

# 4. Abrir navegador
open http://localhost:3000
```

**Tiempo estimado**: 2-3 minutos en primera ejecución (descarga de imágenes).

### Desarrollo Diario

```bash
# Iniciar servicios (usa cache)
docker compose -f infra/docker-compose.dev.yml up

# Iniciar en background
docker compose -f infra/docker-compose.dev.yml up -d

# Ver logs
docker compose -f infra/docker-compose.dev.yml logs -f gateway

# Rebuild un servicio específico
docker compose -f infra/docker-compose.dev.yml up --build api-catalog

# Detener sin borrar volúmenes
docker compose -f infra/docker-compose.dev.yml down
```

### Rebuild Completo (Cambios en package.json o requirements.txt)

```bash
# Forzar rebuild sin cache
docker compose -f infra/docker-compose.dev.yml build --no-cache

# Rebuild y levantar
docker compose -f infra/docker-compose.dev.yml up --build --force-recreate
```

### Reset Completo (Borrar todo y empezar de cero)

```bash
# ⚠️ CUIDADO: Esto borra TODOS los datos

# 1. Bajar servicios y borrar volúmenes
docker compose -f infra/docker-compose.dev.yml down -v

# 2. (Opcional) Limpiar imágenes viejas
docker system prune -a

# 3. Rebuild y arrancar
docker compose -f infra/docker-compose.dev.yml up --build
```

## 🔍 Debugging

### Ver estado de servicios

```bash
# Listar contenedores
docker ps

# Ver logs de todos los servicios
docker compose -f infra/docker-compose.dev.yml logs

# Ver logs de un servicio específico
docker compose -f infra/docker-compose.dev.yml logs api-catalog

# Seguir logs en tiempo real
docker compose -f infra/docker-compose.dev.yml logs -f gateway

# Ver logs de últimos 100 líneas
docker compose -f infra/docker-compose.dev.yml logs --tail=100 api-users
```

### Entrar a un contenedor

```bash
# Shell interactivo en MongoDB
docker exec -it infra-mongo-1 mongosh

# Shell en Node.js service
docker exec -it infra-api-catalog-1 sh

# Shell en Python service
docker exec -it infra-api-users-1 bash

# Ver archivos del contenedor
docker exec infra-api-catalog-1 ls -la /app
```

### Verificar conectividad entre servicios

```bash
# Desde gateway, hacer ping a api-catalog
docker exec infra-gateway-1 wget -O- http://api-catalog:5000/health

# Desde api-catalog, verificar MongoDB
docker exec infra-api-catalog-1 wget -O- http://mongo:27017

# Desde api-users, verificar PostgreSQL
docker exec infra-api-users-1 psql postgresql://filmly:filmly@postgres:5432/filmly -c "SELECT 1"
```

### Verificar variables de entorno

```bash
# Ver todas las variables de un contenedor
docker exec infra-api-catalog-1 env

# Ver una variable específica
docker exec infra-api-catalog-1 printenv JWT_SECRET
```

## 📋 Healthchecks

Todos los servicios tienen healthchecks configurados:

```yaml
# MongoDB
healthcheck:
  test: mongosh --quiet --eval 'db.runCommand({ ping: 1 })' || exit 1
  interval: 10s
  retries: 10

# Elasticsearch
healthcheck:
  test: curl -fsS http://localhost:9200 >/dev/null || exit 1
  interval: 10s
  retries: 20
```

### Ver estado de healthchecks

```bash
docker ps --format "table {{.Names}}\t{{.Status}}"

# Salida esperada:
# infra-frontend-1       Up 2 minutes
# infra-gateway-1        Up 2 minutes
# infra-api-catalog-1    Up 2 minutes
# infra-api-users-1      Up 2 minutes
# infra-mongo-1          Up 2 minutes (healthy)
# infra-elasticsearch-1  Up 2 minutes (healthy)
# infra-postgres-1       Up 2 minutes
```

### Script de verificación

```bash
#!/bin/bash
# scripts/verify-docker.sh

echo "🔍 Verificando servicios Docker..."

services=(
  "http://localhost:8080/health"
  "http://localhost:5001/health"
  "http://localhost:5000/health"
)

for url in "${services[@]}"; do
  echo "Testing $url"
  if curl -f -s "$url" > /dev/null; then
    echo "✅ OK"
  else
    echo "❌ FAIL"
  fi
done

echo "🏁 Verificación completa"
```

## 🌍 Variables de Entorno

### Precedencia

1. Variables en `environment:` del docker-compose
2. Variables en `env_file:`
3. Variables en el archivo `.env.sample`

### Ejemplo

```yaml
api-users:
  env_file: ../api-users/.env.sample
  environment:
    - PORT=5001  # ✅ Override del .env.sample
```

### Verificar valores cargados

```bash
# Ver variables de un servicio
docker compose -f infra/docker-compose.dev.yml config | grep -A 10 "api-users:"
```

## 🚀 Producción

### Cambios necesarios

```yaml
# docker-compose.prod.yml
services:
  gateway:
    ports:
      - "8080:8080"  # ✅ Solo gateway expuesto
  
  api-users:
    # ❌ NO exponer puertos
    networks:
      - internal
  
  api-catalog:
    # ❌ NO exponer puertos
    networks:
      - internal
  
  mongo:
    # ❌ NO exponer puertos
    networks:
      - internal

networks:
  internal:
    driver: bridge
```

### Volúmenes en producción

```yaml
volumes:
  mongo_data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /mnt/data/mongo  # ✅ Ruta específica con backups
```

## 📊 Monitoreo

### Uso de recursos

```bash
# Ver uso de CPU/RAM
docker stats

# Ver uso de espacio
docker system df

# Ver logs de tamaño
du -sh /var/lib/docker/volumes/infra_*
```

### Límites de recursos (opcional)

```yaml
services:
  elasticsearch:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          memory: 512M
```

## 🆘 Troubleshooting Común

### "Cannot connect to Docker daemon"

```bash
# Windows: Verificar que Docker Desktop está corriendo
# Linux: 
sudo systemctl start docker
sudo usermod -aG docker $USER
newgrp docker
```

### "Port already in use"

```bash
# Ver qué proceso usa el puerto
# Windows
netstat -ano | findstr :3000

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### "Volume mounting failed"

```bash
# Windows: Verificar que la carpeta compartida está habilitada
# Docker Desktop → Settings → Resources → File Sharing
```

### "Service 'X' failed to build"

```bash
# Limpiar build cache
docker builder prune -a

# Rebuild sin cache
docker compose -f infra/docker-compose.dev.yml build --no-cache
```

### Elasticsearch no arranca

```bash
# Linux: Aumentar vm.max_map_count
sudo sysctl -w vm.max_map_count=262144

# Persistir cambio
echo "vm.max_map_count=262144" | sudo tee -a /etc/sysctl.conf
```

## ✅ Checklist para el Profesor

- [ ] Un solo comando arranca todo: `docker compose -f infra/docker-compose.dev.yml up --build`
- [ ] Puertos no conflictivos (PostgreSQL en 5433, no 5432)
- [ ] Todos los servicios tienen `.env.sample` completos y comentados
- [ ] Volúmenes persisten datos (no se pierden al reiniciar)
- [ ] Healthchecks configurados en todos los servicios
- [ ] README.md con instrucciones claras
- [ ] No se requieren pasos manuales adicionales
- [ ] Frontend accesible en http://localhost:3000
- [ ] Gateway responde en http://localhost:8080/health
