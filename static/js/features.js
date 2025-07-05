/**
 * Özellik Mühendisliği JavaScript Dosyası
 * 
 * Bu dosya, özellik mühendisliği bölümünün interaktif özelliklerini yönetir:
 * - Ülke seçimi 
 * - Özellik önem grafiği
 * - Veri analizi görselleştirmesi
 */

// Gelişmiş hata ayıklama için logları geliştir
console.logOld = console.log;
console.log = function() {
    console.logOld.apply(console, [`[${new Date().toISOString()}]`, ...arguments]);
};

// Hata yakalamak için window.onerror ekle
window.onerror = function(message, source, lineno, colno, error) {
    console.error(`HATA: ${message} | Kaynak: ${source} | Satır: ${lineno} | Sütun: ${colno}`);
    if (error && error.stack) {
        console.error("Hata Yığını:", error.stack);
    }
    return false;
};

// Yükleme sırasında undefined değerleri tespit et
window.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        // Sayfadaki tüm .undefined içeren elementleri bul
        const undefinedElements = document.querySelectorAll('*:contains("undefined")');
        if (undefinedElements.length > 0) {
            console.warn("Undefined değer içeren elementler bulundu:", undefinedElements.length);
            undefinedElements.forEach(el => {
                console.warn("Undefined içeren element:", el.outerHTML);
            });
        }
    }, 1000);
});

// Yazılım sürümü - tarayıcı önbelleği sorununun önüne geçmek için
const FEATURE_JS_VERSION = "1.0.1-" + Date.now();
console.log(`Features.js yüklendi. Sürüm: ${FEATURE_JS_VERSION}`);

// SeedRandom fonksiyonu - tekrarlanabilir rastgele sayılar üretir
// MIT License, Copyright 2019 David Bau
Math.seedrandom = function(seed) {
    // Basitleştirilmiş bir seedrandom implementasyonu
    var mask = 0xffffffff;
    var m_w = (123456789 + seed.toString().hashCode()) & mask;
    var m_z = (987654321 - seed.toString().hashCode()) & mask;

    return function() {
        m_z = (36969 * (m_z & 65535) + (m_z >> 16)) & mask;
        m_w = (18000 * (m_w & 65535) + (m_w >> 16)) & mask;
        var result = ((m_z << 16) + m_w) & mask;
        result /= 4294967296;
        return result + 0.5;
    };
};

// String için hashCode fonksiyonu ekliyoruz
String.prototype.hashCode = function() {
    var hash = 0, i, chr;
    for (i = 0; i < this.length; i++) {
        chr = this.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // 32bit integer'a dönüştür
    }
    return hash;
};

/**
 * Sayfa yüklendiğinde ülke seçimini başlatır
 */
function initializeFeaturePage() {
    console.log('Özellik sayfası başlatılıyor...');
    
    // Özellik Mühendisliği bölümündeki countrySelect
    const featureCountrySelect = document.getElementById('countrySelect');
    if (featureCountrySelect) {
        console.log('Özellik Mühendisliği bölümündeki ülke seçimi elementi bulundu');
        
        // Ülke listesini yükle
        loadCountriesList(featureCountrySelect);
        
        // Ülke değişikliği için event listener ekle
        featureCountrySelect.addEventListener('change', function() {
            const selectedCountry = this.value;
            console.log(`Özellik Mühendisliği bölümünde ülke seçildi: ${selectedCountry}`);
            fetchFeatureImportance(selectedCountry);
        });
    }
    
    // Ülke seçimi elementi
    initializeCountrySelect();
    
    // Sayfa ilk yüklendiğinde global verilerini göster
    const defaultCountry = 'global';
    fetchFeatureImportance(defaultCountry);
}

/**
 * Ülke seçimi elementi oluşturur ve event listener ekler
 */
function initializeCountrySelect() {
    console.log('Ülke seçimi başlatılıyor...');
    
    let countrySelectContainer = document.getElementById('countrySelectContainer');
    
    // Eğer countrySelectContainer bulunamazsa, #feature-importance-section içinde ara
    if (!countrySelectContainer) {
        console.warn('countrySelectContainer bulunamadı, alternatif konteyner aranıyor...');
        
        // Alternatif olarak feature-importance-country elementini kontrol et
        const featureImportanceCountrySelect = document.getElementById('feature-importance-country');
        if (featureImportanceCountrySelect) {
            console.log('feature-importance-country elementi bulundu, doğrudan bu element kullanılacak');
            // Select elementi doğrudan varsa, container olarak parent elementini al
            countrySelectContainer = featureImportanceCountrySelect.parentElement;
            
            // Event listener ekle
            featureImportanceCountrySelect.addEventListener('change', function() {
                const selectedCountry = this.value;
                console.log(`Ülke seçildi: ${selectedCountry}`);
                fetchFeatureImportance(selectedCountry);
            });
            
            // Mevcut ülke listesi var mı kontrol et, yoksa yükle
            if (featureImportanceCountrySelect.options.length <= 1) {
                console.log('Ülke listesi yükleniyor...');
                loadCountriesList(featureImportanceCountrySelect);
            } else {
                console.log('Mevcut ülke listesi kullanılıyor');
            }
            
            return; // Mevcut select elementi kullandığımız için fonksiyondan çık
        }
        
        // Alternatif konteyner ara
        const featureImportanceSection = document.getElementById('feature-importance-section');
        if (featureImportanceSection) {
            console.log('feature-importance-section bulundu, içinde ülke seçim konteyneri aranıyor');
            
            // Section içinde country-select-container sınıfına sahip elementi ara
            const countrySelectContainers = featureImportanceSection.getElementsByClassName('country-select-container');
            
            if (countrySelectContainers.length > 0) {
                countrySelectContainer = countrySelectContainers[0];
                console.log('Alternatif countrySelectContainer bulundu');
            } else {
                // Yoksa mevcut ülke seçimi için uygun bir yer oluştur
                const selectWrappers = featureImportanceSection.getElementsByClassName('row');
                
                if (selectWrappers.length > 0) {
                    countrySelectContainer = selectWrappers[0].getElementsByClassName('col-md-8')[0];
                    console.log('Mevcut container yapısı içinde uygun element bulundu');
                } else {
                    // Hiçbir uygun yer bulunamazsa yeni bir konteyner oluştur
                    console.warn('Hiçbir uygun konteyner bulunamadı, yeni bir konteyner oluşturuluyor');
                    
                    countrySelectContainer = document.createElement('div');
                    countrySelectContainer.id = 'countrySelectContainer';
                    countrySelectContainer.className = 'country-select-container mb-4';
                    
                    // Uygun bir yere ekle
                    const containerElement = featureImportanceSection.querySelector('.container');
                    if (containerElement) {
                        containerElement.insertBefore(countrySelectContainer, containerElement.firstChild);
        } else {
                        featureImportanceSection.appendChild(countrySelectContainer);
                    }
                }
            }
        } else {
            console.error('feature-importance-section de bulunamadı, #featureImportanceContainer kontrolü yapılıyor');
            
            // Son çare olarak featureImportanceContainer'ı kontrol et
            const featureImportanceContainer = document.getElementById('featureImportanceContainer');
            if (featureImportanceContainer) {
                console.log('featureImportanceContainer bulundu, ülke seçimi için bir konteyner oluşturuluyor');
                
                // Yeni bir konteyner oluştur
                countrySelectContainer = document.createElement('div');
                countrySelectContainer.id = 'countrySelectContainer';
                countrySelectContainer.className = 'mb-4';
                
                // featureImportanceContainer'ın önüne ekle
                featureImportanceContainer.parentNode.insertBefore(countrySelectContainer, featureImportanceContainer);
            } else {
                console.error('Hiçbir uygun konteyner bulunamadı. Ülke seçimi başlatılamıyor.');
                return;
            }
        }
    }
    
    console.log('Ülke seçim konteyneri bulundu, ülke seçim elementi oluşturuluyor');
    
    // Ülke seçim elementini oluştur
    countrySelectContainer.innerHTML = `
        <div class="card shadow-sm border-0 mb-4">
            <div class="card-body">
                <div class="row align-items-center">
                    <div class="col-md-6">
                        <h5 class="mb-0">
                            <i class="fas fa-globe me-2"></i>Özellik Önem Analizi
                        </h5>
                    </div>
                    <div class="col-md-6">
                        <div class="d-flex align-items-center">
                            <label for="countrySelect" class="me-2 mb-0">Ülke:</label>
                            <select id="countrySelect" class="form-select">
                                <option value="global">Yükleniyor...</option>
                            </select>
                            <button id="refreshFeatures" class="btn btn-sm btn-outline-primary ms-2">
                                <i class="fas fa-sync"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Ülke listesini yükle
    loadCountriesList();
    
    // Ülke değişikliği için event listener ekle
    document.getElementById('countrySelect').addEventListener('change', function() {
        const selectedCountry = this.value;
        console.log(`Ülke seçildi: ${selectedCountry}`);
        fetchFeatureImportance(selectedCountry);
    });
    
    // Yenileme butonu için event listener
    document.getElementById('refreshFeatures').addEventListener('click', function() {
        const currentCountry = document.getElementById('countrySelect').value;
        console.log(`Özellik verilerini yenileme: ${currentCountry}`);
        fetchFeatureImportance(currentCountry);
    });
}

/**
 * Ülke listesini API'den alır ve seçim kutusunu doldurur
 * @param {HTMLSelectElement} customSelect - İsteğe bağlı olarak özel bir seçim kutusu
 */
async function loadCountriesList(customSelect = null) {
    console.log('Ülke listesi yükleniyor...');
    
    // Seçim kutusunu belirle
    let countrySelect;
    if (customSelect) {
        // Özel seçim kutusu verilmişse onu kullan
        countrySelect = customSelect;
    } else {
        // Normal seçim kutusunu bul
        countrySelect = document.getElementById('countrySelect');
    }
    
    if (!countrySelect) {
        console.warn('Ülke seçim kutusu bulunamadı');
        return;
    }
    
    try {
        console.log('Ülke listesi için API isteği yapılıyor...');
        
        // Browser konsolunda API isteklerini görüntüle
        console.log('API Endpoints:');
        console.log('- /api/countries');
        console.log('- /api/country-list');
        console.log('- /api/country_list');
        
        // Farklı API endpointlerini dene
        const endpoints = [
            '/api/countries',
            '/api/country-list',
            '/api/country_list'
        ];
        
        let response = null;
        let successfulEndpoint = '';
        
        // Tüm endpoint'leri dene
        for (const endpoint of endpoints) {
            try {
                console.log(`Ülke listesi endpoint'i deneniyor: ${endpoint}`);
                const resp = await fetch(endpoint);
                if (resp.ok) {
                    response = resp;
                    successfulEndpoint = endpoint;
                    break;
                }
            } catch (endpointError) {
                console.warn(`Endpoint ${endpoint} başarısız:`, endpointError);
            }
        }
        
        // Tüm API'ler başarısız olduysa
        if (!response || !response.ok) {
            throw new Error("Ülke listesi alınamadı");
        }
        
        console.log(`Başarılı ülke listesi endpoint'i: ${successfulEndpoint}`);
        const data = await response.json();
        console.log('API yanıtı:', data);
        
        // Veri formatını tanımla
        let countries = data;
        if (data.countries) countries = data.countries;
        if (data.data) countries = data.data;
        if (data.results) countries = data.results;
        
        console.log('İşlenmiş ülke verisi:', countries);
        
        // Ülke seçim kutusunu doldur
        populateCountrySelect(countries, countrySelect);
    } catch (error) {
        console.error('Ülke listesi yüklenirken hata:', error);
        
        // Demo ülke listesi oluştur
        const demoCountries = [
            { code: 'global', name: 'Global (Tüm Ülkeler)' },
            { code: 'tr', name: 'Türkiye' },
            { code: 'us', name: 'Amerika Birleşik Devletleri' },
            { code: 'de', name: 'Almanya' },
            { code: 'gb', name: 'Birleşik Krallık' },
            { code: 'fr', name: 'Fransa' },
            { code: 'jp', name: 'Japonya' },
            { code: 'cn', name: 'Çin' },
            { code: 'in', name: 'Hindistan' },
            { code: 'br', name: 'Brezilya' },
            { code: 'ru', name: 'Rusya' }
        ];
        
        // Demo ülke listesini göster
        populateCountrySelect(demoCountries, countrySelect);
        
        // Kullanıcıya bildirim göster
        showNotification('Ülke listesi alınamadı. Demo ülke listesi gösteriliyor.', 'warning');
    }
}

/**
 * Ülke seçim kutusunu doldurur
 * @param {Array} countries - Ülke listesi
 * @param {HTMLSelectElement} customSelect - İsteğe bağlı olarak özel bir seçim kutusu
 */
function populateCountrySelect(countries, customSelect = null) {
    console.log('Ülke seçim kutusu dolduruluyor:', countries);
    
    let countrySelect;
    if (customSelect) {
        // Özel seçim kutusu verilmişse onu kullan
        countrySelect = customSelect;
            } else {
        // Normal seçim kutusunu bul
        countrySelect = document.getElementById('countrySelect');
    }
    
    if (!countrySelect) {
        console.warn('Ülke seçim kutusu bulunamadı');
        return;
    }
    
    // Seçim kutusunu temizle
    countrySelect.innerHTML = '';
    
    // Ülke listesi geçerli mi kontrol et
    if (!countries || !Array.isArray(countries) || countries.length === 0) {
        // Sadece Global seçeneği ekle
        countrySelect.innerHTML = '<option value="global">Global (Tüm Ülkeler)</option>';
        return;
    }
    
    // Global seçeneği her zaman en üstte olsun
    let hasGlobal = false;
    let optionsHTML = '';
    
    // Ülke formatını kontrol et ve düzenle
    countries.forEach(country => {
        // Ülke verisi farklı formatlarda olabilir
        const code = country.code || country.id || country.value || country;
        const name = country.name || country.label || code.toUpperCase();
        
        // Global seçeneğini atla (sonra ekleyeceğiz)
        if (code.toLowerCase() === 'global') {
            hasGlobal = true;
            return;
        }
        
        optionsHTML += `<option value="${code}">${name}</option>`;
    });
    
    // Global seçeneğini en üste ekle
    const globalOption = '<option value="global">Global (Tüm Ülkeler)</option>';
    countrySelect.innerHTML = globalOption + optionsHTML;
    
    // İlk ülkeyi seç (Global)
    countrySelect.value = 'global';
    
    console.log('Ülke seçim kutusu dolduruldu, global seçildi');
}

/**
 * Seçilen ülke için özellik önem verilerini yükler
 * @param {string} country - Ülke kodu
 */
async function fetchFeatureImportance(country) {
    console.log(`Özellik önemi yükleniyor: ${country}`);
    
    // Yükleniyor göstergesini göster - Feature Importance Container
    const featureImportanceContainer = document.getElementById('featureImportanceContainer');
    if (featureImportanceContainer) {
        featureImportanceContainer.innerHTML = `
            <div class="d-flex justify-content-center my-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Yükleniyor...</span>
                </div>
                <span class="ms-3">Özellik önemi yükleniyor...</span>
            </div>
        `;
    }
    
    // Özellik Mühendisliği bölümü için yükleniyor göstergeleri
    const featureImportanceChart = document.getElementById('featureImportanceChart');
    if (featureImportanceChart) {
        featureImportanceChart.innerHTML = `
            <div class="d-flex justify-content-center align-items-center h-100">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Yükleniyor...</span>
                </div>
                <span class="ms-3">Özellik önemi yükleniyor...</span>
            </div>
        `;
    }
    
    const topFeaturesList = document.getElementById('topFeaturesList');
    if (topFeaturesList) {
        topFeaturesList.innerHTML = `
            <div class="card-body text-center">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Yükleniyor...</span>
                </div>
                <p class="mt-2">En önemli özellikler yükleniyor...</p>
            </div>
        `;
    }
    
    try {
        // API endpoint'lerini dene
        const endpoints = [
            `/api/features/importance/${country}`,
            `/api/feature-importance/${country}`,
            `/api/feature_importance/${country}`
        ];
        
        let response = null;
        let successfulEndpoint = '';
        
        // Tüm endpoint'leri dene
        for (const endpoint of endpoints) {
            try {
                console.log(`Özellik önemi endpoint'i deneniyor: ${endpoint}`);
                const resp = await fetch(endpoint);
                if (resp.ok) {
                    response = resp;
                    successfulEndpoint = endpoint;
                    break;
                }
            } catch (endpointError) {
                console.warn(`Endpoint ${endpoint} başarısız:`, endpointError);
            }
        }
        
        // Tüm API'ler başarısız olduysa
        if (!response || !response.ok) {
            throw new Error("Özellik önemi verileri alınamadı");
        }
        
        console.log(`Başarılı özellik önemi endpoint'i: ${successfulEndpoint}`);
        const data = await response.json();
        
        console.log('Özellik önemi verileri alındı:', data);
        
        // Veri formatını kontrol et
        let featureData = data;
        if (data.features) featureData = data.features;
        if (data.data) featureData = data.data;
        if (data.results) featureData = data.results;
        
        // Eksik veri kontrolü
        if (!featureData || !Array.isArray(featureData) || featureData.length === 0) {
            throw new Error('Geçerli özellik önemi verisi bulunamadı');
        }
        
        // Özellik önemi verilerini göster
        updateFeatureImportanceDisplay(featureData, country);
        
        // Özellik Mühendisliği bölümünü güncelle
        updateFeatureEngineering(featureData, country);
        
        return featureData; // Veriyi döndür
    } catch (error) {
        console.error('Özellik önemi yüklenirken hata:', error);
        
        // Demo veri oluştur
        const demoFeatureData = generateDemoFeatureImportance(country);
        
        // Demo veriyi göster
        updateFeatureImportanceDisplay(demoFeatureData, country);
        
        // Özellik Mühendisliği bölümünü güncelle
        updateFeatureEngineering(demoFeatureData, country);
        
        // Bildirim göster
        showNotification('Özellik önemi verileri alınamadı. Demo veriler gösteriliyor.', 'warning');
        
        return demoFeatureData; // Demo veriyi döndür
    }
}

/**
 * Özellik Mühendisliği bölümünü günceller
 * @param {Array} featureData - Özellik verileri
 * @param {string} country - Ülke adı
 */
function updateFeatureEngineering(featureData, country) {
    console.log(`Özellik Mühendisliği bölümü güncelleniyor: ${country}`, featureData);
    
    // Özellik Önem Grafiği
    const featureImportanceChart = document.getElementById('featureImportanceChart');
    if (featureImportanceChart) {
        // En önemli 10 özelliği al
        const topFeatures = featureData.slice(0, 10);
        
        // Grafik verilerini hazırla
        const chartLabels = topFeatures.map((feature, index) => {
            // Özellik adını doğru şekilde al, yoksa varsayılan bir isim kullan
            return feature.name || feature.feature || `Özellik ${index + 1}`;
        });
        
        const chartValues = topFeatures.map(feature => {
            // importance değeri 0-1 arasında mı yoksa yüzde olarak mı kontrol et
            const importance = feature.importance !== undefined ? feature.importance : (feature.value || 0);
            return importance <= 1 ? importance * 100 : importance; // 0-100 aralığına çevir
        });
        
        // Grafik renklerini hazırla
        const chartColors = topFeatures.map(feature => {
            const importance = feature.importance !== undefined ? feature.importance : (feature.value || 0);
            
            if (importance >= 0.7) return 'rgba(40, 167, 69, 0.8)'; // Yüksek önem (yeşil)
            if (importance >= 0.4) return 'rgba(255, 193, 7, 0.8)'; // Orta önem (sarı)
            return 'rgba(108, 117, 125, 0.8)'; // Düşük önem (gri)
        });
        
        // Grafik oluştur
        try {
            // Highcharts veya Chart.js kullanabiliriz
            if (typeof Highcharts !== 'undefined') {
                // Highcharts ile grafik
                Highcharts.chart(featureImportanceChart, {
                    chart: {
                        type: 'bar',
                        height: 400
                    },
                    title: {
                        text: `${country === 'global' ? 'Global' : country} Özellik Önem Dereceleri`,
                        style: {
                            fontSize: '16px'
                        }
                    },
                    xAxis: {
                        categories: chartLabels,
                        title: {
                            text: 'Özellikler'
                        }
                    },
                    yAxis: {
                        min: 0,
                        max: 100,
                        title: {
                            text: 'Önem Derecesi (%)'
                        }
                    },
                    legend: {
                        enabled: false
                    },
                    tooltip: {
                        formatter: function() {
                            return `<b>${this.x}</b><br/>Önem: %${this.y.toFixed(2)}`;
                        }
                    },
                    plotOptions: {
                        bar: {
                            dataLabels: {
                                enabled: true,
                                formatter: function() {
                                    return `%${this.y.toFixed(1)}`;
                                }
                            },
                            colorByPoint: true
                        }
                    },
                    series: [{
                        name: 'Önem',
                        data: chartValues,
                        colors: generateColorPalette(topFeatures.length)
                    }],
                    credits: {
                        enabled: false
                    }
                });
            } else if (typeof Chart !== 'undefined') {
                // Chart.js ile grafik
                const ctx = featureImportanceChart;
                
                // Eğer zaten bir grafik varsa yok et
                if (window.featureChart) {
                    window.featureChart.destroy();
                }
                
                try {
                    console.log('Chart.js ile grafik oluşturuluyor:', chartLabels, chartValues);
                    // Renk paletini oluştur
                    const backgroundColors = generateColorPalette(topFeatures.length);
                    // Yeni grafik oluştur - horizontalBar yerine bar kullanarak ve indexAxis: 'y' ile yatay bar grafik oluşturuyoruz
                    window.featureChart = new Chart(ctx, {
                        type: 'bar', 
                        data: {
                            labels: chartLabels,
                            datasets: [{
                                label: 'Önem Derecesi (%)',
                                data: chartValues,
                                backgroundColor: backgroundColors,
                                borderColor: backgroundColors.map(color => color.replace('0.7', '1')),
                                borderWidth: 1
                            }]
                        },
                        options: {
                            indexAxis: 'y', // Yatay bar grafiği için
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    display: false
                                },
                                title: {
                                    display: true,
                                    text: `${country === 'global' ? 'Global' : country} Özellik Önem Dereceleri`
                                },
                                tooltip: {
                                    callbacks: {
                                        label: function(context) {
                                            return `Önem: %${context.raw.toFixed(2)}`;
                                        }
                                    }
                                }
                            },
                            scales: {
                                x: {
                                    beginAtZero: true,
                                    max: 100,
                                    title: {
                                        display: true,
                                        text: 'Önem Derecesi (%)'
                                    }
                                },
                                y: {
                                    title: {
                                        display: true,
                                        text: 'Özellikler'
                                    }
                                }
                            }
                        }
                    });
                } catch (chartJsError) {
                    console.error('Chart.js grafiği oluşturulurken hata:', chartJsError);
                    throw chartJsError; // Hata yakalama bloğunun çalışması için hatayı yeniden fırlat
                }
            } else {
                // Kütüphane yoksa basit HTML grafiği oluştur
                let html = `
                    <h5 class="mb-3 text-center">${country === 'global' ? 'Global' : country} Özellik Önem Dereceleri</h5>
                    <div class="feature-chart">
                `;
                
                topFeatures.forEach(feature => {
                    const percentValue = (feature.importance * 100).toFixed(1);
                    const progressClass = getProgressBarClass(feature.importance);
                    
                    html += `
                        <div class="feature-item mb-3">
                            <div class="d-flex justify-content-between mb-1">
                                <span>${feature.name}</span>
                                <span class="fw-bold">%${percentValue}</span>
                            </div>
                            <div class="progress">
                                <div class="progress-bar ${progressClass}" role="progressbar" 
                                     style="width: ${percentValue}%" 
                                     aria-valuenow="${percentValue}" aria-valuemin="0" aria-valuemax="100">
                                </div>
                            </div>
                        </div>
                    `;
                });
                
                html += '</div>';
                featureImportanceChart.innerHTML = html;
            }
        } catch (chartError) {
            console.error('Grafik oluşturulurken hata:', chartError);
            
            // Basit HTML grafiği oluştur
            let html = `
                <div class="feature-chart">
            `;
            
            topFeatures.forEach(feature => {
                const percentValue = (feature.importance * 100).toFixed(1);
                const progressClass = getProgressBarClass(feature.importance);
                
                html += `
                    <div class="feature-item mb-3">
                        <div class="d-flex justify-content-between mb-1">
                            <span>${feature.name}</span>
                            <span class="fw-bold">%${percentValue}</span>
                        </div>
                        <div class="progress">
                            <div class="progress-bar ${progressClass}" role="progressbar" 
                                 style="width: ${percentValue}%" 
                                 aria-valuenow="${percentValue}" aria-valuemin="0" aria-valuemax="100">
                            </div>
                        </div>
                    </div>
                `;
            });
            
            html += '</div>';
            featureImportanceChart.innerHTML = html;
        }
    }
    
    // En Önemli Özellikler Listesi
    const topFeaturesList = document.getElementById('topFeaturesList');
    if (topFeaturesList) {
        // En önemli 10 özelliği al
        const topFeatures = featureData.slice(0, 10);
        
        // Liste HTML'ini oluştur
        let html = `
            <div class="card-header bg-white">
                <h5 class="mb-0">En Önemli Özellikler</h5>
            </div>
            <div class="card-body p-0">
                <ul class="list-group list-group-flush">
        `;
        
        topFeatures.forEach((feature, index) => {
            // Özellik adını kontrol et ve yoksa varsayılan bir isim kullan
            const featureName = feature.name || feature.feature || `Özellik ${index + 1}`;
            
            // Önem değerini kontrol et ve normalize et
            const importance = feature.importance !== undefined ? feature.importance : (feature.value || 0);
            const percentValue = (importance * 100).toFixed(1);
            const badgeClass = getImportanceBadge(importance);
            
            html += `
                <li class="list-group-item">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <span class="badge bg-primary rounded-pill me-2">${index + 1}</span>
                            ${featureName}
                        </div>
                        <span class="badge ${badgeClass}">%${percentValue}</span>
                    </div>
                </li>
            `;
        });
        
        html += `
                </ul>
            </div>
            <div class="card-footer bg-white text-center">
                <small class="text-muted">Toplam ${featureData.length} özellik arasından</small>
            </div>
        `;
        
        // HTML'i DOM'a ekle
        topFeaturesList.innerHTML = html;
    }
}

/**
 * Yenilenebilir enerji için anlamlı özellik adları döndürür
 * @returns {Array} - Özellik adları listesi
 */
function getEnergyFeatureNames() {
    return [
        "Yenilenebilir Enerji Yatırımları",
        "Enerji Tüketim Oranı",
        "Karbon Emisyon Değerleri",
        "Elektrik Üretim Kapasitesi",
        "Yenilenebilir Enerji Payı", 
        "Güneş Enerjisi Kapasitesi",
        "Rüzgar Enerjisi Kapasitesi",
        "Fosil Yakıt Bağımlılığı",
        "Enerji Depolama Kapasitesi",
        "Enerji Politikaları ve Teşvikler",
        "Ekonomik Gelişmişlik Düzeyi",
        "Nüfus Yoğunluğu",
        "Teknolojik İnovasyon Seviyesi",
        "Enerji Verimliliği Oranı",
        "İklim Koşulları",
        "Coğrafi Özellikler",
        "Altyapı Gelişmişlik Düzeyi",
        "Enerji İthalat Bağımlılığı",
        "Enerji Üretim Maliyetleri",
        "Sürdürülebilirlik Hedefleri"
    ];
}

/**
 * Demo özellik önemi verileri oluşturur
 * @param {string} country - Ülke kodu
 * @return {Array} Demo özellik verisi
 */
function generateDemoFeatureImportance(country) {
    console.log(`Demo özellik önemi oluşturuluyor: ${country}`);
    
    // Ülke kodunu küçük harfe çevir
    const countryCode = country.toLowerCase();
    
    // Özellik listesi - Yenilenebilir enerji için anlamlı isimlerle değiştir
    const featureNames = getEnergyFeatureNames();
    
    // Her ülke için hafif farklı değerler oluştur
    let multiplier = 1.0;
    let variance = 0.1;
    
    // Ülkeye göre önemi değiştir
    switch (countryCode) {
        case 'us':
            multiplier = 1.1;
            variance = 0.15;
            break;
        case 'tr':
            multiplier = 0.9;
            variance = 0.08;
            break;
        case 'gb':
            multiplier = 1.05;
            variance = 0.12;
            break;
        case 'de':
            multiplier = 1.15;
            variance = 0.07;
            break;
        case 'fr':
            multiplier = 0.95;
            variance = 0.11;
            break;
        case 'jp':
            multiplier = 1.2;
            variance = 0.09;
            break;
        case 'cn':
            multiplier = 1.25;
            variance = 0.14;
            break;
        default:
            // Global için default değerler
            break;
    }
    
    // Demo verileri oluştur
    const featureData = featureNames.map((name, index) => {
        // Özellik önem değeri (0-1 arasında)
        const baseValue = (1 - (index / featureNames.length)) * multiplier;
        const randomVariance = (Math.random() * variance * 2) - variance;
        let importance = baseValue + randomVariance;
        
        // 0-1 arasına sınırla
        importance = Math.max(0.01, Math.min(0.99, importance));
        
        return {
            name: name,
            importance: importance,
            description: generateFeatureEnergyDescription(name, importance),
            rank: index + 1
        };
    });
    
    // Önem değerine göre sırala
    featureData.sort((a, b) => b.importance - a.importance);
    
    // Rank değerlerini güncelle
    featureData.forEach((feature, index) => {
        feature.rank = index + 1;
    });
    
    return featureData;
}

/**
 * Yenilenebilir enerji özelliği için açıklama üretir
 * @param {string} featureName - Özellik adı
 * @param {number} importance - Önem değeri (0-1 arası)
 * @returns {string} - Açıklama metni
 */
function generateFeatureEnergyDescription(featureName, importance) {
    const percentValue = (importance * 100).toFixed(1);
    
    // Özellik adına göre özelleştirilmiş açıklamalar
    const descriptions = {
        "Yenilenebilir Enerji Yatırımları": 
            `Ülkelerin yenilenebilir enerji alanında yaptığı yatırımlar, modelin tahminlerini %${percentValue} oranında etkilemektedir. Yüksek yatırım oranları, gelecekteki yenilenebilir enerji kapasitesinin göstergesidir.`,
        
        "Enerji Tüketim Oranı": 
            `Toplam enerji tüketimi içindeki yenilenebilir enerji oranı, tahminlerde %${percentValue} öneme sahiptir. Bu oran, ülkenin mevcut yenilenebilir enerji kullanım seviyesini gösterir.`,
        
        "Karbon Emisyon Değerleri": 
            `Karbon emisyon değerleri, ülkelerin yenilenebilir enerjiye geçiş motivasyonunu %${percentValue} oranında etkilemektedir. Yüksek emisyona sahip ülkeler genellikle daha hızlı geçiş hedefleri belirlemektedir.`,
        
        "Elektrik Üretim Kapasitesi": 
            `Toplam elektrik üretim kapasitesi, yenilenebilir enerji potansiyelini değerlendirmede %${percentValue} önem taşımaktadır. Büyük kapasiteli ülkeler, yenilenebilir enerji entegrasyonunda farklı zorluklarla karşılaşmaktadır.`,
        
        "Yenilenebilir Enerji Payı": 
            `Mevcut enerji karışımında yenilenebilir kaynakların payı, modelde %${percentValue} ağırlığa sahiptir. Bu oran, ülkenin temiz enerji dönüşümündeki mevcut durumunu yansıtır.`,
        
        "Güneş Enerjisi Kapasitesi": 
            `Güneş enerjisi kurulu gücü, ülkenin yenilenebilir enerji profilinde %${percentValue} etkiye sahiptir. Güneş enerjisi, birçok ülkede en hızlı büyüyen yenilenebilir enerji kaynağıdır.`,
        
        "Rüzgar Enerjisi Kapasitesi": 
            `Rüzgar enerjisi kapasitesi, tahminlerde %${percentValue} önem taşımaktadır. Kıyı ve açık deniz rüzgar santralleri, enerji üretiminde önemli bir paya sahiptir.`,
        
        "Fosil Yakıt Bağımlılığı": 
            `Fosil yakıtlara olan bağımlılık seviyesi, yenilenebilir enerjiye geçiş hızını %${percentValue} oranında belirlemektedir. Yüksek bağımlılık, genellikle daha zorlu bir geçiş sürecine işaret eder.`,
        
        "Enerji Depolama Kapasitesi": 
            `Enerji depolama teknolojileri ve kapasitesi, yenilenebilir enerji entegrasyonunda %${percentValue} öneme sahiptir. Gelişmiş depolama sistemleri, aralıklı enerji kaynaklarının daha etkin kullanımını sağlar.`,
        
        "Enerji Politikaları ve Teşvikler": 
            `Hükümet politikaları ve teşvik mekanizmaları, yenilenebilir enerji gelişiminde %${percentValue} oranında etkilidir. Güçlü politika destekleri, sektör büyümesini hızlandırmaktadır.`
    };
    
    // Belirli açıklama yoksa genel bir açıklama oluştur
    if (descriptions[featureName]) {
        return descriptions[featureName];
    }
    
    // Önem seviyesine göre genel açıklama
    let importanceLevel = "düşük";
    if (importance > 0.7) importanceLevel = "çok yüksek";
    else if (importance > 0.4) importanceLevel = "yüksek";
    else if (importance > 0.2) importanceLevel = "orta";
    
    return `<strong>${featureName}</strong>, yenilenebilir enerji tahmin modelinde <strong>${importanceLevel} öneme</strong> sahiptir. Bu özellik, tahmin sonuçlarını %${percentValue} oranında etkilemektedir.`;
}

/**
 * Özellik önemi verilerini görselleştirir ve gösterir
 * @param {Array} featureData - Özellik önemi verileri
 * @param {string} country - Seçilen ülke kodu
 */
function updateFeatureImportanceDisplay(featureData, country) {
    console.log(`Özellik önemi görüntüleniyor: ${country}`, featureData);
    
    // Feature container elementini bul
    const featureContainer = document.getElementById('featureImportanceContainer');
    if (!featureContainer) {
        console.warn('Özellik önemi konteyner elementi bulunamadı');
        return;
    }
    
    // Veriyi önem değerine göre sırala
    featureData.sort((a, b) => {
        const importanceA = a.importance !== undefined ? a.importance : (a.value || 0);
        const importanceB = b.importance !== undefined ? b.importance : (b.value || 0);
        return importanceB - importanceA;
    });
    
    // İlk 5 veya daha az özelliği al
    const topFeatures = featureData.slice(0, Math.min(5, featureData.length));
    
    // Ülke adını formatla
    let countryName = country.toUpperCase();
    if (country.toLowerCase() === 'global') {
        countryName = 'Global (Tüm Ülkeler)';
    }
    
    // Container'ı temizle
    featureContainer.innerHTML = '';
    
    // Üç sütunlu layout oluştur
    const rowElement = document.createElement('div');
    rowElement.className = 'row g-4';
    featureContainer.appendChild(rowElement);
    
    // Özet kartı için sütun
    const summaryCol = document.createElement('div');
    summaryCol.className = 'col-md-4';
    rowElement.appendChild(summaryCol);
    
    // Grafik için sütun
    const chartCol = document.createElement('div');
    chartCol.className = 'col-md-8';
    rowElement.appendChild(chartCol);
    
    // Özellik kartları için sütun
    const cardsCol = document.createElement('div');
    cardsCol.className = 'col-12 mt-4';
    rowElement.appendChild(cardsCol);
    
    // Tablo için sütun
    const tableCol = document.createElement('div');
    tableCol.className = 'col-12 mt-4';
    tableCol.id = 'featureTableContainer'; 
    rowElement.appendChild(tableCol);
    
    // Özet, grafik ve kartları hazırla
    const summaryElement = document.createElement('div');
    summaryElement.innerHTML = createFeatureSummary(topFeatures, countryName);
    summaryCol.appendChild(summaryElement);
    
    const chartElement = document.createElement('div');
    chartElement.innerHTML = createFeatureChart(featureData, countryName);
    chartCol.appendChild(chartElement);
    
    // Özellik kartları için konteyner
    const cardsContainer = document.createElement('div');
    cardsContainer.className = 'card shadow-sm border-0';
    cardsCol.appendChild(cardsContainer);
    
    // Özellik kartlarını oluştur
    renderFeatureImportanceCards(cardsContainer, featureData, 5);
    
    // Tablo görünümünü oluştur
    renderFeatureTable(tableCol, featureData, country);
    
    // Highlight sınıfı eklemek için CSS stil ekle
    addHighlightStyle();
}

/**
 * Özellik önemi özeti oluşturur
 * @param {Array} topFeatures - En önemli özellikler
 * @param {string} countryName - Ülke adı
 * @return {string} Özet HTML
 */
function createFeatureSummary(topFeatures, countryName) {
    // Top özelliklerin önem değeri toplamını hesapla
    let totalImportance = 0;
    topFeatures.forEach(feature => {
        totalImportance += feature.importance !== undefined ? feature.importance : (feature.value || 0);
    });
    
    // Önem yüzdesini hesapla (100 üzerinden)
    const importancePercent = Math.min(100, Math.round(totalImportance * 100));
    
    // Özet kartı HTML
    return `
        <div class="card shadow-sm border-0 mb-4">
            <div class="card-header bg-primary text-white">
                <h5 class="mb-0">
                    <i class="fas fa-chart-pie me-2"></i>${countryName} - Özellik Önemi Özeti
                </h5>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-4">
                        <div class="text-center">
                            <div class="display-4 fw-bold text-primary">${topFeatures.length}</div>
                            <div class="text-muted">Önemli Özellik Sayısı</div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="text-center">
                            <div class="display-4 fw-bold text-success">${importancePercent}%</div>
                            <div class="text-muted">Toplam Önem Oranı</div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="text-center">
                            <div class="display-4 fw-bold text-info">${(topFeatures[0]?.importance * 100 || 0).toFixed(1)}%</div>
                            <div class="text-muted">En Etkili Özellik Oranı</div>
                        </div>
                    </div>
                </div>
                
                <hr>
                
                <h6 class="mb-3">En Etkili Özellikler:</h6>
                <ul class="list-group">
                    ${topFeatures.map((feature, index) => {
                        // Veri doğrulama ve yerine koyma
                        const featureName = feature.name || feature.feature || `Yenilenebilir Enerji Özelliği ${index + 1}`;
                        const importance = feature.importance !== undefined ? feature.importance : (feature.value || 0);
                        const percentValue = (importance * 100).toFixed(1);
                        
                        // Önem değerine göre renk sınıfı seç
                        let bgClass = 'bg-success';
                        if (importance > 0.7) bgClass = 'bg-danger';
                        else if (importance > 0.4) bgClass = 'bg-warning';
                        
                        return `
                            <li class="list-group-item d-flex justify-content-between align-items-center">
                                <div>
                                    <span class="badge ${bgClass} me-2">${index + 1}</span>
                                    ${featureName}
                                </div>
                                <span class="badge bg-primary rounded-pill">${percentValue}%</span>
                            </li>
                        `;
                    }).join('')}
                </ul>
            </div>
        </div>
    `;
}

/**
 * Özellik önemi için chart oluşturur
 * @param {Array} featureData - Tüm özellik verisi
 * @param {string} countryName - Ülke adı
 * @return {string} Chart HTML
 */
function createFeatureChart(featureData, countryName) {
    // Chart container ID'si
    const chartId = 'featureImportanceChart';
    
    // Chart HTML
    const chartHTML = `
        <div class="card shadow-sm border-0 mb-4">
            <div class="card-header bg-light">
                <h5 class="mb-0">
                    <i class="fas fa-chart-bar me-2"></i>${countryName} - Özellik Önemi Grafiği
                </h5>
            </div>
            <div class="card-body">
                <div id="${chartId}" style="min-height: 400px;"></div>
            </div>
        </div>
    `;
    
    // Chart oluşturmak için setTimeout kullan (DOM'un yüklenmesini beklemek için)
    setTimeout(() => {
        const chartElement = document.getElementById(chartId);
        if (!chartElement) {
            console.warn('Chart elementi bulunamadı:', chartId);
            return;
        }
        
        // Chart verilerini hazırla
        // İlk 10 özelliği al (daha fazlası grafikte kalabalık olabilir)
        const chartData = featureData.slice(0, 10).map(feature => {
            const name = feature.name || feature.feature || "Adsız Özellik";
            const importance = feature.importance !== undefined ? feature.importance : (feature.value || 0);
            return [name, importance * 100]; // Yüzde gösterimi için 100 ile çarp
        });
        
        // Highcharts veya başka bir grafik kütüphanesi varsa kullan
        if (typeof Highcharts !== 'undefined') {
            Highcharts.chart(chartId, {
                chart: {
                    type: 'bar'
                },
                title: {
                    text: `${countryName} - Özellik Önemi`,
                    style: {
                        fontSize: '16px'
                    }
                },
                subtitle: {
                    text: 'Satın alma olasılığı üzerindeki etki'
                },
                xAxis: {
                    type: 'category',
                    labels: {
                        style: {
                            fontSize: '13px'
                        }
                    }
                },
                yAxis: {
                    min: 0,
                    title: {
                        text: 'Önem Yüzdesi (%)'
                    }
                },
                legend: {
                    enabled: false
                },
                tooltip: {
                    pointFormat: 'Önem: <b>{point.y:.1f}%</b>'
                },
                series: [{
                    name: 'Önem',
                    colorByPoint: true,
                    data: chartData,
                    dataLabels: {
                        enabled: true,
                        format: '{point.y:.1f}%',
                        style: {
                            fontSize: '12px'
                        }
                    }
                }],
                credits: {
                    enabled: false
                }
            });
        } else {
            // Highcharts yüklü değilse, fallback görünüm
            chartElement.innerHTML = `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    Grafik kütüphanesi yüklenemedi. Lütfen tablo görünümünü kontrol edin.
                </div>
                <div class="table-responsive">
                    <table class="table table-sm table-striped">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Özellik</th>
                                <th>Önem (%)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${chartData.map((item, index) => `
                                <tr>
                                    <td>${index + 1}</td>
                                    <td>${item[0]}</td>
                                    <td>${item[1].toFixed(1)}%</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }
    }, 300);
    
    return chartHTML;
}

/**
 * Özellik önemi verilerini tablo olarak gösterir
 * @param {HTMLElement} containerElement - Tablo konteyneri
 * @param {Array} featureData - Özellik verileri
 * @param {string} country - Ülke kodu
 */
function renderFeatureTable(containerElement, featureData, country) {
    console.log('Özellik tablosu oluşturuluyor...', featureData);
    
    if (!containerElement) {
        console.warn('Tablo container elementi bulunamadı');
        return;
    }
    
    // Veri kontrolü
    if (!featureData || !Array.isArray(featureData) || featureData.length === 0) {
        containerElement.innerHTML = `
            <div class="alert alert-warning">
                <i class="fas fa-exclamation-circle me-2"></i>
                ${country.toUpperCase()} için özellik önemi verisi bulunamadı.
            </div>
        `;
        return;
    }
    
    // Ülke adını formatla
    let countryName = country.toUpperCase();
    if (country.toLowerCase() === 'global') {
        countryName = 'Global (Tüm Ülkeler)';
    }
    
    // Başlığı ve alt başlığı olustur
    containerElement.innerHTML = `
        <div class="card shadow-sm border-0">
            <div class="card-header bg-light">
                <h5 class="mb-0">
                    <i class="fas fa-table me-2"></i>${countryName} - Tüm Özellikler
                </h5>
        </div>
        <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-striped table-hover">
                        <thead class="table-light">
                            <tr>
                                <th scope="col" style="width: 70px;">#</th>
                                <th scope="col">Özellik</th>
                                <th scope="col">Açıklama</th>
                                <th scope="col" style="width: 150px;">Önem (%)</th>
                            </tr>
                        </thead>
                        <tbody id="featureTableBody">
                            <!-- Feature rows will be inserted here -->
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="card-footer text-muted">
                <small>
                    <i class="fas fa-info-circle me-1"></i>
                    Toplam ${featureData.length} özellik | Son Güncelleme: ${new Date().toLocaleString()}
                </small>
            </div>
        </div>
    `;
    
    // Tablo body elementini bul
    const tableBody = document.getElementById('featureTableBody');
    if (!tableBody) {
        console.warn('Tablo body elementi bulunamadı');
        return;
    }
    
    // Her özellik için bir satır oluştur
    featureData.forEach((feature, index) => {
        const rank = index + 1;
        const name = feature.name || feature.feature || `Yenilenebilir Enerji Özelliği ${index + 1}`;
        
        // Açıklama kontrol ediliyor - boşsa anlamlı bir açıklama ekliyoruz
        let description = feature.description || "";
        if (!description) {
            const importance = feature.importance !== undefined ? feature.importance : (feature.value || 0);
            const percentValue = (importance * 100).toFixed(1);
            
            // Önem seviyesine göre açıklama oluştur
            let importanceLevel = "düşük";
            if (importance > 0.7) importanceLevel = "çok yüksek";
            else if (importance > 0.4) importanceLevel = "yüksek";
            else if (importance > 0.2) importanceLevel = "orta";
            
            description = `Bu özellik, yenilenebilir enerji tahmin modelinde <strong>${importanceLevel} öneme</strong> sahiptir. Tahmin sonuçlarını %${percentValue} oranında etkilemektedir.`;
        }
        
        const importance = feature.importance !== undefined ? feature.importance : (feature.value || 0);
        const percentValue = (importance * 100).toFixed(1);
        
        // Önem değerine göre renk sınıfı belirle
        let importanceColorClass = '';
        if (importance > 0.7) importanceColorClass = 'text-danger fw-bold';
        else if (importance > 0.4) importanceColorClass = 'text-warning fw-bold';
        else if (importance > 0.2) importanceColorClass = 'text-primary';
        else importanceColorClass = 'text-muted';
        
        // Önem çubuğu için stil
        const barWidth = Math.max(5, Math.min(100, importance * 100));
        const progressClass = getProgressBarClass(importance);
        
        // Satırı oluştur
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="text-center">${rank}</td>
            <td class="fw-medium">${name}</td>
            <td><small>${description}</small></td>
            <td>
                <div class="d-flex align-items-center justify-content-between">
                    <div class="progress me-2" style="height: 8px; width: 70px;">
                        <div class="progress-bar ${progressClass}" role="progressbar" 
                            style="width: ${barWidth}%" 
                            aria-valuenow="${barWidth}" 
                            aria-valuemin="0" 
                            aria-valuemax="100">
            </div>
        </div>
                    <span class="${importanceColorClass}">${percentValue}%</span>
        </div>
            </td>
        `;
        
        // Satırı tabloya ekle
        tableBody.appendChild(row);
    });
}

/**
 * Bildirim gösterir
 * @param {string} message - Bildirim mesajı
 * @param {string} type - Bildirim tipi (success, danger, warning, info)
 */
function showNotification(message, type = 'info') {
    console.log(`Bildirim: ${message} (${type})`);
    
    // Toast konteyner elementini kontrol et, yoksa oluştur
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }
    
    // Bildirim ID'si oluştur
    const toastId = 'toast-' + Date.now();
    
    // Bildirim tipine göre stil belirle
    let bgClass = 'bg-info';
    let iconClass = 'fas fa-info-circle';
    
    switch (type) {
        case 'success':
            bgClass = 'bg-success';
            iconClass = 'fas fa-check-circle';
            break;
        case 'danger':
        case 'error':
            bgClass = 'bg-danger';
            iconClass = 'fas fa-exclamation-circle';
            break;
        case 'warning':
            bgClass = 'bg-warning';
            iconClass = 'fas fa-exclamation-triangle';
            break;
    }
    
    // Toast HTML'ini oluştur
    const toastHTML = `
        <div id="${toastId}" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header ${bgClass} text-white">
                <i class="${iconClass} me-2"></i>
                <strong class="me-auto">Bildirim</strong>
                <small>${new Date().toLocaleTimeString()}</small>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Kapat"></button>
            </div>
                <div class="toast-body">
                    ${message}
            </div>
        </div>
    `;
    
    // Toast'u konteyner'a ekle
    toastContainer.innerHTML += toastHTML;
    
    // Toast'u oluştur ve göster
    const toastElement = document.getElementById(toastId);
    if (toastElement) {
        const toast = new bootstrap.Toast(toastElement, {
            autohide: true,
            delay: 5000
        });
        toast.show();
        
        // Belirli bir süre sonra DOM'dan kaldır
        setTimeout(() => {
            toastElement.remove();
        }, 5500);
    }
}

/**
 * Önem derecesine göre progress bar sınıfını döndürür
 * @param {number} importance - Önem değeri (0-1 arası)
 * @returns {string} - Bootstrap progress bar sınıfı
 */
function getProgressBarClass(importance) {
    // importance değeri tanımlı değilse veya geçersizse varsayılan renk döndür
    if (importance === undefined || importance === null) {
        return 'bg-secondary';
    }
    
    // 0-1 aralığında değilse normalize et
    const normalizedImportance = importance > 1 ? importance / 100 : importance;
    
    if (normalizedImportance >= 0.7) return 'bg-danger'; // Yüksek önem
    if (normalizedImportance >= 0.4) return 'bg-warning'; // Orta önem
    if (normalizedImportance >= 0.2) return 'bg-primary'; // Düşük-orta önem
    return 'bg-success'; // Düşük önem
}

/**
 * Önem derecesine göre badge sınıfını döndürür
 * @param {number} importance - Önem değeri (0-1 arası)
 * @returns {string} - Bootstrap badge sınıfı
 */
function getImportanceBadge(importance) {
    // importance değeri tanımlı değilse veya geçersizse varsayılan renk döndür
    if (importance === undefined || importance === null) {
        return 'badge bg-secondary';
    }
    
    // 0-1 aralığında değilse normalize et
    const normalizedImportance = importance > 1 ? importance / 100 : importance;
    
    if (normalizedImportance >= 0.7) return 'badge bg-danger';
    if (normalizedImportance >= 0.4) return 'badge bg-warning';
    if (normalizedImportance >= 0.2) return 'badge bg-primary';
    return 'badge bg-success';
}

/**
 * Özellik kartı oluşturur
 * @param {Object} feature - Özellik verisi
 * @param {number} index - Özelliğin sıra numarası
 * @returns {HTMLElement} - Oluşturulan kart elementi
 */
function createFeatureCard(feature, index) {
    console.log(`${index+1}. sıradaki özellik kartı oluşturuluyor:`, feature.name);
    
    // Kart elementini oluştur
    const card = document.createElement('div');
    card.className = 'card mb-3 feature-card shadow-sm';
    card.dataset.featureId = `feature-${index}`;
    
    // Özellik adı ve değeri
    const name = feature.name || feature.feature || "Adsız Özellik";
    const importance = feature.importance !== undefined ? feature.importance : (feature.value || 0);
    
    // Önem derecesine göre kart stili
    const cardClass = getCardStyleClass(importance);
    card.classList.add(cardClass);
    
    // Önem seviyesi
    const importanceLevel = getImportanceLevel(importance);
    const importanceBadge = getImportanceBadge(importance);
    
    // Özellik açıklaması
    const description = feature.description || 
                        `Bu özellik, model tarafından ${importanceLevel.toLowerCase()} derecede önemli olarak değerlendirilmiştir.`;
    
    // Önem yüzdesi
    const percentValue = (importance * 100).toFixed(1);
    
    // Kart içeriğini oluştur
    card.innerHTML = `
        <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0 feature-name">
                <span class="badge bg-secondary me-2">${index + 1}</span>
                ${name}
            </h5>
            <span class="${importanceBadge}">%${percentValue}</span>
        </div>
        <div class="card-body">
            <p class="card-text">${description}</p>
            <div class="feature-impact mt-3">
                <small class="text-muted d-block mb-2">Etki Seviyesi: <strong>${importanceLevel}</strong></small>
                <div class="progress" style="height: 10px;">
                    <div class="progress-bar ${getProgressBarClass(importance)}" 
                         role="progressbar" 
                         style="width: ${percentValue}%" 
                         aria-valuenow="${percentValue}" 
                         aria-valuemin="0" 
                         aria-valuemax="100">
                    </div>
                </div>
            </div>
        </div>
    `;
    
    return card;
}

/**
 * Özellik kartı stili için CSS sınıfı döndürür
 * @param {number} importance - Özellik önem değeri (0-1 arası)
 * @return {string} - Kart için CSS sınıf adı
 */
function getCardStyleClass(importance) {
    if (!importance && importance !== 0) return '';
    
    if (importance > 0.7) return 'border-danger';
    if (importance > 0.4) return 'border-warning';
    if (importance > 0.2) return 'border-primary';
    return 'border-success';
}

/**
 * Özellik için açıklama metni oluşturur
 * @param {Object} feature - Özellik verisi
 * @param {number} index - Özelliğin sıra numarası
 * @return {string} - Açıklama metni
 */
function generateFeatureDescription(feature, index) {
    // Eğer açıklama zaten varsa kullan
    if (feature.description) {
        return feature.description;
    }
    
    const importance = feature.importance !== undefined ? feature.importance : (feature.value || 0);
    const name = feature.name || feature.feature || "bu özellik";
    const percentValue = (importance * 100).toFixed(1);
    
    // Önem derecesine göre farklı açıklama metinleri
    if (importance > 0.7) {
        return `<strong>${name}</strong>, model tahmininde <strong>çok yüksek öneme</strong> sahiptir. Modelin tahmin sonuçlarını %${percentValue} oranında etkilemektedir.`;
    } else if (importance > 0.4) {
        return `<strong>${name}</strong>, model tahmininde <strong>yüksek öneme</strong> sahiptir. Tüm özelliklerin önem sıralamasında üst sıralarda yer alır.`;
    } else if (importance > 0.2) {
        return `<strong>${name}</strong>, model tahmininde <strong>orta derecede öneme</strong> sahiptir. Model çıktısını anlamlı düzeyde etkilemektedir.`;
    } else if (importance > 0.1) {
        return `<strong>${name}</strong>, model tahmininde <strong>düşük öneme</strong> sahiptir. Tahminlerde limitli bir etkiye sahiptir.`;
    } else {
        return `<strong>${name}</strong>, model tahmininde <strong>çok düşük öneme</strong> sahiptir. Diğer özelliklere kıyasla sınırlı bir etkiye sahiptir.`;
    }
}

/**
 * Özellik önemi kartlarını oluşturur ve container'a ekler
 * @param {HTMLElement} containerElement - Kartların ekleneceği konteyner
 * @param {Array} featureData - Özellik verisi dizisi
 * @param {number} limit - Maksimum gösterilecek kart sayısı
 */
function renderFeatureImportanceCards(containerElement, featureData, limit = 5) {
    if (!containerElement) {
        console.warn('Kart container elementi bulunamadı');
                return;
            }
            
    if (!featureData || !Array.isArray(featureData) || featureData.length === 0) {
        containerElement.innerHTML = `
            <div class="alert alert-warning">
                <i class="fas fa-exclamation-circle me-2"></i>
                Özellik önemi verisi bulunamadı.
            </div>
        `;
        return;
    }
    
    // Container'ı temizle
    containerElement.innerHTML = '';
    
    // Kartları oluşturmadan önce sırala
    const sortedData = [...featureData]
        .sort((a, b) => {
            const importanceA = a.importance !== undefined ? a.importance : (a.value || 0);
            const importanceB = b.importance !== undefined ? b.importance : (b.value || 0);
            return importanceB - importanceA;
        })
        .slice(0, limit); // Sadece ilk N özelliği göster
    
    // Başlık ekle
    const header = document.createElement('div');
    header.className = 'card-header bg-primary text-white';
    header.innerHTML = `
        <h5 class="mb-0">
            <i class="fas fa-star me-2"></i>En Önemli ${limit} Özellik
        </h5>
    `;
    containerElement.appendChild(header);
    
    // Kartlar için container
    const cardsContainer = document.createElement('div');
    cardsContainer.className = 'card-body p-0';
    
    // Her özellik için kart oluştur
    sortedData.forEach((feature, index) => {
        const card = createFeatureCard(feature, index);
        cardsContainer.appendChild(card);
    });
    
    // Kart container'ını ana container'a ekle
    containerElement.appendChild(cardsContainer);
    
    // Tümünü görüntüle butonu ekle (sadece daha fazla veri varsa)
    if (featureData.length > limit) {
        const footer = document.createElement('div');
        footer.className = 'card-footer text-center';
        footer.innerHTML = `
            <button id="showAllFeatures" class="btn btn-outline-primary btn-sm">
                <i class="fas fa-list me-1"></i>Tüm Özellikleri Görüntüle (${featureData.length})
            </button>
        `;
        containerElement.appendChild(footer);
        
        // Butona tıklama olayı ekle
        setTimeout(() => {
            const button = document.getElementById('showAllFeatures');
            if (button) {
                button.addEventListener('click', () => {
                    const tableContainer = document.getElementById('featureTableContainer');
                    if (tableContainer) {
                        // Tablo bölümüne kaydır
                        tableContainer.scrollIntoView({ behavior: 'smooth' });
                        
                        // Vurgu efekti
                        tableContainer.classList.add('highlight-section');
                        setTimeout(() => {
                            tableContainer.classList.remove('highlight-section');
                        }, 2000);
                    }
                });
            }
        }, 100);
    }
}

/**
 * Highlight sınıfı eklemek için CSS stil ekle
 */
function addHighlightStyle() {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        .highlight-section {
            background-color: #f0f0f0;
            transition: background-color 0.3s ease;
        }
    `;
    document.head.appendChild(styleElement);
}

/**
 * Özellik kartına etkileşim ekler
 * @param {HTMLElement} cardElement - Kart elementi
 * @param {Object} feature - Özellik verisi
 */
function addCardInteraction(cardElement, feature) {
    // Tıklama efekti
    cardElement.style.cursor = 'pointer';
    
    // Karta tıklandığında detaylı bilgi göster
    cardElement.addEventListener('click', () => {
        showFeatureDetailModal(feature);
    });
    
    // Hover efekti
    cardElement.addEventListener('mouseenter', () => {
        cardElement.classList.add('shadow');
        cardElement.style.transform = 'translateY(-5px)';
    });
    
    cardElement.addEventListener('mouseleave', () => {
        cardElement.classList.remove('shadow');
        cardElement.style.transform = 'translateY(0)';
    });
}

// Model Doğruluk Metrikleri değerlerini yüzde formatına dönüştür
const accuracy = modelMetrics.accuracy * 100;
const precision = modelMetrics.precision * 100;
const recall = modelMetrics.recall * 100;
const f1Score = modelMetrics.f1Score * 100;
const mse = modelMetrics.mse * 100; // Eğer MSE'yi de yüzde formatında göstermek istiyorsanız
const rmse = modelMetrics.rmse * 100; // Eğer RMSE'yi de yüzde formatında göstermek istiyorsanız
const mae = modelMetrics.mae * 100; // Eğer MAE'yi de yüzde formatında göstermek istiyorsanız

// R^2 Skoru zaten 0-100 aralığında olduğu için değişiklik yapmaya gerek yok
const r2Score = modelMetrics.r2Score;

// Grafik verilerini oluştur
const chartData = {
    labels: ['ACCURACY', 'PRECISION', 'RECALL', 'F1 SCORE', 'MSE', 'RMSE', 'MAE', 'R^2 Skoru'],
    datasets: [{
        label: 'Model Doğruluk Metrikleri',
        data: [accuracy, precision, recall, f1Score, mse, rmse, mae, r2Score],
        backgroundColor: 'rgba(75, 192, 192, 0.7)',
    }]
};

// Grafiği oluştur
renderChart(chartData);

/**
 * Özellik detaylarını gösteren modal
 * @param {Object} feature - Özellik verisi
 */
function showFeatureDetailModal(feature) {
    console.log('Özellik detayları gösteriliyor:', feature);
    
    // Mevcut modalı kontrolü
    let modalElement = document.getElementById('featureDetailModal');
    
    // Modal yoksa oluştur
    if (!modalElement) {
        modalElement = document.createElement('div');
        modalElement.className = 'modal fade';
        modalElement.id = 'featureDetailModal';
        modalElement.tabIndex = '-1';
        modalElement.setAttribute('aria-labelledby', 'featureDetailModalLabel');
        modalElement.setAttribute('aria-hidden', 'true');
        document.body.appendChild(modalElement);
    }
    
    // Özellik verilerini hazırla
    const name = feature.name || feature.feature || "Adsız Özellik";
    const description = feature.description || generateFeatureDescription(feature, 0);
    const importance = feature.importance !== undefined ? feature.importance : (feature.value || 0);
    const percentValue = (importance * 100).toFixed(1);
    const importanceLevel = getImportanceLevel(importance);
    const progressClass = getProgressBarClass(importance);
    
    // Modal içeriğini oluştur
    modalElement.innerHTML = `
        <div class="modal-dialog modal-dialog-centered modal-lg">
            <div class="modal-content">
                <div class="modal-header bg-light">
                    <h5 class="modal-title" id="featureDetailModalLabel">
                        <i class="fas fa-chart-line me-2"></i>${name}
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Kapat"></button>
                </div>
                <div class="modal-body">
                    <div class="row">
                        <div class="col-md-4">
                            <div class="text-center mb-4">
                                <div class="display-4 fw-bold text-${importance > 0.7 ? 'danger' : importance > 0.4 ? 'warning' : 'primary'}">${percentValue}%</div>
                                <div class="text-muted">Önem Değeri</div>
                            </div>
                            
                            <div class="mb-4">
                                <div class="d-flex justify-content-between mb-2">
                                    <span>Etki Seviyesi:</span>
                                    <span class="fw-bold">${importanceLevel}</span>
                                </div>
                                <div class="progress" style="height: 15px;">
                                    <div class="progress-bar ${progressClass}" 
                                        role="progressbar" 
                                        style="width: ${percentValue}%" 
                                        aria-valuenow="${percentValue}" 
                                        aria-valuemin="0" 
                                        aria-valuemax="100">
                                        ${percentValue}%
                                    </div>
                                </div>
                            </div>
                            
                            <div class="card bg-light">
                                <div class="card-body">
                                    <h6 class="card-title">Özellik Detayları</h6>
                                    <ul class="list-unstyled">
                                        <li><strong>Sıralama:</strong> ${feature.rank || 'Belirtilmemiş'}</li>
                                        <li><strong>Kategori:</strong> ${feature.category || 'Genel'}</li>
                                        <li><strong>Veri Türü:</strong> ${feature.dataType || feature.type || 'Sayısal'}</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-8">
                            <h5 class="mb-3">Özellik Açıklaması</h5>
                            <div class="card mb-4">
                                <div class="card-body">
                                    <p>${description}</p>
                                </div>
                            </div>
                            
                            <h5 class="mb-3">Özellik Etkisi</h5>
                            <div class="alert ${importance > 0.5 ? 'alert-warning' : 'alert-info'}">
                                <i class="fas fa-info-circle me-2"></i>
                                <span>Bu özellik, tahmin sonuçlarını <strong>${percentValue}%</strong> oranında etkilemektedir. ${
                                    importance > 0.7 ? 'Çok yüksek öneme sahip olduğu için bu özelliği özellikle dikkate almanız önerilir.' :
                                    importance > 0.4 ? 'Önemli bir etkiye sahip olduğu için bu özelliği dikkate almanız faydalı olabilir.' :
                                    'Diğer özelliklere göre ortalama bir etkiye sahiptir.'
                                }</span>
                            </div>
                            
                            <div class="card">
                                <div class="card-header">Tavsiyeleri</div>
                                <div class="card-body">
                                    <ul>
                                        ${importance > 0.5 ? 
                                            `<li>Bu özellik yüksek öneme sahip olduğu için, modelinizi eğitirken veya tahminlerinizi değerlendirirken bu özelliğe özel dikkat gösterin.</li>
                                             <li>Veri kalitesini ve bu özellik için toplanan veri miktarını artırmayı düşünün.</li>` :
                                            `<li>Bu özellik orta düzeyde öneme sahiptir, ancak model performansını etkileyebilir.</li>
                                             <li>Diğer önemli özelliklerin yanında bu özelliği de analiz etmeyi ihmal etmeyin.</li>`
                                        }
                                        <li>Farklı ülke ve bölgelerde bu özelliğin önem seviyesi değişiklik gösterebilir.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Kapat</button>
                </div>
            </div>
        </div>
    `;
    
    // Modal'ı göster
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
}

/**
 * Özellik Önem Analizi bölümünü günceller
 * @param {string} country - Ülke kodu
 */
async function updateFeatureImportanceSection(country) {
    console.log(`Özellik Önem Analizi bölümü güncelleniyor: ${country}`);
    
    // Özellik Önem Analizi bölümündeki konteynerler
    const featureImportanceContainer = document.getElementById('feature-importance-container');
    const featureImportanceStats = document.getElementById('feature-importance-stats');
    
    // Yükleniyor göstergesini göster
    if (featureImportanceContainer) {
        featureImportanceContainer.innerHTML = `
            <div class="d-flex justify-content-center align-items-center" style="height: 300px;">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Yükleniyor...</span>
                </div>
                <span class="ms-3">Özellik önemi yükleniyor...</span>
            </div>
        `;
    }
    
    if (featureImportanceStats) {
        featureImportanceStats.innerHTML = `
            <div class="d-flex justify-content-center align-items-center" style="height: 200px;">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Yükleniyor...</span>
                </div>
            </div>
        `;
    }
    
    try {
        // Özellik verilerini al (fetchFeatureImportance fonksiyonunu kullan)
        const featureData = await fetchFeatureImportance(country);
        
        // Özellik Önem Analizi bölümünü güncelle
        renderFeatureImportanceSection(featureData, country);
    } catch (error) {
        console.error('Özellik Önem Analizi güncellenirken hata:', error);
        
        // Hata durumunda demo veri oluştur
        const demoFeatureData = generateDemoFeatureImportance(country);
        
        // Demo veri ile güncelle
        renderFeatureImportanceSection(demoFeatureData, country);
        
        // Bildirim göster
        showNotification('Özellik önemi verileri alınamadı. Demo veriler gösteriliyor.', 'warning');
    }
}

/**
 * Özellik Önem Analizi bölümü için grafik ve istatistikleri render eder
 * @param {Array} featureData - Özellik verileri
 * @param {string} country - Ülke kodu
 */
function renderFeatureImportanceSection(featureData, country) {
    console.log(`Özellik Önem Analizi bölümü render ediliyor: ${country}`, featureData);
    
    // Özellik Önem Analizi bölümündeki konteynerler
    const featureImportanceContainer = document.getElementById('feature-importance-container');
    const featureImportanceStats = document.getElementById('feature-importance-stats');
    
    if (!featureData || !Array.isArray(featureData) || featureData.length === 0) {
        // Veri yoksa hata mesajı göster
        if (featureImportanceContainer) {
            featureImportanceContainer.innerHTML = `
                <div class="alert alert-warning">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    ${country.toUpperCase()} için özellik önemi verisi bulunamadı.
                </div>
            `;
        }
        
        if (featureImportanceStats) {
            featureImportanceStats.innerHTML = `
                <div class="alert alert-warning">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    İstatistik verisi yok.
                </div>
            `;
        }
        
        return;
    }
    
    // Veriyi önem değerine göre sırala
    const sortedFeatures = [...featureData].sort((a, b) => {
        const importanceA = a.importance !== undefined ? a.importance : (a.value || 0);
        const importanceB = b.importance !== undefined ? b.importance : (b.value || 0);
        return importanceB - importanceA;
    });
    
    // En önemli 10 özelliği al
    const topFeatures = sortedFeatures.slice(0, 10);
    
    // Ülke adını formatla
    let countryName = country.toUpperCase();
    if (country.toLowerCase() === 'global') {
        countryName = 'Global (Tüm Ülkeler)';
    }
    
    // Grafik render et
    if (featureImportanceContainer) {
        renderFeatureImportanceChart(featureImportanceContainer, topFeatures, countryName);
    }
    
    // İstatistikler render et
    if (featureImportanceStats) {
        renderFeatureImportanceStats(featureImportanceStats, topFeatures, countryName);
    }
}

/**
 * Özellik önemi grafiğini render eder
 * @param {HTMLElement} container - Grafik konteyneri
 * @param {Array} features - Özellik verileri
 * @param {string} countryName - Ülke adı
 */
function renderFeatureImportanceChart(container, features, countryName) {
    // Grafik verilerini hazırla
    const chartLabels = features.map(feature => feature.name || feature.feature || "Özellik");
    const chartValues = features.map(feature => {
        const importance = feature.importance !== undefined ? feature.importance : (feature.value || 0);
        return importance * 100; // Yüzde formatına çevir
    });
    
    // Renkleri hazırla
    const chartColors = features.map(feature => {
        const importance = feature.importance !== undefined ? feature.importance : (feature.value || 0);
        
        if (importance >= 0.7) return 'rgba(220, 53, 69, 0.8)'; // Yüksek (kırmızı)
        if (importance >= 0.4) return 'rgba(255, 193, 7, 0.8)'; // Orta (sarı)
        if (importance >= 0.2) return 'rgba(13, 110, 253, 0.8)'; // Düşük-orta (mavi)
        return 'rgba(25, 135, 84, 0.8)'; // Düşük (yeşil)
    });
    
    // Konteyneri temizle
    container.innerHTML = '';
    
    // Canvas elementi oluştur
    const canvas = document.createElement('canvas');
    canvas.id = 'feature-importance-chart';
    canvas.style.width = '100%';
    canvas.style.height = '300px';
    container.appendChild(canvas);
    
    // Chart.js ile grafik oluştur
    try {
        if (typeof Chart !== 'undefined') {
            // Chart.js ile grafik oluştur
            new Chart(canvas, {
                type: 'horizontalBar',
                data: {
                    labels: chartLabels,
                    datasets: [{
                        label: 'Önem Derecesi (%)',
                        data: chartValues,
                        backgroundColor: chartColors,
                        borderColor: chartColors.map(color => color.replace('0.8', '1')),
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    title: {
                        display: true,
                        text: `${countryName} - Özellik Önemi`
                    },
                    legend: {
                        display: false
                    },
                    scales: {
                        xAxes: [{
                            ticks: {
                                beginAtZero: true,
                                max: 100
                            }
                        }]
                    },
                    tooltips: {
                        callbacks: {
                            label: function(tooltipItem, data) {
                                return `Önem: %${tooltipItem.xLabel.toFixed(1)}`;
                            }
                        }
                    }
                }
            });
        } else {
            // Chart.js yoksa HTML tabanlı grafik oluştur
            let html = `
                <h5 class="text-center mb-3">${countryName} - Özellik Önemi Dereceleri</h5>
                <div class="feature-chart">
            `;
            
            features.forEach(feature => {
                const name = feature.name || feature.feature || "Özellik";
                const importance = feature.importance !== undefined ? feature.importance : (feature.value || 0);
                const percentValue = (importance * 100).toFixed(1);
                const progressClass = getProgressBarClass(importance);
                
                html += `
                    <div class="feature-item mb-3">
                        <div class="d-flex justify-content-between mb-1">
                            <span>${name}</span>
                            <span class="fw-bold">%${percentValue}</span>
                        </div>
                        <div class="progress">
                            <div class="progress-bar ${progressClass}" role="progressbar" 
                                 style="width: ${percentValue}%" 
                                 aria-valuenow="${percentValue}" aria-valuemin="0" aria-valuemax="100">
                            </div>
                        </div>
                    </div>
                `;
            });
            
            html += '</div>';
            container.innerHTML = html;
        }
    } catch (error) {
        console.error('Grafik oluşturulurken hata:', error);
        
        // Hata durumunda basit HTML grafik oluştur
        let html = `
            <div class="alert alert-warning mb-3">Grafik oluşturulamadı, basit görünüm gösteriliyor.</div>
            <h5 class="text-center mb-3">${countryName} - Özellik Önemi Dereceleri</h5>
            <div class="table-responsive">
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Özellik</th>
                            <th>Önem (%)</th>
                            <th>Gösterge</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        features.forEach((feature, index) => {
            const name = feature.name || feature.feature || "Özellik";
            const importance = feature.importance !== undefined ? feature.importance : (feature.value || 0);
            const percentValue = (importance * 100).toFixed(1);
            const progressClass = getProgressBarClass(importance);
            
            html += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${name}</td>
                    <td>${percentValue}%</td>
                    <td>
                        <div class="progress">
                            <div class="progress-bar ${progressClass}" role="progressbar" 
                                 style="width: ${percentValue}%" 
                                 aria-valuenow="${percentValue}" aria-valuemin="0" aria-valuemax="100">
                            </div>
                        </div>
                    </td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
        
        container.innerHTML = html;
    }
}

/**
 * Özellik önemi istatistiklerini render eder
 * @param {HTMLElement} container - İstatistik konteyneri
 * @param {Array} features - Özellik verileri
 * @param {string} countryName - Ülke adı
 */
function renderFeatureImportanceStats(container, features, countryName) {
    // En önemli 5 özelliği al
    const topFeatures = features.slice(0, 5);
    
    // Toplam önem değerini hesapla
    let totalImportance = 0;
    topFeatures.forEach(feature => {
        const importance = feature.importance !== undefined ? feature.importance : (feature.value || 0);
        totalImportance += importance;
    });
    
    // HTML oluştur
    let html = `
        <h5 class="mb-4">En Önemli 5 Özellik</h5>
        <ul class="list-group mb-4">
    `;
    
    topFeatures.forEach((feature, index) => {
        // Özellik adı ve değerlerinin doğru şekilde alınmasını sağla
        const name = feature.name || feature.feature || "Yenilenebilir Enerji Özelliği " + (index + 1);
        const importance = feature.importance !== undefined ? feature.importance : (feature.value || 0);
        const percentValue = (importance * 100).toFixed(1);
        const badgeClass = getImportanceBadge(importance);
        
        html += `
            <li class="list-group-item d-flex justify-content-between align-items-center">
                <div>
                    <span class="badge bg-primary rounded-circle me-2">${index + 1}</span>
                    ${name}
                </div>
                <span class="${badgeClass}">${percentValue}%</span>
            </li>
        `;
    });
    
    html += `
        </ul>
        <div class="card bg-light">
            <div class="card-body">
                <h6 class="card-title">Özellik Önemi Analizi Nedir?</h6>
                <p class="card-text small">
                    Özellik önemi analizi, makine öğrenmesi modellerinde hangi değişkenlerin tahminlerde 
                    en etkili olduğunu gösteren bir tekniktir. Yüksek önem değerine sahip değişkenler, 
                    enerji tüketimini tahmin etmede daha belirleyici faktörlerdir.
                </p>
            </div>
        </div>
    `;
    
    // HTML'i konteynere ekle
    container.innerHTML = html;
}

/**
 * Önem seviyesini belirleyen metinsel açıklama döndürür
 * @param {number} importance - Önem değeri (0-1 arası)
 * @returns {string} - Önem seviyesi açıklaması
 */
function getImportanceLevel(importance) {
    if (!importance && importance !== 0) return 'Bilinmiyor';
    
    if (importance >= 0.7) return 'Çok Yüksek';
    if (importance >= 0.4) return 'Yüksek';
    if (importance >= 0.2) return 'Orta';
    if (importance >= 0.1) return 'Düşük';
    return 'Çok Düşük';
}

function generateColorPalette(count) {
    // Canlı ve modern renkler
    const vibrantColors = [
        '#FF6384', // Canlı Pembe
        '#36A2EB', // Canlı Mavi
        '#FFCE56', // Canlı Sarı
        '#4BC0C0', // Canlı Turkuaz
        '#9966FF', // Canlı Mor
        '#FF9F40', // Canlı Turuncu
        '#00C49A', // Canlı Yeşil
        '#F67019', // Canlı Koyu Turuncu
        '#B2912F', // Altın
        '#C9CBCF'  // Açık Gri
    ];
    if (count <= vibrantColors.length) {
        return vibrantColors.slice(0, count);
    }
    // Fazla bar için canlı rastgele renkler üret
    const colors = [...vibrantColors];
    for (let i = vibrantColors.length; i < count; i++) {
        // Canlı renk üretmek için HSL kullan
        const hue = Math.floor(Math.random() * 360);
        colors.push(`hsl(${hue}, 85%, 55%)`);
    }
    return colors;
} 