# Testing Guide

Este proyecto incluye tests unitarios y de integración para los principales servicios.

## Estructura de Tests

```
├── api-catalog/
│   └── src/__tests__/          # Tests de API de catálogo
│       ├── movies.test.ts
│       └── reviews.test.ts
├── api-users/
│   └── tests/                  # Tests de API de usuarios
│       └── test_auth.py
└── frontend/
    └── src/__tests__/          # Tests de componentes React
        ├── Navbar.test.tsx
        ├── ReviewForm.test.tsx
        └── api.test.ts
```

## Ejecutar Tests

### Todos los tests
```bash
make test
```

### Tests individuales por servicio

**API Catalog (Node.js/Jest)**
```bash
cd api-catalog
npm install
npm test
```

**API Users (Python/pytest)**
```bash
cd api-users
pip install -r requirements.txt
pytest
```

**Frontend (React/Vitest)**
```bash
cd frontend
npm install
npm test
```

## Cobertura de Tests

### API Catalog
- ✅ Validación de parámetros en búsqueda
- ✅ Respuesta de endpoints principales
- ✅ Fallback a OMDb cuando Elasticsearch no tiene resultados
- ✅ Validación de ratings (1-10)
- ✅ Autenticación en reviews

### API Users
- ✅ Health check del servidor
- ✅ Validación de campos en registro
- ✅ Validación de email
- ✅ Autenticación (login sin credenciales)
- ✅ Acceso a rutas protegidas sin token

### Frontend
- ✅ Renderizado de componentes principales
- ✅ Estados de autenticación en Navbar
- ✅ Formulario de reviews con validación
- ✅ Configuración de API service

## CI/CD

Los tests se pueden integrar en un pipeline de CI/CD:

```yaml
# Ejemplo para GitHub Actions
- name: Run tests
  run: |
    cd api-catalog && npm install && npm test
    cd ../api-users && pip install -r requirements.txt && pytest
    cd ../frontend && npm install && npm test
```

## Notas

- Los tests usan **mocks** para dependencias externas (MongoDB, Elasticsearch, OMDb API)
- No se requiere tener los servicios corriendo para ejecutar los tests
- Los tests están diseñados como **smoke tests** para validar funcionalidad básica
- Para tests de integración completos, considera usar Docker Compose con servicios de test

## Añadir Nuevos Tests

### API Catalog (TypeScript/Jest)
Crea archivos en `api-catalog/src/__tests__/*.test.ts`

### API Users (Python/pytest)
Crea archivos en `api-users/tests/test_*.py`

### Frontend (React/Vitest)
Crea archivos en `frontend/src/__tests__/*.test.tsx`
