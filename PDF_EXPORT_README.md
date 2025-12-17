# PDF Export Özelliği - Test Raporu

Test çıktısını PDF formatında export etmek için kullanılabilir.

## Kurulum

PDF export için gerekli Python kütüphanesini yükleyin:

```powershell
pip install weasyprint
```

veya

```powershell
pip install -r requirements.txt
```

## Kullanım

### PowerShell Script ile PDF Export

```powershell
# PDF export ile testleri çalıştır
.\run_tests.ps1 -Pdf

# HTML ve PDF export ile
.\run_tests.ps1 -Html -Pdf

# Coverage olmadan PDF export
.\run_tests.ps1 -NoCoverage -Pdf
```

### Python Script ile PDF Export

```powershell
# HTML raporu oluştur
python run_tests.py --html

# HTML'den PDF'e dönüştür
python generate_pdf_report.py --html test-report.html --output test-report.pdf
```

## Özellikler

### HTML Raporu
- Modern ve responsive tasarım
- Test istatistikleri (başarılı/başarısız/toplam)
- Başarısız testlerin detaylı listesi
- Coverage bilgisi (eğer varsa)

### PDF Raporu
- HTML raporunun PDF versiyonu
- Yazdırmaya uygun format
- Türkçe karakter desteği
- Profesyonel görünüm

## Çıktı Dosyaları

Test raporları **proje kök dizinine** kaydedilir:

- `test-report.html` - HTML formatında test raporu
- `test-report.pdf` - PDF formatında test raporu

**Tam yol örneği:**
```
E:\Samsung_Innovation_Project_V3\test-report.html
E:\Samsung_Innovation_Project_V3\test-report.pdf
```

Script çalıştırıldığında PDF'in kaydedildiği tam yol konsola yazdırılır.

## Notlar

1. **WeasyPrint**: Önerilen PDF oluşturma kütüphanesi. Windows, Linux ve macOS'ta çalışır.
2. **pdfkit**: Alternatif olarak kullanılabilir, ancak `wkhtmltopdf` binary'sine ihtiyaç duyar.
3. **ReportLab**: Python ile direkt PDF oluşturma için kullanılabilir, ancak HTML'den dönüştürme özelliği yok.

## Sorun Giderme

### WeasyPrint yüklenemiyor

```powershell
# Python sürümünüzü kontrol edin
python --version

# pip'i güncelleyin
python -m pip install --upgrade pip

# WeasyPrint'i yükleyin
pip install weasyprint
```

### PDF oluşturulmuyor

1. HTML dosyasının oluşturulduğundan emin olun:
   ```powershell
   .\run_tests.ps1 -Html
   ```

2. PDF script'inin çalıştığından emin olun:
   ```powershell
   python generate_pdf_report.py --html test-report.html
   ```

3. Hata mesajlarını kontrol edin ve gerekli kütüphanelerin yüklü olduğundan emin olun.

## Örnek Çıktı

PDF raporu şunları içerir:
- Test başlığı ve tarih
- İstatistik kartları (Başarılı, Başarısız, Toplam)
- Başarısız testlerin detaylı listesi
- Coverage bilgisi (eğer varsa)

PDF dosyası profesyonel görünümde, yazdırmaya hazır formattadır.
