# Test Dokümantasyonu

Bu dizin MVVM mimarisine uygun kapsamlı unit testler içerir. Testler FIRST prensiplerine uygun olarak yazılmıştır ve anti-pattern'lerden kaçınır.

## Test Yapısı

```
app/test/
├── __init__.py
├── conftest.py              # Pytest fixture'ları ve konfigürasyon
├── unit/                    # Unit testler
│   ├── test_data_service.py      # Model katmanı testleri (DataService)
│   ├── test_data_viewmodel.py    # ViewModel katmanı testleri
│   ├── test_data_model.py        # Alternatif Model katmanı testleri
│   └── test_data_utils.py        # Utility fonksiyon testleri
└── README.md               # Bu dosya
```

## Test Prensipleri

### FIRST Prensipleri

1. **Fast (Hızlı)**: Testler hızlı çalışır, entegrasyon testleri ayrıdır
2. **Isolated (Bağımsız)**: Her test bağımsızdır, diğer testlerden etkilenmez
3. **Repeatable (Tekrarlanabilir)**: Aynı sonuçları her çalıştırmada verir
4. **Self-Validating (Kendi Kendini Doğrular)**: Test sonucu açık ve nettir (pass/fail)
5. **Timely (Zamanında)**: Kodla birlikte yazılmıştır

### Anti-Pattern'lerden Kaçınma

- **The Liar (Yalancı Test)**: Testler gerçekten test eder, her zaman pass olmaz
- **The Giant (Dev Test)**: Testler küçük ve odaklıdır, tek bir davranışı test eder
- **The Mockery (Aşırı Mock)**: Mock kullanımı dengelidir, sadece gerektiğinde kullanılır
- **The Secret Catcher (Gizli Yakalayıcı)**: Assertion'lar açık ve nettir
- **The Generous Leftovers (Cömert Artıklar)**: Gereksiz setup/teardown yoktur
- **The Slow Poke (Yavaş Test)**: Testler hızlı çalışır

## Test Çalıştırma

### Tüm Testleri Çalıştırma

```bash
# unittest kullanarak
python -m unittest discover app/test/unit -v

# pytest kullanarak (önerilen)
pytest app/test/unit -v

# Coverage ile birlikte
pytest app/test/unit --cov=app --cov-report=html --cov-report=term-missing
```

### Belirli Bir Test Dosyasını Çalıştırma

```bash
# unittest ile
python -m unittest app.test.unit.test_data_service -v

# pytest ile
pytest app/test/unit/test_data_service.py -v
```

### Belirli Bir Test Metodunu Çalıştırma

```bash
# pytest ile
pytest app/test/unit/test_data_service.py::TestDataService::test_get_countries_returns_list -v
```

### Marker'larla Test Çalıştırma

```bash
# Sadece unit testler
pytest -m unit

# Sadece model testleri
pytest -m model

# Yavaş testleri hariç tut
pytest -m "not slow"
```

## Test Coverage

Coverage bir araçtır, amaç değil. Kaliteli testler > Yüksek coverage.

Coverage raporu oluşturmak için:

```bash
pytest app/test/unit --cov=app --cov-report=html
```

Rapor `htmlcov/index.html` dosyasında oluşturulur.

## Test Kategorileri

### Model Katmanı Testleri (`test_data_service.py`)

- Veri yükleme ve işleme
- Ülke verilerini alma
- Model eğitimi
- Tahmin yapma
- Özellik önemliliği
- Edge case'ler

### ViewModel Katmanı Testleri (`test_data_viewmodel.py`)

- Veri formatlama
- API yanıtları hazırlama
- Hata yönetimi
- Chart verisi oluşturma
- Trend hesaplama

### Utility Fonksiyon Testleri (`test_data_utils.py`)

- Trend hesaplama
- Veri interpolasyonu
- Yüzde formatlama
- JSON işlemleri
- Renk paleti oluşturma

## Test Best Practices

1. **Her test tek bir şeyi test eder**: Test metodları küçük ve odaklıdır
2. **Açıklayıcı test isimleri**: `test_shouldReturnError_whenInputIsInvalid()` formatı
3. **Arrange-Act-Assert pattern**: Test yapısı net ve anlaşılırdır
4. **Mock kullanımı dengeli**: Sadece gerektiğinde mock kullanılır
5. **Edge case'ler test edilir**: Sınır durumları ve hata senaryoları kapsanır
6. **Test verileri gerçekçi**: Test verileri gerçek kullanım senaryolarını yansıtır

## Test Verileri

Test verileri geçici dosyalar olarak oluşturulur ve test sonrası temizlenir. `conftest.py` içinde paylaşılan fixture'lar bulunur.

## Sorun Giderme

### Testler çalışmıyor

1. Bağımlılıkların yüklü olduğundan emin olun:
   ```bash
   pip install -r requirements.txt
   ```

2. Python path'inin doğru olduğundan emin olun

3. Test dosyalarının doğru dizinde olduğundan emin olun

### Import hataları

Test dosyaları proje kök dizinini path'e ekler. Eğer hala import hataları varsa:

```python
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..')))
```

## Katkıda Bulunma

Yeni testler eklerken:

1. FIRST prensiplerine uyun
2. Anti-pattern'lerden kaçının
3. Test isimlerini açıklayıcı yapın
4. Edge case'leri kapsayın
5. Mock kullanımını dengeli tutun

## Referanslar

- [FIRST Principles](https://pragprog.com/magazines/2012-01/unit-testing)
- [Test Anti-Patterns](https://www.thoughtworks.com/insights/blog/test-antipatterns)
- [Python unittest Documentation](https://docs.python.org/3/library/unittest.html)
- [pytest Documentation](https://docs.pytest.org/)




