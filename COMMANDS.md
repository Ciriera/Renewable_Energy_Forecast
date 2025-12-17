# ====================================================================================
# UYGULAMA BAŞLATMA KOMUTLARI
# ====================================================================================

# BACKEND (Flask API)
# -------------------
# Geliştirme modunda başlat (Debug modu açık) ( localhost:5000 adresinde erişilebilir)
cd E:\Samsung_Innovation_Project_V3; C:\Users\cavul\AppData\Local\Programs\Python\Python39\python.exe app.py

# FRONTEND (Flask templates ve static dosyalar)
# ----------------------------------------------
# Not: Frontend, Backend ile birlikte çalışır (aynı Flask uygulaması)
# Backend başlatıldığında otomatik olarak http://localhost:5000 adresinde erişilebilir

# Tarayıcıda açmak için:
Start-Process "http://localhost:5000"


# TEST KOMUTLARI
# --------------
# Testleri çalıştır (PowerShell)
.\run_tests.ps1

# Testleri çalıştır (HTML raporu ile)
.\run_tests.ps1 -Html

# Testleri çalıştır (PDF raporu ile)
.\run_tests.ps1 -Html -Pdf

# Testleri çalıştır (Coverage olmadan)
.\run_tests.ps1 -NoCoverage

# Testleri çalıştır (Python)
python -m pytest app/test/unit -v

# Testleri çalıştır (Coverage ile)
python -m pytest app/test/unit --cov=app --cov-report=html


# BAĞIMLILIK YÖNETİMİ
# --------------------
# Bağımlılıkları yükle
pip install -r requirements.txt

# Bağımlılıkları güncelle
pip install --upgrade -r requirements.txt


# ENVİRONMENT DEĞİŞKENLERİ
# -------------------------
# Port belirleme (PowerShell)
$env:PORT=5000

# Port belirleme (CMD)
set PORT=5000

# Port belirleme (Bash/Linux)
export PORT=5000


# UYGULAMA DURUMU
# ---------------
# API durumunu kontrol et
curl http://localhost:5000/api/status

# Veya tarayıcıda aç
Start-Process "http://localhost:5000/api/status"


# LOGLAR
# ------
# Uygulama loglarını görüntüle (PowerShell - canlı takip)
Get-Content app.log -Wait -Tail 50

# Logları temizle
Remove-Item app.log -ErrorAction SilentlyContinue
