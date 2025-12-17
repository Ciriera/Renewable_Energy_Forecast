#!/bin/bash
# Backend (Flask API) Başlatma Scripti - Linux/macOS
# Bu script Flask uygulamasını başlatır

echo "================================================================================="
echo "BACKEND (Flask API) BASLATILIYOR..."
echo "================================================================================="
echo ""

# Port kontrolü
if [ -z "$PORT" ]; then
    export PORT=5000
    echo "[INFO] Port belirtilmedi, varsayilan port kullaniliyor: $PORT"
else
    echo "[INFO] Port: $PORT"
fi

# Python kontrolü
if ! command -v python3 &> /dev/null; then
    if ! command -v python &> /dev/null; then
        echo "[HATA] Python bulunamadi!"
        echo "[INFO] Lutfen Python yukleyin veya PATH'e ekleyin."
        exit 1
    else
        PYTHON_CMD="python"
    fi
else
    PYTHON_CMD="python3"
fi

echo "[OK] Python bulundu: $($PYTHON_CMD --version)"
echo ""

# Gerekli dosyaların varlığını kontrol et
if [ ! -f "app.py" ]; then
    echo "[HATA] app.py dosyasi bulunamadi!"
    echo "[INFO] Lutfen proje ana dizininde calistirin."
    exit 1
fi

if [ ! -f "requirements.txt" ]; then
    echo "[UYARI] requirements.txt dosyasi bulunamadi!"
    echo "[INFO] Bagimliliklari kontrol edin."
fi

echo "[INFO] Flask uygulamasi baslatiliyor..."
echo "[INFO] Erisim adresi: http://localhost:$PORT"
echo "[INFO] API durum kontrolu: http://localhost:$PORT/api/status"
echo ""
echo "Durdurmak icin: Ctrl+C"
echo ""

# Flask uygulamasını başlat
$PYTHON_CMD app.py


