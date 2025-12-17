# PowerShell Test Çalıştırma Scripti - Düzeltilmiş Versiyon
# Python path sorunları için optimize edilmiş

param(
    [string]$TestDir = "app/test/unit",
    [switch]$NoCoverage,
    [switch]$Html,
    [switch]$Verbose,
    [string]$PythonPath = ""
)

# Renkli çıktı için fonksiyonlar
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Error { Write-Host $args -ForegroundColor Red }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }
function Write-Info { Write-Host $args -ForegroundColor Cyan }

# Python komutunu bul
$pythonCmd = $null
$pythonPath = $null

# Kullanıcı Python path belirtmişse onu kullan
if ($PythonPath -and (Test-Path $PythonPath)) {
    $pythonCmd = $PythonPath
    $pythonPath = $PythonPath
    Write-Info "✅ Belirtilen Python yolu kullanılıyor: $pythonPath"
} else {
    # Önce python komutunu dene
    try {
        $pythonTest = python --version 2>&1
        if ($LASTEXITCODE -eq 0 -or $pythonTest -match "Python") {
            $pythonCmd = "python"
            $cmd = Get-Command python -ErrorAction SilentlyContinue
            if ($cmd) {
                $pythonPath = $cmd.Source
            } else {
                $pythonPath = "python"
            }
        }
    } catch {
        # python komutu yok, devam et
    }
    
    # python yoksa py launcher'ı dene
    if (-not $pythonCmd) {
        try {
            $pyTest = py --version 2>&1
            if ($LASTEXITCODE -eq 0 -or $pyTest -match "Python") {
                $pythonCmd = "py"
                $pythonPath = "py"
            }
        } catch {
            # py launcher da yok
        }
    }
    
    # Hala bulunamadıysa bilinen yolları ara
    if (-not $pythonCmd) {
        $possiblePaths = @(
            "$env:LOCALAPPDATA\Programs\Python\Python39\python.exe",
            "$env:LOCALAPPDATA\Programs\Python\Python310\python.exe",
            "$env:LOCALAPPDATA\Programs\Python\Python311\python.exe",
            "$env:LOCALAPPDATA\Programs\Python\Python312\python.exe",
            "$env:ProgramFiles\Python39\python.exe",
            "$env:ProgramFiles\Python310\python.exe",
            "$env:ProgramFiles\Python311\python.exe",
            "$env:ProgramFiles\Python312\python.exe",
            "C:\Users\$env:USERNAME\AppData\Local\Programs\Python\Python39\python.exe",
            "C:\Users\$env:USERNAME\AppData\Local\Programs\Python\Python310\python.exe",
            "C:\Users\$env:USERNAME\AppData\Local\Programs\Python\Python311\python.exe",
            "C:\Users\$env:USERNAME\AppData\Local\Programs\Python\Python312\python.exe"
        )
        
        foreach ($path in $possiblePaths) {
            if (Test-Path $path) {
                $pythonPath = $path
                $pythonCmd = $path
                Write-Info "✅ Python bulundu: $pythonPath"
                break
            }
        }
    }
}

# Hala bulunamadıysa hata ver
if (-not $pythonCmd) {
    Write-Host "❌ Python bulunamadı!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Lütfen aşağıdakilerden birini yapın:" -ForegroundColor Yellow
    Write-Host "1. Python path'ini belirtin:" -ForegroundColor Yellow
    Write-Host "   .\run_tests_fixed.ps1 -PythonPath `"C:\Users\cavul\AppData\Local\Programs\Python\Python39\python.exe`"" -ForegroundColor Cyan
    Write-Host "2. Python scriptini direkt çalıştırın:" -ForegroundColor Yellow
    Write-Host "   `"C:\Users\cavul\AppData\Local\Programs\Python\Python39\python.exe`" run_tests.py" -ForegroundColor Cyan
    Write-Host "3. Python'u PATH'e ekleyin" -ForegroundColor Yellow
    exit 1
}

# Başlangıç
$separator = "=" * 80
Write-Host $separator -ForegroundColor Cyan
Write-Info "🧪 TEST ÇALIŞTIRMA BAŞLATILIYOR..."
Write-Host $separator -ForegroundColor Cyan
Write-Info "📁 Test Dizini: $TestDir"
Write-Info "🐍 Python: $pythonPath"
Write-Info "📊 Coverage: $(if ($NoCoverage) { 'Kapalı' } else { 'Açık' })"
Write-Info "⏰ Başlangıç Zamanı: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host $separator -ForegroundColor Cyan
Write-Host ""

$startTime = Get-Date

# Pytest komutunu oluştur
$pytestArgs = @(
    "-m", "pytest",
    $TestDir,
    "-v",
    "--tb=short",
    "--junit-xml=test-results.xml"
)

if (-not $NoCoverage) {
    $pytestArgs += @(
        "--cov=app",
        "--cov-report=html:htmlcov",
        "--cov-report=term-missing",
        "--cov-report=json:coverage.json"
    )
}

# Testleri çalıştır
try {
    Write-Info "🚀 Testler çalıştırılıyor..."
    Write-Host ""
    
    # Python komutunu çalıştır
    $result = & $pythonCmd -m pytest $pytestArgs 2>&1
    
    $endTime = Get-Date
    $executionTime = ($endTime - $startTime).TotalSeconds
    
    # Çıktıyı göster
    $result | ForEach-Object { 
        if ($_ -match "FAILED|ERROR") {
            Write-Host $_ -ForegroundColor Red
        } elseif ($_ -match "PASSED") {
            Write-Host $_ -ForegroundColor Green
        } elseif ($_ -match "SKIPPED") {
            Write-Host $_ -ForegroundColor Yellow
        } else {
            Write-Host $_
        }
    }
    
    # Sonuçları parse et
    $output = $result -join "`n"
    
    # Test sayılarını bul
    $passedMatch = [regex]::Match($output, "(\d+) passed")
    $failedMatch = [regex]::Match($output, "(\d+) failed")
    $errorMatch = [regex]::Match($output, "(\d+) error")
    $skippedMatch = [regex]::Match($output, "(\d+) skipped")
    
    $passed = if ($passedMatch.Success) { [int]$passedMatch.Groups[1].Value } else { 0 }
    $failed = if ($failedMatch.Success) { [int]$failedMatch.Groups[1].Value } else { 0 }
    $errors = if ($errorMatch.Success) { [int]$errorMatch.Groups[1].Value } else { 0 }
    $skipped = if ($skippedMatch.Success) { [int]$skippedMatch.Groups[1].Value } else { 0 }
    $total = $passed + $failed + $errors + $skipped
    
    # Coverage bilgisini bul
    $coverage = 0.0
    if (-not $NoCoverage) {
        $coverageMatch = [regex]::Match($output, "TOTAL\s+\d+\s+\d+\s+(\d+)%")
        if ($coverageMatch.Success) {
            $coverage = [double]$coverageMatch.Groups[1].Value
        }
    }
    
    # Rapor
    Write-Host ""
    Write-Host $separator -ForegroundColor Cyan
    Write-Info "📊 TEST RAPORU"
    Write-Host $separator -ForegroundColor Cyan
    Write-Host ""
    
    Write-Info "📈 GENEL İSTATİSTİKLER"
    $dashLine = "-" * 80
    Write-Host $dashLine
    Write-Host "✅ Toplam Test:     $total"
    
    if ($total -gt 0) {
        $successRate = ($passed / $total) * 100
        $failureRate = (($failed + $errors) / $total) * 100
        
        Write-Success "✅ Başarılı:        $passed ($([math]::Round($successRate, 2))%)"
        Write-Error "❌ Başarısız:       $failed ($([math]::Round($failureRate, 2))%)"
    } else {
        Write-Warning "⚠️  Test bulunamadı!"
    }
    
    Write-Warning "⚠️  Hatalar:         $errors"
    Write-Host "⏭️  Atlanan:         $skipped"
    Write-Host "⏱️  Süre:            $([math]::Round($executionTime, 2)) saniye"
    
    if (-not $NoCoverage) {
        Write-Host "📊 Coverage:        $([math]::Round($coverage, 2))%"
    }
    
    Write-Host ""
    
    # Başarısız testleri bul
    $failedTests = @()
    $failedPattern = "FAILED\s+(.+?)\s+::\s+(.+?)\s+::\s+(.+?)$"
    $matches = [regex]::Matches($output, $failedPattern, [System.Text.RegularExpressions.RegexOptions]::Multiline)
    foreach ($match in $matches) {
        $failedTests += @{
            File = $match.Groups[1].Value
            Class = $match.Groups[2].Value
            Method = $match.Groups[3].Value
        }
    }
    
    if ($failedTests.Count -gt 0) {
        Write-Error "❌ BAŞARISIZ TESTLER"
        Write-Host $dashLine
        for ($i = 0; $i -lt $failedTests.Count; $i++) {
            $test = $failedTests[$i]
            Write-Host "$($i + 1). $($test.File)::$($test.Method)" -ForegroundColor Red
        }
        Write-Host ""
    }
    
    # Sonuç
    Write-Host $separator -ForegroundColor Cyan
    if ($failed -eq 0 -and $errors -eq 0) {
        Write-Success "🎉 TÜM TESTLER BAŞARILI!"
        Write-Host $separator -ForegroundColor Cyan
        exit 0
    } else {
        Write-Error "⚠️  $($failed + $errors) TEST BAŞARISIZ!"
        Write-Host $separator -ForegroundColor Cyan
        exit 1
    }
    
} catch {
    Write-Error "❌ Test çalıştırma hatası: $_"
    Write-Host ""
    Write-Host "Hata detayları:" -ForegroundColor Yellow
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($Verbose) {
        Write-Host $_.ScriptStackTrace -ForegroundColor Gray
    }
    exit 1
}




