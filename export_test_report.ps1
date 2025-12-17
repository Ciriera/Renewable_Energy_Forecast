# PowerShell Test Raporu Export Scripti
# HTML ve PDF export için yardımcı fonksiyonlar

function Export-TestReportToHtml {
    param(
        [string]$OutputFile = "test-report.html",
        [object]$TestResults,
        [object]$CoverageData,
        [hashtable]$Statistics
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $htmlContent = @"
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
        .log-call {
            background: #f9f9f9;
            border-left: 4px solid #667eea;
            padding: 15px;
            margin: 10px 0;
            border-radius: 5px;
        }
        .log-entry {
            margin: 5px 0;
            padding: 5px;
        }
        .log-info {
            color: #2196F3;
        }
        .log-error {
            color: #f44336;
        }
        .log-warning {
            color: #ff9800;
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
                <p>$([math]::Round(($Statistics.Passed / $Statistics.Total) * 100, 2))%</p>
            </div>
            <div class="stat-box failure">
                <h3>❌ Başarısız</h3>
                <div class="value">$($Statistics.Failed)</div>
                <p>$([math]::Round(($Statistics.Failed / $Statistics.Total) * 100, 2))%</p>
            </div>
            <div class="stat-box info">
                <h3>📊 Toplam</h3>
                <div class="value">$($Statistics.Total)</div>
                <p>Süre: $([math]::Round($Statistics.Duration, 2))s</p>
            </div>
        </div>
"@
    
    # Başarısız testler bölümü
    if ($TestResults.FailedTests.Count -gt 0) {
        $htmlContent += @"
        <div class="section">
            <h2 class="section-title">❌ Başarısız Testler</h2>
            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Dosya</th>
                        <th>Test Metodu</th>
                        <th>Hata</th>
                    </tr>
                </thead>
                <tbody>
"@
        $index = 1
        foreach ($test in $TestResults.FailedTests) {
            $methodName = $test.Method -replace "test_", "" -replace "_", " "
            $htmlContent += @"
                    <tr class="failed">
                        <td>$index</td>
                        <td>$($test.File)</td>
                        <td>$($test.Class)::$($test.Method)</td>
                        <td>$($test.Error)</td>
                    </tr>
"@
            $index++
        }
        $htmlContent += @"
                </tbody>
            </table>
        </div>
"@
    }
    
    $htmlContent += @"
    </div>
</body>
</html>
"@
    
    try {
        $htmlContent | Out-File -FilePath $OutputFile -Encoding UTF8
        Write-Info "[OK] HTML raporu olusturuldu: $OutputFile"
        return $true
    } catch {
        Write-Error "[HATA] HTML raporu olusturulurken hata: $_"
        return $false
    }
}

function Export-TestReportToPdf {
    param(
        [string]$HtmlFile = "test-report.html",
        [string]$PdfFile = "test-report.pdf",
        [string]$PythonPath = ""
    )
    
    if (-not (Test-Path $HtmlFile)) {
        Write-Error "[HATA] HTML dosyasi bulunamadi: $HtmlFile"
        Write-Info "[INFO] Oncelikle HTML raporu olusturulmali"
        return $false
    }
    
    # Python script'ini çalıştır
    $pdfScript = "generate_pdf_report.py"
    if (-not (Test-Path $pdfScript)) {
        Write-Error "[HATA] PDF script bulunamadi: $pdfScript"
        return $false
    }
    
    # Python'u bul
    $pythonCmd = "python"
    if ($PythonPath) {
        $pythonCmd = $PythonPath
    }
    
    try {
        Write-Info "[INFO] PDF olusturuluyor..."
        & $pythonCmd $pdfScript --html $HtmlFile --output $PdfFile
        if ($LASTEXITCODE -eq 0 -and (Test-Path $PdfFile)) {
            Write-Info "[OK] PDF raporu olusturuldu: $PdfFile"
            return $true
        } else {
            Write-Warning "[UYARI] PDF olusturulamadi. Gerekli kutuphaneler yuklu olmayabilir."
            Write-Info "[INFO] Yuklemek icin: pip install weasyprint"
            return $false
        }
    } catch {
        Write-Error "[HATA] PDF olusturulurken hata: $_"
        return $false
    }
}

# Export edilebilir hale getir
Export-ModuleMember -Function Export-TestReportToHtml, Export-TestReportToPdf



