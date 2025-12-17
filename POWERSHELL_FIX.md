# PowerShell Script Düzeltmeleri

## Yapılan Düzeltmeler

### 1. Python Bulma Sorunu Çözüldü ✅

Script artık Python'u şu sırayla arar:
1. `python` komutu
2. `py` launcher
3. Sistemde Python.exe'yi otomatik bulma

### 2. Syntax Hataları Düzeltildi ✅

- Python string çarpma syntax'ı (`"=" * 80`) PowerShell'e uyarlandı
- String işlemleri düzeltildi
- Hata yönetimi iyileştirildi

### 3. Yeni Özellikler Eklendi ✅

- Test dosyaları özeti
- Renkli çıktı iyileştirildi
- Daha detaylı hata mesajları
- Python path gösterimi

## Kullanım

### Ana Script (run_tests.ps1)

```powershell
# Temel kullanım
.\run_tests.ps1

# Coverage olmadan
.\run_tests.ps1 -NoCoverage

# Verbose mod
.\run_tests.ps1 -Verbose

# Özel test dizini
.\run_tests.ps1 -TestDir "app/test/unit"
```

### Basit Script (run_tests_simple.ps1) - ÖNERİLEN

Python path sorunları için daha güvenilir alternatif:

```powershell
.\run_tests_simple.ps1
```

Bu script Python scriptini (`run_tests.py`) çalıştırır, bu daha güvenilirdir.

## Sorun Giderme

### Python Bulunamıyor Hatası

Eğer hala Python bulunamıyorsa:

1. **Python scriptini direkt çalıştırın:**
   ```powershell
   python run_tests.py
   # veya
   py run_tests.py
   ```

2. **Python path'ini kontrol edin:**
   ```powershell
   $env:PATH
   ```

3. **Python'u manuel olarak yükleyin:**
   - https://www.python.org/downloads/
   - Yükleme sırasında "Add Python to PATH" seçeneğini işaretleyin

### Execution Policy Hatası

Eğer script çalıştırma izni hatası alırsanız:

```powershell
# Mevcut policy'yi kontrol et
Get-ExecutionPolicy

# Geçici olarak değiştir (sadece bu oturum için)
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process

# Script'i çalıştır
.\run_tests.ps1
```

Veya script'i bypass ile çalıştırın:
```powershell
powershell -ExecutionPolicy Bypass -File .\run_tests.ps1
```

## Alternatif Çözümler

### 1. Python Scriptini Direkt Kullanın (EN GÜVENİLİR)

```powershell
python run_tests.py
python run_tests.py --html
python run_tests.py --no-coverage
```

### 2. Basit PowerShell Scripti

```powershell
.\run_tests_simple.ps1
```

Bu script Python scriptini çalıştırır, daha güvenilirdir.

### 3. Batch Scripti

```cmd
run_tests.bat
```

## Test

Script'i test etmek için:

```powershell
# Önce Python'un çalıştığını kontrol et
python --version
# veya
py --version

# Sonra script'i çalıştır
.\run_tests.ps1 -Verbose
```

## Öneriler

1. **Python scriptini kullanın** (`run_tests.py`) - En güvenilir ve özellik açısından en zengin
2. **Basit PowerShell scriptini kullanın** (`run_tests_simple.ps1`) - Python path sorunları için
3. **Python'u PATH'e ekleyin** - Uzun vadeli çözüm




