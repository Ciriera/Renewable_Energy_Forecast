# Test Çalıştırma Scriptleri

Bu dizinde testleri otomatik çalıştırmak için hazır scriptler bulunmaktadır.

## Mevcut Scriptler

### 1. Python Scripti (`run_tests.py`) - ÖNERİLEN ⭐

En detaylı raporlama ve analiz özelliklerine sahiptir.

**Kullanım:**
```bash
# Temel kullanım
python run_tests.py

# Coverage olmadan
python run_tests.py --no-coverage

# HTML raporu ile
python run_tests.py --html

# Özel test dizini
python run_tests.py --test-dir app/test/unit
```

**Özellikler:**
- ✅ Detaylı başarı/başarısızlık istatistikleri
- ✅ Başarısız testlerin listesi
- ✅ Test dosyaları özeti
- ✅ Coverage raporu
- ✅ HTML rapor oluşturma
- ✅ JSON rapor desteği
- ✅ Yüzdelik başarı oranları

### 2. PowerShell Scripti (`run_tests.ps1`) - Windows

Windows PowerShell için optimize edilmiştir.

**Kullanım:**
```powershell
# Temel kullanım
.\run_tests.ps1

# Coverage olmadan
.\run_tests.ps1 -NoCoverage

# HTML raporu ile
.\run_tests.ps1 -Html

# Verbose mod
.\run_tests.ps1 -Verbose

# Özel test dizini
.\run_tests.ps1 -TestDir "app/test/unit"
```

**Özellikler:**
- ✅ Renkli çıktı
- ✅ Detaylı istatistikler
- ✅ Başarısız testlerin listesi
- ✅ Coverage raporu

### 3. Bash Scripti (`run_tests.sh`) - Linux/Mac

Linux ve macOS için optimize edilmiştir.

**Kullanım:**
```bash
# Çalıştırma izni ver
chmod +x run_tests.sh

# Temel kullanım
./run_tests.sh

# Coverage olmadan
./run_tests.sh app/test/unit true

# Özel test dizini
./run_tests.sh app/test/unit false false
```

**Özellikler:**
- ✅ Renkli çıktı
- ✅ Detaylı istatistikler
- ✅ Başarısız testlerin listesi
- ✅ Coverage raporu

### 4. Batch Scripti (`run_tests.bat`) - Windows CMD

Windows Command Prompt için basit script.

**Kullanım:**
```cmd
REM Temel kullanım
run_tests.bat

REM Coverage olmadan
run_tests.bat --no-coverage

REM HTML raporu ile
run_tests.bat --html
```

## Rapor Formatları

### 1. Konsol Çıktısı
Tüm scriptler konsola detaylı rapor yazdırır:
- Genel istatistikler
- Başarı/başarısızlık yüzdeleri
- Başarısız testlerin listesi
- Execution time
- Coverage bilgisi

### 2. HTML Raporu
Python scripti ile HTML raporu oluşturulabilir:
```bash
python run_tests.py --html
```
Rapor `test-report.html` dosyasında oluşturulur.

### 3. JSON Raporu
Pytest JSON raporu otomatik oluşturulur:
- `test-report.json` - Test sonuçları
- `coverage.json` - Coverage bilgisi

### 4. JUnit XML Raporu
CI/CD entegrasyonu için:
- `test-results.xml` - JUnit formatında

### 5. HTML Coverage Raporu
Coverage raporu HTML formatında:
- `htmlcov/index.html` - Detaylı coverage raporu

## Örnek Çıktı

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

## CI/CD Entegrasyonu

### GitHub Actions
```yaml
- name: Run Tests
  run: python run_tests.py --html
- name: Upload Test Results
  uses: actions/upload-artifact@v2
  with:
    name: test-results
    path: |
      test-results.xml
      test-report.html
      htmlcov/
```

### GitLab CI
```yaml
test:
  script:
    - python run_tests.py
  artifacts:
    reports:
      junit: test-results.xml
    paths:
      - htmlcov/
```

## Sorun Giderme

### Testler çalışmıyor
1. Python ve pytest yüklü mü kontrol edin:
   ```bash
   python --version
   pip install pytest pytest-cov
   ```

2. Test dizini doğru mu kontrol edin:
   ```bash
   ls app/test/unit
   ```

### Coverage raporu oluşmuyor
1. `pytest-cov` paketi yüklü mü:
   ```bash
   pip install pytest-cov
   ```

2. Coverage parametresini kontrol edin

### Script çalışmıyor
1. Çalıştırma izni var mı kontrol edin (Linux/Mac):
   ```bash
   chmod +x run_tests.sh
   ```

2. Python path doğru mu kontrol edin

## İpuçları

1. **Hızlı testler için**: Coverage'ı kapatın
   ```bash
   python run_tests.py --no-coverage
   ```

2. **Detaylı analiz için**: HTML raporu oluşturun
   ```bash
   python run_tests.py --html
   ```

3. **Belirli test dosyaları için**: Pytest'i direkt kullanın
   ```bash
   pytest app/test/unit/test_data_service.py -v
   ```

4. **Sadece başarısız testleri görmek için**:
   ```bash
   pytest app/test/unit --lf  # last-failed
   ```

## Performans

- **Ortalama çalışma süresi**: 10-30 saniye (test sayısına bağlı)
- **Coverage ile**: +5-10 saniye
- **HTML raporu ile**: +1-2 saniye

## Destek

Sorunlar için:
1. Test çıktısını kontrol edin
2. `test-output.txt` dosyasını inceleyin
3. Pytest loglarını kontrol edin




