# Basit PowerShell Test Scripti
# Python path sorunları için alternatif çözüm

param(
    [string]$TestDir = "app/test/unit",
    [switch]$NoCoverage
)

# Python'u bul
$pythonFound = $false
$pythonExe = $null

# 1. python komutunu dene
try {
    $test = python --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        $pythonExe = "python"
        $pythonFound = $true
    }
} catch {
    # Devam et
}

# 2. py launcher'ı dene
if (-not $pythonFound) {
    try {
        $test = py --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            $pythonExe = "py"
            $pythonFound = $true
        }
    } catch {
        # Devam et
    }
}

# 3. Python.exe'yi doğrudan ara
if (-not $pythonFound) {
    $searchPaths = @(
        "$env:LOCALAPPDATA\Programs\Python",
        "$env:ProgramFiles\Python*",
        "$env:ProgramFiles(x86)\Python*",
        "$env:USERPROFILE\AppData\Local\Programs\Python",
        "$env:USERPROFILE\anaconda3",
        "$env:USERPROFILE\miniconda3"
    )
    
    foreach ($path in $searchPaths) {
        $found = Get-ChildItem -Path $path -Filter "python.exe" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($found) {
            $pythonExe = $found.FullName
            $pythonFound = $true
            break
        }
    }
}

if (-not $pythonFound) {
    Write-Host "❌ Python bulunamadı!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Lütfen Python scriptini direkt çalıştırın:" -ForegroundColor Yellow
    Write-Host "  python run_tests.py" -ForegroundColor Cyan
    Write-Host "  veya" -ForegroundColor Yellow
    Write-Host "  py run_tests.py" -ForegroundColor Cyan
    exit 1
}

Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "🧪 TEST ÇALIŞTIRMA BAŞLATILIYOR..." -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "📁 Test Dizini: $TestDir" -ForegroundColor Cyan
Write-Host "🐍 Python: $pythonExe" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host ""

# Python scriptini çalıştır (daha güvenilir)
$scriptArgs = @("run_tests.py", "--test-dir", $TestDir)
if ($NoCoverage) {
    $scriptArgs += "--no-coverage"
}

& $pythonExe $scriptArgs
exit $LASTEXITCODE




