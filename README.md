# Filmly

**Aplicación web de microservicios para búsqueda y valoración de películas**

Sistema completo con arquitectura de microservicios que incluye:
- Búsqueda avanzada de películas con Elasticsearch
- Sistema de autenticación con JWT
- Reseñas y valoraciones
- Listas personalizadas de películas
- 3 microservicios en 2 lenguajes (Node.js/TypeScript y Python)
- Empaquetado completo con Docker Compose

---

## 0. SOFTWARE NECESARIO

### Requisitos mínimos

- **Docker Desktop** 4.0 o superior 
- **Git** (para clonar el repositorio)

**Puertos requeridos** (deben estar libres):
- `3000` - Frontend React
- `5000` - API Catalog (Node.js)
- `5001` - API Users (Python/FastAPI)
- `8080` - Gateway
- `9200` - Elasticsearch
- `27017` - MongoDB
- `5432` - PostgreSQL

---

## 1. SERVICIOS QUE HAY QUE ARRANCAR

La aplicación utiliza Docker Compose para levantar todos los servicios. Se levantarán automáticamente:

### Microservicios de la aplicación

1. **frontend** - Interfaz React con TypeScript (Node.js/Vite)
2. **gateway** - API Gateway para enrutamiento y CORS (Node.js/Express)
3. **api-catalog** - Servicio de catálogo de películas y búsqueda (Node.js/Express + MongoDB + Elasticsearch)
4. **api-users** - Servicio de autenticación y usuarios (Python/FastAPI + PostgreSQL)

### Infraestructura (bases de datos)

5. **mongodb** - Base de datos NoSQL para películas, reseñas y listas
6. **elasticsearch** - Motor de búsqueda para consultas avanzadas
7. **postgres** - Base de datos relacional para usuarios
8. **kibana** - Visualización de índices de Elasticsearch

**Total: 8 contenedores Docker**



##  2. DEPENDENCIAS QUE HAY QUE INSTALAR

### Instalación automática con Docker

**NO es necesario instalar dependencias manualmente**. Docker Compose se encarga de:

- Instalar todas las dependencias de Node.js (`npm install`)
- Instalar todas las dependencias de Python (`pip install -r requirements.txt`)
- Configurar las bases de datos
- Crear las redes entre servicios

###  Dependencias incluidas

**Frontend** (`frontend/package.json`):
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "axios": "^1.6.2",
    "bootstrap": "^5.3.2"
  }
}
```

**API Catalog** (`api-catalog/package.json`):
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "mongodb": "^6.3.0",
    "@elastic/elasticsearch": "^8.11.0",
    "axios": "^1.6.2",
    "jsonwebtoken": "^9.0.2"
  }
}
```

**API Users** (`api-users/requirements.txt`):
```
fastapi==0.104.1
uvicorn==0.24.0
sqlalchemy==2.0.23
psycopg2-binary==2.9.9
pyjwt==2.8.0
passlib==1.7.4
python-jose==3.3.0
```

**Gateway** (`gateway/package.json`):
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "http-proxy-middleware": "^2.0.6",
    "cors": "^2.8.5"
  }
}
```

---

## 3. CÓMO ARRANCAR LA PARTE SERVIDORA

### Paso 1: Clonar el repositorio

```bash
git clone <https://github.com/DiegoRamirezLacalle/Filmly.git>
cd Filmly
```

### Paso 2: Arrancar todos los servicios

```bash
docker compose -f infra/docker-compose.dev.yml up --build
```

Este comando: Construye las imágenes Docker de los 4 microservicios, instala todas las dependencias automáticamente, arranca los 8 contenedores, configura las redes entre servicios, crea los volúmenes para persistencia de datos

### Paso 3: Esperar a que todos los servicios estén listos

```bash
# En otra terminal, verificar que todos los contenedores estén corriendo
docker ps

# Deberías ver 8 contenedores con estado "Up"
```


### Verificar que los servicios están funcionando

```bash
# Health check del Gateway (verifica todos los servicios internos)
curl http://localhost:8080/health

# Respuesta esperada:
# {
#   "status": "ok",
#   "services": {
#     "api-catalog": "ok",
#     "api-users": "ok"
#   }
# }
```

### Comandos útiles

```bash
# Ver logs de todos los servicios
docker compose -f infra/docker-compose.dev.yml logs -f

# Ver logs de un servicio específico
docker compose -f infra/docker-compose.dev.yml logs -f api-catalog

# Detener todos los servicios
docker compose -f infra/docker-compose.dev.yml down

# Detener y eliminar datos (reset completo)
docker compose -f infra/docker-compose.dev.yml down -v
```

---

## 4. CÓMO ACCEDER A LA PARTE CLIENTE

### Interfaz web (Frontend)

Abrir navegador en: **http://localhost:3000**

### Funcionalidades disponibles

1. **Búsqueda de películas**
   - Buscador en la página principal
   - Búsqueda con Elasticsearch (indexación de 50,000+ películas)
   - Resultados con póster, título, año y rating

2. **Sistema de autenticación**
   - Click en **"Signup"** para crear cuenta
   - Email y contraseña (mínimo 6 caracteres)
   - Login persistente con JWT

3. **Gestión de listas**
   - Click en **"+ Agregar a Mi Lista"** en cualquier película
   - Ver **"Mi Lista"** en el menú superior
   - Eliminar películas de la lista

4. **Sistema de reseñas**
   - Click en **"Escribir reseña"** en una película
   - Rating de 1-10 estrellas
   - Texto de la reseña (máx. 1000 caracteres)
   - Ver reseñas de otros usuarios

### API REST (para desarrollo/integración)

**Gateway API**: http://localhost:8080

#### Endpoints principales

```bash
# 1. Crear cuenta
curl -X POST http://localhost:8080/api/users/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}'

# 2. Login
curl -X POST http://localhost:8080/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}'

# 3. Buscar películas
curl "http://localhost:8080/api/movies/search-es?q=inception"

# 4. Detalle de película
curl "http://localhost:8080/api/movies/detail?imdbID=tt1375666"

# 5. Ver mi lista (requiere autenticación)
curl -X GET http://localhost:8080/api/movies/my-list \
  -H "Authorization: Bearer <tu-token-jwt>"
```

### Herramientas adicionales (opcional)

- **Kibana** (visualización de Elasticsearch): http://localhost:5601
- **API Catalog** (directo): http://localhost:5000/health
- **API Users** (directo): http://localhost:5001/health

---

##  Estructura del Proyecto

```
Filmly/
├── src/                          # Código fuente de la aplicación
│   ├── api-catalog/             # Microservicio Node.js - Catálogo de películas
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── routes/          # Endpoints REST
│   │   │   ├── services/        # Lógica de negocio
│   │   │   └── lib/             # Conexiones (MongoDB, Elasticsearch, OMDb)
│   │   ├── package.json         # Dependencias Node.js
│   │   ├── tsconfig.json        # Configuración TypeScript
│   │   └── Dockerfile
│   │
│   ├── api-users/               # Microservicio Python - Autenticación
│   │   ├── app/
│   │   │   ├── main.py          # Punto de entrada FastAPI
│   │   │   ├── routers/         # Endpoints REST
│   │   │   ├── models.py        # Modelos SQLAlchemy
│   │   │   ├── auth.py          # Lógica JWT
│   │   │   └── db/              # Conexiones PostgreSQL
│   │   ├── requirements.txt     # Dependencias Python
│   │   └── Dockerfile
│   │
│   ├── gateway/                 # Microservicio Node.js - API Gateway
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── config/          # Configuración de proxies
│   │   │   └── middlewares/     # CORS, logging
│   │   ├── package.json
│   │   └── Dockerfile
│   │
│   └── frontend/                # Cliente React + TypeScript
│       ├── src/
│       │   ├── main.tsx         # Punto de entrada
│       │   ├── App.tsx          # Componente principal
│       │   ├── pages/           # Páginas (Search, Login, Signup, etc.)
│       │   ├── components/      # Componentes reutilizables
│       │   ├── services/        # API calls con Axios
│       │   └── types/           # Tipos TypeScript
│       ├── package.json
│       ├── vite.config.ts
│       └── Dockerfile
│
├── infra/                       # Infraestructura Docker
│   └── docker-compose.dev.yml   #  Archivo principal de orquestación
│
├── docs/                        # Documentación técnica
│   ├── ARCHITECTURE.md
│   ├── DATA_MODEL.md
│   ├── DOCKER_SETUP.md
│   └── TESTING.md
│
└── README.md                    # Este archivo

```

**Nota**: La carpeta `src/` contiene todo el código fuente de los 4 microservicios (renombrados de `api-catalog/`, `api-users/`, `gateway/`, `frontend/` a la raíz para claridad).

---

## Arquitectura y Tecnologías

### Lenguajes de programación

- **Node.js + TypeScript** (3 microservicios):
  - gateway
  - api-catalog
  - frontend (React)
  
- **Python 3.11** (1 microservicio):
  - api-users (FastAPI)

### Frontend
- React 18 + TypeScript
- Vite (bundler ultrarrápido)
- Bootstrap 5 (estilos)
- Axios (llamadas API)
- React Router (navegación)

### Backend - API Gateway
- Express + TypeScript
- http-proxy-middleware (proxy reverso)
- CORS configurado

### Backend - API Catalog
- Express + TypeScript
- MongoDB 6 (almacenamiento de películas, reseñas, listas)
- Elasticsearch 8.14 (búsqueda avanzada)
- OMDb API (metadatos de películas)
- JWT (validación de tokens)

### Backend - API Users
- FastAPI (framework Python async)
- PostgreSQL 16 + SQLAlchemy (ORM)
- JWT (generación de tokens)
- Passlib + bcrypt (hash de contraseñas)

### Orquestación
- Docker Compose
- 8 contenedores interconectados
- Volúmenes persistentes para datos
- Health checks automáticos

---

##  Testing

El proyecto incluye **27 tests** (unitarios e integración) distribuidos en los 3 servicios principales.

### Ejecutar todos los tests

```bash
# Opción 1: Usando Make
make test

# Opción 2: Manualmente
cd api-catalog && npm test
cd api-users && pytest
cd frontend && npm test
```

### Tests por servicio

#### API Catalog (15 tests - Jest + Supertest)
```bash
cd api-catalog
npm install
npm test
```

Prueba:
- Validación de queries de búsqueda
- Formato de imdbID
- Validación de ratings (1-10)
- Transformación de datos

#### API Users (8 tests - pytest)
```bash
cd api-users
pip install -r requirements.txt
pytest
```

Prueba:
- Endpoints de signup/login
- Validación de email
- Manejo de errores 401/422
- Protección de rutas

#### Frontend (4 tests - Vitest + React Testing Library)
```bash
cd frontend
npm install
npm test
```

Prueba:
- Renderizado de componentes
- Validación de formularios
- Configuración de API

**Resultado**: 23/23 tests funcionales pasando


---

##  Configuración 

### Variables de Entorno

Cada servicio tiene un archivo `.env.sample` con valores por defecto configurados. **No es necesario modificarlos para desarrollo**.

#### Archivos de configuración incluidos

**api-catalog/.env.sample**:
```bash
PORT=5000
MONGO_URI=mongodb://mongo:27017/filmly
OMDB_API_KEY=af2afac5              # API Key gratuita de OMDb
ELASTIC_URL=http://elasticsearch:9200
JWT_SECRET=dev-secret-change-me
```

**api-users/.env.sample**:
```bash
PORT=5001
DATABASE_URL=postgresql://filmly:filmly@postgres:5432/filmly
JWT_SECRET=dev-secret-change-me    # Debe coincidir con api-catalog
JWT_EXPIRES_MIN=10080              
```

**gateway/.env.sample**:
```bash
PORT=8080
API_USERS_URL=http://api-users:5001
API_CATALOG_URL=http://api-catalog:5000
```

**frontend/.env.sample**:
```bash
VITE_API_BASE=http://localhost:8080
```

---

## Troubleshooting (Solución de Problemas)

### Problem 1: Puerto ya en uso

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### Problem 2: Servicios no arrancan correctamente

```bash
# Ver logs en tiempo real
docker compose -f infra/docker-compose.dev.yml logs -f

# Ver logs de un servicio específico
docker compose -f infra/docker-compose.dev.yml logs api-catalog

# Rebuild completo
docker compose -f infra/docker-compose.dev.yml down
docker compose -f infra/docker-compose.dev.yml up --build --force-recreate
```

### Problem 3: Elasticsearch requiere más memoria

```bash
# Elasticsearch necesita mínimo 512MB RAM
# Si falla el arranque, verificar configuración Docker Desktop:
# Settings > Resources > Memory: mínimo 4GB recomendado
```

### Problem 4: Base de datos corrompida / Reset completo

```bash
# Eliminar todos los contenedores y volúmenes
docker compose -f infra/docker-compose.dev.yml down -v

# Arrancar desde cero
docker compose -f infra/docker-compose.dev.yml up --build
```

### Problem 5: Verificar que todo funciona

```bash
# 1. Ver contenedores corriendo
docker ps

# 2. Health check del gateway
curl http://localhost:8080/health

# 3. Probar búsqueda
curl "http://localhost:8080/api/movies/search-es?q=matrix"

# 4. Abrir frontend
# Navegador: http://localhost:3000
```

---

## Características Destacadas

### Cumple con requisitos de proyecto

- **Múltiples lenguajes**: Node.js/TypeScript (3 servicios) + Python (1 servicio)
- **Docker + Docker Compose**: Empaquetado completo con 8 contenedores
- **Arquitectura de microservicios**: 4 servicios independientes comunicados
- **README completo**: Instrucciones detalladas paso a paso
- **Código fuente en `src/`**: Todos los microservicios organizados
- **Scripts de instalación**: `package.json` y `requirements.txt` incluidos
- **Persistencia de datos**: 3 bases de datos con volúmenes Docker

### Funcionalidades técnicas

- **Autenticación JWT**: Login/Signup con tokens seguros
- **Búsqueda avanzada**: Elasticsearch con 50,000+ películas indexadas
- **API Gateway**: Proxy reverso con CORS configurado
- **Validaciones robustas**: Backend valida todos los inputs
- **Testing**: 27 tests unitarios e integración
- **Health checks**: Monitoreo automático de servicios
- **Logging**: Logs estructurados en todos los servicios
- **Documentación**: OpenAPI/Swagger specs incluidas

---





