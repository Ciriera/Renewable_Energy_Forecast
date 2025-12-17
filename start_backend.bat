@echo off
REM Backend (Flask API) Başlatma Scripti - Windows CMD
REM Bu script Flask uygulamasını başlatır

echo ================================================================================
echo BACKEND (Flask API) BASLATILIYOR...
echo ================================================================================
echo.

REM Port kontrolü
if "%PORT%"=="" (
    set PORT=5000
    echo [INFO] Port belirtilmedi, varsayilan port kullaniliyor: %PORT%
) else (
    echo [INFO] Port: %PORT%
)

REM app.py kontrolü
if not exist "app.py" (
    echo [HATA] app.py dosyasi bulunamadi!
    echo [INFO] Lutfen proje ana dizininde calistirin.
    pause
    exit /b 1
)

echo [INFO] Flask uygulamasi baslatiliyor...
echo [INFO] Erisim adresi: http://localhost:%PORT%
echo [INFO] API durum kontrolu: http://localhost:%PORT%/api/status
echo.
echo Durdurmak icin: Ctrl+C
echo.

REM Flask uygulamasını başlat
python app.py

if errorlevel 1 (
    echo.
    echo [HATA] Flask uygulamasi baslatilirken hata olustu!
    pause
    exit /b 1
)


