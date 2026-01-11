# Backend Robustness Checklist

## ✅ Validación de Inputs

### Signup/Login (api-users)
```python
# app/schemas.py
class SignupIn(BaseModel):
    email: EmailStr  # ✅ Validación de formato de email
    password: str = Field(min_length=6, max_length=128)  # ✅ Mínimo 6 caracteres

class LoginIn(BaseModel):
    email: EmailStr  # ✅ Validación de formato de email
    password: str
```

**Comportamiento:**
- Email inválido → `422 Unprocessable Entity`
- Password < 6 caracteres → `422 Unprocessable Entity`
- Email ya existe (signup) → `409 Conflict`
- Credenciales inválidas (login) → `401 Unauthorized`

### Reviews (api-catalog)
```typescript
// routes/reviews.ts
if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
  return res.status(400).json({ 
    error: "Invalid rating", 
    details: "rating must be between 1 and 5" 
  });
}

if (text.length > 1000) {
  return res.status(400).json({ 
    error: "Text too long", 
    details: "text must be 1000 characters or less" 
  });
}
```

**Validaciones:**
- ✅ `rating`: Debe ser 1-5 (entero)
- ✅ `text`: Máximo 1000 caracteres
- ✅ `imdbID`: Requerido y no vacío

## ✅ Errores Consistentes

### Formato Estándar
Todos los endpoints ahora devuelven:
```json
{
  "error": "Descripción corta del error",
  "details": "Explicación detallada o contexto adicional"
}
```

### Códigos HTTP Correctos

#### 400 Bad Request
- Input inválido o faltante
- Ejemplos: rating fuera de rango, text demasiado largo, parámetros missing

#### 401 Unauthorized
- Token faltante, inválido o expirado
- Siempre incluye: `{ error: "Unauthorized", details: "Missing or invalid token" }`

#### 404 Not Found
- Recurso no encontrado
- Ejemplos: película no existe, item no está en lista

#### 409 Conflict
- Recurso ya existe
- Ejemplos: email ya registrado, película ya en lista

#### 422 Unprocessable Entity
- ❌ **Eliminado** (ahora usamos 400)
- Antes se usaba inconsistentemente

#### 500 Internal Server Error
- Errores no capturados del servidor
- Node/Python manejan automáticamente

#### 503 Service Unavailable
- Servicio degradado (DB/ES inaccesible)
- Healthchecks devuelven 503 si hay fallos

### Ejemplos de Respuestas

**Review con rating inválido:**
```bash
POST /api/reviews
{ "imdbID": "tt1234", "rating": 10, "text": "Great!" }

→ 400 Bad Request
{
  "error": "Invalid rating",
  "details": "rating must be between 1 and 5"
}
```

**Token expirado:**
```bash
GET /api/mylist/me
Authorization: Bearer <expired_token>

→ 401 Unauthorized
{
  "error": "Unauthorized",
  "details": "Missing or invalid token"
}
```

**Item ya en lista:**
```bash
POST /api/mylist
{ "imdbID": "tt1234" }

→ 409 Conflict
{
  "error": "Item already in your list",
  "details": "This movie is already saved"
}
```

## ✅ JWT Claro

### Configuración
Ver documentación completa en: [`docs/JWT.md`](./JWT.md)

**Resumen:**
- **Secret**: `JWT_SECRET=dev-secret-change-me`
  - ⚠️ Cambiar en producción
  - Mismo valor en api-users y api-catalog
  
- **Expiración**: 7 días (604,800 segundos)
  - Configurado en: `api-users/app/settings.py`
  - `JWT_EXPIRES_MIN = 60 * 24 * 7`

- **Algoritmo**: HS256 (HMAC SHA-256)

- **Payload**:
  ```json
  {
    "sub": "user_id",
    "email": "user@email.com",
    "iat": 1234567890,
    "exp": 1234567890
  }
  ```

- **Comportamiento al expirar**:
  1. Backend devuelve 401
  2. Frontend interceptor limpia localStorage
  3. Usuario debe hacer login nuevamente

## ✅ Healthchecks Completos

### Gateway (`http://localhost:8080/health`)
```json
{
  "status": "ok",
  "timestamp": "2026-01-10T18:30:00.000Z",
  "gateway": "ok",
  "apiUsers": "ok",
  "apiCatalog": "ok"
}
```

**Verifica:**
- ✅ Conectividad con api-users
- ✅ Conectividad con api-catalog
- 🔴 Devuelve 503 si algún servicio falla

### api-users (`http://localhost:5001/health`)
```json
{
  "status": "ok",
  "timestamp": "2026-01-10T18:30:00.000Z",
  "database": "ok"
}
```

**Verifica:**
- ✅ Conexión a PostgreSQL (consulta `SELECT 1`)
- 🔴 Devuelve 503 si DB falla

### api-catalog (`http://localhost:5000/health`)
```json
{
  "status": "ok",
  "timestamp": "2026-01-10T18:30:00.000Z",
  "mongo": "ok",
  "elasticsearch": "ok"
}
```

**Verifica:**
- ✅ Conexión a MongoDB (comando `ping`)
- ✅ Conexión a Elasticsearch (método `ping`)
- 🔴 Devuelve 503 si algún servicio falla

### Testing Healthchecks

```bash
# Gateway
curl http://localhost:8080/health

# API Users (directo - solo para debugging)
curl http://localhost:5001/health

# API Catalog (directo - solo para debugging)
curl http://localhost:5000/health
```

### Healthcheck Script
```bash
#!/bin/bash
# scripts/check-health.sh

echo "Checking Gateway..."
curl -s http://localhost:8080/health | jq .

echo "\nChecking API Users..."
curl -s http://localhost:5001/health | jq .

echo "\nChecking API Catalog..."
curl -s http://localhost:5000/health | jq .
```

## ✅ CORS/Proxy Cerrados

Ver documentación completa en: [`docs/CORS.md`](./CORS.md)

### Arquitectura Actual

```
Browser (localhost:3000)
    ↓ HTTP + CORS
Gateway (localhost:8080)
    ├─→ /api/users → api-users:5001
    ├─→ /api/movies → api-catalog:5000
    ├─→ /api/reviews → api-catalog:5000/reviews
    └─→ /api/mylist → api-catalog:5000/mylist
```

### Gateway Proxy Configuration

```typescript
// gateway/src/index.ts

// ✅ CORS habilitado en gateway
app.use(cors());

// ✅ Rutas proxy configuradas
app.use("/api/users", createProxyMiddleware({ 
  target: "http://api-users:5001",
  changeOrigin: true,
  pathRewrite: { "^/api/users": "" }
}));

app.use("/api/movies", createProxyMiddleware({ 
  target: "http://api-catalog:5000",
  changeOrigin: true,
  pathRewrite: { "^/api/movies": "" }
}));

app.use("/api/reviews", createProxyMiddleware({ 
  target: "http://api-catalog:5000/reviews",
  changeOrigin: true,
  pathRewrite: (path) => path.replace(/^\/api\/reviews/, "")
}));

app.use("/api/mylist", createProxyMiddleware({ 
  target: "http://api-catalog:5000/mylist",
  changeOrigin: true,
  pathRewrite: (path) => path.replace(/^\/api\/mylist/, "")
}));
```

### Verificación

✅ **Browser solo habla con Gateway:**
- Frontend: `axios.create({ baseURL: "" })`
- Todas las peticiones van a `http://localhost:8080/api/*`

✅ **Gateway enruta correctamente:**
- `/api/users/signup` → api-users:5001
- `/api/movies/search` → api-catalog:5000
- `/api/reviews` → api-catalog:5000/reviews
- `/api/mylist/me` → api-catalog:5000/mylist/me

⚠️ **Para Producción:**
- Restringir CORS a dominios específicos
- Bloquear puertos 5000, 5001 externamente
- Usar Docker networks internas

## Testing

### 1. Validación de Inputs
```bash
# Review con rating inválido (debe fallar con 400)
curl -X POST http://localhost:8080/api/reviews \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"imdbID":"tt1234","rating":10,"text":"test"}'

# Signup con password corto (debe fallar con 422)
curl -X POST http://localhost:8080/api/users/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"12345"}'
```

### 2. Formato de Errores
```bash
# Verificar que todos devuelven { error, details }
curl http://localhost:8080/api/movies/search
curl http://localhost:8080/api/reviews
curl -X POST http://localhost:8080/api/mylist
```

### 3. Healthchecks
```bash
# Todos deben devolver 200 y status: "ok"
curl -w "\n%{http_code}\n" http://localhost:8080/health
curl -w "\n%{http_code}\n" http://localhost:5001/health
curl -w "\n%{http_code}\n" http://localhost:5000/health
```

### 4. CORS/Proxy
```bash
# Desde el navegador, todas estas deben funcionar:
fetch('http://localhost:8080/api/users/health')
fetch('http://localhost:8080/api/movies/search?title=inception')
fetch('http://localhost:8080/health')
```

## Resumen de Mejoras Implementadas

| Área | Estado | Detalles |
|------|--------|----------|
| **Validación Inputs** | ✅ | Email, password (6+ chars), rating (1-5), text (max 1000) |
| **Errores Consistentes** | ✅ | Formato `{ error, details }` + códigos HTTP correctos |
| **JWT Documentado** | ✅ | Secret, expiración (7d), algoritmo HS256 |
| **Healthchecks** | ✅ | Gateway, api-users (PG), api-catalog (Mongo+ES) |
| **CORS/Proxy** | ✅ | Gateway centralizado, rutas configuradas correctamente |

## Próximos Pasos (Producción)

1. **Seguridad**
   - [ ] Cambiar JWT_SECRET a valor aleatorio fuerte
   - [ ] Restringir CORS a dominios específicos
   - [ ] Habilitar HTTPS/TLS
   - [ ] Rate limiting en endpoints de auth

2. **Infraestructura**
   - [ ] Docker networks privadas
   - [ ] Bloquear puertos internos (5000, 5001)
   - [ ] Monitoring y alertas en healthchecks
   - [ ] Logs centralizados

3. **Base de Datos**
   - [ ] Índices en MongoDB (userId, imdbID)
   - [ ] Backups automáticos
   - [ ] Connection pooling optimizado

4. **Frontend**
   - [ ] Refresh token para sesiones largas
   - [ ] Mejor manejo de errores de red
   - [ ] Retry automático en fallos transitorios
