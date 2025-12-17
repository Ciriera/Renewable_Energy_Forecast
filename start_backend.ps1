# Backend (Flask API) Başlatma Scripti
# Bu script Flask uygulamasını başlatır

Write-Host "=================================================================================" -ForegroundColor Cyan
Write-Host "BACKEND (Flask API) BASLATILIYOR..." -ForegroundColor Cyan
Write-Host "=================================================================================" -ForegroundColor Cyan
Write-Host ""

# Port kontrolü
$port = $env:PORT
if (-not $port) {
    $port = 5000
    Write-Host "[INFO] Port belirtilmedi, varsayilan port kullaniliyor: $port" -ForegroundColor Yellow
} else {
    Write-Host "[INFO] Port: $port" -ForegroundColor Green
}

# Python kontrolü
$pythonCmd = $null
$pythonPaths = @(
    "C:\Users\cavul\AppData\Local\Programs\Python\Python39\python.exe",
    "$env:LOCALAPPDATA\Programs\Python\Python39\python.exe",
    "$env:LOCALAPPDATA\Programs\Python\Python310\python.exe",
    "$env:LOCALAPPDATA\Programs\Python\Python311\python.exe",
    "$env:LOCALAPPDATA\Programs\Python\Python312\python.exe"
)

foreach ($path in $pythonPaths) {
    if (Test-Path $path) {
        $pythonCmd = $path
        break
    }
}

if (-not $pythonCmd) {
    try {
        $pythonTest = python --version 2>&1
        if ($LASTEXITCODE -eq 0 -and $pythonTest -match "Python") {
            $cmd = Get-Command python -ErrorAction SilentlyContinue
            if ($cmd -and $cmd.Source -notlike "*WindowsApps*") {
                $pythonCmd = $cmd.Source
            }
        }
    } catch {
        # Python bulunamadı
    }
}

if (-not $pythonCmd) {
    Write-Host "[HATA] Python bulunamadi!" -ForegroundColor Red
    Write-Host "[INFO] Lutfen Python yolunu belirtin veya PATH'e ekleyin." -ForegroundColor Yellow
    exit 1
}

Write-Host "[OK] Python bulundu: $pythonCmd" -ForegroundColor Green
Write-Host ""

# Gerekli dosyaların varlığını kontrol et
if (-not (Test-Path "app.py")) {
    Write-Host "[HATA] app.py dosyasi bulunamadi!" -ForegroundColor Red
    Write-Host "[INFO] Lutfen proje ana dizininde calistirin." -ForegroundColor Yellow
    exit 1
}

if (-not (Test-Path "requirements.txt")) {
    Write-Host "[UYARI] requirements.txt dosyasi bulunamadi!" -ForegroundColor Yellow
    Write-Host "[INFO] Bagimliliklari kontrol edin." -ForegroundColor Yellow
}

Write-Host "[INFO] Flask uygulamasi baslatiliyor..." -ForegroundColor Cyan
Write-Host "[INFO] Erisim adresi: http://localhost:$port" -ForegroundColor Green
Write-Host "[INFO] API durum kontrolu: http://localhost:$port/api/status" -ForegroundColor Green
Write-Host ""
Write-Host "Durdurmak icin: Ctrl+C" -ForegroundColor Yellow
Write-Host ""

# Flask uygulamasını başlat
try {
    $env:PORT = $port
    & $pythonCmd app.py
} catch {
    Write-Host ""
    Write-Host "[HATA] Flask uygulamasi baslatilirken hata olustu: $_" -ForegroundColor Red
    exit 1
}


