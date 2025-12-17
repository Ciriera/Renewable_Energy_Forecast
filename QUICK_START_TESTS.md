# Test Çalıştırma - Hızlı Başlangıç

## 🚀 Hızlı Başlangıç

### Windows (PowerShell) - ÖNERİLEN

```powershell
# Basit kullanım
.\run_tests.ps1

# Detaylı rapor ile
python run_tests.py --html
```

### Windows (CMD)

```cmd
run_tests.bat
```

### Linux/Mac

```bash
chmod +x run_tests.sh
./run_tests.sh
```

### Python (Tüm Platformlar) - EN DETAYLI ⭐

```bash
# Temel kullanım
python run_tests.py

# HTML raporu ile
python run_tests.py --html

# Coverage olmadan (daha hızlı)
python run_tests.py --no-coverage
```

## 📊 Çıktı Örneği

```
================================================================================
🧪 TEST ÇALIŞTIRMA BAŞLATILIYOR...
================================================================================
📁 Test Dizini: app/test/unit
📊 Coverage: Açık
⏰ Başlangıç Zamanı: 2025-01-15 14:30:00
================================================================================

🚀 Testler çalıştırılıyor...

================================================================================
📊 TEST RAPORU
================================================================================

📈 GENEL İSTATİSTİKLER
--------------------------------------------------------------------------------
✅ Toplam Test:     150
✅ Başarılı:        145 (96.67%)
❌ Başarısız:       3 (2.00%)
⚠️  Hatalar:         2
⏭️  Atlanan:        0
⏱️  Süre:            12.34 saniye
📊 Coverage:        85.23%

❌ BAŞARISIZ TESTLER
--------------------------------------------------------------------------------
1. test_data_service.py::TestDataService::test_predict_future_invalid_year
2. test_data_viewmodel.py::TestDataViewModel::test_get_country_data_error
3. test_data_model.py::TestDataModel::test_train_model_insufficient_data

================================================================================
⚠️  5 TEST BAŞARISIZ!
================================================================================
```

## 📁 Oluşturulan Dosyalar

Test çalıştırıldıktan sonra şu dosyalar oluşturulur:

- `test-results.xml` - JUnit XML formatında test sonuçları
- `test-report.html` - HTML formatında detaylı rapor (--html ile)
- `coverage.json` - JSON formatında coverage bilgisi
- `htmlcov/` - HTML coverage raporu dizini
- `test-report.json` - JSON formatında test raporu (opsiyonel)

## 🎯 Hızlı Komutlar

```bash
# Tüm testleri çalıştır
python run_tests.py

# Sadece başarısız testleri göster
pytest app/test/unit --lf

# Belirli bir test dosyasını çalıştır
pytest app/test/unit/test_data_service.py -v

# Coverage raporunu görüntüle
start htmlcov/index.html  # Windows
open htmlcov/index.html   # Mac
xdg-open htmlcov/index.html  # Linux
```

## ⚡ Performans İpuçları

1. **Hızlı test için**: Coverage'ı kapatın
   ```bash
   python run_tests.py --no-coverage
   ```

2. **Sadece değişen testleri çalıştır**:
   ```bash
   pytest app/test/unit --lf
   ```

3. **Paralel çalıştırma** (pytest-xdist gerekli):
   ```bash
   pytest app/test/unit -n auto
   ```

## 🔧 Sorun Giderme

### Testler çalışmıyor
```bash
# Bağımlılıkları kontrol et
pip install pytest pytest-cov

# Test dizinini kontrol et
ls app/test/unit
```

### Script çalışmıyor
```bash
# Python versiyonunu kontrol et
python --version

# Script izinlerini kontrol et (Linux/Mac)
chmod +x run_tests.sh
```

## 📚 Daha Fazla Bilgi

Detaylı dokümantasyon için `README_TESTS.md` dosyasına bakın.




