/**
 * Yenilenebilir Enerji İstatistikleri
 * Ana JavaScript Dosyası
 * 
 * Bu dosya, web uygulamasının frontend işlevselliğini yönetir:
 * - API çağrıları
 * - Veri görselleştirme
 * - Kullanıcı etkileşimi
 */

// Global değişkenler
let countryChart = null;
let countriesData = [];

// Sayfa yüklendiğinde çalışacak fonksiyon
document.addEventListener('DOMContentLoaded', function() {
    // Genel bakış verilerini yükle
    loadOverviewData();
    
    // Ülke listesini yükle
    loadCountriesList();
    
    // Ülke seçimi değiştiğinde
    document.getElementById('country-select').addEventListener('change', function() {
        const selectedCountry = this.value;
        if (selectedCountry) {
            loadCountryData(selectedCountry);
        }
    });
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 70,
                    behavior: 'smooth'
                });
            }
        });
    });
});

/**
 * Genel bakış verilerini API'den yükler ve görüntüler
 */
async function loadOverviewData() {
    try {
        const response = await fetch('/api/data/overview');
        const data = await response.json();
        
        if (!data || !data.overview) {
            throw new Error('Veri alınamadı');
        }
        
        // Genel istatistikleri göster
        displayOverviewStats(data.overview);
        
        // En yüksek ve en düşük ülkeleri göster
        displayTopCountries(data.top_countries);
        displayBottomCountries(data.bottom_countries);
        
    } catch (error) {
        console.error('Genel bakış verileri yüklenirken hata oluştu:', error);
        showErrorMessage('overview-stats', 'Veri yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.');
    }
}

/**
 * Ülke listesini API'den yükler ve seçim kutusunu doldurur
 */
async function loadCountriesList() {
    try {
        const selectElement = document.getElementById('country-select');
        if (!selectElement) {
            console.error('country-select ID\'li eleman bulunamadı!');
            return;
        }
        
        // Yükleniyor durumunu göster
        selectElement.disabled = true;
        selectElement.innerHTML = '<option value="">Yükleniyor...</option>';
        
        const response = await fetch('/api/data/countries');
        
        if (!response.ok) {
            throw new Error(`API yanıtı başarısız: ${response.status}`);
        }
        
        const data = await response.json();
        
        // API yanıtını konsola yazdırarak içeriğini görelim
        console.log('API Yanıtı:', data);
        
        // Veri yapısını kontrol et
        if (!data) {
            throw new Error('API yanıtı geçersiz');
        }
        
        // Başarı durumunu kontrol et (eğer API başarı bilgisi dönüyorsa)
        if (data.hasOwnProperty('success') && !data.success) {
            throw new Error('Ülke listesi alınamadı: ' + (data.error || data.message || 'Bilinmeyen hata'));
        }
        
        // Ülke verilerini al, API yanıt yapısına göre uyarla
        let countries = [];
        
        if (data.countries) {
            // {countries: [...]} formatı
            countries = data.countries;
        } else if (Array.isArray(data)) {
            // Doğrudan dizi formatı
            countries = data;
        } else if (typeof data === 'object' && Object.keys(data).length > 0) {
            // Başka bir obje formatı, içinde dizi olabilir
            // İlk array tipindeki değeri bulmaya çalış
            for (const key in data) {
                if (Array.isArray(data[key]) && data[key].length > 0) {
                    countries = data[key];
                    break;
                }
            }
        }
        
        if (!Array.isArray(countries) || countries.length === 0) {
            throw new Error('Ülke listesi bulunamadı veya boş');
        }
        
        // Global değişkene atama
        countriesData = countries;
        
        // Mevcut seçenekleri temizle
        selectElement.innerHTML = '<option value="" selected disabled>Bir ülke seçin</option>';
        
        // Veri yapısını kontrol et ve ona göre işle
        if (typeof countries[0] === 'string') {
            // String listesi durumu
            countries.sort((a, b) => String(a).localeCompare(String(b), 'tr'));
            
            countries.forEach(country => {
                const option = document.createElement('option');
                option.value = country;
                option.textContent = country;
                selectElement.appendChild(option);
            });
        } else if (typeof countries[0] === 'object') {
            // Obje listesi durumu - hangi alanın kullanılacağını belirle
            const nameKey = countries[0].hasOwnProperty('name') ? 'name' : 
                           countries[0].hasOwnProperty('country') ? 'country' : 
                           countries[0].hasOwnProperty('title') ? 'title' : 
                           Object.keys(countries[0])[0]; // İlk anahtar
            
            const valueKey = countries[0].hasOwnProperty('id') ? 'id' : 
                            countries[0].hasOwnProperty('code') ? 'code' : nameKey;
            
            countries.sort((a, b) => String(a[nameKey]).localeCompare(String(b[nameKey]), 'tr'));
            
            countries.forEach(country => {
                const option = document.createElement('option');
                option.value = country[valueKey];
                option.textContent = country[nameKey];
                selectElement.appendChild(option);
            });
        }
        
        // Seçim kutusunu aktifleştir
        selectElement.disabled = false;
        
        console.log('Ülke listesi yüklendi ve seçim kutusu dolduruldu. Toplam:', countries.length);
        
    } catch (error) {
        console.error('Ülke listesi yüklenirken hata oluştu:', error);
        
        const selectElement = document.getElementById('country-select');
        if (selectElement) {
            selectElement.disabled = true;
            selectElement.innerHTML = '<option value="">Ülke listesi yüklenemedi</option>';
            
            // Hata mesajını kullanıcıya göster
            const errorContainer = document.getElementById('country-select-error');
            if (errorContainer) {
                errorContainer.textContent = `Hata: ${error.message}`;
                errorContainer.style.display = 'block';
            } else {
                // Hata container'ı yoksa, seçim kutusunun yanına bir hata mesajı ekle
                const parentElement = selectElement.parentElement;
                if (parentElement) {
                    const errorDiv = document.createElement('div');
                    errorDiv.id = 'country-select-error';
                    errorDiv.className = 'text-danger mt-2';
                    errorDiv.textContent = `Hata: ${error.message}`;
                    parentElement.appendChild(errorDiv);
                }
            }
        }
    }
}

/**
 * Seçilen ülkeye ait yenilenebilir enerji tüketimi verilerini yükler ve görüntüler
 * @param {string} countryName - Yüklenecek ülkenin adı
 */
function loadCountryData(countryName) {
    // Eğer ülke adı yoksa işlemi durdur
    if (!countryName) {
        console.error('Ülke adı belirtilmedi');
        showError('Lütfen bir ülke seçin');
        return;
    }

    // Yükleniyor durumunu göster
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) loadingIndicator.style.display = 'block';
    
    // Hata mesajlarını temizle
    hideError();
    
    // API isteği yap
    fetch(`/api/country-data?country=${encodeURIComponent(countryName)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`API yanıtı başarısız: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // Yükleniyor göstergesini gizle
            if (loadingIndicator) loadingIndicator.style.display = 'none';
            
            // API yanıtını kontrol et
            if (!data || !data.success) {
                throw new Error(data.message || 'Ülke verileri alınamadı');
            }
            
            // Ülke istatistiklerini göster
            displayCountryStats(data);
            
            // Ülke grafiğini oluştur
            if (data.yearly_data && Array.isArray(data.yearly_data)) {
                createCountryChart(countryName, data.yearly_data);
            } else {
                console.error('Grafik verisi bulunamadı veya geçersiz format');
                showError('Grafik verisi yüklenemedi');
            }
            
            // Ülke raporunu görünür yap
            document.getElementById('country-report').style.display = 'block';
        })
        .catch(error => {
            console.error('Ülke verisi yüklenirken hata:', error);
            if (loadingIndicator) loadingIndicator.style.display = 'none';
            showError(`Veri yüklenirken hata oluştu: ${error.message}`);
            document.getElementById('country-report').style.display = 'none';
        });
}

/**
 * Genel bakış istatistiklerini görüntüler
 * @param {Object} data - Genel bakış verileri
 */
function displayOverviewStats(data) {
    // Toplam ülke sayısı
    const totalCountriesElement = document.querySelector('#overview-stats .card:nth-child(1) h3');
    totalCountriesElement.textContent = data.total_countries;
    totalCountriesElement.classList.remove('loading-placeholder');
    
    // Ortalama yenilenebilir oran
    const avgRenewableElement = document.querySelector('#overview-stats .card:nth-child(2) h3');
    avgRenewableElement.textContent = `%${data.renewable_stats.mean.toFixed(1)}`;
    avgRenewableElement.classList.remove('loading-placeholder');
    
    // Yıl aralığı
    const yearRangeElement = document.querySelector('#overview-stats .card:nth-child(3) h3');
    yearRangeElement.textContent = `${data.year_range.min} - ${data.year_range.max}`;
    yearRangeElement.classList.remove('loading-placeholder');
}

/**
 * En yüksek oranlı ülkeleri tabloda gösterir
 * @param {Array} countries - Ülke verileri
 */
function displayTopCountries(countries) {
    const tableBody = document.querySelector('#top-countries-table tbody');
    tableBody.innerHTML = '';
    
    if (!countries || countries.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="3" class="text-center">Veri bulunamadı</td>';
        tableBody.appendChild(row);
        return;
    }
    
    countries.forEach((country, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${country.country}</td>
            <td>%${country.value.toFixed(1)}</td>
        `;
        tableBody.appendChild(row);
    });
}

/**
 * En düşük oranlı ülkeleri tabloda gösterir
 * @param {Array} countries - Ülke verileri
 */
function displayBottomCountries(countries) {
    const tableBody = document.querySelector('#bottom-countries-table tbody');
    tableBody.innerHTML = '';
    
    if (!countries || countries.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="3" class="text-center">Veri bulunamadı</td>';
        tableBody.appendChild(row);
        return;
    }
    
    countries.forEach((country, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${country.country}</td>
            <td>%${country.value.toFixed(1)}</td>
        `;
        tableBody.appendChild(row);
    });
}

/**
 * Ülke istatistiklerini gösterir
 * @param {Object} data - API'den gelen ülke verileri
 */
function displayCountryStats(data) {
    // Ülke başlığını güncelle
    const countryTitle = document.getElementById('country-title');
    if (countryTitle) countryTitle.textContent = data.country || 'Ülke bilgisi yok';
    
    // İstatistikleri güncelle
    updateStatValue('current-value', data.current_value);
    updateStatValue('average-value', data.average);
    updateStatValue('min-value', data.min_value);
    updateStatValue('max-value', data.max_value);
    
    // Trend göstergesini güncelle
    const trendIndicator = document.getElementById('trend-indicator');
    const trendValue = document.getElementById('trend-value');
    
    if (trendIndicator && trendValue && data.trend !== undefined) {
        const trendPercentage = Number(data.trend).toFixed(2);
        trendValue.textContent = `${Math.abs(trendPercentage)}%`;
        
        if (data.trend > 0) {
            trendIndicator.className = 'trend-up';
            trendIndicator.innerHTML = '<i class="fas fa-arrow-up"></i>';
            trendValue.className = 'text-success';
        } else if (data.trend < 0) {
            trendIndicator.className = 'trend-down';
            trendIndicator.innerHTML = '<i class="fas fa-arrow-down"></i>';
            trendValue.className = 'text-danger';
        } else {
            trendIndicator.className = 'trend-neutral';
            trendIndicator.innerHTML = '<i class="fas fa-minus"></i>';
            trendValue.className = 'text-secondary';
        }
    }
}

/**
 * Belirtilen istatistik öğesini günceller
 * @param {string} elementId - Güncellenecek HTML elemanının ID'si
 * @param {number} value - Gösterilecek değer
 */
function updateStatValue(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        // Değer yoksa veya geçersizse
        if (value === undefined || value === null || isNaN(value)) {
            element.textContent = 'Veri yok';
            return;
        }
        
        // Sayısal değeri formatlayarak göster (2 ondalık)
        element.textContent = Number(value).toFixed(2) + '%';
    } else {
        console.error(`${elementId} ID'li eleman bulunamadı`);
    }
}

/**
 * Ülke verilerini görsel bir grafikte gösterir
 * @param {string} countryName - Ülke adı
 * @param {Array} yearlyData - Yıllara göre veriler
 */
function createCountryChart(countryName, yearlyData) {
    try {
        if (!yearlyData || !Array.isArray(yearlyData) || yearlyData.length === 0) {
            console.error('Grafik oluşturmak için geçerli veri bulunamadı');
            return;
        }
        
        console.log('Grafik verileri:', yearlyData);
        
        // Verileri grafik formatına dönüştür
        const years = [];
        const values = [];
        
        // Verileri yıla göre sırala
        const sortedData = [...yearlyData].sort((a, b) => a.year - b.year);
        
        // Grafik verilerini hazırla
        sortedData.forEach(item => {
            years.push(item.year);
            values.push(Number(item.value));
        });
        
        // Grafik renklerini ayarla
        const chartColors = {
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            pointBackgroundColor: 'rgba(75, 192, 192, 1)',
            pointBorderColor: '#fff'
        };
        
        // Grafik canvas'ını seç
        const chartCanvas = document.getElementById('country-chart');
        if (!chartCanvas) {
            console.error('Grafik canvas elemanı bulunamadı');
            return;
        }
        
        // Eğer hâlihazırda bir grafik varsa yok et
        if (window.countryChart) {
            window.countryChart.destroy();
        }
        
        // Yeni grafiği oluştur
        window.countryChart = new Chart(chartCanvas.getContext('2d'), {
            type: 'line',
            data: {
                labels: years,
                datasets: [{
                    label: `${countryName} Yenilenebilir Enerji Tüketimi %`,
                    data: values,
                    borderColor: chartColors.borderColor,
                    backgroundColor: chartColors.backgroundColor,
                    pointBackgroundColor: chartColors.pointBackgroundColor,
                    pointBorderColor: chartColors.pointBorderColor,
                    borderWidth: 2,
                    pointRadius: 4,
                    tension: 0.1,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.parsed.y.toFixed(2)}%`;
                            }
                        }
                    },
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Yıllara Göre Yenilenebilir Enerji Tüketimi'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        title: {
                            display: true,
                            text: 'Yenilenebilir Enerji Tüketimi (%)'
                        },
                        ticks: {
                            callback: function(value) {
                                return value.toFixed(1) + '%';
                            }
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
        
        console.log('Ülke grafiği başarıyla oluşturuldu');
        
    } catch (error) {
        console.error('Grafik oluşturulurken hata oluştu:', error);
        // Hata durumunda grafik alanını temizleme veya hata mesajı gösterme işlemleri yapılabilir
    }
}

/**
 * Ülke veri tablosunu doldurur
 * @param {Array} data - Yıllara göre veri noktaları
 */
function fillCountryDataTable(data) {
    const tableBody = document.querySelector('#country-data-table tbody');
    tableBody.innerHTML = '';
    
    if (!data || data.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="2" class="text-center">Veri bulunamadı</td>';
        tableBody.appendChild(row);
        return;
    }
    
    // Verileri yıla göre sırala (büyükten küçüğe)
    const sortedData = [...data].sort((a, b) => b.year - a.year);
    
    sortedData.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.year}</td>
            <td>%${item.value.toFixed(2)}</td>
        `;
        tableBody.appendChild(row);
    });
}

/**
 * Trend göstergesini günceller
 * @param {number} trendPercentage - Trend yüzdesi
 */
function updateTrendIndicator(trendPercentage) {
    const trendValue = document.getElementById('trend-value');
    const trendExplanation = document.getElementById('trend-explanation');
    const trendProgress = document.getElementById('trend-progress');
    
    // Trend değerini göster
    trendValue.textContent = `%${trendPercentage.toFixed(1)}`;
    
    // Progress bar'ı ayarla
    let progressWidth = Math.min(Math.abs(trendPercentage), 100);
    trendProgress.style.width = `${progressWidth}%`;
    
    // Trend sınıflarını temizle
    trendValue.classList.remove('trend-positive', 'trend-negative', 'trend-neutral');
    trendProgress.classList.remove('progress-bar-positive', 'progress-bar-negative');
    
    // Trend değerine göre sınıf ve açıklama ekle
    if (trendPercentage > 5) {
        trendValue.classList.add('trend-positive');
        trendProgress.classList.add('progress-bar-positive');
        trendExplanation.textContent = 'Yenilenebilir enerji kullanımında önemli bir artış görülüyor.';
    } else if (trendPercentage < -5) {
        trendValue.classList.add('trend-negative');
        trendProgress.classList.add('progress-bar-negative');
        trendExplanation.textContent = 'Yenilenebilir enerji kullanımında önemli bir düşüş görülüyor.';
    } else if (trendPercentage > 0) {
        trendValue.classList.add('trend-positive');
        trendProgress.classList.add('progress-bar-positive');
        trendExplanation.textContent = 'Yenilenebilir enerji kullanımında hafif bir artış var.';
    } else if (trendPercentage < 0) {
        trendValue.classList.add('trend-negative');
        trendProgress.classList.add('progress-bar-negative');
        trendExplanation.textContent = 'Yenilenebilir enerji kullanımında hafif bir düşüş var.';
    } else {
        trendValue.classList.add('trend-neutral');
        trendExplanation.textContent = 'Yenilenebilir enerji kullanımında önemli bir değişiklik yok.';
    }
}

/**
 * Yükleme durumunu gösterir veya gizler
 * @param {boolean} isLoading - Yükleniyor mu?
 */
function showLoadingState(isLoading) {
    const countryDetailsElement = document.getElementById('country-details');
    
    if (isLoading) {
        countryDetailsElement.classList.add('loading');
    } else {
        countryDetailsElement.classList.remove('loading');
    }
}

/**
 * Hata mesajını gösterir
 * @param {string} elementId - Hata mesajının gösterileceği elementin ID'si
 * @param {string} message - Hata mesajı
 */
function showErrorMessage(elementId, message) {
    const element = document.getElementById(elementId);
    
    if (!element) return;
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-danger mt-3';
    errorDiv.textContent = message;
    
    // Önceki hata mesajlarını temizle
    const existingErrors = element.querySelectorAll('.alert-danger');
    existingErrors.forEach(el => el.remove());
    
    element.appendChild(errorDiv);
} 