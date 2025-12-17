@echo off
REM Windows Batch Test Çalıştırma Scripti
REM Bu script tüm testleri çalıştırır ve detaylı rapor oluşturur

setlocal enabledelayedexpansion

set TEST_DIR=app\test\unit
set NO_COVERAGE=0
set HTML_REPORT=0

REM Parametreleri kontrol et
if "%1"=="--no-coverage" set NO_COVERAGE=1
if "%1"=="--html" set HTML_REPORT=1
if not "%1"=="" if not "%1"=="--no-coverage" if not "%1"=="--html" set TEST_DIR=%1

echo ================================================================================
echo 🧪 TEST ÇALIŞTIRMA BAŞLATILIYOR...
echo ================================================================================
echo 📁 Test Dizini: %TEST_DIR%
if %NO_COVERAGE%==1 (
    echo 📊 Coverage: Kapalı
) else (
    echo 📊 Coverage: Açık
)
echo ⏰ Başlangıç Zamanı: %date% %time%
echo ================================================================================
echo.

set START_TIME=%time%

REM Pytest komutunu oluştur
set PYTEST_CMD=python -m pytest %TEST_DIR% -v --tb=short --junit-xml=test-results.xml

if %NO_COVERAGE%==0 (
    set PYTEST_CMD=%PYTEST_CMD% --cov=app --cov-report=html:htmlcov --cov-report=term-missing --cov-report=json:coverage.json
)

REM Testleri çalıştır
echo 🚀 Testler çalıştırılıyor...
%PYTEST_CMD% > test-output.txt 2>&1
set EXIT_CODE=%ERRORLEVEL%

REM Çıktıyı göster
type test-output.txt

REM Sonuçları parse et (basit versiyon)
findstr /C:"passed" test-output.txt > temp.txt
findstr /C:"failed" test-output.txt > temp2.txt
findstr /C:"error" test-output.txt > temp3.txt
findstr /C:"skipped" test-output.txt > temp4.txt

REM Rapor
echo.
echo ================================================================================
echo 📊 TEST RAPORU
echo ================================================================================
echo.
echo 📈 GENEL İSTATİSTİKLER
echo --------------------------------------------------------------------------------

REM Test sonuçlarını göster
type test-output.txt | findstr /C:"passed" /C:"failed" /C:"error" /C:"skipped"

echo.
echo ================================================================================
if %EXIT_CODE%==0 (
    echo 🎉 TÜM TESTLER BAŞARILI!
) else (
    echo ⚠️  BAZI TESTLER BAŞARISIZ!
)
echo ================================================================================

REM Temizlik
del temp.txt temp2.txt temp3.txt temp4.txt 2>nul

exit /b %EXIT_CODE%




