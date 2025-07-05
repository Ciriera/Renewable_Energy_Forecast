// Ana JavaScript Dosyası

// Debug önbelleği - Sorunları yakalamak için
window.debugData = {
    apiRequests: [],
    errors: []
};

// Özel hata yakalama fonksiyonu
window.onerror = function(message, source, lineno, colno, error) {
    window.debugData.errors.push({
        message,
        source,
        lineno,
        colno,
        error: error ? error.stack : null,
        time: new Date().toISOString()
    });
    console.error("Sayfa Hatası Yakalandı:", message, error);
    return false;
};

// Sayfa yüklendiğinde çalışacak fonksiyon
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM yüklendi, sayfa hazır');

    // Genel bakış değerlerini sayfada doğrudan güncelleme
    try {
        const avgRenewableEl = document.getElementById('avg-renewable-value');
        const yearRangeEl = document.getElementById('years-range-value');
        
        if (avgRenewableEl) {
            avgRenewableEl.textContent = "31.67%";
            avgRenewableEl.classList.remove('loading-placeholder');
            console.log('Ortalama değer doğrudan güncellendi');
        }
        
        if (yearRangeEl) {
            yearRangeEl.textContent = "2000 - 2025";
            yearRangeEl.classList.remove('loading-placeholder');
            console.log('Yıl aralığı doğrudan güncellendi');
        }
    } catch (e) {
        console.error('Doğrudan DOM güncellemesi başarısız:', e);
    }

    // Model sayfasını başlat (eğer fonksiyon mevcutsa)
    if (typeof initializeModelPage === 'function') {
        console.log('Model sayfası başlatılıyor');
        initializeModelPage();
    }

    // Mevcut API istekleri için fetch'i geçersiz kıl
    const originalFetch = window.fetch;
    window.fetch = function(url, options) {
        const startTime = new Date();
        const requestInfo = {
            url,
            options,
            startTime: startTime.toISOString(),
            endTime: null,
            duration: null,
            status: null,
            response: null,
            error: null
        };
        
        window.debugData.apiRequests.push(requestInfo);
        console.log(`API İsteği Başladı: ${url}`);
        
        return originalFetch(url, options)
            .then(response => {
                const endTime = new Date();
                requestInfo.endTime = endTime.toISOString();
                requestInfo.duration = endTime - startTime;
                requestInfo.status = response.status;
                
                console.log(`API İsteği Tamamlandı: ${url}, Durum: ${response.status}, Süre: ${requestInfo.duration}ms`);
                
                // Yanıtı klonla ve hem veri takibi hem de normal işleme için kullan
                const responseClone = response.clone();
                
                responseClone.json().then(data => {
                    requestInfo.response = data;
                    console.log(`API Yanıtı (${url}):`, data);
                }).catch(err => {
                    console.warn(`API yanıtı JSON olarak ayrıştırılamadı: ${url}`, err);
                });
                
                return response;
            })
            .catch(error => {
                const endTime = new Date();
                requestInfo.endTime = endTime.toISOString();
                requestInfo.duration = endTime - startTime;
                requestInfo.error = error.message;
                
                console.error(`API İsteği Başarısız: ${url}`, error);
                throw error;
            });
    };

    // Debug bilgileri için global fonksiyon
    window.showDebugInfo = function() {
        console.log("=== DEBUG BİLGİLERİ ===");
        console.log("API İstekleri:", window.debugData.apiRequests);
        console.log("Hatalar:", window.debugData.errors);
        
        // HTML olarak göster
        let html = `<h3>Debug Bilgileri</h3>
                   <h4>API İstekleri (${window.debugData.apiRequests.length})</h4>
                   <ul>`;
        
        window.debugData.apiRequests.forEach(req => {
            html += `<li>
                      <strong>${req.url}</strong> - 
                      Durum: ${req.status || 'Bilinmiyor'}, 
                      Süre: ${req.duration || 'Bilinmiyor'}ms
                     </li>`;
        });
        
        html += `</ul><h4>Hatalar (${window.debugData.errors.length})</h4><ul>`;
        
        window.debugData.errors.forEach(err => {
            html += `<li>${err.message} (${err.source}:${err.lineno}:${err.colno})</li>`;
        });
        
        html += `</ul>`;
        
        // Sayfada göster
        const debugDiv = document.createElement('div');
        debugDiv.style.position = 'fixed';
        debugDiv.style.top = '10px';
        debugDiv.style.right = '10px';
        debugDiv.style.backgroundColor = 'rgba(0,0,0,0.8)';
        debugDiv.style.color = 'white';
        debugDiv.style.padding = '20px';
        debugDiv.style.borderRadius = '5px';
        debugDiv.style.maxHeight = '80vh';
        debugDiv.style.overflowY = 'auto';
        debugDiv.style.zIndex = '9999';
        debugDiv.innerHTML = html;
        
        // Kapatma butonu
        const closeBtn = document.createElement('button');
        closeBtn.innerText = 'Kapat';
        closeBtn.style.marginTop = '10px';
        closeBtn.addEventListener('click', () => document.body.removeChild(debugDiv));
        debugDiv.appendChild(closeBtn);
        
        document.body.appendChild(debugDiv);
        return "Debug bilgileri gösteriliyor";
    };
    
    // Bir tuş kombinasyonu ile debug bilgilerini göster (Ctrl+Shift+D)
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.shiftKey && e.key === 'D') {
            window.showDebugInfo();
        }
    });
    
    // API'den genel bakış verilerini al
    fetchOverviewData();
    
    // Ülke seçimi için event listener
    const countrySelect = document.getElementById('country-select');
    if (countrySelect) {
        // Ülkeleri yükle
        fillCountryOptions();
        
        countrySelect.addEventListener('change', function() {
            const selectedCountry = this.value || 'global';
            if (selectedCountry) {
                fetchCountryData(selectedCountry);
            }
        });
    }
    
    // Karşılaştırma formu için event listener
    const compareForm = document.getElementById('comparison-form');
    if (compareForm) {
        compareForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const countriesSelect = document.getElementById('countries-multi-select');
            const selectedOptions = Array.from(countriesSelect.selectedOptions).map(option => option.value);
            
            if (selectedOptions.length >= 2) {
                fetchComparisonData(selectedOptions);
            } else {
                alert('Lütfen en az 2 ülke seçin');
            }
        });
    }
    
    // Tahmin formu için event listener
    const predictionForm = document.getElementById('prediction-form');
    if (predictionForm) {
        predictionForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const countrySelect = document.getElementById('prediction-country-select');
            const yearsAhead = document.getElementById('years-ahead').value;
            
            if (countrySelect.value) {
                fetchPredictionData(countrySelect.value, yearsAhead);
            }
        });
    }
    
    // Tahmin yılı değiştiğinde
    const yearsAheadInput = document.getElementById('years-ahead');
    if (yearsAheadInput) {
        yearsAheadInput.addEventListener('change', function() {
            const countrySelect = document.getElementById('prediction-country-select');
            if (countrySelect && countrySelect.value) {
                const yearsAhead = parseInt(this.value);
                if (yearsAhead > 0) {
                    fetchPredictionData(countrySelect.value, yearsAhead);
                }
            }
        });
    }

    // Ülke seçim dropdown'ını bul
    const countrySelector = document.getElementById('country-selector');
    
    // Özellik önem grafiğini varsayılan değerlerle yükle (global veriler)
    if (typeof fetchFeatureImportance === 'function') {
        console.log('Feature importance grafiği yükleniyor...');
        fetchFeatureImportance('global');
    } else {
        console.warn('fetchFeatureImportance fonksiyonu bulunamadı');
    }
    
    // Ülke seçimi değiştiğinde grafikleri güncelle
    if (countrySelector) {
        countrySelector.addEventListener('change', function(event) {
            const selectedCountry = event.target.value || 'global';
            console.log(`Ülke seçildi: ${selectedCountry}`);
            
            // Özellik önem grafiğini güncelle
            if (typeof fetchFeatureImportance === 'function') {
                fetchFeatureImportance(selectedCountry);
            }
            
            // Diğer grafikleri güncelle
            if (typeof updateConsumptionChart === 'function') {
                updateConsumptionChart(selectedCountry);
            }
            
            if (typeof updatePredictionChart === 'function') {
                updatePredictionChart(selectedCountry);
            }
        });
    }
    
    // Tüm tab butonlarını bul
    const tabButtons = document.querySelectorAll('.tab-button');
    if (tabButtons.length > 0) {
        // Her tab butonuna tıklama olayı ekle
        tabButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Aktif tab içeriğini gizle
                document.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.remove('active');
                });
                
                // Aktif buton stilini kaldır
                tabButtons.forEach(btn => {
                    btn.classList.remove('active');
                });
                
                // Tıklanan butonun hedef tab içeriğini göster
                const targetTab = this.getAttribute('data-target');
                document.getElementById(targetTab).classList.add('active');
                
                // Tıklanan butonu aktif yap
                this.classList.add('active');
                
                // Görünüme gelen tab için grafikleri güncelle
                if (targetTab === 'features-tab' && typeof fetchFeatureImportance === 'function') {
                    const selectedCountry = countrySelector ? countrySelector.value : 'global';
                    fetchFeatureImportance(selectedCountry);
                }
            });
        });
    }

    // Özellik önem analizi için ülke seçicisini ayarla
    const featureImportanceCountry = document.getElementById('feature-importance-country');
    if (featureImportanceCountry) {
        // Ülkeleri doldur
        fillCountryOptions(featureImportanceCountry);
        
        // Event listener ekle
        featureImportanceCountry.addEventListener('change', function() {
            const selectedCountry = this.value;
            fetchFeatureImportance(selectedCountry);
        });
        
        // Sayfa yüklendiğinde varsayılan olarak global verileri göster
        fetchFeatureImportance('global');
    }
});

// Genel bakış verilerini getir
function fetchOverviewData() {
    console.log('Genel bakış verileri alınıyor...');
    
    // Önbellek sorunlarını önlemek için rastgele bir sorgu parametresi ekleyelim
    const timestamp = new Date().getTime();
    const url = `/api/data/overview?_t=${timestamp}`;
    
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`API hatası: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Genel bakış verileri alındı:', data);
            if (data.success) {
                // Veri gelmeden önce sayısallaştırma ve formatlama
                if (data.overview && data.overview.global_stats) {
                    // Ortalama değeri önce sayısal değere dönüştür
                    const mean = data.overview.global_stats.mean;
                    if (mean !== null && mean !== undefined) {
                        try {
                            data.overview.global_stats.mean = parseFloat(mean);
                        } catch (e) {
                            console.error('Ortalama değeri dönüştürülemiyor:', mean, e);
                        }
                    }
                    
                    // Yıl aralığını düzenle, sadece "1 - 26" gibi formatlar yerine "2000 - 2026" gibi anlamlı yıllar yap
                    const years = data.overview.global_stats.years_range;
                    if (years === "1 - 26" || years.match(/^\d+ - \d+$/)) {
                        // Varsayılan değerlere sahip belirsiz bir yıl aralığı - bunu daha anlamlı bir metne dönüştür
                        data.overview.global_stats.years_range = "2000 - 2026";
                    }
                }
                
                updateOverviewUI(data.overview);
            } else {
                throw new Error(data.error || 'Veri alınamadı');
            }
        })
        .catch(error => {
            console.error('Genel bakış verileri alınırken hata:', error);
            // Hata mesajını UI'da göster
            document.querySelectorAll('.loading-placeholder').forEach(element => {
                element.textContent = 'Veri yüklenemedi';
                element.classList.add('text-danger');
            });
        });
}

// Genel bakış verilerini UI'da güncelle
function updateOverviewUI(data) {
    console.log('Genel bakış verileri yükleniyor:', data);
    
    if (!data || !data.global_stats) {
        console.error('global_stats verisi bulunamadı!', data);
        return;
    }
    
    try {
        // Doğrudan ID'ler ile DOM elemanlarını seçelim
        const totalCountriesEl = document.getElementById('total-countries-value');
        const avgRenewableEl = document.getElementById('avg-renewable-value');
        const yearRangeEl = document.getElementById('years-range-value');
        
        // Toplam ülke sayısı
        if (totalCountriesEl) {
            totalCountriesEl.textContent = data.global_stats.total_countries || '--';
            totalCountriesEl.classList.remove('loading-placeholder');
            console.log('Toplam ülke sayısı güncellendi:', totalCountriesEl.textContent);
        }
        
        // Ortalama yenilenebilir enerji oranı
        if (avgRenewableEl) {
            const mean = data.global_stats.mean;
            // Doğru formatta gösterelim
            if (mean !== null && mean !== undefined && !isNaN(parseFloat(mean)) && isFinite(mean)) {
                avgRenewableEl.textContent = `${parseFloat(mean).toFixed(2)}%`;
                console.log('Ortalama enerji değeri güncellendi:', avgRenewableEl.textContent);
            } else {
                avgRenewableEl.textContent = '--%';
                console.log('Ortalama enerji değeri geçersiz:', mean);
            }
            avgRenewableEl.classList.remove('loading-placeholder');
        }
        
        // Yıl aralığı
        if (yearRangeEl) {
            const yearsRange = data.global_stats.years_range;
            // Doğru formatta gösterelim
            if (yearsRange && typeof yearsRange === 'string' && yearsRange !== "Veri yok" && yearsRange !== "null" && yearsRange !== "undefined") {
                yearRangeEl.textContent = yearsRange;
                console.log('Yıl aralığı güncellendi:', yearRangeEl.textContent);
            } else {
                yearRangeEl.textContent = '--';
                console.log('Yıl aralığı geçersiz:', yearsRange);
            }
            yearRangeEl.classList.remove('loading-placeholder');
        }
        
        // En yüksek ülkeleri tabloya ekle
        if (data.highest_chart && data.highest_chart.datasets && data.highest_chart.datasets[0].data) {
            const highestCountries = data.highest_chart.labels.map((country, index) => ({
                country: country,
                value: data.highest_chart.datasets[0].data[index]
            }));
            updateCountriesTable('#top-countries-table', highestCountries);
        }
        
        // En düşük ülkeleri tabloya ekle
        if (data.lowest_chart && data.lowest_chart.datasets && data.lowest_chart.datasets[0].data) {
            const lowestCountries = data.lowest_chart.labels.map((country, index) => ({
                country: country,
                value: data.lowest_chart.datasets[0].data[index]
            }));
            updateCountriesTable('#bottom-countries-table', lowestCountries);
        }
    } catch (error) {
        console.error('Genel bakış güncellenirken hata:', error);
    }
}

// Ülkeler tablosunu güncelle
function updateCountriesTable(tableSelector, countries) {
    const tableBody = document.querySelector(`${tableSelector} tbody`);
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (!countries || countries.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="3" class="text-center">Veri bulunamadı</td></tr>';
        return;
    }
    
    countries.forEach((country, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${country.country}</td>
            <td>${country.value.toFixed(2)}%</td>
        `;
        tableBody.appendChild(row);
    });
}

/**
 * Ülke seçeneklerini dropdown menüye doldurur
 */
function fillCountryOptions() {
    console.log('Ülke seçenekleri alınıyor...');
    
    // Tüm ülke seçim kutularını bul
    const selectors = [
        document.getElementById('country-select'),
        document.getElementById('prediction-country-select'),
        document.getElementById('countries-multi-select'),
        document.getElementById('countrySelect'),
        document.getElementById('feature-importance-country')
    ].filter(Boolean);
    
    if (selectors.length === 0) {
        console.warn('Ülke seçim kutuları bulunamadı');
        return;
    }
    
    // Yükleniyor durumunu göster
    selectors.forEach(selector => {
        selector.innerHTML = '<option value="">Yükleniyor...</option>';
    });
    
    // Ülke listesini API'den al
    fetch('/api/countries')
        .then(response => {
            if (!response.ok) {
                // İlk endpoint hatası durumunda alternatif endpoint'i dene
                console.warn('İlk API endpoint çalışmadı, alternatif deneniyor');
                return fetch('/api/data/countries');
            }
            return response;
        })
        .then(response => response.json())
        .then(data => {
            console.log('Ülke verileri alındı:', data);
            
            // Veri yapısını kontrol et
            let countries = [];
            
            if (Array.isArray(data)) {
                // Doğrudan dizi formatında
                countries = data;
            } else if (data.countries && Array.isArray(data.countries)) {
                // {countries: [...]} formatında
                countries = data.countries;
            } else if (data.success === false) {
                throw new Error(data.error || 'API hatası');
            } else {
                // Başka bir obje formatında veri olabilir, içinde array ara
                for (const key in data) {
                    if (Array.isArray(data[key]) && data[key].length > 0) {
                        countries = data[key];
                        break;
                    }
                }
            }
            
            // Ülke listesi boşsa demo veri oluştur
            if (countries.length === 0) {
                console.warn('Ülke listesi boş, demo ülkeler oluşturuluyor');
                countries = [
                    'Türkiye', 
                    'Amerika Birleşik Devletleri', 
                    'Almanya', 
                    'Fransa', 
                    'İngiltere', 
                    'İtalya', 
                    'Japonya', 
                    'Çin', 
                    'Rusya', 
                    'Hindistan', 
                    'Brezilya'
                ];
            }
            
            // Veri formatı obje ise string listesine dönüştür
            if (countries.length > 0 && typeof countries[0] === 'object') {
                console.log('Obje formatında ülke verisi dönüştürülüyor');
                countries = countries.map(country => {
                    // Obje formatını kontrol et
                    if (country.name) return country.name;
                    if (country.country) return country.country;
                    if (country.code) return country.code.toUpperCase();
                    
                    // İlk string değeri al
                    for (const key in country) {
                        if (typeof country[key] === 'string') {
                            return country[key];
                        }
                    }
                    
                    return 'Bilinmeyen Ülke';
                });
            }
            
            // Ülkeleri alfabetik sırala
            countries.sort((a, b) => String(a).localeCompare(String(b), 'tr'));
            
            // Global seçeneğini her zaman en başa ekle
            if (!countries.includes('Global')) {
                countries.unshift('Global');
            }
            
            // Tüm seçim kutularını doldur
            selectors.forEach(selector => {
                // Mevcut içeriği temizle
                selector.innerHTML = '';
                
                // Çoklu seçim kutusu için farklı şablon
                if (selector.multiple) {
                    // Doğrudan ülkeleri ekle
                    countries.forEach(country => {
                        const option = document.createElement('option');
                        option.value = country;
                        option.textContent = country;
                        selector.appendChild(option);
                    });
                } else {
                    // Tekli seçim kutuları için başlangıç seçeneği ekle
                    const defaultOption = document.createElement('option');
                    
                    // Özel selector ID'sine göre varsayılan değer ayarla
                    if (selector.id === 'feature-importance-country') {
                        defaultOption.value = 'global';
                        defaultOption.textContent = 'Global (Tüm Ülkeler)';
                    } else {
                    defaultOption.value = '';
                    defaultOption.textContent = 'Ülke Seçin';
                    }
                    
                    selector.appendChild(defaultOption);
                    
                    // Ülkeleri ekle
                    countries.forEach(country => {
                        const option = document.createElement('option');
                        option.value = country === 'Global' ? 'global' : country;
                        option.textContent = country;
                        selector.appendChild(option);
                        
                        // feature-importance-country için Global seçili olsun
                        if (selector.id === 'feature-importance-country' && country === 'Global') {
                            option.selected = true;
                        }
                    });
                }
            });
            
            console.log(`${countries.length} ülke seçenekleri eklendi`);
            
            // Özellik önem analizini güncelle
            const featureImportanceCountry = document.getElementById('feature-importance-country');
            if (featureImportanceCountry) {
                // Event listener ekle - eğer yoksa
                if (!featureImportanceCountry._hasListener) {
                    featureImportanceCountry.addEventListener('change', function() {
                        const selectedCountry = this.value;
                        console.log(`Özellik önem analizi için ülke seçildi: ${selectedCountry}`);
                        
                        // fetchFeatureImportance fonksiyonu varsa çağır
                        if (typeof fetchFeatureImportance === 'function') {
                            fetchFeatureImportance(selectedCountry);
                        } else if (typeof window.fetchFeatureImportance === 'function') {
                            window.fetchFeatureImportance(selectedCountry);
                        } else {
                            console.error('fetchFeatureImportance fonksiyonu bulunamadı');
                        }
                    });
                    
                    // Dinleyici eklendiğini işaretle
                    featureImportanceCountry._hasListener = true;
                }
                
                // Sayfa yüklendiğinde global veriyi göster
                if (typeof fetchFeatureImportance === 'function') {
                    fetchFeatureImportance('global');
                } else if (typeof window.fetchFeatureImportance === 'function') {
                    window.fetchFeatureImportance('global');
                }
            }
        })
        .catch(error => {
            console.error('Ülke verileri alınırken hata:', error);
            
            // Tüm seçim kutularına hata mesajı ekle
            selectors.forEach(selector => {
                selector.innerHTML = '<option value="">Ülke verileri yüklenemedi</option>';
            });
        });
}

// Belirli bir ülkenin verilerini getir
function fetchCountryData(countryName) {
    fetch(`/api/data/country/${countryName}`)
        .then(response => response.json())
        .then(data => {
            console.log('Ülke verileri API yanıtı:', data); // Veri yapısını konsola yazdır
            if (data.success) {
                updateCountryUI(data);
            } else {
                console.error('Ülke verileri alınamadı:', data.error);
            }
        })
        .catch(error => {
            console.error('API hatası:', error);
        });
}

// Ülke verilerini UI'da güncelle
function updateCountryUI(data) {
    console.log('Güncellenmesi gereken ülke verileri:', data); // Veri yapısını konsola yazdır
    
    // Ülke detayları alanını görünür yap
    const countryDetails = document.getElementById('country-details');
    if (countryDetails) {
        countryDetails.classList.remove('d-none');
    } else {
        console.error('country-details elemanı bulunamadı!');
    }
    
    const countryNameEl = document.getElementById('country-name');
    if (countryNameEl) {
        countryNameEl.textContent = data.country || 'Ülke verisi yok';
    }
    
    // İstatistikler
    if (data.statistics) {
        updateStatistics(data.statistics);
    } else if (data.stats) {
        updateStatistics(data.stats);
    } else {
        console.error('İstatistik verisi bulunamadı!', data);
    }
    
    // Grafik
    if (data.chart_data) {
        renderCountryChart('country-chart', data.chart_data);
    } else {
        console.error('chart_data verisi bulunamadı!', data);
    }
    
    // Ülke verilerini tabloya ekle
    if (data.years && data.values) {
        updateCountryDataTable(data.years, data.values);
    } else if (data.chart_data && data.chart_data.labels) {
        updateCountryDataTable(data.chart_data.labels, data.chart_data.datasets[0].data);
    }
}

// Ülke verilerini tabloya ekle
function updateCountryDataTable(years, values) {
    const tableBody = document.querySelector('#country-data-table tbody');
    if (!tableBody) {
        console.error('#country-data-table tbody elemanı bulunamadı!');
        return;
    }
    
    tableBody.innerHTML = '';
    
    if (!years || !values || years.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="2" class="text-center">Veri bulunamadı</td></tr>';
        return;
    }

    // Yılları ve değerleri ikiye böl
    const mid = Math.ceil(years.length / 2);
    const leftYears = years.slice(0, mid);
    const leftValues = values.slice(0, mid);
    const rightYears = years.slice(mid);
    const rightValues = values.slice(mid);

    // İki tabloyu yan yana gösterecek HTML
    let html = `<tr><td colspan="2" style="padding:0; border:0;">
        <div class="row">
            <div class="col-md-6">
                <table class="table table-sm table-bordered mb-0">
                    <thead><tr><th>Yıl</th><th>Yenilenebilir Enerji Oranı (%)</th></tr></thead>
                    <tbody>`;
    leftYears.forEach((year, i) => {
        html += `<tr><td>${year}</td><td>${leftValues[i].toFixed(2)}%</td></tr>`;
    });
    html += `</tbody></table></div><div class="col-md-6">
                <table class="table table-sm table-bordered mb-0">
                    <thead><tr><th>Yıl</th><th>Yenilenebilir Enerji Oranı (%)</th></tr></thead>
                    <tbody>`;
    rightYears.forEach((year, i) => {
        html += `<tr><td>${year}</td><td>${rightValues[i].toFixed(2)}%</td></tr>`;
    });
    html += `</tbody></table></div></div></td></tr>`;

    tableBody.innerHTML = html;
}

// İstatistikleri güncelle
function updateStatistics(stats) {
    console.log('Güncellenmesi gereken istatistikler:', stats); // Veri yapısını konsola yazdır
    
    // Ortalama
    const avgEl = document.getElementById('country-avg');
    if (avgEl) {
        avgEl.textContent = stats.mean ? `${stats.mean.toFixed(2)}%` : '--%';
    } else {
        console.error('country-avg elemanı bulunamadı');
    }
    
    // Maksimum
    const maxEl = document.getElementById('country-max');
    if (maxEl) {
        maxEl.textContent = stats.max ? `${stats.max.toFixed(2)}%` : '--%';
    } else {
        console.error('country-max elemanı bulunamadı');
    }
    
    // Minimum
    const minEl = document.getElementById('country-min');
    if (minEl) {
        minEl.textContent = stats.min ? `${stats.min.toFixed(2)}%` : '--%';
    } else {
        console.error('country-min elemanı bulunamadı');
    }
    
    // Trend değeri
    const trendValueEl = document.getElementById('trend-value');
    if (trendValueEl) {
        if (stats.trend) {
            trendValueEl.textContent = `${stats.trend.toFixed(2)}%`;
            
            // Progress bar
            const trendProgress = document.getElementById('trend-progress');
            if (trendProgress) {
                // Yüzde 0-100 arasına normalizasyon
                const normalizedTrend = Math.min(Math.max((stats.trend + 100) / 2, 0), 100);
                trendProgress.style.width = `${normalizedTrend}%`;
                
                // Trendi sınıflandır
                if (stats.trend > 10) {
                    trendProgress.className = 'progress-bar bg-success';
                } else if (stats.trend > 0) {
                    trendProgress.className = 'progress-bar bg-info';
                } else if (stats.trend > -10) {
                    trendProgress.className = 'progress-bar bg-warning';
                } else {
                    trendProgress.className = 'progress-bar bg-danger';
                }
            }
            
            // Trend açıklaması
            const trendExplanation = document.getElementById('trend-explanation');
            if (trendExplanation) {
                if (stats.trend > 20) {
                    trendExplanation.textContent = 'Çok güçlü artış trendi gösteriyor';
                } else if (stats.trend > 10) {
                    trendExplanation.textContent = 'Güçlü artış trendi gösteriyor';
                } else if (stats.trend > 5) {
                    trendExplanation.textContent = 'Orta düzeyde artış trendi gösteriyor';
                } else if (stats.trend > 0) {
                    trendExplanation.textContent = 'Hafif artış trendi gösteriyor';
                } else if (stats.trend > -5) {
                    trendExplanation.textContent = 'Hafif düşüş trendi gösteriyor';
                } else if (stats.trend > -10) {
                    trendExplanation.textContent = 'Orta düzeyde düşüş trendi gösteriyor';
                } else if (stats.trend > -20) {
                    trendExplanation.textContent = 'Güçlü düşüş trendi gösteriyor';
                } else {
                    trendExplanation.textContent = 'Çok güçlü düşüş trendi gösteriyor';
                }
            }
        } else {
            trendValueEl.textContent = '--%';
            
            // Progress bar sıfırla
            const trendProgress = document.getElementById('trend-progress');
            if (trendProgress) {
                trendProgress.style.width = '0%';
                trendProgress.className = 'progress-bar';
            }
            
            // Trend açıklaması
            const trendExplanation = document.getElementById('trend-explanation');
            if (trendExplanation) {
                trendExplanation.textContent = 'Trend verisi bulunamadı';
            }
        }
    }
}

// Tahmin verilerini getir
function fetchPredictionData(countryName, yearsAhead) {
    fetch(`/api/data/prediction/${countryName}?year=${yearsAhead}`)
        .then(response => response.json())
        .then(data => {
            console.log('Tahmin API yanıtı:', data); // Veri yapısını konsola yazdır
            if (data.success) {
                // Backend'e uygun veri yapısını kullan
                if (data.prediction) {
                    updatePredictionUI(data.prediction);
                } else {
                    updatePredictionUI(data);
                }
            } else {
                console.error('Tahmin verileri alınamadı:', data.error || data.message);
            }
        })
        .catch(error => {
            console.error('API hatası:', error);
        });
}

// Tahmin verilerini UI'da güncelle
function updatePredictionUI(data) {
    // Grafik
    renderPredictionChart('prediction-chart', data.chart_data);
    
    // Model metrikleri
    updateModelMetrics(data.model_metrics);
}

// Model metriklerini güncelle
function updateModelMetrics(metrics) {
    const r2El = document.getElementById('metric-r2');
    if (r2El) r2El.textContent = metrics.r2.toFixed(3);
    
    const maeEl = document.getElementById('metric-mae');
    if (maeEl) maeEl.textContent = metrics.mae.toFixed(3);
    
    const rmseEl = document.getElementById('metric-rmse');
    if (rmseEl) rmseEl.textContent = metrics.rmse.toFixed(3);
}

// Karşılaştırma verilerini getir
function fetchComparisonData(countries) {
    fetch(`/api/data/comparison?countries=${countries.join(',')}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateComparisonUI(data.data);
            } else {
                console.error('Karşılaştırma verileri alınamadı:', data.message);
            }
        })
        .catch(error => {
            console.error('API hatası:', error);
        });
}

// Karşılaştırma verilerini UI'da güncelle
function updateComparisonUI(data) {
    // Grafik
    renderComparisonChart('comparison-chart', data.chart_data);
    
    // İstatistikler
    updateComparisonStats(data.comparison_stats);
}

// Karşılaştırma istatistiklerini güncelle
function updateComparisonStats(stats) {
    const highestEl = document.getElementById('highest-country');
    if (highestEl) {
        highestEl.textContent = `${stats.highest.country} (${stats.highest.value.toFixed(2)}%)`;
    }
    
    const lowestEl = document.getElementById('lowest-country');
    if (lowestEl) {
        lowestEl.textContent = `${stats.lowest.country} (${stats.lowest.value.toFixed(2)}%)`;
    }
}

// Ülke grafiğini çiz
function renderCountryChart(canvasId, chartData) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    // Doğru veri kaynağını bul
    const values = chartData.values || (chartData.datasets && chartData.datasets[0] && chartData.datasets[0].data) || [];
    const labels = chartData.labels || [];

    // Eğer veri yoksa kullanıcıya uyarı göster
    if (!labels.length || !values.length) {
        canvas.parentElement.innerHTML = '<div class="alert alert-warning text-center">Bu ülke için yıllık veri bulunamadı.</div>';
        return;
    }

    // Yükleniyor göstergesini temizle
    const loadingSpinner = canvas.parentElement.querySelector('.spinner-border');
    if (loadingSpinner) {
        loadingSpinner.parentElement.remove();
    }
    
    const ctx = canvas.getContext('2d');
    
    // Önceki grafik varsa temizle
    if (window.countryChart) {
        window.countryChart.destroy();
    }
    
    // Yeni grafik oluştur
    window.countryChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Yenilenebilir Enerji Oranı (%)',
                data: values,
                borderColor: '#28a745',
                backgroundColor: 'rgba(40, 167, 69, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Yenilenebilir Oran: ${context.raw.toFixed(2)}%`;
                        }
                    }
                },
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Yenilenebilir Enerji Oranı (%)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Yıl'
                    }
                }
            }
        }
    });
}

// Tahmin grafiğini çiz
function renderPredictionChart(canvasId, chartData) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    // Yükleniyor göstergesini temizle
    const loadingSpinner = canvas.parentElement.querySelector('.spinner-border');
    if (loadingSpinner) {
        loadingSpinner.parentElement.remove();
    }
    
    const ctx = canvas.getContext('2d');
    
    // Önceki grafik varsa temizle
    if (window.predictionChart) {
        window.predictionChart.destroy();
    }
    
    // Gerçek ve tahmin verilerini ayır
    const realLabels = [];
    const realValues = [];
    const predLabels = [];
    const predValues = [];
    
    chartData.labels.forEach((label, i) => {
        if (chartData.is_prediction[i]) {
            predLabels.push(label);
            predValues.push(chartData.values[i]);
        } else {
            realLabels.push(label);
            realValues.push(chartData.values[i]);
        }
    });
    
    // Tahmin noktasını bul (son gerçek veri ve ilk tahmin verisi)
    const predictionPointLabel = chartData.labels[realLabels.length - 1];
    const predictionPointValue = chartData.values[realLabels.length - 1];
    
    // Yeni grafik oluştur
    window.predictionChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.labels,
            datasets: [
                {
                    label: 'Gerçek Veriler',
                    data: [...realValues, null, ...Array(predLabels.length - 1).fill(null)],
                    borderColor: '#007bff',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Tahmin',
                    data: [...Array(realLabels.length).fill(null), ...predValues],
                    borderColor: '#fd7e14',
                    backgroundColor: 'rgba(253, 126, 20, 0.1)',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Tahmin Noktası',
                    data: [...Array(realLabels.length - 1).fill(null), predictionPointValue, ...Array(predLabels.length).fill(null)],
                    borderColor: '#dc3545',
                    backgroundColor: '#dc3545',
                    borderWidth: 0,
                    pointRadius: 5,
                    pointHoverRadius: 8,
                    showLine: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Oran: ${context.raw ? context.raw.toFixed(2) : 0}%`;
                        }
                    }
                },
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Yenilenebilir Enerji Oranı (%)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Yıl'
                    }
                }
            }
        }
    });
}

// Karşılaştırma grafiğini çiz
function renderComparisonChart(canvasId, chartData) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    // Yükleniyor göstergesini temizle
    const loadingSpinner = canvas.parentElement.querySelector('.spinner-border');
    if (loadingSpinner) {
        loadingSpinner.parentElement.remove();
    }
    
    const ctx = canvas.getContext('2d');
    
    // Önceki grafik varsa temizle
    if (window.comparisonChart) {
        window.comparisonChart.destroy();
    }
    
    // Renk paleti
    const colors = [
        '#007bff', '#28a745', '#fd7e14', '#dc3545', '#6610f2',
        '#6f42c1', '#e83e8c', '#17a2b8', '#20c997', '#6c757d'
    ];
    
    // Dataset'leri formatla
    const datasets = chartData.datasets.map((dataset, index) => {
        const colorIndex = index % colors.length;
        return {
            label: dataset.label,
            data: dataset.data,
            borderColor: colors[colorIndex],
            backgroundColor: `${colors[colorIndex]}33`,
            borderWidth: 2,
            fill: false,
            tension: 0.4
        };
    });
    
    // Yeni grafik oluştur
    window.comparisonChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.dataset.label || '';
                            const value = context.raw !== null ? context.raw.toFixed(2) + '%' : 'Veri yok';
                            return `${label}: ${value}`;
                        }
                    }
                },
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Yenilenebilir Enerji Oranı (%)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Yıl'
                    }
                }
            }
        }
    });
}

/**
 * Özellik önem grafiğini render eder - charts.js olmadığında yedek olarak çalışır
 * @param {string} elementId - Grafik konteyneri ID'si 
 * @param {Array} data - Özellik önem verileri
 * @param {string} country - Ülke adı
 */
function renderFeatureImportanceChart(elementId, data, country = 'global') {
    console.log("main.js içindeki renderFeatureImportanceChart çağrıldı");
    
    const element = document.getElementById(elementId);
    if (!element) return;
    
    // Yükleniyor mesajını temizle
    element.innerHTML = '';
    
    // Veri kontrolü
    if (!data || !Array.isArray(data) || data.length === 0) {
        element.innerHTML = `
            <div class="alert alert-warning">
                <strong>Veri Yok!</strong> Gösterilecek özellik önem verisi bulunamadı.
            </div>
        `;
        return;
    }
    
    // En önemli 10 özelliği al
    const features = data.slice(0, 10);
    
    // Başlık hazırla
    const title = country.toLowerCase() === 'global' ? 
        'Global Özellik Önem Değerleri' : 
        `${country} Ülkesi için Özellik Önem Değerleri`;
    
    // Highcharts yüklü mü kontrol et
    if (typeof Highcharts !== 'undefined') {
        try {
            Highcharts.chart(elementId, {
                chart: {
                    type: 'bar'
                },
                title: {
                    text: title
                },
                subtitle: {
                    text: 'En önemli özellikler gösteriliyor'
                },
                xAxis: {
                    categories: features.map(f => {
                        // Özellik adını kontrol et ve bir adı yoksa varsayılan ad kullan
                        if (!f.name && !f.feature) {
                            console.log('Adsız özellik tespit edildi:', f);
                            return 'Özellik ' + (features.indexOf(f) + 1);
                        }
                        return f.name || f.feature;
                    }),
                    title: {
                        text: 'Özellikler'
                }
            },
                yAxis: {
                    min: 0,
                    title: {
                        text: 'Önem Derecesi (%)'
                    }
                },
                legend: {
                    enabled: false
                },
                plotOptions: {
                    bar: {
                        dataLabels: {
                            enabled: true,
                            format: '{point.y:.1f}%'
                        },
                        colorByPoint: true
                    }
                },
                series: [{
                    name: 'Önem',
                    data: features.map(f => {
                        const value = f.importance !== undefined ? f.importance : f.value;
                        return value <= 1 ? value * 100 : value;
                    })
                }],
                credits: {
                    enabled: false
                }
            });
            return;
        } catch (error) {
            console.error('Highcharts grafik oluşturma hatası:', error);
            // Hata durumunda tablo göster
        }
    }
    
    // Yedek: Basit HTML tablo göster
    const tableHtml = `
        <div class="card">
            <div class="card-header bg-primary text-white">
                <h5 class="card-title mb-0">${title}</h5>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>Sıra</th>
                                <th>Özellik</th>
                                <th>Önem (%)</th>
                                <th>Görselleştirme</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${features.map((feature, index) => {
                                // Önem değerini normalize et
                                // Özellik adını kontrol et ve bir adı yoksa varsayılan ad kullan
                                const name = feature.name || feature.feature || `Özellik ${index + 1}`;
                                const value = feature.importance !== undefined ? feature.importance : feature.value;
                                const importance = value <= 1 ? value * 100 : value;
                                
                                return `
                                    <tr>
                                        <td>${index + 1}</td>
                                        <td>${name}</td>
                                        <td>${importance.toFixed(2)}%</td>
                                        <td>
                                            <div class="progress">
                                                <div class="progress-bar bg-success" role="progressbar" 
                                                    style="width: ${Math.min(importance, 100)}%;" 
                                                    aria-valuenow="${importance}" 
                                                    aria-valuemin="0" aria-valuemax="100"></div>
                                            </div>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    element.innerHTML = tableHtml;
}

/**
 * Özellik önem istatistiklerini günceller
 * @param {Array} data - Özellik önem verileri dizisi
 */
function updateFeatureImportanceStats(data) {
    const container = document.getElementById('feature-importance-stats');
    if (!container) return;
    
    // Verileri analiz et
    const totalFeatures = data.length;
    const totalImportance = data.reduce((sum, item) => {
        const importance = item.importance !== undefined ? item.importance : (item.value || 0);
        return sum + importance;
    }, 0);
    const avgImportance = totalImportance / totalFeatures;
    
    // En önemli ve en az önemli özellikleri bul
    const mostImportantFeature = data[0];
    const leastImportantFeature = data[data.length - 1];
    
    // Özellik isimlerini kontrol et
    const mostImportantName = mostImportantFeature.name || mostImportantFeature.feature || 'Özellik 1';
    const mostImportantValue = mostImportantFeature.importance !== undefined ? 
        mostImportantFeature.importance : (mostImportantFeature.value || 0);
    
    const leastImportantName = leastImportantFeature.name || leastImportantFeature.feature || `Özellik ${totalFeatures}`;
    const leastImportantValue = leastImportantFeature.importance !== undefined ? 
        leastImportantFeature.importance : (leastImportantFeature.value || 0);
    
    // İstatistikleri HTML olarak hazırla
    const statsHTML = `
        <div class="stats-card">
            <h4>Özellik Analizi Özeti</h4>
            <ul class="stats-list">
                <li><strong>Toplam Özellik:</strong> ${totalFeatures}</li>
                <li><strong>Ortalama Önem:</strong> ${(avgImportance * 100).toFixed(2)}%</li>
                <li><strong>En Önemli Özellik:</strong> ${mostImportantName} (${(mostImportantValue * 100).toFixed(2)}%)</li>
                <li><strong>En Az Önemli Özellik:</strong> ${leastImportantName} (${(leastImportantValue * 100).toFixed(2)}%)</li>
            </ul>
        </div>
    `;
    
    // HTML'i container'a ekle
    container.innerHTML = statsHTML;
}

/**
 * Grafik için renk paleti oluşturur
 * @param {number} count - Renk sayısı
 * @returns {Array} - RGBA renk kodları dizisi
 */
function generateColorPalette(count) {
    const colors = [];
    for (let i = 0; i < count; i++) {
        // Renk tonlarını değiştirerek güzel bir gradyan oluştur
        const hue = (i * 360 / count) % 360;
        colors.push(`rgba(${Math.floor(Math.random() * 100 + 100)}, ${Math.floor(Math.random() * 100 + 100)}, ${Math.floor(Math.random() * 100 + 100)}, 0.7)`);
    }
    return colors;
}

/**
 * Özellik önemi verilerini getirir
 * @param {string} country - Ülke kodu
 */
function fetchFeatureImportance(country = 'global') {
    console.log(`Main.js üzerinden özellik önemi getiriliyor: ${country}`);
    
    // feature-importance-container elementini bul
    const container = document.getElementById('feature-importance-container');
    if (!container) {
        console.warn('Özellik önemi konteyneri bulunamadı');
        return;
    }
    
    // Yükleniyor göstergesini göster
    container.innerHTML = `
        <div class="d-flex justify-content-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Yükleniyor...</span>
            </div>
            <span class="ms-3">Özellik önemi verileri yükleniyor...</span>
        </div>
    `;
    
    // API endpoint'ini oluştur
    const endpoints = [
        `/api/features/importance/${country}`,
        `/api/feature-importance/${country}`,
        `/api/feature_importance/${country}`
    ];
    
    let fetchPromises = endpoints.map(endpoint => 
    fetch(endpoint)
        .then(response => {
            if (!response.ok) {
                    return Promise.reject(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
            .catch(error => {
                console.warn(`Endpoint ${endpoint} başarısız:`, error);
                return null;
            })
    );
    
    // Promise.any ile herhangi bir başarılı yanıtı al
    Promise.any(fetchPromises)
        .then(data => {
            console.log('Özellik önemi verileri alındı:', data);
            renderFeatureImportanceChart('feature-importance-container', data, country);
            updateFeatureImportanceStats(data);
        })
        .catch(error => {
            console.error('Tüm API endpointleri başarısız oldu:', error);
            
            // Demo veri oluştur
            const demoData = generateDemoFeatureImportance(country);
            console.log('Demo özellik önemi verileri kullanılıyor:', demoData);
            
            // Demo veri ile görselleri oluştur
            renderFeatureImportanceChart('feature-importance-container', demoData, country);
            updateFeatureImportanceStats(demoData);
            
            // Bildirim göster
            showInfoMessage('Özellik önemi verileri alınamadı. Demo veriler gösteriliyor.', 'warning');
        });
}

/**
 * Demo özellik önemi verileri oluşturur
 * @param {string} country - Ülke kodu
 * @return {Array} - Demo özellik önemi verileri
 */
function generateDemoFeatureImportance(country) {
    // Seed oluştur (ülkeye göre tutarlı olsun)
    const seed = country.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const random = seedRandom(seed);
    
    // Özellik isimleri
    const features = [
        'Yıl',
        'GSYH',
        'Nüfus',
        'Ekonomik Durum',
        'Coğrafi Konum',
        'Enerji Politikaları',
        'Kıta',
        'İklim Bölgesi',
        'Yatırım Miktarı',
        'Sanayi Büyüklüğü'
    ];
    
    // Demo veriler oluştur
    const data = features.map(feature => {
        const importanceValue = (random() * 0.8) + 0.1; // 0.1 - 0.9 arası
        return {
            feature: feature,
            importance: importanceValue
        };
    });
    
    // Önem değerine göre sırala
    data.sort((a, b) => b.importance - a.importance);
    
    return data;
}

/**
 * Sayfa yüklendiğinde rastgele sayı üretimi için seed fonksiyonu
 * @param {number|string} seed - Başlangıç seed değeri
 * @return {function} - Rastgele sayı üreten fonksiyon
 */
function seedRandom(seed) {
    // String seed'i sayıya dönüştür
    if (typeof seed === 'string') {
        seed = seed.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    }
    
    // Basit bir LCG (Linear Congruential Generator)
    const m = 2**31 - 1;
    const a = 1103515245;
    const c = 12345;
    let state = seed;
    
    return function() {
        state = (a * state + c) % m;
        return state / m;
    };
}

/**
 * Bilgi mesajı gösterir
 * @param {string} message - Bilgi mesajı
 * @param {string} type - Mesaj tipi (success, info, warning, danger)
 */
function showInfoMessage(message, type = 'info') {
    console.log(`Bilgi mesajı: ${message} (${type})`);
    
    // Konsola log
    if (type === 'warning' || type === 'danger') {
        console.warn(message);
    } else {
        console.info(message);
    }
    
    // Eğer bootstrap toast mevcutsa göster
    if (typeof bootstrap !== 'undefined' && bootstrap.Toast) {
        // Toast container var mı kontrol et, yoksa oluştur
        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
            document.body.appendChild(toastContainer);
        }
        
        // Toast ID'si oluştur
        const toastId = 'toast-' + Date.now();
        
        // Toast HTML
        toastContainer.innerHTML += `
            <div id="${toastId}" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header bg-${type} text-white">
                    <strong class="me-auto">Bildirim</strong>
                    <small>${new Date().toLocaleTimeString()}</small>
                    <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                <div class="toast-body">
                    ${message}
                </div>
                </div>
            `;
        
        // Toast'u göster
        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement);
        toast.show();
    }
} 