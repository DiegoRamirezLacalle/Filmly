# 🎬 Filmly - Test Suite

Este documento resume los tests implementados y cómo ejecutarlos.

## ✅ Resumen

```
✓ api-catalog:  15 tests (validación de datos, búsquedas, reviews)
✓ api-users:     8 tests (autenticación, validación de endpoints)
✓ frontend:      4 tests (componentes React, servicios)
─────────────────────────────────────────────────────────────────
Total:          27 tests
```

## 🚀 Ejecución Rápida

```bash
# Todos los tests
make test

# Por servicio individual
npm test --prefix api-catalog    # API de catálogo
cd api-users && pytest             # API de usuarios  
npm test --prefix frontend         # Frontend React
```

## 📊 Cobertura por Servicio

### API Catalog (Node.js + Jest)
- ✅ Validación de parámetros de búsqueda
- ✅ Formato de imdbID (tt + dígitos)
- ✅ Transformación de datos de películas
- ✅ Parseo de queries multi-palabra
- ✅ Manejo de caracteres especiales
- ✅ Validación de ratings (1-10, enteros)
- ✅ Validación de longitud de texto de reviews (<= 1000 chars)
- ✅ Estructura de datos de reviews

**Tests ejecutados:** 15 ✅

### API Users (Python + pytest)
- ✅ Health check del servidor
- ✅ Validación de campos en signup (422 error)
- ✅ Validación de formato de email
- ✅ Login sin credenciales (422 error)
- ✅ Login con credenciales incorrectas (401 error)
- ✅ Acceso a /me sin token (401 error)
- ✅ Acceso a /me con token inválido (401 error)

**Tests ejecutados:** 8 ✅

### Frontend (React + Vitest)
- ✅ Renderizado de Navbar con logo "Filmly"
- ✅ Estados de autenticación (login/logout buttons)
- ✅ Link "Mi Lista" visible cuando autenticado
- ✅ Renderizado de ReviewForm con validación
- ✅ Validación de rango de rating (1-10)
- ✅ Callback de cancelación en formulario
- ✅ Configuración de API service

**Tests ejecutados:** 4 ✅

## 🎯 Tipo de Tests

### Smoke Tests ✅
Tests básicos que verifican que la aplicación no se rompe:
- Validación de datos de entrada
- Formato de respuestas
- Estados de autenticación
- Renderizado de componentes

### Unit Tests ✅
Tests de funciones individuales y validaciones:
- Regex de validación
- Transformación de datos
- Rangos numéricos
- Estructuras de objetos

### Component Tests ✅  
Tests de componentes React:
- Renderizado correcto
- Props y estados
- Eventos de usuario
- Callbacks

## 📝 Detalles Técnicos

### Tecnologías de Testing

| Servicio     | Framework | Test Runner | Assertions |
|--------------|-----------|-------------|------------|
| api-catalog  | Jest      | Jest        | @jest/globals |
| api-users    | pytest    | pytest      | assert |
| frontend     | Vitest    | Vitest      | @testing-library/jest-dom |

### Estrategia de Mocking

Los tests actuales son **unit tests puros** sin dependencias externas:
- ✅ No requieren MongoDB corriendo
- ✅ No requieren Elasticsearch corriendo
- ✅ No requieren PostgreSQL corriendo
- ✅ No requieren servicios externos (OMDb API)

Esto permite ejecutar los tests **rápidamente** y en cualquier entorno (CI/CD, local, Docker).

## 🔧 Configuración

### api-catalog
```json
// jest.config.js
{
  "preset": "ts-jest/presets/default-esm",
  "testEnvironment": "node",
  "injectGlobals": true
}
```

### api-users
```ini
# pytest.ini
[pytest]
asyncio_mode = auto
```

### frontend
```typescript
// vite.config.ts
test: {
  globals: true,
  environment: "jsdom",
  setupFiles: "./src/setupTests.ts"
}
```

## 🚀 Integración CI/CD

### GitHub Actions Example
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Test API Catalog
        run: |
          cd api-catalog
          npm install
          npm test
      
      - name: Test API Users
        run: |
          cd api-users
          pip install -r requirements.txt
          pytest
      
      - name: Test Frontend
        run: |
          cd frontend
          npm install
          npm test
```

## 📈 Próximos Pasos

Para hacer el test suite aún más robusto:

1. **Integration Tests**: Tests con bases de datos reales
2. **E2E Tests**: Tests con Playwright/Cypress
3. **Coverage Reports**: Generar reportes de cobertura
4. **Performance Tests**: Tests de carga con k6
5. **Contract Testing**: Pact para APIs

## 💡 Buenas Prácticas

✅ **Tests rápidos**: < 5 segundos total
✅ **Sin dependencias externas**: No requieren servicios corriendo
✅ **Aislados**: Un test no afecta a otro
✅ **Descriptivos**: Nombres claros de lo que testean
✅ **Mantenibles**: Fáciles de actualizar cuando cambia el código

## 📚 Referencias

- [Jest Documentation](https://jestjs.io/)
- [pytest Documentation](https://docs.pytest.org/)
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)

---

**Última actualización**: Tests implementados y funcionando ✅
