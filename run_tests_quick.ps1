# Hızlı Test Çalıştırma - Python Yolu Belirtilmiş
# Kullanım: .\run_tests_quick.ps1

$pythonExe = "C:\Users\cavul\AppData\Local\Programs\Python\Python39\python.exe"

if (-not (Test-Path $pythonExe)) {
    Write-Host "❌ Python bulunamadı: $pythonExe" -ForegroundColor Red
    Write-Host "Lütfen Python yolunu güncelleyin." -ForegroundColor Yellow
    exit 1
}

Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "🧪 TEST ÇALIŞTIRMA BAŞLATILIYOR..." -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "🐍 Python: $pythonExe" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host ""

# Python scriptini çalıştır
& $pythonExe run_tests.py
exit $LASTEXITCODE




