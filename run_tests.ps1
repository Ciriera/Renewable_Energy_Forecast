# PowerShell Test Çalıştırma Scripti
# Bu script tüm testleri çalıştırır ve detaylı rapor oluşturur

param(
    [string]$TestDir = "app/test/unit",
    [switch]$NoCoverage,
    [switch]$Html,
    [switch]$Pdf,
    [switch]$Verbose,
    [string]$PythonPath = ""
)

# Encoding ayarları - Türkçe karakter desteği için
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$PSDefaultParameterValues['*:Encoding'] = 'utf8'
chcp 65001 | Out-Null  # UTF-8 code page

# Renkli çıktı için fonksiyonlar - UTF-8 encoding ile
function Write-Success { 
    $text = $args -join ' '
    [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
    Write-Host $text -ForegroundColor Green
}
function Write-Error { 
    $text = $args -join ' '
    [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
    Write-Host $text -ForegroundColor Red
}
function Write-Warning { 
    $text = $args -join ' '
    [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
    Write-Host $text -ForegroundColor Yellow
}
function Write-Info { 
    $text = $args -join ' '
    [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
    Write-Host $text -ForegroundColor Cyan
}

# HTML raporu oluşturma fonksiyonu
function Generate-HtmlReport {
    param(
        [hashtable]$Statistics,
        [hashtable]$TestResults,
        [array]$CoverageData,
        [double]$CoveragePercentage,
        [hashtable]$TestFiles,
        [bool]$NoCoverage
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $successRate = if ($Statistics.Total -gt 0) { [math]::Round(($Statistics.Passed / $Statistics.Total) * 100, 2) } else { 0 }
    $failureRate = if ($Statistics.Total -gt 0) { [math]::Round(($Statistics.Failed / $Statistics.Total) * 100, 2) } else { 0 }
    
    # HTML escape fonksiyonu
    function Escape-Html {
        param([string]$text)
        return $text -replace '&', '&amp;' -replace '<', '&lt;' -replace '>', '&gt;' -replace '"', '&quot;' -replace "'", '&#39;'
    }
    
    # Test kategori açıklamaları
    $testCategories = @{
        "test_data_service" = "DataService - Veri yukleme, isleme ve model egitimi testleri"
        "test_data_viewmodel" = "DataViewModel - Veri formatlama ve API hazirlama testleri"
        "test_data_model" = "DataModel - Alternatif model katmani testleri"
        "test_data_utils" = "DataUtils - Yardimci fonksiyon testleri"
        "test_data_service_boundary" = "DataService - Sinir deger ve validasyon testleri"
        "test_data_viewmodel_boundary" = "DataViewModel - Sinir deger ve validasyon testleri"
    }
    
    $html = @"
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Raporu - $timestamp</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
            padding: 20px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
        }
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        .header p {
            font-size: 1.1em;
            opacity: 0.9;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        .stat-box {
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .stat-box.success {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .stat-box.failure {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
        }
        .stat-box.info {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            color: white;
        }
        .stat-box h3 {
            font-size: 1.2em;
            margin-bottom: 10px;
        }
        .stat-box .value {
            font-size: 2.5em;
            font-weight: bold;
            margin: 10px 0;
        }
        .section {
            margin: 40px 0;
        }
        .section-title {
            font-size: 1.8em;
            color: #667eea;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 3px solid #667eea;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            font-weight: 600;
        }
        tr:hover {
            background-color: #f5f5f5;
        }
        .failed {
            background-color: #fee;
        }
        .passed {
            background-color: #efe;
        }
        @media print {
            body {
                background: white;
                padding: 0;
            }
            .container {
                box-shadow: none;
                padding: 0;
            }
            .section {
                page-break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 Test Raporu</h1>
            <p>Oluşturulma Zamanı: $timestamp</p>
        </div>
        
        <div class="stats-grid">
            <div class="stat-box success">
                <h3>✅ Başarılı</h3>
                <div class="value">$($Statistics.Passed)</div>
                <p>$successRate%</p>
            </div>
            <div class="stat-box failure">
                <h3>❌ Başarısız</h3>
                <div class="value">$($Statistics.Failed)</div>
                <p>$failureRate%</p>
            </div>
            <div class="stat-box info">
                <h3>📊 Toplam</h3>
                <div class="value">$($Statistics.Total)</div>
                <p>Süre: $([math]::Round($Statistics.Duration, 2))s</p>
            </div>
        </div>
"@
    
    # Genel istatistikler detaylı
    $html += @"
        <div class="section">
            <h2 class="section-title">📊 Genel İstatistikler</h2>
            <table>
                <thead>
                    <tr>
                        <th>Metrik</th>
                        <th>Değer</th>
                        <th>Yüzde</th>
                    </tr>
                </thead>
                <tbody>
                    <tr class="passed">
                        <td><strong>✅ Başarılı Testler</strong></td>
                        <td>$($Statistics.Passed)</td>
                        <td>$successRate%</td>
                    </tr>
                    <tr class="failed">
                        <td><strong>❌ Başarısız Testler</strong></td>
                        <td>$($Statistics.Failed)</td>
                        <td>$failureRate%</td>
                    </tr>
                    <tr>
                        <td><strong>⚠️ Hatalar</strong></td>
                        <td>$($Statistics.Errors)</td>
                        <td>-</td>
                    </tr>
                    <tr>
                        <td><strong>⏭️ Atlanan Testler</strong></td>
                        <td>$($Statistics.Skipped)</td>
                        <td>-</td>
                    </tr>
                    <tr>
                        <td><strong>📊 Toplam Test</strong></td>
                        <td>$($Statistics.Total)</td>
                        <td>100%</td>
                    </tr>
                    <tr>
                        <td><strong>⏱️ Çalıştırma Süresi</strong></td>
                        <td>$([math]::Round($Statistics.Duration, 2)) saniye</td>
                        <td>-</td>
                    </tr>
"@
    if (-not $NoCoverage) {
        $html += @"
                    <tr>
                        <td><strong>📈 Coverage</strong></td>
                        <td>$([math]::Round($CoveragePercentage, 2))%</td>
                        <td>-</td>
                    </tr>
"@
    }
    $html += @"
                </tbody>
            </table>
        </div>
"@
    
    # Başarısız testler bölümü - dosya bazında gruplanmış
    if ($TestResults.FailedTests -and $TestResults.FailedTests.Count -gt 0) {
        $html += @"
        <div class="section">
            <h2 class="section-title">❌ Başarısız Testler Detaylı Listesi (Toplam: $($TestResults.FailedTests.Count) Hata)</h2>
"@
        
        # Dosya bazında grupla
        $failedByFile = @{}
        foreach ($test in $TestResults.FailedTests) {
            $fileName = $test.File
            if (-not $failedByFile.ContainsKey($fileName)) {
                $failedByFile[$fileName] = @()
            }
            $failedByFile[$fileName] += $test
        }
        
        $globalIndex = 1
        foreach ($file in ($failedByFile.Keys | Sort-Object)) {
            $fileTests = $failedByFile[$file]
            $html += @"
            <div style="margin: 20px 0; padding: 15px; background: #f9f9f9; border-radius: 5px;">
                <h3 style="color: #667eea; margin-bottom: 10px;">📁 Dosya: $(Escape-Html $file) ($($fileTests.Count) hata)</h3>
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Test Metodu</th>
                            <th>Test Açıklaması</th>
                            <th>Hata Tipi</th>
                        </tr>
                    </thead>
                    <tbody>
"@
            foreach ($test in $fileTests) {
                $methodName = $test.Method -replace "test_", "" -replace "_", " "
                $errorMsg = Escape-Html $test.Error
                if ($errorMsg.Length -gt 150) {
                    $errorMsg = $errorMsg.Substring(0, 147) + "..."
                }
                $html += @"
                        <tr class="failed">
                            <td>$globalIndex</td>
                            <td><strong>$(Escape-Html "$($test.Class)::$($test.Method)")</strong></td>
                            <td>$(Escape-Html $methodName)</td>
                            <td style="color: #d32f2f;">$errorMsg</td>
                        </tr>
"@
                $globalIndex++
            }
            $html += @"
                    </tbody>
                </table>
            </div>
"@
        }
        
        $html += @"
        </div>
"@
    }
    
    # Test dosyaları detaylı özeti
    if ($TestFiles -and $TestFiles.Count -gt 0) {
        $html += @"
        <div class="section">
            <h2 class="section-title">📁 Test Dosyaları Detaylı Özeti</h2>
"@
        
        foreach ($file in ($TestFiles.Keys | Sort-Object)) {
            $stats = $TestFiles[$file]
            $fileTotal = $stats.TotalPassed + $stats.TotalFailed + $stats.TotalErrors + $stats.TotalSkipped
            if ($fileTotal -eq 0) { continue }
            
            $fileSuccess = ($stats.TotalPassed / $fileTotal) * 100
            $statusIcon = if ($stats.TotalFailed -eq 0 -and $stats.TotalErrors -eq 0) { "✅" } else { "❌" }
            
            # Dosya kategorisi bul
            $fileCategory = ""
            foreach ($cat in $testCategories.Keys) {
                if ($file -like "*$cat*") {
                    $fileCategory = $testCategories[$cat]
                    break
                }
            }
            
            $html += @"
            <div style="margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
                <h3 style="color: #667eea; margin-bottom: 10px;">$statusIcon $(Escape-Html $file)</h3>
                <p style="color: #666; margin-bottom: 15px;">$(Escape-Html $fileCategory)</p>
                <p><strong>Toplam Test:</strong> $fileTotal | <strong>Başarılı:</strong> $($stats.TotalPassed) | <strong>Başarısız:</strong> $($stats.TotalFailed) | <strong>Hatalar:</strong> $($stats.TotalErrors) | <strong>Atlanan:</strong> $($stats.TotalSkipped) | <strong>Başarı Oranı:</strong> $([math]::Round($fileSuccess, 1))%</p>
                
"@
            
            # Başarılı testler (kategorilere göre)
            if ($stats.Passed.Count -gt 0) {
                $html += @"
                <details style="margin-top: 10px;">
                    <summary style="cursor: pointer; color: #4caf50; font-weight: bold;">✅ Başarılı Testler ($($stats.Passed.Count))</summary>
                    <ul style="margin-left: 20px; margin-top: 10px;">
"@
                # Test kategori belirleme (inline)
                $passedByCategory = @{}
                foreach ($test in $stats.Passed) {
                    $methodName = $test.Method
                    $category = "Genel"
                    if ($methodName -match "test_init|test_load|test_get_countries|test_get_country") { $category = "Bilgi Getirme" }
                    elseif ($methodName -match "test_train|test_predict|test_model") { $category = "Model Islemleri" }
                    elseif ($methodName -match "test_calculate|test_trend") { $category = "Hesaplama" }
                    elseif ($methodName -match "test_empty|test_invalid|test_error|test_negative") { $category = "Hata Yonetimi" }
                    elseif ($methodName -match "test_boundary|test_minimum|test_maximum") { $category = "Sinir Degerler" }
                    elseif ($methodName -match "test_format|test_save|test_load") { $category = "Veri Islemleri" }
                    
                    if (-not $passedByCategory.ContainsKey($category)) {
                        $passedByCategory[$category] = @()
                    }
                    $passedByCategory[$category] += $test
                }
                
                foreach ($category in ($passedByCategory.Keys | Sort-Object)) {
                    $html += @"
                        <li><strong>Kategori: $category</strong>
                            <ul>
"@
                    foreach ($test in $passedByCategory[$category]) {
                        $methodName = $test.Method -replace "test_", "" -replace "_", " "
                        $html += @"
                                <li style="color: #4caf50;">+ $(Escape-Html $methodName)</li>
"@
                    }
                    $html += @"
                            </ul>
                        </li>
"@
                }
                $html += @"
                    </ul>
                </details>
"@
            }
            
            # Başarısız testler
            if ($stats.Failed.Count -gt 0) {
                $html += @"
                <details style="margin-top: 10px;">
                    <summary style="cursor: pointer; color: #f44336; font-weight: bold;">❌ Başarısız Testler ($($stats.Failed.Count))</summary>
                    <ul style="margin-left: 20px; margin-top: 10px;">
"@
                foreach ($test in $stats.Failed) {
                    $methodName = $test.Method -replace "test_", "" -replace "_", " "
                    $errorMsg = if ($test.Error) { Escape-Html $test.Error } else { "Bilinmeyen hata" }
                    $html += @"
                        <li style="color: #f44336;">
                            <strong>- $(Escape-Html $methodName)</strong>
                            <br><span style="color: #ff9800; font-size: 0.9em;">Hata: $errorMsg</span>
                        </li>
"@
                }
                $html += @"
                    </ul>
                </details>
"@
            }
            
            $html += @"
            </div>
"@
        }
        
        $html += @"
        </div>
"@
    }
    
    # Coverage raporu
    if (-not $NoCoverage -and $CoverageData -and $CoverageData.Count -gt 0) {
        $html += @"
        <div class="section">
            <h2 class="section-title">📈 Kod Kapsamı (Coverage) Detaylı Raporu</h2>
            <div style="background: #f0f0f0; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                <h3 style="color: #667eea; margin-bottom: 10px;">📊 Genel Coverage: $([math]::Round($CoveragePercentage, 2))%</h3>
                <p style="margin: 5px 0;"><strong>Açıklama:</strong> Coverage, kod satırlarının kaç yüzdesinin testlerle kapsandığını gösterir.</p>
                <p style="margin: 5px 0;"><strong>Renk Kodlaması:</strong></p>
                <ul style="margin-left: 20px;">
                    <li style="color: #4caf50;">🟢 Yeşil (≥80%): İyi coverage - Testler yeterince kapsamlı</li>
                    <li style="color: #ff9800;">🟡 Sarı (50-79%): Orta coverage - Daha fazla test gerekli</li>
                    <li style="color: #f44336;">🔴 Kırmızı (<50%): Düşük coverage - Kritik testler eksik</li>
                </ul>
            </div>
"@
        
        # Coverage verilerini kategorilere göre grupla
        $coverageByCategory = @{}
        foreach ($item in $CoverageData) {
            $cat = $item.Category
            if (-not $coverageByCategory.ContainsKey($cat)) {
                $coverageByCategory[$cat] = @()
            }
            $coverageByCategory[$cat] += $item
        }
        
        foreach ($category in ($coverageByCategory.Keys | Sort-Object)) {
            $html += @"
            <h3 style="color: #667eea; margin-top: 20px;">📂 Kategori: $category</h3>
            <table>
                <thead>
                    <tr>
                        <th>Dosya</th>
                        <th>Satırlar</th>
                        <th>Kapsanan</th>
                        <th>Eksik</th>
                        <th>Coverage</th>
                    </tr>
                </thead>
                <tbody>
"@
            $categoryItems = $coverageByCategory[$category] | Sort-Object File
            foreach ($item in $categoryItems) {
                $fileDisplayName = $item.File.Replace("app\", "").Replace("\", "/")
                $coverColor = if ($item.Coverage -ge 80) { "#4caf50" } elseif ($item.Coverage -ge 50) { "#ff9800" } else { "#f44336" }
                $html += @"
                    <tr style="background-color: $(if ($item.Coverage -ge 80) { '#efe' } elseif ($item.Coverage -ge 50) { '#fff9e6' } else { '#fee' });">
                        <td>$(Escape-Html $fileDisplayName)</td>
                        <td>$($item.Statements)</td>
                        <td>$($item.Covered)</td>
                        <td>$($item.Missed)</td>
                        <td style="color: $coverColor; font-weight: bold;">$([math]::Round($item.Coverage, 1))%</td>
                    </tr>
"@
            }
            $html += @"
                </tbody>
            </table>
"@
        }
        
        $html += @"
        </div>
"@
    }
    
    $html += @"
    </div>
</body>
</html>
"@
    
    return $html
}

# Python komutunu bul
$pythonCmd = $null
$pythonPath = $null

# Kullanıcı Python path belirtmişse onu kullan
if ($PythonPath -and (Test-Path $PythonPath)) {
    $pythonCmd = $PythonPath
    $pythonPath = $PythonPath
    Write-Info "[OK] Belirtilen Python yolu kullaniliyor: $pythonPath"
} else {
    # Önce bilinen yolları ara (kullanıcının Python'u öncelikli)
    $possiblePaths = @(
        "C:\Users\cavul\AppData\Local\Programs\Python\Python39\python.exe",
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
            Write-Info "[OK] Python bulundu: $pythonPath"
            break
        }
    }
    
    # Hala bulunamadıysa python komutunu dene
    if (-not $pythonCmd) {
        try {
            $pythonTest = python --version 2>&1
            if ($LASTEXITCODE -eq 0 -and $pythonTest -match "Python") {
                $cmd = Get-Command python -ErrorAction SilentlyContinue
                if ($cmd -and $cmd.Source -notlike "*WindowsApps*") {
                    # Windows Store launcher değilse kullan
                    $pythonCmd = "python"
                    $pythonPath = $cmd.Source
                }
            }
        } catch {
            # python komutu yok, devam et
        }
    }
    
    # Hala bulunamadıysa genel arama yap
    if (-not $pythonCmd) {
        $possiblePaths = @(
            "C:\Users\cavul\AppData\Local\Programs\Python\Python39\python.exe",
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
                break
            }
        }
        
        # Hala bulunamadıysa genel arama yap
        if (-not $pythonCmd) {
            $searchPaths = @(
                "$env:LOCALAPPDATA\Programs\Python",
                "$env:ProgramFiles\Python*",
                "$env:ProgramFiles(x86)\Python*",
                "$env:USERPROFILE\AppData\Local\Programs\Python",
                "$env:USERPROFILE\anaconda3",
                "$env:USERPROFILE\miniconda3"
            )
            
            foreach ($basePath in $searchPaths) {
                if (Test-Path $basePath) {
                    $pythonExes = Get-ChildItem -Path $basePath -Filter "python.exe" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
                    if ($pythonExes) {
                        $pythonPath = $pythonExes.FullName
                        $pythonCmd = $pythonPath
                        break
                    }
                }
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
    Write-Host "   .\run_tests.ps1 -PythonPath `"C:\Users\cavul\AppData\Local\Programs\Python\Python39\python.exe`"" -ForegroundColor Cyan
    Write-Host "2. Python scriptini direkt çalıştırın:" -ForegroundColor Yellow
    Write-Host "   `"C:\Users\cavul\AppData\Local\Programs\Python\Python39\python.exe`" run_tests.py" -ForegroundColor Cyan
    Write-Host "3. Python'u PATH'e ekleyin" -ForegroundColor Yellow
    exit 1
}

# Başlangıç
$separator = "=" * 80
$dashLine = "-" * 80
Write-Host $separator -ForegroundColor Cyan
Write-Info "[TEST] TEST CALISTIRMA BASLATILIYOR..."
Write-Host $separator -ForegroundColor Cyan
Write-Info "[DIR] Test Dizini: $TestDir"
Write-Info "[PY] Python: $pythonPath"
Write-Info "[COV] Coverage: $(if ($NoCoverage) { 'Kapali' } else { 'Acik' })"
Write-Info "[TIME] Baslangic Zamani: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host $separator -ForegroundColor Cyan
Write-Host ""

$startTime = Get-Date

# Pytest komutunu oluştur
$pytestArgs = @(
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
    Write-Info "[RUN] Testler calistiriliyor..."
    Write-Host ""
    
    # Python komutunu çalıştır - UTF-8 encoding ile
    $env:PYTHONIOENCODING = "utf-8"
    $env:PYTHONUTF8 = "1"
    
    # PowerShell encoding ayarları
    $originalOutputEncoding = [Console]::OutputEncoding
    [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
    
    try {
        $result = & $pythonCmd -m pytest $pytestArgs 2>&1
    } finally {
        [Console]::OutputEncoding = $originalOutputEncoding
    }
    
    $endTime = Get-Date
    $executionTime = ($endTime - $startTime).TotalSeconds
    $pytestExitCode = $LASTEXITCODE
    
    # Çıktıyı parse et ve düzenli göster
    $output = $result -join "`n"
    $outputLines = $result
    
    # Pytest çıktısını daha düzenli göster
    $inFailures = $false
    $inCoverage = $false
    $inShortSummary = $false
    $currentFailure = $null
    $logCallCounter = 0
    $failureCounter = 0
    $script:shortSummaryGroups = $null
    
    Write-Host ""
    Write-Info "[TEST OUTPUT] TEST CALISTIRMA CIKTISI (DUZENLI FORMAT)"
    Write-Host $dashLine
    
    for ($i = 0; $i -lt $outputLines.Count; $i++) {
        $line = $outputLines[$i]
        
        # FAILURES bölümü başlangıcı
        if ($line -match "=+\s+FAILURES\s+=") {
            $inFailures = $true
            $failureCounter = 0
            Write-Host ""
            Write-Error "[FAILURES] BASARISIZ TESTLER DETAYLI LISTESI"
            Write-Host $dashLine
            continue
        }
        
        # Coverage bölümü
        if ($line -match "coverage: platform|Name\s+Stmts\s+Miss\s+Cover") {
            $inCoverage = $true
            $inFailures = $false
            $inShortSummary = $false
            if ($line -match "coverage: platform") {
                Write-Host ""
                Write-Info "[COVERAGE] KOD KAPSAMI DETAYLI RAPORU"
                Write-Host $dashLine
                Write-Host ""
                Write-Host "   ACIKLAMA:" -ForegroundColor Cyan
                Write-Host "   - Coverage: Kod satirlarinin kac yuzdesinin testlerle kapsandigini gosterir" -ForegroundColor Gray
                Write-Host "   - Missing Satirlar: Test edilmeyen kod satir numaralari" -ForegroundColor Gray
                Write-Host "   - Renk Kodlamasi:" -ForegroundColor Gray
                Write-Host "     * YESIL (>=80%): Iyi coverage - Testler yeterince kapsamli" -ForegroundColor Green
                Write-Host "     * SARI (50-79%): Orta coverage - Daha fazla test gerekli" -ForegroundColor Yellow
                Write-Host "     * KIRMIZI (<50%): Dusuk coverage - Kritik testler eksik" -ForegroundColor Red
                Write-Host ""
                Write-Host "   ORNEGIN:" -ForegroundColor Cyan
                Write-Host "   - %99 coverage demek: 100 satirdan 99'u test edilmis, 1 satir test edilmemis" -ForegroundColor Gray
                Write-Host "   - Missing: '23-24, 90-94' demek: 23-24 ve 90-94 satirlari test edilmemis" -ForegroundColor Gray
                Write-Host ""
                Write-Host $dashLine
                Write-Host ""
            }
            continue
        }
        
        # Short test summary başlangıcı
        if ($line -match "short test summary info") {
            $inShortSummary = $true
            $inFailures = $false
            $inCoverage = $false
            Write-Host ""
            Write-Info "[SUMMARY] KISA TEST OZETI (KATEGORIZE EDILMIS)"
            Write-Host $dashLine
            Write-Host ""
            continue
        }
        
        # FAILURES bölümü içinde - her hata için düzenli gösterim
        if ($inFailures) {
            # Yeni bir hata başlangıcı
            if ($line -match "^_{10,}\s+(.+?\.py)::(.+?)$") {
                if ($null -ne $currentFailure) {
                    Write-Host ""
                    Write-Host $dashLine
                    Write-Host ""
                }
                $failureCounter++
                $logCallCounter = 0
                $testName = $matches[1]
                $testMethod = $matches[2]
                Write-Host ""
                Write-Host "   HATA #$failureCounter" -ForegroundColor Red
                Write-Host "   " + ("=" * 76)
                Write-Host "   Test Dosyasi: $testName" -ForegroundColor Cyan
                Write-Host "   Test Metodu:  $testMethod" -ForegroundColor Cyan
                Write-Host ""
                $currentFailure = @{ 
                    Test = "$testName::$testMethod"
                    Lines = @()
                }
                $inLogCall = $false
                $currentLogCall = $null
                continue
            }
            
            # Hata mesajı (E ile başlayan satırlar)
            if ($line -match "^\s+E\s+(.+)$") {
                $errorMsg = $matches[1].Trim()
                if ($errorMsg -match "(AssertionError|Exception|ValueError|KeyError|TypeError):?\s*(.*)$") {
                    $errorType = $matches[1]
                    $errorDetail = $matches[2]
                    Write-Host "   Hata Tipi:    $errorType" -ForegroundColor Yellow
                    if ($errorDetail.Length -gt 0) {
                        $errorDetail = $errorDetail.Trim()
                        if ($errorDetail.Length -gt 100) {
                            $errorDetail = $errorDetail.Substring(0, 97) + "..."
                        }
                        Write-Host "   Hata Mesaji:  $errorDetail" -ForegroundColor Yellow
                    }
                } else {
                    Write-Host "   Hata Detayi:  $errorMsg" -ForegroundColor Yellow
                }
                continue
            }
            
            # Dosya:satır bilgisi
            if ($line -match "^\s+(.+?\.py):(\d+):\s+in\s+(.+)$") {
                $filePathInfo = $matches[1]
                $lineNumInfo = $matches[2]
                $funcNameInfo = $matches[3]
                Write-Host "   Konum:        ${filePathInfo}:${lineNumInfo} (fonksiyon: $funcNameInfo)" -ForegroundColor Gray
                continue
            }
            
            # "During handling" mesajı
            if ($line -match "During handling|Traceback \(most recent call last\)") {
                Write-Host "   Detay:        $($line.Trim())" -ForegroundColor Gray
                continue
            }
            
            # Captured log call başlangıcı
            if ($line -match "Captured log call|Captured stdout") {
                $logCallCounter++
                $inLogCall = $true
                $currentLogCall = @{ Number = $logCallCounter; Entries = @() }
                Write-Host ""
                Write-Host "   [LOG CALL #$logCallCounter]" -ForegroundColor Magenta
                Write-Host "   " + ("-" * 76)
                continue
            }
            
            # Log satırları (INFO, ERROR, WARNING, DEBUG) - daha esnek pattern
            if ($inLogCall -and $line -match "^\s*(INFO|ERROR|WARNING|DEBUG)\s+") {
                $logLevel = $matches[1]
                $logContent = $line.Trim()
                
                # Log formatı: INFO     app.module:file.py:line mesaj
                if ($logContent -match "^(INFO|ERROR|WARNING|DEBUG)\s+([^:]+):([^:]+):(\d+)\s+(.+)$") {
                    $moduleInfo = $matches[2].Trim()
                    $fileInfo = $matches[3].Trim()
                    $lineNumInfo = $matches[4]
                    $messageInfo = $matches[5].Trim()
                    
                    $color = switch ($logLevel) {
                        "ERROR" { "Red" }
                        "WARNING" { "Yellow" }
                        "INFO" { "Cyan" }
                        "DEBUG" { "Gray" }
                        default { "White" }
                    }
                    
                    Write-Host "      [$logLevel] $messageInfo" -ForegroundColor $color
                    Write-Host "              Konum: ${fileInfo}:${lineNumInfo}" -ForegroundColor DarkGray
                    
                    # Log call'a ekle
                    if ($null -ne $currentLogCall) {
                        $currentLogCall.Entries += @{
                            Level = $logLevel
                            Module = $moduleInfo
                            File = $fileInfo
                            Line = $lineNumInfo
                            Message = $messageInfo
                        }
                    }
                } else {
                    # Basit format
                    $logMsg = $logContent -replace "^\s*(INFO|ERROR|WARNING|DEBUG)\s+", ""
                    $color = switch ($logLevel) {
                        "ERROR" { "Red" }
                        "WARNING" { "Yellow" }
                        "INFO" { "Cyan" }
                        "DEBUG" { "Gray" }
                        default { "White" }
                    }
                    Write-Host "      [$logLevel] $logMsg" -ForegroundColor $color
                    
                    if ($null -ne $currentLogCall) {
                        $currentLogCall.Entries += @{
                            Level = $logLevel
                            Message = $logMsg
                        }
                    }
                }
                continue
            }
            
            # Log call içindeki diğer satırlar (traceback, devam satırları vs.)
            if ($inLogCall) {
                # Traceback ve dosya referansları
                if ($line -match "^\s+(Traceback|File |raise |ValueError|Exception|AssertionError|KeyError|TypeError)") {
                    $traceLine = $line.Trim()
                    Write-Host "      $traceLine" -ForegroundColor DarkGray
                    continue
                }
                
                # Boş satır log call'ı bitiriyor olabilir (eğer önceki satır log değilse)
                if ($line.Trim().Length -eq 0) {
                    # Bir sonraki satırı kontrol et
                    if ($i + 1 -lt $outputLines.Count) {
                        $nextLine = $outputLines[$i + 1]
                        # Eğer sonraki satır log değilse, log call bitti
                        if ($nextLine -notmatch "^\s*(INFO|ERROR|WARNING|DEBUG)\s+" -and $nextLine -notmatch "Captured log call") {
                            $inLogCall = $false
                            if ($null -ne $currentLogCall) {
                                $currentLogCall = $null
                            }
                        }
                    }
                    continue
                }
                
                # Log call içindeki devam eden satırlar (uzun mesajların devamı)
                if ($line -match "^\s+[^IEW]") {
                    # INFO, ERROR, WARNING ile başlamayan ama log call içindeki satırlar
                    $contLine = $line.Trim()
                    Write-Host "      ... $contLine" -ForegroundColor DarkGray
                    continue
                }
            }
            
            # Diğer hata detayları (dosya:satır formatında)
            if ($line -match "^\s+(app\\|File )") {
                Write-Host "   Konum:        $($line.Trim())" -ForegroundColor Gray
                continue
            }
            
            # Boş satır veya ayırıcı
            if ($line.Trim().Length -eq 0 -or $line -match "^-{10,}$") {
                if ($inLogCall -and $line.Trim().Length -eq 0) {
                    $inLogCall = $false
                    if ($null -ne $currentLogCall -and $currentLogCall.Entries.Count -eq 0) {
                        Write-Host "      (Log kaydi yok)" -ForegroundColor DarkGray
                    }
                }
                continue
            }
        }
        
        # Coverage bölümü içinde - düzenli tablo formatı
        if ($inCoverage) {
            # Header satırı
            if ($line -match "Name\s+Stmts\s+Miss\s+Cover") {
                Write-Host ("   {0,-45} {1,12} {2,12} {3,10} {4,30}" -f "Dosya Adi", "Toplam Satir", "Kapsanmayan", "Coverage", "Eksik Satir Numaralari") -ForegroundColor Cyan
                Write-Host "   " + ("-" * 115)
                continue
            }
            
            # Ayırıcı satır
            if ($line -match "^-{10,}$") {
                Write-Host "   " + ("-" * 115)
                continue
            }
            
            # TOTAL satırı
            if ($line -match "TOTAL\s+(\d+)\s+(\d+)\s+(\d+)%") {
                $totalStmts = $matches[1]
                $totalMiss = $matches[2]
                $totalCover = $matches[3]
                $totalCovered = [int]$totalStmts - [int]$totalMiss
                $coverColor = if ([int]$totalCover -ge 80) { "Green" } elseif ([int]$totalCover -ge 50) { "Yellow" } else { "Red" }
                $coverageBar = ""
                $barLength = 50
                $filledLength = [Math]::Round(($totalCover / 100) * $barLength)
                $coverageBar += "[" + ("=" * $filledLength) + (" " * ($barLength - $filledLength)) + "]"
                Write-Host ""
                Write-Host "   " + ("=" * 115) -ForegroundColor Cyan
                Write-Host ("   {0,-45} {1,12} {2,12} {3,10}%" -f "GENEL TOPLAM", $totalStmts, $totalMiss, $totalCover) -ForegroundColor $coverColor
                Write-Host ("   {0,-45} {1}" -f "Coverage Bar:", $coverageBar) -ForegroundColor $coverColor
                Write-Host ("   {0,-45} {1,12} satir test edildi, {2,12} satir test edilmedi" -f "Ozet:", $totalCovered, $totalMiss) -ForegroundColor Gray
                Write-Host "   " + ("=" * 115) -ForegroundColor Cyan
                Write-Host ""
                continue
            }
            
            # Coverage satırı parse et
            if ($line -match "^\s*(.+?)\s+(\d+)\s+(\d+)\s+(\d+)%\s*(.*)$") {
                $fileName = $matches[1].Trim()
                $stmts = [int]$matches[2]
                $miss = [int]$matches[3]
                $cover = [int]$matches[4]
                $missing = $matches[5].Trim()
                
                # Dosya adını kısalt
                $fileDisplay = $fileName.Replace("app\", "").Replace("\", "/")
                if ($fileDisplay.Length -gt 43) {
                    $fileDisplay = $fileDisplay.Substring(0, 40) + "..."
                }
                
                # Hesaplanan değerler
                $covered = $stmts - $miss
                
                # Missing satırları düzenle (çok uzunsa kısalt ve daha okunabilir yap)
                $missingDisplay = $missing
                if ($missingDisplay.Length -gt 0 -and $missingDisplay -ne "-") {
                    $missingParts = $missingDisplay.Split(',')
                    if ($missingParts.Count -gt 10) {
                        $missingDisplay = ($missingParts[0..9] -join ',') + "... (+$($missingParts.Count - 10) satir daha)"
                    }
                    # Çok uzun satır numarası listesi varsa kısalt
                    if ($missingDisplay.Length -gt 50) {
                        $missingDisplay = $missingDisplay.Substring(0, 47) + "..."
                    }
                    # Aralıkları açıklayıcı hale getir (örn: 23-24, 90-94 -> "23-24. satirlar, 90-94. satirlar")
                    $missingDisplay = $missingDisplay -replace "(\d+)-(\d+)", "`$1-`$2. satirlar"
                    $missingDisplay = $missingDisplay -replace ",(\d+)", ", `$1. satir"
                    if ($missingDisplay -match "^\d+$") {
                        $missingDisplay = "$missingDisplay. satir"
                    }
                } elseif ($missingDisplay -eq "-" -or $missingDisplay.Length -eq 0) {
                    $missingDisplay = "Hepsi test edilmis"
                }
                
                $coverColor = if ($cover -ge 80) { "Green" } elseif ($cover -ge 50) { "Yellow" } else { "Red" }
                
                # Coverage bar oluştur
                $barLength = 20
                $filledLength = [Math]::Round(($cover / 100) * $barLength)
                $coverageBar = "[" + ("=" * $filledLength) + (" " * ($barLength - $filledLength)) + "]"
                
                # Dosya satırını göster
                Write-Host ("   {0,-45} {1,12} {2,12} {3,9}% {4,-30}" -f $fileDisplay, $stmts, $miss, $cover, $coverageBar) -ForegroundColor $coverColor
                
                # Detaylı bilgi göster
                if ($miss -gt 0) {
                    Write-Host ("      -> {0,3} satir test edildi, {1,3} satir test edilmedi (%{2} eksik)" -f $covered, $miss, (100 - $cover)) -ForegroundColor Gray
                    if ($missingDisplay -ne "Hepsi test edilmis") {
                        Write-Host ("      -> Eksik satirlar: $missingDisplay" -f $missingDisplay) -ForegroundColor Yellow
                    }
                } else {
                    Write-Host ("      -> Tum {0} satir basariyla test edildi!" -f $stmts) -ForegroundColor Green
                }
                Write-Host ""
                continue
            }
            
            # Diğer coverage satırları (HTML/JSON yazıldı mesajları)
            if ($line -match "Coverage HTML|Coverage JSON|written to") {
                Write-Host "   $($line.Trim())" -ForegroundColor Gray
                continue
            }
        }
        
        # Short summary bölümü içinde - kategorize edilmiş FAILED'lar
        if ($inShortSummary) {
            # FAILED satırı parse et
            if ($line -match "FAILED\s+(.+?\.py)::(.+?)::(.+?)\s+-\s+(.+)$") {
                $failedFile = $matches[1]
                $failedClass = $matches[2]
                $failedMethod = $matches[3]
                $failedError = $matches[4]
                
                # Dosya bazında grupla
                if (-not $script:shortSummaryGroups) {
                    $script:shortSummaryGroups = @{}
                }
                if (-not $script:shortSummaryGroups.ContainsKey($failedFile)) {
                    $script:shortSummaryGroups[$failedFile] = @()
                }
                $script:shortSummaryGroups[$failedFile] += @{
                    Class = $failedClass
                    Method = $failedMethod
                    Error = $failedError
                }
                continue
            }
            
            # Summary sonu satırı
            if ($line -match "=+\s+\d+\s+failed") {
                # Gruplanmış hataları göster
                if ($script:shortSummaryGroups) {
                    $globalIndex = 1
                    foreach ($file in ($script:shortSummaryGroups.Keys | Sort-Object)) {
                        Write-Host ""
                        Write-Host "   DOSYA: $file ($($script:shortSummaryGroups[$file].Count) hata)" -ForegroundColor Cyan
                        Write-Host "   " + ("-" * 93)
                        foreach ($fail in $script:shortSummaryGroups[$file]) {
                            $methodDisplay = $fail.Method -replace "test_", "" -replace "_", " "
                            $errorDisplay = $fail.Error
                            if ($errorDisplay.Length -gt 85) {
                                $errorDisplay = $errorDisplay.Substring(0, 82) + "..."
                            }
                            Write-Host "   $globalIndex. $($fail.Class)::$($fail.Method)" -ForegroundColor Red
                            Write-Host "      Test: $methodDisplay" -ForegroundColor Yellow
                            Write-Host "      Hata: $errorDisplay" -ForegroundColor Yellow
                            Write-Host ""
                            $globalIndex++
                        }
                    }
                    $script:shortSummaryGroups = $null
                }
                continue
            }
        }
        
        # Normal test satırları (PASSED/FAILED/SKIPPED)
        if (-not $inFailures -and -not $inCoverage -and -not $inShortSummary) {
            if ($line -match "FAILED|ERROR") {
                Write-Host $line -ForegroundColor Red
            } elseif ($line -match "PASSED") {
                Write-Host $line -ForegroundColor Green
            } elseif ($line -match "SKIPPED") {
                Write-Host $line -ForegroundColor Yellow
            } elseif ($line -match "collected|test session starts|platform|plugins|asyncio") {
                Write-Host $line -ForegroundColor Cyan
            } else {
                Write-Host $line
            }
        }
    }
    
    Write-Host ""
    Write-Host $dashLine
    Write-Host ""
    
    # Tüm testleri detaylı şekilde parse et
    $allTests = @()
    # pytest verbose formatı: test_file.py::TestClass::test_method PASSED/FAILED
    $testPattern = "(.+?\.py)::(.+?)::(.+?)\s+(PASSED|FAILED|ERROR|SKIPPED)"
    $testMatches = [regex]::Matches($output, $testPattern, [System.Text.RegularExpressions.RegexOptions]::Multiline)
    foreach ($match in $testMatches) {
        $testFile = $match.Groups[1].Value
        $testClass = $match.Groups[2].Value
        $testMethod = $match.Groups[3].Value
        $testStatus = $match.Groups[4].Value
        
        # Duplicate kontrolü
        $exists = $allTests | Where-Object { 
            $_.File -eq $testFile -and $_.Class -eq $testClass -and $_.Method -eq $testMethod 
        }
        if (-not $exists) {
            $allTests += @{
                File = $testFile
                Class = $testClass
                Method = $testMethod
                Status = $testStatus
            }
        }
    }
    
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
    
    # Coverage bilgisini bul ve parse et
    $coverage = 0.0
    $coverageData = @()
    if (-not $NoCoverage) {
        # Toplam coverage bul
        $coverageMatch = [regex]::Match($output, "TOTAL\s+\d+\s+\d+\s+(\d+)%")
        if ($coverageMatch.Success) {
            $coverage = [double]$coverageMatch.Groups[1].Value
        }
        
        # Coverage tablosunu parse et
        $coverageStart = $output.IndexOf("Name")
        if ($coverageStart -ge 0) {
            $coverageSection = $output.Substring($coverageStart)
            $coverageEnd = $coverageSection.IndexOf("---")
            if ($coverageEnd -ge 0) {
                $coverageTable = $coverageSection.Substring(0, $coverageEnd)
                $tableStart = $coverageTable.IndexOf("`n") + 1
                $tableLines = $coverageTable.Substring($tableStart).Split("`n", [System.StringSplitOptions]::RemoveEmptyEntries)
                
                # Her dosya için coverage bilgisini parse et
                foreach ($line in $tableLines) {
                    if ($line -match "^app\\") {
                        # Format: app\module.py   233    233     0%   1-623
                        $fileMatch = [regex]::Match($line, "^([^\s]+)\s+(\d+)\s+(\d+)\s+(\d+)%")
                        if ($fileMatch.Success) {
                            $fileName = $fileMatch.Groups[1].Value
                            $statements = [int]$fileMatch.Groups[2].Value
                            $missed = [int]$fileMatch.Groups[3].Value
                            $coveragePercent = [double]$fileMatch.Groups[4].Value
                            
                            # Dosya kategorisini belirle
                            $category = "Diger"
                            if ($fileName -like "*test*") {
                                $category = "Test Dosyalari"
                            } elseif ($fileName -like "*data_service*") {
                                $category = "Data Service"
                            } elseif ($fileName -like "*data_viewmodel*" -or $fileName -like "*viewmodel*") {
                                $category = "ViewModel"
                            } elseif ($fileName -like "*data_model*" -or $fileName -like "*models*") {
                                $category = "Model"
                            } elseif ($fileName -like "*utils*") {
                                $category = "Utils"
                            } elseif ($fileName -like "*views*" -or $fileName -like "*static*") {
                                $category = "Views/Static"
                            }
                            
                            $coverageData += @{
                                File = $fileName
                                Statements = $statements
                                Missed = $missed
                                Covered = $statements - $missed
                                Coverage = $coveragePercent
                                Category = $category
                            }
                        }
                    } elseif ($line -match "^TOTAL") {
                        # TOTAL satırını atla, zaten parse edildi
                        break
                    }
                }
            }
        }
    }
    
    # Rapor
    Write-Host ""
    Write-Host $separator -ForegroundColor Cyan
    Write-Info "[REPORT] TEST RAPORU"
    Write-Host $separator -ForegroundColor Cyan
    Write-Host ""
    
    Write-Info "[STATS] GENEL ISTATISTIKLER"
    $dashLine = "-" * 80
    Write-Host $dashLine
    Write-Host "[TOTAL] Toplam Test:     $total"
    
    if ($total -gt 0) {
        $successRate = ($passed / $total) * 100
        $failureRate = (($failed + $errors) / $total) * 100
        
        Write-Success "[PASS] Basarili:        $passed ($([math]::Round($successRate, 2))%)"
        Write-Error "[FAIL] Basarisiz:       $failed ($([math]::Round($failureRate, 2))%)"
    } else {
        Write-Warning "[WARN] Test bulunamadi!"
    }
    
    Write-Warning "[ERR] Hatalar:         $errors"
    Write-Host "[SKIP] Atlanan:         $skipped"
    Write-Host "[TIME] Sure:            $([math]::Round($executionTime, 2)) saniye"
    
    if (-not $NoCoverage) {
        Write-Host "[COV] Coverage:        $([math]::Round($coverage, 2))%"
    }
    
    Write-Host ""
    
    # Başarısız testleri ve hata mesajlarını bul - ÖNCE BAŞARISIZ TESTLERİ GÖSTER
    $failedTests = @()
    $failedPattern = "FAILED\s+(.+?)\s+::\s+(.+?)\s+::\s+(.+?)$"
    $failedMatches = [regex]::Matches($output, $failedPattern, [System.Text.RegularExpressions.RegexOptions]::Multiline)
    foreach ($match in $failedMatches) {
        $testFile = $match.Groups[1].Value
        $testClass = $match.Groups[2].Value
        $testMethod = $match.Groups[3].Value
        
        # Hata mesajını bul (FAILED satırından sonraki ilk satırları al)
        $errorMessage = ""
        $failureStart = $output.IndexOf("FAILED $testFile::$testClass::$testMethod")
        if ($failureStart -ge 0) {
            $failureSection = $output.Substring($failureStart)
            $lines = $failureSection.Split("`n")
            for ($i = 0; $i -lt [Math]::Min(5, $lines.Length); $i++) {
                if ($lines[$i] -match "AssertionError|Exception|Error|ValueError|KeyError") {
                    $errorMessage = $lines[$i].Trim()
                    if ($errorMessage.Length -gt 100) {
                        $errorMessage = $errorMessage.Substring(0, 97) + "..."
                    }
                    break
                }
            }
        }
        
        $failedTests += @{
            File = $testFile
            Class = $testClass
            Method = $testMethod
            Error = $errorMessage
        }
    }
    
    # Test dosyalarını gruplandır ve detaylı parse et
    $testFiles = @{}
    foreach ($test in $allTests) {
        $fileName = $test.File
        if (-not $testFiles.ContainsKey($fileName)) {
            $testFiles[$fileName] = @{
                Passed = @()
                Failed = @()
                Errors = @()
                Skipped = @()
                TotalPassed = 0
                TotalFailed = 0
                TotalErrors = 0
                TotalSkipped = 0
            }
        }
        
        $testInfo = @{
            Class = $test.Class
            Method = $test.Method
            Status = $test.Status
            Progress = $test.Progress
        }
        
        switch ($test.Status) {
            "PASSED" { 
                $testFiles[$fileName].Passed += $testInfo
                $testFiles[$fileName].TotalPassed++
            }
            "FAILED" { 
                $testInfo.Error = ($failedTests | Where-Object { $_.File -eq $fileName -and $_.Method -eq $test.Method }).Error
                $testFiles[$fileName].Failed += $testInfo
                $testFiles[$fileName].TotalFailed++
            }
            "ERROR" { 
                $testInfo.Error = ($failedTests | Where-Object { $_.File -eq $fileName -and $_.Method -eq $test.Method }).Error
                $testFiles[$fileName].Errors += $testInfo
                $testFiles[$fileName].TotalErrors++
            }
            "SKIPPED" { 
                $testFiles[$fileName].Skipped += $testInfo
                $testFiles[$fileName].TotalSkipped++
            }
        }
    }
    
    # Başarısız testler özeti - TÜM HATALAR (ÖNCE GÖSTER)
    if ($failedTests.Count -gt 0) {
        Write-Error "[FAIL] BASARISIZ TESTLER DETAYLI LISTESI (TOPLAM: $($failedTests.Count) HATA)"
        Write-Host $dashLine
        Write-Host ""
        Write-Host "   TOPLAM $($failedTests.Count) ADET BASARISIZ TEST TESPIT EDILDI" -ForegroundColor Red
        Write-Host ""
        
        # Başarısız testleri dosya bazında grupla
        $failedByFile = @{}
        foreach ($test in $failedTests) {
            $fileName = $test.File
            if (-not $failedByFile.ContainsKey($fileName)) {
                $failedByFile[$fileName] = @()
            }
            $failedByFile[$fileName] += $test
        }
        
        $globalIndex = 1
        foreach ($file in ($failedByFile.Keys | Sort-Object)) {
            $fileTests = $failedByFile[$file]
            Write-Host "   DOSYA: $file ($($fileTests.Count) hata)" -ForegroundColor Cyan
            Write-Host "   " + ("-" * 76)
            
            foreach ($test in $fileTests) {
                $methodName = $test.Method -replace "test_", "" -replace "_", " "
                Write-Host "   $globalIndex. $($test.Class)::$($test.Method)" -ForegroundColor Red
                Write-Host "      Test Aciklamasi: $methodName" -ForegroundColor Yellow
                if ($test.Error) {
                    $errorDisplay = $test.Error
                    if ($errorDisplay.Length -gt 120) {
                        $errorDisplay = $errorDisplay.Substring(0, 117) + "..."
                    }
                    Write-Host "      Hata Tipi: $errorDisplay" -ForegroundColor Yellow
                }
                Write-Host ""
                $globalIndex++
            }
        }
        
        Write-Host $dashLine
        Write-Host ""
    }
    
    # Test kategorilerine göre açıklamalar
    $testCategories = @{
        "test_data_service" = "DataService - Veri yukleme, isleme ve model egitimi testleri"
        "test_data_viewmodel" = "DataViewModel - Veri formatlama ve API hazirlama testleri"
        "test_data_model" = "DataModel - Alternatif model katmani testleri"
        "test_data_utils" = "DataUtils - Yardimci fonksiyon testleri"
        "test_data_service_boundary" = "DataService - Sinir deger ve validasyon testleri"
        "test_data_viewmodel_boundary" = "DataViewModel - Sinir deger ve validasyon testleri"
    }
    
    # Test metod isimlerinden kategori çıkar
    function Get-TestCategory {
        param($methodName)
        if ($methodName -match "test_init|test_load|test_get_countries|test_get_country") { return "Bilgi Getirme" }
        if ($methodName -match "test_train|test_predict|test_model") { return "Model Islemleri" }
        if ($methodName -match "test_calculate|test_trend") { return "Hesaplama" }
        if ($methodName -match "test_empty|test_invalid|test_error|test_negative") { return "Hata Yonetimi" }
        if ($methodName -match "test_boundary|test_minimum|test_maximum") { return "Sinir Degerler" }
        if ($methodName -match "test_format|test_save|test_load") { return "Veri Islemleri" }
        return "Genel"
    }
    
    if ($testFiles.Count -gt 0) {
        Write-Info "[FILES] TEST DOSYALARI DETAYLI OZETI"
        Write-Host $dashLine
        Write-Host ""
        
        foreach ($file in ($testFiles.Keys | Sort-Object)) {
            $stats = $testFiles[$file]
            $fileTotal = $stats.TotalPassed + $stats.TotalFailed + $stats.TotalErrors + $stats.TotalSkipped
            if ($fileTotal -eq 0) { continue }
            
            $fileSuccess = ($stats.TotalPassed / $fileTotal) * 100
            $statusIcon = if ($stats.TotalFailed -eq 0 -and $stats.TotalErrors -eq 0) { "[OK]" } else { "[FAIL]" }
            
            # Dosya adından kategori bul
            $fileCategory = ""
            foreach ($cat in $testCategories.Keys) {
                if ($file -like "*$cat*") {
                    $fileCategory = $testCategories[$cat]
                    break
                }
            }
            
            Write-Host "$statusIcon DOSYA: $file" -ForegroundColor $(if ($stats.TotalFailed -eq 0 -and $stats.TotalErrors -eq 0) { "Green" } else { "Red" })
            if ($fileCategory) {
                Write-Host "   Aciklama: $fileCategory" -ForegroundColor Gray
            }
            Write-Host "   Toplam Test: $fileTotal | Basarili: $($stats.TotalPassed) | Basarisiz: $($stats.TotalFailed) | Hatalar: $($stats.TotalErrors) | Atlanan: $($stats.TotalSkipped) | Basari Orani: $([math]::Round($fileSuccess, 1))%"
            Write-Host ""
            
            # Başarılı testleri kategorilere göre grupla
            if ($stats.Passed.Count -gt 0) {
                Write-Host "   [PASS] BASARILI TESTLER ($($stats.Passed.Count)):" -ForegroundColor Green
                $passedByCategory = @{}
                foreach ($test in $stats.Passed) {
                    $category = Get-TestCategory $test.Method
                    if (-not $passedByCategory.ContainsKey($category)) {
                        $passedByCategory[$category] = @()
                    }
                    $passedByCategory[$category] += $test
                }
                
                foreach ($category in ($passedByCategory.Keys | Sort-Object)) {
                    Write-Host "      Kategori: $category" -ForegroundColor Cyan
                    foreach ($test in $passedByCategory[$category]) {
                        $methodName = $test.Method -replace "test_", "" -replace "_", " "
                        Write-Host "         + $methodName" -ForegroundColor Green
                    }
                }
                Write-Host ""
            }
            
            # Başarısız testleri göster
            if ($stats.Failed.Count -gt 0) {
                Write-Host "   [FAIL] BASARISIZ TESTLER ($($stats.Failed.Count)):" -ForegroundColor Red
                foreach ($test in $stats.Failed) {
                    $methodName = $test.Method -replace "test_", "" -replace "_", " "
                    Write-Host "      - $methodName" -ForegroundColor Red
                    if ($test.Error) {
                        Write-Host "        Hata: $($test.Error)" -ForegroundColor Yellow
                    }
                }
                Write-Host ""
            }
            
            # Hata testleri
            if ($stats.Errors.Count -gt 0) {
                Write-Host "   [ERROR] HATA TESTLERI ($($stats.Errors.Count)):" -ForegroundColor Magenta
                foreach ($test in $stats.Errors) {
                    $methodName = $test.Method -replace "test_", "" -replace "_", " "
                    Write-Host "      ! $methodName" -ForegroundColor Magenta
                    if ($test.Error) {
                        Write-Host "        Hata: $($test.Error)" -ForegroundColor Yellow
                    }
                }
                Write-Host ""
            }
            
            Write-Host $dashLine
            Write-Host ""
        }
    }
    
    # Coverage raporu detaylı gösterimi
    if (-not $NoCoverage -and $coverageData.Count -gt 0) {
        Write-Info "[COVERAGE] KOD KAPSAMI DETAYLI RAPORU"
        Write-Host $dashLine
        Write-Host ""
        
        # Toplam coverage göster
        $coverageColor = "Green"
        if ($coverage -lt 50) {
            $coverageColor = "Red"
        } elseif ($coverage -lt 80) {
            $coverageColor = "Yellow"
        }
        
        Write-Host "   GENEL COVERAGE: $([math]::Round($coverage, 1))%" -ForegroundColor $coverageColor
        Write-Host ""
        
        # Coverage verilerini kategorilere göre grupla
        $coverageByCategory = @{}
        foreach ($item in $coverageData) {
            $cat = $item.Category
            if (-not $coverageByCategory.ContainsKey($cat)) {
                $coverageByCategory[$cat] = @()
            }
            $coverageByCategory[$cat] += $item
        }
        
        # Her kategori için coverage göster
        foreach ($category in ($coverageByCategory.Keys | Sort-Object)) {
            Write-Host "   KATEGORI: $category" -ForegroundColor Cyan
            Write-Host "   " + ("-" * 76)
            
            $categoryItems = $coverageByCategory[$category] | Sort-Object File
            
            # Tablo başlığı
            Write-Host ("   {0,-45} {1,8} {2,8} {3,8} {4,6}" -f "Dosya", "Satirlar", "Kapsanan", "Eksik", "Coverage")
            Write-Host "   " + ("-" * 76)
            
            # Her dosya için satır göster
            foreach ($item in $categoryItems) {
                $fileDisplayName = $item.File.Replace("app\", "").Replace("\", "/")
                if ($fileDisplayName.Length -gt 43) {
                    $fileDisplayName = $fileDisplayName.Substring(0, 40) + "..."
                }
                
                # Coverage rengi belirle
                $itemColor = "Green"
                if ($item.Coverage -lt 50) {
                    $itemColor = "Red"
                } elseif ($item.Coverage -lt 80) {
                    $itemColor = "Yellow"
                }
                
                # İyileştirme önerisi için renk belirle
                $coverageIcon = "[OK]"
                if ($item.Coverage -lt 50) {
                    $coverageIcon = "[DUSUK]"
                } elseif ($item.Coverage -lt 80) {
                    $coverageIcon = "[ORTA]"
                }
                
                Write-Host ("   {0,-45} {1,8} {2,8} {3,8} {4,5}% {5}" -f `
                    $fileDisplayName, `
                    $item.Statements, `
                    $item.Covered, `
                    $item.Missed, `
                    [math]::Round($item.Coverage, 1), `
                    $coverageIcon) -ForegroundColor $itemColor
            }
            
            # Kategori özeti
            $categoryStats = $coverageByCategory[$category]
            $catTotalStmts = ($categoryStats | Measure-Object -Property Statements -Sum).Sum
            $catTotalMissed = ($categoryStats | Measure-Object -Property Missed -Sum).Sum
            $catTotalCovered = $catTotalStmts - $catTotalMissed
            $catCoverage = if ($catTotalStmts -gt 0) { ($catTotalCovered / $catTotalStmts) * 100 } else { 0 }
            
            $catColor = "Green"
            if ($catCoverage -lt 50) {
                $catColor = "Red"
            } elseif ($catCoverage -lt 80) {
                $catColor = "Yellow"
            }
            
            Write-Host "   " + ("-" * 76)
            Write-Host ("   {0,-45} {1,8} {2,8} {3,8} {4,5}%" -f `
                "KATEGORI TOPLAM:", `
                $catTotalStmts, `
                $catTotalCovered, `
                $catTotalMissed, `
                [math]::Round($catCoverage, 1)) -ForegroundColor $catColor
            Write-Host ""
        }
        
        Write-Host $dashLine
        Write-Host ""
        
        # Coverage önerileri
        $lowCoverage = $coverageData | Where-Object { $_.Coverage -lt 50 -and $_.Statements -gt 50 -and $_.File -notlike "*test*" }
        if ($lowCoverage.Count -gt 0) {
            Write-Warning "[ONERI] Dusuk coverage'a sahip dosyalar (>50 satir):"
            foreach ($item in $lowCoverage) {
                $fileDisplayName = $item.File.Replace("app\", "").Replace("\", "/")
                if ($fileDisplayName.Length -gt 50) {
                    $fileDisplayName = $fileDisplayName.Substring(0, 47) + "..."
                }
                Write-Host "   - $fileDisplayName : $([math]::Round($item.Coverage, 1))% (Eksik: $($item.Missed) satir)" -ForegroundColor Yellow
            }
            Write-Host ""
        }
    }
    
    # HTML/PDF Export
    if ($Html -or $Pdf) {
        Write-Host ""
        Write-Host $separator -ForegroundColor Cyan
        Write-Info "[EXPORT] HTML/PDF RAPORU OLUSTURULUYOR..."
        Write-Host $separator -ForegroundColor Cyan
        Write-Host ""
        
        # Test sonuçlarını topla
        $testStatistics = @{
            Total = $total
            Passed = $passed
            Failed = $failed
            Errors = $errors
            Skipped = $skipped
            Duration = $executionTime
        }
        
        $testResults = @{
            FailedTests = $failedTests
            AllTests = $allTests
            CoverageData = $coverageData
        }
        
        # HTML export
        if ($Html -or $Pdf) {
            # HTML içeriğini oluştur
            $currentDir = Get-Location
            $htmlFile = Join-Path $currentDir "test-report.html"
            $htmlContent = Generate-HtmlReport -Statistics $testStatistics -TestResults $testResults -CoverageData $coverageData -CoveragePercentage $coverage -TestFiles $testFiles -NoCoverage $NoCoverage
            
            try {
                # UTF-8 BOM ile yaz (Türkçe karakterler için)
                $utf8NoBom = New-Object System.Text.UTF8Encoding $false
                [System.IO.File]::WriteAllText($htmlFile, $htmlContent, $utf8NoBom)
                
                # Dosyanın tam olarak yazıldığından emin ol
                Start-Sleep -Milliseconds 500
                
                Write-Success "[OK] HTML raporu olusturuldu: $htmlFile"
                Write-Host "   Tam yol: $((Resolve-Path $htmlFile).Path)" -ForegroundColor Gray
                Write-Host "   Dosya boyutu: $((Get-Item $htmlFile).Length) byte" -ForegroundColor Gray
            } catch {
                Write-Error "[HATA] HTML raporu olusturulurken hata: $_"
            }
        }
        
        # PDF export - HTML'den SONRA oluştur
        if ($Pdf) {
            # HTML'in tamamen yazıldığından emin ol
            Start-Sleep -Seconds 1
            
            # Tam yol ile kayıt yeri belirle
            $currentDir = Get-Location
            $pdfFile = Join-Path $currentDir "test-report.pdf"
            $htmlFile = Join-Path $currentDir "test-report.html"
            
            Write-Info "[INFO] PDF kayit yeri: $pdfFile"
            
            # HTML dosyasının var olduğunu ve boş olmadığını kontrol et
            if (Test-Path $htmlFile) {
                $htmlFileInfo = Get-Item $htmlFile
                if ($htmlFileInfo.Length -gt 0) {
                    Write-Info "[INFO] HTML dosyasi bulundu: $($htmlFileInfo.Length) byte"
                    Write-Info "[INFO] PDF olusturuluyor (bu biraz zaman alabilir)..."
                    
                    try {
                        # PDF oluşturma çıktılarını göster
                        $pdfOutput = & $pythonCmd generate_pdf_report.py --html $htmlFile --output $pdfFile 2>&1
                        
                        # Hataları kontrol et
                        if ($LASTEXITCODE -ne 0 -or $pdfOutput -match "HATA|ERROR|Exception") {
                            Write-Warning "[UYARI] PDF olusturma ciktisi:"
                            $pdfOutput | ForEach-Object { Write-Host "   $_" -ForegroundColor Yellow }
                            Write-Warning "[UYARI] PDF olusturulamadi. Gerekli kutuphaneler yuklu olmayabilir."
                            Write-Info "[INFO] Yuklemek icin: pip install xhtml2pdf"
                            Write-Info "      veya: pip install weasyprint (Linux/Mac icin)"
                        }
                        
                        # PDF dosyasının oluşturulduğunu kontrol et
                        Start-Sleep -Milliseconds 500
                        if (Test-Path $pdfFile) {
                            $pdfFileInfo = Get-Item $pdfFile
                            if ($pdfFileInfo.Length -gt 0) {
                                Write-Success "[OK] PDF raporu olusturuldu: $pdfFile"
                                Write-Host "   Tam yol: $((Resolve-Path $pdfFile).Path)" -ForegroundColor Gray
                                Write-Host "   Dosya boyutu: $($pdfFileInfo.Length) byte" -ForegroundColor Gray
                            } else {
                                Write-Warning "[UYARI] PDF dosyasi olusturuldu ama bos!"
                                Write-Info "[INFO] PDF olusturma hatasi olabilir. HTML'i kontrol edin: $htmlFile"
                            }
                        } else {
                            Write-Warning "[UYARI] PDF dosyasi olusturulamadi."
                            Write-Info "[INFO] Yuklemek icin: pip install xhtml2pdf"
                            if ($pdfOutput) {
                                Write-Host "   Hata mesaji:" -ForegroundColor Yellow
                                $pdfOutput | ForEach-Object { Write-Host "   $_" -ForegroundColor Yellow }
                            }
                        }
                    } catch {
                        Write-Error "[HATA] PDF olusturulurken hata: $_"
                        Write-Host "   Hata detayi: $($_.Exception.Message)" -ForegroundColor Yellow
                    }
                } else {
                    Write-Error "[HATA] HTML dosyasi bos! PDF olusturulamadi."
                    Write-Host "   HTML dosyasi: $htmlFile" -ForegroundColor Yellow
                }
            } else {
                Write-Error "[HATA] HTML dosyasi bulunamadi, PDF olusturulamadi"
                Write-Host "   Aradigi yer: $htmlFile" -ForegroundColor Yellow
            }
        }
        
        Write-Host ""
    }
    
    # Sonuç
    Write-Host $separator -ForegroundColor Cyan
    if ($failed -eq 0 -and $errors -eq 0 -and $pytestExitCode -eq 0) {
        Write-Success "[SUCCESS] TUM TESTLER BASARILI!"
        Write-Host $separator -ForegroundColor Cyan
        exit 0
    } else {
        $totalFailed = $failed + $errors
        if ($totalFailed -gt 0) {
            Write-Error "[FAIL] $totalFailed TEST BASARISIZ!"
        } else {
            Write-Warning "[WARN] Test calistirma sirasinda sorun olustu!"
        }
        Write-Host $separator -ForegroundColor Cyan
        exit 1
    }
    
} catch {
    Write-Error "[ERROR] Test calistirma hatasi: $_"
    Write-Host ""
    Write-Host "Hata detayları:" -ForegroundColor Yellow
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($Verbose) {
        Write-Host $_.ScriptStackTrace -ForegroundColor Gray
    }
    exit 1
}
