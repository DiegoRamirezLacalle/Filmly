# ✅ Docker Setup - Checklist Completo

## 🎯 Arranque Limpio (One Command)

```bash
docker compose -f infra/docker-compose.dev.yml up --build
```

**Tiempo estimado**: 2-3 minutos en primera ejecución

## ✅ Estado del Proyecto

### 1. ⬜ Docker Compose "One Command" → ✅ COMPLETADO

- **Comando único**: `docker compose -f infra/docker-compose.dev.yml up --build`
- **Sin pasos manuales**: Los `.env.sample` se cargan automáticamente
- **Healthchecks configurados**: MongoDB, Elasticsearch, PostgreSQL
- **Dependencias ordenadas**: Los servicios esperan a que las DBs estén listas

### 2. ⬜ Sin Puertos Ocupados → ✅ COMPLETADO

**Puertos utilizados** (sin conflictos):

| Servicio | Puerto Host | Puerto Container | Nota |
|----------|-------------|------------------|------|
| frontend | 3000 | 3000 | React |
| gateway | 8080 | 8080 | API pública |
| api-catalog | 5000 | 5000 | Interno (debug) |
| api-users | 5001 | 5001 | Interno (debug) |
| postgres | **5433** | 5432 | ⚠️ Mapeado a 5433 para evitar conflicto |
| mongo | 27017 | 27017 | MongoDB |
| elasticsearch | 9200 | 9200 | Elasticsearch |
| kibana | 5601 | 5601 | Opcional |

**PostgreSQL**: Usa puerto **5433** en el host para no conflictuar con instalaciones locales de PostgreSQL (que usan 5432).

**Conexiones**:
- Desde host: `postgresql://filmly:filmly@localhost:5433/filmly`
- Desde contenedores: `postgresql://filmly:filmly@postgres:5432/filmly`

### 3. ⬜ .env.sample Completos → ✅ COMPLETADO

Todos los servicios tienen `.env.sample` con:
- ✅ Comentarios explicativos
- ✅ Valores por defecto funcionales
- ✅ Instrucciones para producción

#### api-catalog/.env.sample
```bash
# API Catalog Service Configuration
PORT=5000
MONGO_URI=mongodb://mongo:27017/filmly
OMDB_API_KEY=af2afac5  # API Key gratuita
ELASTIC_URL=http://elasticsearch:9200
ELASTIC_INDEX=movies
JWT_SECRET=dev-secret-change-me  # ⚠️ Cambiar en producción
```

#### api-users/.env.sample
```bash
# API Users Service Configuration
PORT=5001
DATABASE_URL=postgresql://filmly:filmly@postgres:5432/filmly
JWT_SECRET=dev-secret-change-me  # DEBE coincidir con api-catalog
JWT_ALG=HS256
JWT_EXPIRES_MIN=10080  # 7 días
```

#### gateway/.env.sample
```bash
# Gateway Service Configuration
PORT=8080
API_USERS_URL=http://api-users:5001
API_CATALOG_URL=http://api-catalog:5000
```

#### frontend/.env.sample
```bash
# Frontend Configuration
VITE_API_BASE=http://localhost:8080
```

**Uso**: No es necesario copiar a `.env` para desarrollo. Los valores por defecto funcionan directamente.

**Para personalizar**:
```bash
cp api-catalog/.env.sample api-catalog/.env
# Editar api-catalog/.env con tus valores
```

### 4. ⬜ Volúmenes Persisten Datos → ✅ COMPLETADO

**Volúmenes nombrados** (managed by Docker):

```yaml
volumes:
  mongo_data:      # MongoDB (/data/db)
  es_data:         # Elasticsearch (/usr/share/elasticsearch/data)
  pgdata:          # PostgreSQL (/var/lib/postgresql/data)
```

**Ventajas**:
- ✅ Los datos persisten entre reinicios
- ✅ No se corrompen al hacer `docker compose down`
- ✅ Gestionados por Docker (ubicación optimizada)
- ✅ Funcionan en Windows, Linux, Mac sin cambios

**Comandos**:
```bash
# Ver volúmenes
docker volume ls | grep infra

# Eliminar solo los contenedores (mantiene datos)
docker compose -f infra/docker-compose.dev.yml down

# Eliminar todo incluyendo datos (⚠️ CUIDADO)
docker compose -f infra/docker-compose.dev.yml down -v
```

## 📋 Verificación del Sistema

### Healthchecks

Todos los servicios responden correctamente:

```bash
# Gateway (verifica todos los servicios)
curl http://localhost:8080/health
# → {"status":"ok","gateway":"ok","apiUsers":"ok","apiCatalog":"ok"}

# API Users
curl http://localhost:5001/health
# → {"status":"ok","database":"ok"}

# API Catalog
curl http://localhost:5000/health
# → {"status":"ok","mongo":"ok","elasticsearch":"ok"}
```

### Scripts de Verificación

**Windows PowerShell**:
```powershell
.\scripts\verify-services.ps1
```

**Linux/Mac**:
```bash
chmod +x scripts/verify-services.sh
./scripts/verify-services.sh
```

**Salida esperada**:
```
🔍 Verificando servicios Filmly...
==================================

📡 Healthchecks:
Gateway                  ✅ OK
API Users                ✅ OK
API Catalog              ✅ OK
Elasticsearch            ✅ OK

🌐 Frontend:
React App                ✅ OK

🐳 Contenedores Docker:
Contenedores corriendo: 8
✅ Todos los contenedores están corriendo

==================================
📊 Resumen:
  Total verificados: 5
  Exitosos: 5
  Fallidos: 0

🎉 Todos los servicios están funcionando correctamente!
```

## 🧪 Testing Manual

### 1. Frontend Carga
```
Abrir: http://localhost:3000
Debe mostrar: Página de búsqueda de películas
```

### 2. Buscar Película
```
1. Escribir "inception" en el buscador
2. Debe aparecer: Lista de resultados
3. Click en "Ver detalle"
4. Debe mostrar: Información completa de la película
```

### 3. Crear Cuenta
```
1. Click en "Signup"
2. Email: test@test.com
3. Password: 123456
4. Debe: Iniciar sesión automáticamente
```

### 4. Agregar a Lista
```
1. Buscar una película
2. Abrir detalle
3. Click "+ Agregar a Mi Lista"
4. Debe: Confirmar agregado
5. Click "Mi Lista" en navbar
6. Debe: Mostrar la película guardada
```

### 5. Escribir Reseña
```
1. Abrir detalle de película
2. Click " Escribir reseña"
3. Rating: 5 estrellas
4. Texto: "Great movie!"
5. Click "Guardar"
6. Debe: Mostrar reseña en la lista
```

## 📊 Estructura de Contenedores

```
┌─────────────────────────────────────────┐
│  Browser: http://localhost:3000         │
│  (Frontend - React + Vite)              │
└───────────────┬─────────────────────────┘
                │
                ↓ (HTTP)
┌─────────────────────────────────────────┐
│  Gateway: http://localhost:8080         │
│  (API Gateway + CORS + Proxy)           │
└───┬──────────────────────────┬──────────┘
    │                          │
    ↓                          ↓
┌───────────────┐      ┌───────────────┐
│  api-users    │      │  api-catalog  │
│  FastAPI      │      │  Express      │
│  Port: 5001   │      │  Port: 5000   │
└───┬───────────┘      └───┬───────────┘
    │                      │
    ↓                      ↓
┌───────────────┐      ┌───────────────┐
│  PostgreSQL   │      │  MongoDB      │
│  Port: 5433   │      │  Port: 27017  │
└───────────────┘      └───┬───────────┘
                           │
                           ↓
                   ┌───────────────┐
                   │ Elasticsearch │
                   │  Port: 9200   │
                   └───────────────┘
```

## 🔄 Workflows para el Profesor

### Primera Ejecución (Limpia)

```bash
# 1. Clonar repositorio
git clone <repo-url>
cd Filmly

# 2. Levantar todo (⏱️ 2-3 minutos)
docker compose -f infra/docker-compose.dev.yml up --build

# 3. Esperar mensaje: "gateway on 8080 -> users=..."
# 4. Abrir navegador: http://localhost:3000
# 5. Probar funcionalidades
```

### Detener y Mantener Datos

```bash
# Detener contenedores (mantiene volúmenes)
docker compose -f infra/docker-compose.dev.yml down

# Volver a arrancar (usa datos existentes)
docker compose -f infra/docker-compose.dev.yml up
```

### Reset Completo (Empezar de Cero)

```bash
# ⚠️ Borra TODOS los datos
docker compose -f infra/docker-compose.dev.yml down -v

# Rebuild desde cero
docker compose -f infra/docker-compose.dev.yml up --build
```

### Ver Logs en Vivo

```bash
# Todos los servicios
docker compose -f infra/docker-compose.dev.yml logs -f

# Un servicio específico
docker compose -f infra/docker-compose.dev.yml logs -f gateway
docker compose -f infra/docker-compose.dev.yml logs -f api-catalog
```

## 🐛 Troubleshooting Rápido

### "Cannot connect to Docker daemon"
```bash
# Verificar que Docker Desktop está corriendo
docker ps
```

### "Port already in use"
```powershell
# Windows - Ver proceso en puerto 3000
netstat -ano | findstr :3000

# Matar proceso
taskkill /PID <PID> /F
```

### "Service unhealthy"
```bash
# Ver logs del servicio problemático
docker compose -f infra/docker-compose.dev.yml logs elasticsearch
docker compose -f infra/docker-compose.dev.yml logs mongo
```

### Elasticsearch no arranca (Linux)
```bash
# Aumentar límite de memoria virtual
sudo sysctl -w vm.max_map_count=262144
```

## 📚 Documentación Adicional

- [README.md](../README.md) - Guía principal del proyecto
- [DOCKER_SETUP.md](./DOCKER_SETUP.md) - Guía detallada de Docker
- [BACKEND_ROBUSTNESS.md](./BACKEND_ROBUSTNESS.md) - Validaciones y errores
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Arquitectura del sistema

## ✅ Checklist Final para Entrega

- [x] Un comando levanta todo: `docker compose -f infra/docker-compose.dev.yml up --build`
- [x] No hay conflictos de puertos (PostgreSQL en 5433)
- [x] Archivos `.env.sample` completos con comentarios
- [x] Volúmenes persisten datos correctamente
- [x] Healthchecks en todos los servicios
- [x] Scripts de verificación (PowerShell + Bash)
- [x] README con instrucciones claras
- [x] Documentación técnica completa
- [x] Frontend accesible en http://localhost:3000
- [x] API Gateway responde en http://localhost:8080/health

## 🎓 Para el Profesor

### Evaluación Rápida (5 minutos)

1. **Clonar y arrancar**:
   ```bash
   git clone <repo-url> && cd Filmly
   docker compose -f infra/docker-compose.dev.yml up --build
   ```

2. **Verificar servicios** (esperar 2 min):
   ```bash
   curl http://localhost:8080/health
   # Debe devolver: {"status":"ok","gateway":"ok","apiUsers":"ok","apiCatalog":"ok"}
   ```

3. **Probar frontend**:
   - Abrir: http://localhost:3000
   - Buscar: "inception"
   - Ver: Resultados y detalles

4. **Probar autenticación**:
   - Crear cuenta: test@test.com / 123456
   - Agregar película a "Mi Lista"
   - Escribir reseña

5. **Verificar persistencia**:
   ```bash
   docker compose -f infra/docker-compose.dev.yml down
   docker compose -f infra/docker-compose.dev.yml up -d
   # Login → Mi Lista debe mantener películas guardadas
   ```

### Puntos Clave de Evaluación

✅ **Arquitectura**:
- Gateway pattern (proxy centralizado)
- Microservicios independientes
- Bases de datos apropiadas (PostgreSQL, MongoDB, Elasticsearch)

✅ **Docker**:
- Un solo comando de arranque
- Volúmenes persistentes
- Healthchecks configurados
- Sin conflictos de puertos

✅ **Configuración**:
- Variables de entorno documentadas
- Valores por defecto funcionales
- Fácil personalización

✅ **Funcionalidades**:
- Búsqueda de películas (Elasticsearch)
- Autenticación JWT
- Reseñas de usuarios
- Listas personalizadas
- Detalle completo de películas

✅ **Calidad del Código**:
- TypeScript + Python con tipos
- Validación de inputs
- Manejo de errores consistente
- Documentación completa
