# Yenilenebilir Enerji Tüketimi Analiz ve Tahmin Sistemi

Bu proje, dünya çapında ülkelerin yenilenebilir enerji tüketim verilerini analiz eden ve gelecek tahminleri yapan bir web uygulamasıdır. MVVM (Model-View-ViewModel) mimarisi kullanılarak geliştirilmiştir.

## Proje Yapısı

Proje, MVVM (Model-View-ViewModel) mimarisi kullanarak aşağıdaki bileşenlerden oluşmaktadır:

### Model Katmanı (`DataService`)
- Veri yükleme ve işleme
- Veri analizi ve istatistik hesaplamaları
- Makine öğrenimi modelleri ve tahminler

### ViewModel Katmanı (`DataViewModel`)
- Model ve View arasında köprü
- Veri dönüşümleri ve formatlamaları
- API yanıtları için veri hazırlama

### View Katmanı (Flask ve JavaScript)
- Web arayüzü
- Veri görselleştirme
- Kullanıcı etkileşimleri

## Kurulum

### Gereksinimler

```bash
# Bağımlılıkları yükle
pip install -r requirements.txt
```

### Uygulamayı Başlatma

```bash
# Ana dizinde çalıştır
python app.py
```

Uygulama varsayılan olarak http://localhost:5000 adresinde çalışacaktır.

## Özellikler

- **Veri Analizi**: Ülkelere göre yenilenebilir enerji tüketim trendleri
- **Ülke Karşılaştırma**: Birden fazla ülkenin yenilenebilir enerji verilerini karşılaştırma
- **Tahmin Modelleri**: Gelecekteki yenilenebilir enerji tüketimini tahmin etme
- **Model Metrikleri**: Tahmin modellerinin doğruluk ve performans ölçümleri
- **Özellik Önemliliği**: Modelde kullanılan özelliklerin önem sıralaması

## API Endpointleri

### Ülke Verileri

- `GET /api/data/countries`: Tüm ülkelerin listesini döndürür
- `GET /api/data/country/<country_name>`: Belirli bir ülke için veri döndürür
- `GET /api/data/overview`: Veri seti hakkında genel bilgileri döndürür

### Tahmin ve Analiz

- `GET /api/data/features?country=<country_name>`: Özellik önemlerini döndürür
- `GET /api/data/prediction/<country_name>?year=<year>`: Belirli bir ülke için tahmin yapar
- `GET /api/data/model?country=<country_name>`: Model metriklerini döndürür
- `GET /api/data/comparison?countries=country1,country2,...`: Ülkeleri karşılaştırır
- `GET/POST /api/data/train?country=<country_name>`: Model eğitimi yapar

## Kod Yapısı

```
app/
├── data_service.py           # Veri işleme ve model eğitimi (Model)
├── data_viewmodel.py         # ViewModel katmanı
├── app.py                    # Flask uygulaması ve API rotaları
├── models/                   # Eğitilmiş modeller
├── static/
│   ├── js/                   # Frontend JavaScript dosyaları
│   ├── css/                  # CSS stil dosyaları
│   └── images/               # Görseller
├── templates/                # HTML şablonları
└── test/                     # Test dosyaları
    └── unit/                 # Unit testler
```

## Geliştirme

### Testler

Unit testleri çalıştırmak için:

```bash
python -m unittest discover app/test/unit
```

## Lisans

Bu proje açık kaynak olarak MIT lisansı altında lisanslanmıştır.

## Katkıda Bulunanlar

- Samsung Innovation Camp Ekibi

---

© 2025 Samsung Innovation Camp 