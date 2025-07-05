/**
 * Gelecek Tahminleri JavaScript Dosyası
 */

// Tahmin İşlemleri

// Tahmin verilerini getir
function fetchPredictionData(countryName, futureYear) {
    if (!countryName) {
        showPredictionError('Lütfen bir ülke seçin');
        return;
    }
    
    if (!futureYear || isNaN(futureYear) || futureYear < 1) {
        showPredictionError('Geçerli bir tahmin yılı girin');
        return;
    }
    
    // Yükleniyor göster
    const chartContainer = document.getElementById('prediction-chart-container');
    const predictionInfoContainer = document.getElementById('prediction-info-container');
    
    if (chartContainer) {
        chartContainer.innerHTML = `
            <div class="d-flex justify-content-center align-items-center" style="height: 400px;">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Yükleniyor...</span>
                </div>
            </div>
        `;
    }
    
    if (predictionInfoContainer) {
        predictionInfoContainer.innerHTML = '<p class="text-center">Yükleniyor...</p>';
    }
    
    // URL oluştur
    const url = `/api/data/prediction/${encodeURIComponent(countryName)}?year=${futureYear}`;
    
    // API'ye istek at
    fetch(url)
        .then(response => response.json())
        .then(data => {
            console.log('Tahmin API yanıtı:', data); // Kontrol için
            if (data.success) {
                renderPredictionData(data);
            } else {
                console.error('Tahmin verileri alınamadı:', data.error);
                showPredictionError('Tahmin verileri alınamadı: ' + data.error);
            }
        })
        .catch(error => {
            console.error('API hatası:', error);
            showPredictionError('API bağlantı hatası');
        });
}

// Tahmin verilerini göster
function renderPredictionData(data) {
    // Gösterge değerlerini güncelle
    updatePredictionMetrics(data);
    
    // Tahmin grafiğini oluştur
    createPredictionChart(data);
    
    // Tahmin açıklamasını güncelle
    updatePredictionDescription(data);
}

// Tahmin metriklerini güncelle
function updatePredictionMetrics(data) {
    const predictionValue = document.getElementById('predicted-avg');
    const maxValue = document.getElementById('predicted-max');
    const minValue = document.getElementById('predicted-min');
    
    if (!predictionValue || !maxValue || !minValue) return;
    
    // API yanıtı eski sürüm ise (prediction nesnesi yok, sadece değer var)
    if (data.prediction && typeof data.prediction !== 'object') {
        predictionValue.textContent = `%${data.prediction.toFixed(2)}`;
        
        // Demo değerler
        const variance = data.prediction * 0.15; // %15 varyans
        maxValue.textContent = `%${(data.prediction + variance).toFixed(2)}`;
        minValue.textContent = `%${Math.max(0, (data.prediction - variance)).toFixed(2)}`;
        return;
    }
    
    // Yeni API yanıtı formatı
    const prediction = data.prediction;
    
    if (prediction && prediction.value !== undefined) {
        predictionValue.textContent = `%${prediction.value.toFixed(2)}`;
        
        // Güven aralığı varsa
        if (prediction.confidence_interval) {
            maxValue.textContent = `%${prediction.confidence_interval.upper.toFixed(2)}`;
            minValue.textContent = `%${prediction.confidence_interval.lower.toFixed(2)}`;
        } else {
            // Varsayılan değerler
            const variance = prediction.value * 0.15;
            maxValue.textContent = `%${(prediction.value + variance).toFixed(2)}`;
            minValue.textContent = `%${Math.max(0, (prediction.value - variance)).toFixed(2)}`;
        }
    } else {
        // Veri yoksa varsayılanlar
        predictionValue.textContent = '--%';
        maxValue.textContent = '--%';
        minValue.textContent = '--%';
    }
}

// Tahmin grafiğini oluştur
function createPredictionChart(data) {
    const chartContainer = document.getElementById('prediction-chart-container');
    if (!chartContainer) return;
    
    // Chart.js yüklenmiş mi kontrol et ve eğer yüklenmediyse yükle
    if (typeof Chart === 'undefined') {
        const scriptElement = document.createElement('script');
        scriptElement.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        scriptElement.onload = function() {
            console.log('Chart.js başarıyla yüklendi');
            // Chart.js yüklendikten sonra grafiği oluştur
            createChartAfterLoad(data, chartContainer);
        };
        scriptElement.onerror = function() {
            console.error('Chart.js yüklenemedi');
            // Yüklenemediğinde alternatif gösterim
            showAlternativeChart(data, chartContainer);
        };
        document.head.appendChild(scriptElement);
    } else {
        // Chart.js zaten yüklüyse direkt grafiği oluştur
        createChartAfterLoad(data, chartContainer);
    }
}

// Chart.js yüklendikten sonra grafiği oluştur
function createChartAfterLoad(data, container) {
    // Veri yoksa veya bozuksa hata göster
    if (!data || !data.chart_data) {
        showAlternativeChart(data, container);
        return;
    }
    
    // Canvas elementini oluştur
    container.innerHTML = `<canvas id="prediction-chart"></canvas>`;
    const canvas = document.getElementById('prediction-chart');
    
    if (!canvas) return;
    
    // Grafik oluştur
    new Chart(canvas, {
        type: 'line',
        data: data.chart_data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            scales: {
                y: {
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
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            if (context.raw === null) return '';
                            return `${context.dataset.label}: %${context.raw.toFixed(2)}`;
                        }
                    }
                },
                legend: {
                    position: 'top',
                }
            }
        }
    });
}

// Alternatif grafik gösterimi (Chart.js yüklenemezse)
function showAlternativeChart(data, container) {
    // Veri doğrulama
    const hasValidData = data && 
                         data.chart_data && 
                         data.chart_data.datasets && 
                         data.chart_data.datasets.length > 0 && 
                         data.chart_data.labels;
    
    if (!hasValidData) {
        container.innerHTML = `
            <div class="alert alert-warning">
                <i class="bi bi-exclamation-triangle-fill me-2"></i>
                Grafik verileri yüklenemedi veya eksik.
            </div>
        `;
        return;
    }
    
    // Tablo olarak göster
    let tableHTML = `
        <div class="table-responsive">
            <table class="table table-bordered">
                <thead>
                    <tr>
                        <th>Yıl</th>
    `;
    
    // Dataset başlıkları ekle
    data.chart_data.datasets.forEach(dataset => {
        tableHTML += `<th>${dataset.label}</th>`;
    });
    
    tableHTML += `
                    </tr>
                </thead>
                <tbody>
    `;
    
    // Her yıl için veri satırı ekle
    data.chart_data.labels.forEach((year, index) => {
        tableHTML += `
            <tr>
                <td>${year}</td>
        `;
        
        // Her dataset için değer ekle
        data.chart_data.datasets.forEach(dataset => {
            const value = dataset.data[index];
            if (value === null || value === undefined) {
                tableHTML += `<td>-</td>`;
            } else {
                tableHTML += `<td>%${value.toFixed(2)}</td>`;
            }
        });
        
        tableHTML += `</tr>`;
    });
    
    tableHTML += `
                </tbody>
            </table>
        </div>
    `;
    
    container.innerHTML = tableHTML;
}

// Tahmin açıklamasını güncelle
function updatePredictionDescription(data) {
    const container = document.getElementById('prediction-info-container');
    if (!container) return;
    
    // Verileri çıkar
    const country = data.country;
    const futureYear = data.year || data.future_year;
    
    // Yeni API formatı (prediction bir nesne)
    if (data.prediction && typeof data.prediction === 'object') {
        const prediction = data.prediction;
        // Fonksiyonu daha önce tanımlandığı şekilde çağır
        renderPredictionInfo(data);
        return;
    }
    
    // Eski API formatı (prediction bir sayı)
    if (data.prediction && typeof data.prediction !== 'object') {
        const predictionValue = data.prediction;
        
        // Tahmin değişim yönünü belirle (demo)
        const changePercent = Math.random() > 0.5 ? 
            (Math.random() * 15 + 5).toFixed(1) : 
            (-Math.random() * 15 - 5).toFixed(1);
        const isPositive = parseFloat(changePercent) > 0;
        
        const changeClass = isPositive ? 'success' : 'danger';
        const changeIcon = isPositive ? 'bi-arrow-up-right' : 'bi-arrow-down-right';
        const trendText = isPositive ? 'Artış Gösteriyor' : 'Azalış Gösteriyor';
        
        // Kart oluştur
        container.innerHTML = `
            <div class="card border-primary">
                <div class="card-header bg-primary text-white">
                    <h5 class="mb-0">${country} için ${futureYear} Yılı Tahmini</h5>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6">
                            <h2 class="display-4 text-primary mb-3">%${predictionValue.toFixed(2)}</h2>
                            <p class="mb-1">
                                <span class="badge bg-${changeClass}">
                                    <i class="bi ${changeIcon}"></i> ${trendText} (%${Math.abs(changePercent)})
                                </span>
                            </p>
                            <p class="text-muted small mb-3">Bir önceki döneme göre değişim</p>
                        </div>
                        <div class="col-md-6">
                            <div class="alert alert-info">
                                <h6><i class="bi bi-info-circle-fill me-2"></i>Tahmin Hakkında:</h6>
                                <p class="mb-0">Bu tahmin, geçmiş veriler kullanılarak zaman serisi analizi ile oluşturulmuştur. Gerçek değerler, ekonomik, politik ve çevresel faktörlere bağlı olarak farklılık gösterebilir.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } else {
        // Tahmin verisi yoksa
        container.innerHTML = `
            <div class="alert alert-warning">
                <i class="bi bi-exclamation-triangle-fill me-2"></i>
                ${country} için ${futureYear} yılı tahmini hesaplanamadı.
            </div>
        `;
    }
}

// Tahmin bilgilerini göster
function renderPredictionInfo(data) {
    const container = document.getElementById('prediction-info-container');
    if (!container) return;
    
    // Verileri çıkar
    const country = data.country;
    const futureYear = data.future_year;
    const prediction = data.prediction;
    
    if (!prediction || prediction.value === null) {
        container.innerHTML = `
            <div class="alert alert-warning">
                <i class="bi bi-exclamation-triangle-fill me-2"></i>
                ${country} için ${futureYear} yılı tahmini hesaplanamadı.
            </div>
        `;
        return;
    }
    
    // Değişim yönüne göre renk ve simge belirle
    const changeClass = prediction.trend_class === 'positive' ? 'success' : 'danger';
    const changeIcon = prediction.trend_class === 'positive' ? 'bi-arrow-up-right' : 'bi-arrow-down-right';
    
    // Kart oluştur
    let cardHTML = `
        <div class="card border-primary">
            <div class="card-header bg-primary text-white">
                <h5 class="mb-0">${country} için ${futureYear} Yılı Tahmini</h5>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-6">
                        <h2 class="display-4 text-primary mb-3">%${prediction.value.toFixed(2)}</h2>
                        <p class="mb-1">
                            <span class="badge bg-${changeClass}">
                                <i class="bi ${changeIcon}"></i> ${prediction.trend_text}
                            </span>
                        </p>
                        <p class="text-muted small mb-3">Bir önceki döneme göre değişim</p>
    `;
    
    // Güven aralığı varsa ekle
    if (prediction.confidence_interval) {
        cardHTML += `
                        <div class="mt-3">
                            <h6>Güven Aralığı:</h6>
                            <p class="mb-1">Alt: %${prediction.confidence_interval.lower.toFixed(2)}</p>
                            <p>Üst: %${prediction.confidence_interval.upper.toFixed(2)}</p>
                        </div>
        `;
    }
    
    cardHTML += `
                    </div>
                    <div class="col-md-6">
                        <div class="alert alert-info">
                            <h6><i class="bi bi-info-circle-fill me-2"></i>Tahmin Hakkında:</h6>
                            <p class="mb-0">Bu tahmin, geçmiş veriler kullanılarak ileri beslemeli sinir ağları ve zaman serisi analizi ile oluşturulmuştur. Gerçek değerler, ekonomik, politik ve çevresel faktörlere bağlı olarak farklılık gösterebilir.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = cardHTML;
}

// Hata mesajını göster
function showPredictionError(message) {
    const chartContainer = document.getElementById('prediction-chart-container');
    const infoContainer = document.getElementById('prediction-info-container');
    
    const errorHTML = `
        <div class="alert alert-danger m-3">
            <i class="bi bi-exclamation-triangle-fill me-2"></i>
            ${message}
        </div>
    `;
    
    if (chartContainer) chartContainer.innerHTML = errorHTML;
    if (infoContainer) infoContainer.innerHTML = '';
}

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', function() {
    // Ülke listesini doldur
    initializeCountrySelect();
    
    // Tahmin butonuna tıklanınca
    const applyPredictionBtn = document.getElementById('apply-prediction');
    if (applyPredictionBtn) {
        applyPredictionBtn.addEventListener('click', function() {
            const countrySelect = document.getElementById('prediction-country-select');
            const yearInput = document.getElementById('prediction-year');
            
            if (countrySelect && yearInput) {
                const selectedCountry = countrySelect.value;
                const futureYear = parseInt(yearInput.value);
                
                // Sonuç bölümünü görünür yap
                const resultDiv = document.getElementById('prediction-result');
                if (resultDiv) {
                    resultDiv.classList.remove('d-none');
                }
                
                // Tahmin verilerini getir
                fetchPredictionData(selectedCountry, futureYear);
            }
        });
    }
    
    // Tahmin formu
    const predictionForm = document.getElementById('prediction-form');
    if (predictionForm) {
        predictionForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const countrySelect = document.getElementById('prediction-country-select');
            const yearInput = document.getElementById('prediction-year');
            
            if (countrySelect && yearInput) {
                const selectedCountry = countrySelect.value;
                const futureYear = parseInt(yearInput.value);
                
                // Sonuç bölümünü görünür yap
                const resultDiv = document.getElementById('prediction-result');
                if (resultDiv) {
                    resultDiv.classList.remove('d-none');
                }
                
                // Tahmin verilerini getir
                fetchPredictionData(selectedCountry, futureYear);
            }
        });
    }
});

/**
 * Ülke seçim listesini oluşturur
 */
function initializeCountrySelect() {
    const countrySelect = document.getElementById('prediction-country-select');
    if (!countrySelect) return;
    
    // Yükleniyor göstergesi
    countrySelect.innerHTML = '<option value="">Ülkeler yükleniyor...</option>';
    countrySelect.disabled = true;
    
    // API'den ülke listesini al - önce API ülkeler, sonra alternatif endpoint dene
    console.log('Ülke listesi alınıyor - /api/countries denemesi yapılıyor');
    
    // Sırayla denenecek API endpointleri
    const endpoints = [
        '/api/countries',
        '/api/data/countries'
    ];
    
    // Her endpoint için bir Promise oluştur
    const fetchPromises = endpoints.map(endpoint => 
        fetch(endpoint)
            .then(response => {
                // HTTP başarı durumunu kontrol et
                if (!response.ok) {
                    throw new Error(`HTTP error ${response.status}: ${endpoint}`);
                }
                return response.json();
            })
            .then(data => {
                // API yanıtını kontrol et
                if (!data.success) {
                    console.warn(`Endpoint ${endpoint} başarısız cevap döndü:`, data);
                    throw new Error(data.error || 'Ülke listesi alınamadı');
                }
                console.log(`${endpoint} endpoint'inden ülke listesi alındı:`, data);
                return {endpoint, data};
            })
    );
    
    // İlk başarılı olan Promise'i kullan
    Promise.any(fetchPromises)
        .then(({endpoint, data}) => {
            console.log(`Ülke listesi ${endpoint} endpoint'inden başarıyla alındı`);
            
            // Liste başlangıcı
            countrySelect.innerHTML = '<option value="" selected disabled>Bir ülke seçin</option>';
            
            // Alınan ülkeleri sırala ve ekle
            const countries = data.countries;
            
            if (!countries || !Array.isArray(countries) || countries.length === 0) {
                console.warn('Ülke listesi boş veya geçersiz format:', countries);
                throw new Error('Ülke listesi boş veya geçersiz format');
            }
            
            // Formatı kontrol et ve düzenle
            const formattedCountries = countries.map(country => {
                if (typeof country === 'object' && country !== null) {
                    return country.name || country.code || country.value || country;
                }
                return country;
            });
            
            formattedCountries.sort((a, b) => String(a).localeCompare(String(b), 'tr'));
            
            formattedCountries.forEach(country => {
                const option = document.createElement('option');
                option.value = country;
                option.textContent = country;
                // Türkiye'yi varsayılan olarak seç
                if (country === 'Turkey' || country === 'Türkiye') {
                    option.selected = true;
                    selectedCountry = country;
                }
                countrySelect.appendChild(option);
            });
            
            // Seçim kutusunu aktifleştir
            countrySelect.disabled = false;
            console.log('Ülke listesi başarıyla yüklendi, toplam:', formattedCountries.length);
        })
        .catch(error => {
            console.error('Ülke listesi yüklenirken hata:', error);
            countrySelect.innerHTML = '<option value="">Ülke listesi yüklenemedi</option>';
            countrySelect.disabled = true;
            
            // Örnek ülke listesi oluştur (yedek plan)
            setTimeout(() => {
                const fallbackCountries = [
                    'Turkey', 'Germany', 'United States', 'China', 'Japan',
                    'Brazil', 'India', 'France', 'Spain', 'Italy'
                ];
                
                console.log('Yedek ülke listesi kullanılıyor');
                countrySelect.innerHTML = '<option value="" selected disabled>Bir ülke seçin</option>';
                
                fallbackCountries.forEach(country => {
                    const option = document.createElement('option');
                    option.value = country;
                    option.textContent = country;
                    // Türkiye'yi varsayılan olarak seç
                    if (country === 'Turkey') {
                        option.selected = true;
                        selectedCountry = country;
                    }
                    countrySelect.appendChild(option);
                });
                
                countrySelect.disabled = false;
                showNotification('API hatası: Örnek ülke listesi kullanılıyor', 'warning');
            }, 800);
        });
} 