# Script de verificación de servicios Docker (PowerShell)
# Uso: .\scripts\verify-services.ps1

Write-Host "🔍 Verificando servicios Filmly..." -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

$Total = 0
$Success = 0
$Fail = 0

# Función para verificar servicio
function Test-Service {
    param(
        [string]$Name,
        [string]$Url
    )
    
    $script:Total++
    Write-Host -NoNewline ("{0,-25}" -f $Name)
    
    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ OK" -ForegroundColor Green
            $script:Success++
        } else {
            Write-Host "❌ FAIL" -ForegroundColor Red
            $script:Fail++
        }
    } catch {
        Write-Host "❌ FAIL" -ForegroundColor Red
        $script:Fail++
    }
}

# Verificar servicios principales
Write-Host "📡 Healthchecks:"
Test-Service -Name "Gateway" -Url "http://localhost:8080/health"
Test-Service -Name "API Users" -Url "http://localhost:5001/health"
Test-Service -Name "API Catalog" -Url "http://localhost:5000/health"
Test-Service -Name "Elasticsearch" -Url "http://localhost:9200"
Write-Host ""

# Verificar frontend
Write-Host "🌐 Frontend:"
Test-Service -Name "React App" -Url "http://localhost:3000"
Write-Host ""

# Verificar contenedores
Write-Host "🐳 Contenedores Docker:"
try {
    $containers = docker ps --format "{{.Names}}" | Select-String "infra-"
    $count = ($containers | Measure-Object).Count
    Write-Host "Contenedores corriendo: $count"
    
    if ($count -ge 7) {
        Write-Host "✅ Todos los contenedores están corriendo" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Se esperaban 7+ contenedores" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ No se pudo verificar contenedores" -ForegroundColor Red
}
Write-Host ""

# Resumen
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "📊 Resumen:"
Write-Host "  Total verificados: $Total"
Write-Host "  Exitosos: $Success" -ForegroundColor Green
Write-Host "  Fallidos: $Fail" -ForegroundColor Red
Write-Host ""

if ($Fail -eq 0) {
    Write-Host "🎉 Todos los servicios están funcionando correctamente!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "⚠️  Algunos servicios no están disponibles" -ForegroundColor Yellow
    Write-Host "Verifica los logs con: docker compose -f infra/docker-compose.dev.yml logs"
    exit 1
}
