# Testing - Guía Técnica

> **Nota**: Para instrucciones básicas de testing, ver [README.md](../README.md)

## Configuración de Testing

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
