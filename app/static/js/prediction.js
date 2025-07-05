/**
 * Gelecek Tahminleri JavaScript Dosyası
 * 
 * Bu dosya, gelecek tahminleri bölümünün fonksiyonlarını içerir:
 * - Tahmin grafiği
 * - Tahmin açıklamaları
 */

// Global değişkenler
let predictionChart = null;
let selectedCountry = '';

// Sayfa yüklendiğinde çalışacak işlemler
document.addEventListener('DOMContentLoaded', function() {
    // Ülke seçim listesini doldur
    initializeCountrySelect();
    
    // Tahmin Yap butonuna tıklandığında
    const applyButton = document.getElementById('apply-prediction');
    if (applyButton) {
        applyButton.addEventListener('click', function() {
            const countrySelect = document.getElementById('prediction-country-select');
            const yearInput = document.getElementById('prediction-year');
            
            if (!countrySelect || !countrySelect.value) {
                showNotification('Lütfen bir ülke seçin', 'warning');
                return;
            }
            
            if (!yearInput || !yearInput.value || yearInput.value < 2024 || yearInput.value > 2050) {
                showNotification('Lütfen 2024-2050 arasında geçerli bir yıl girin', 'warning');
                return;
            }
            
            // Seçilen değerleri al
            const country = countrySelect.value;
            const years = parseInt(yearInput.value) - new Date().getFullYear();
            
            // Tahmin yap
            loadPredictionData(country, years);
        });
    }
    
    // Ülke seçiminde değişiklik
    const countrySelect = document.getElementById('prediction-country-select');
    if (countrySelect) {
        countrySelect.addEventListener('change', function() {
            selectedCountry = this.value;
        });
    }
    
    // Tahmin yılı değiştiğinde validasyon
    const yearInput = document.getElementById('prediction-year');
    if (yearInput) {
        yearInput.addEventListener('input', function() {
            if (this.value < 2024) this.value = 2024;
            if (this.value > 2050) this.value = 2050;
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
    
    // API'den ülke listesini al
    fetch('/api/data/countries')
        .then(response => response.json())
        .then(data => {
            // API yanıtını kontrol et
            if (!data.success) {
                throw new Error(data.error || 'Ülke listesi alınamadı');
            }
            
            // Liste başlangıcı
            countrySelect.innerHTML = '<option value="" selected disabled>Bir ülke seçin</option>';
            
            // Alınan ülkeleri sırala ve ekle
            const countries = data.countries;
            countries.sort((a, b) => a.localeCompare(b, 'tr'));
            
            countries.forEach(country => {
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
        })
        .catch(error => {
            console.error('Ülke listesi yüklenirken hata:', error);
            countrySelect.innerHTML = '<option value="">Ülke listesi yüklenemedi</option>';
            countrySelect.disabled = true;
            showNotification('Ülke listesi yüklenemedi: ' + error.message, 'error');
        });
}

/**
 * Tahmin verilerini API'den yükler
 * @param {string} countryName - Ülke adı
 * @param {number} yearsAhead - Kaç yıl ilerisi için tahmin
 */
async function loadPredictionData(countryName, yearsAhead = 5) {
    try {
        // Tahmin sonuç bölümünü göster
        document.getElementById('prediction-result').classList.remove('d-none');
        
        // Yükleniyor göster
        showPredictionLoading(true);
        
        // API'den tahmin verilerini al
        const response = await fetch(`/api/data/prediction/${encodeURIComponent(countryName)}?years=${yearsAhead}`);
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Tahmin yapılamadı');
        }
        
        // Tahmin grafiğini oluştur
        createOrUpdatePredictionChart(data);
        
        // Tahmin açıklamalarını göster
        displayPredictionInfo(data);
        
        // Yükleme durumunu kaldır
        showPredictionLoading(false);
        
    } catch (error) {
        console.error('Tahmin verileri yüklenirken hata oluştu:', error);
        showPredictionError(error.message);
    }
}

/**
 * Tahmin grafiğini oluşturur veya günceller
 * @param {Object} data - Tahmin verileri
 */
function createOrUpdatePredictionChart(data) {
    const ctx = document.getElementById('prediction-chart').getContext('2d');
    
    // Veri kontrolü: historical ve predictions dizileri var mı?
    if (!data.historical || !Array.isArray(data.historical) || data.historical.length === 0 ||
        !data.predictions || !Array.isArray(data.predictions) || data.predictions.length === 0) {
        const chartContainer = document.getElementById('prediction-chart-container');
        if (chartContainer) {
            chartContainer.innerHTML = `
                <div class="alert alert-warning">
                    <i class="bi bi-exclamation-triangle-fill me-2"></i>
                    Tahmin grafiği için yeterli veri bulunamadı.
                </div>
            `;
        }
        return;
    }
    
    // predictions dizisinde tüm değerler aynıysa kullanıcıya uyarı göster
    const allSame = data.predictions.every(p => p.value === data.predictions[0].value);
    if (allSame && data.predictions.length > 1) {
        const chartContainer = document.getElementById('prediction-chart-container');
        if (chartContainer) {
            chartContainer.innerHTML = `
                <div class="alert alert-warning">
                    <i class="bi bi-exclamation-triangle-fill me-2"></i>
                    Tahmin edilen tüm yıllar için aynı değer dönüyor. Lütfen veri setinizi veya modeli güncelleyiniz.
                </div>
            `;
        }
        return;
    }
    
    // Tüm veri noktalarını birleştir
    const labels = [];
    const values = [];
    const backgroundColors = [];
    
    // Geçmiş veriler
    data.historical.forEach(point => {
        labels.push(point.year);
        values.push(point.value);
        backgroundColors.push('rgba(13, 110, 253, 0.8)');  // Primary blue
    });
    
    // Tahmin verileri
    data.predictions.forEach(point => {
        labels.push(point.year);
        values.push(point.value);
        backgroundColors.push('rgba(25, 135, 84, 0.8)');  // Success green
    });
    
    // Eğer grafik zaten varsa, güncelle
    if (predictionChart) {
        predictionChart.data.labels = labels;
        predictionChart.data.datasets[0].data = values;
        predictionChart.data.datasets[0].backgroundColor = backgroundColors;
        predictionChart.options.plugins.title.text = `${data.country} - Yenilenebilir Enerji Oranı Tahmini (%)`;
        predictionChart.update();
        return;
    }
    
    // Yeni grafik oluştur
    predictionChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Yenilenebilir Enerji (%)',
                data: values,
                backgroundColor: backgroundColors,
                borderColor: 'rgba(0, 0, 0, 0.1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: `${data.country} - Yenilenebilir Enerji Oranı Tahmini (%)`,
                    font: {
                        size: 16
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const isHistory = context.dataIndex < data.historical.length;
                            return `${isHistory ? 'Gerçek' : 'Tahmin'}: %${context.raw.toFixed(1)}`;
                        }
                    }
                },
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Yıl'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Yenilenebilir Enerji Oranı (%)'
                    },
                    beginAtZero: true
                }
            }
        }
    });
    
    // Ek açıklama ekle
    const annotation = document.createElement('div');
    annotation.className = 'mt-3 text-center';
    annotation.innerHTML = `
        <div class="d-flex justify-content-center">
            <div class="me-3"><i class="bi bi-square-fill" style="color: rgba(13, 110, 253, 0.8);"></i> Gerçek Veriler</div>
            <div><i class="bi bi-square-fill" style="color: rgba(25, 135, 84, 0.8);"></i> Tahmin</div>
        </div>
    `;
    
    // Grafiğin altına ekle
    const chartContainer = document.getElementById('prediction-chart').parentNode;
    chartContainer.appendChild(annotation);
}

/**
 * Tahmin bilgilerini gösterir
 * @param {Object} data - Tahmin verileri
 */
function displayPredictionInfo(data) {
    // Tahmin değerleri
    const firstPrediction = data.predictions[0];
    const lastPrediction = data.predictions[data.predictions.length - 1];
    
    // Değerleri göster
    document.getElementById('predicted-avg').textContent = `%${(firstPrediction.value + lastPrediction.value) / 2}`.replace('.', ',');
    document.getElementById('predicted-max').textContent = `%${Math.max(...data.predictions.map(p => p.value)).toFixed(1)}`.replace('.', ',');
    document.getElementById('predicted-min').textContent = `%${Math.min(...data.predictions.map(p => p.value)).toFixed(1)}`.replace('.', ',');
    
    // Trend göstergesini güncelle
    const trendValue = data.prediction_trend;
    document.getElementById('prediction-value').textContent = `%${trendValue.toFixed(1)}`.replace('.', ',');
    
    // Trend açıklaması
    let trendDescription = '';
    let barClass = '';
    
    if (trendValue > 10) {
        trendDescription = 'Güçlü artış trendi';
        barClass = 'bg-success';
        document.getElementById('prediction-explanation').textContent = 'Yenilenebilir enerji oranında önemli bir artış bekleniyor.';
    } else if (trendValue > 2) {
        trendDescription = 'Artış trendi';
        barClass = 'bg-success';
        document.getElementById('prediction-explanation').textContent = 'Yenilenebilir enerji oranında artış trendi gözlemleniyor.';
    } else if (trendValue > -2) {
        trendDescription = 'Yatay trend';
        barClass = 'bg-info';
        document.getElementById('prediction-explanation').textContent = 'Yenilenebilir enerji oranı nispeten sabit kalacak.';
    } else if (trendValue > -10) {
        trendDescription = 'Azalış trendi';
        barClass = 'bg-warning';
        document.getElementById('prediction-explanation').textContent = 'Yenilenebilir enerji oranında hafif bir düşüş trendi gözlemleniyor.';
    } else {
        trendDescription = 'Güçlü azalış trendi';
        barClass = 'bg-danger';
        document.getElementById('prediction-explanation').textContent = 'Yenilenebilir enerji oranında önemli bir düşüş bekleniyor.';
    }
    
    // Trend metni
    document.getElementById('prediction-description').textContent = trendDescription;
    
    // Progress bar
    const progressBar = document.getElementById('prediction-progress');
    progressBar.style.width = `${Math.min(Math.abs(trendValue) * 3, 100)}%`;
    
    // Progress bar sınıfını temizle ve yeni sınıf ekle
    progressBar.className = 'progress-bar';
    progressBar.classList.add(barClass);
    
    // Bildirim göster
    showNotification(`${data.country} için ${data.predictions[data.predictions.length - 1].year} yılı tahmini hazırlandı`, 'success');
}

/**
 * Yükleme durumunu gösterir veya gizler
 * @param {boolean} isLoading - Yükleniyor mu?
 */
function showPredictionLoading(isLoading) {
    if (isLoading) {
        // Yükleme göstergesini hazırla
        const loadingHtml = `
            <div class="d-flex justify-content-center align-items-center py-5">
                <div class="spinner-border text-primary me-3" role="status">
                    <span class="visually-hidden">Yükleniyor...</span>
                </div>
                <span>Tahmin yapılıyor, lütfen bekleyin...</span>
            </div>
        `;
        
        // Grafik konteynerine ekle
        const chartContainer = document.getElementById('prediction-chart-container');
        if (chartContainer) {
            chartContainer.innerHTML = loadingHtml;
        }
        
        // Bilgi konteynerine ekle
        const infoContainer = document.getElementById('prediction-info-container');
        if (infoContainer) {
            infoContainer.innerHTML = loadingHtml;
        }
        
        // Değerleri temizle
        document.getElementById('predicted-avg').textContent = '--%';
        document.getElementById('predicted-max').textContent = '--%';
        document.getElementById('predicted-min').textContent = '--%';
    }
}

/**
 * Hata mesajını gösterir
 * @param {string} message - Hata mesajı
 */
function showPredictionError(message) {
    // Grafik konteynerine hata ekle
    const chartContainer = document.getElementById('prediction-chart-container');
    if (chartContainer) {
        chartContainer.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle-fill me-2"></i>
                ${message || 'Tahmin yapılırken bir hata oluştu.'}
            </div>
        `;
    }
    
    // Bilgi konteynerine hata ekle
    const infoContainer = document.getElementById('prediction-info-container');
    if (infoContainer) {
        infoContainer.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle-fill me-2"></i>
                Detaylar yüklenemedi.
            </div>
        `;
    }
    
    // Bildirim göster
    showNotification('Tahmin yapılırken hata oluştu: ' + message, 'error');
}

/**
 * Kullanıcıya bildirim gösterir
 * @param {string} message - Bildirim mesajı
 * @param {string} type - Bildirim tipi (success, error, warning, info)
 */
function showNotification(message, type = 'info') {
    // Toast konteynerini kontrol et/oluştur
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }
    
    // Toast ID oluştur
    const toastId = 'toast-' + Date.now();
    
    // Toast tipi için sınıf ve simge belirle
    let bgClass = 'bg-info';
    let icon = 'bi-info-circle';
    
    switch (type) {
        case 'success':
            bgClass = 'bg-success';
            icon = 'bi-check-circle';
            break;
        case 'error':
            bgClass = 'bg-danger';
            icon = 'bi-exclamation-circle';
            break;
        case 'warning':
            bgClass = 'bg-warning';
            icon = 'bi-exclamation-triangle';
            break;
    }
    
    // Toast HTML'i
    const toastHtml = `
        <div id="${toastId}" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header ${bgClass} text-white">
                <i class="bi ${icon} me-2"></i>
                <strong class="me-auto">${type.charAt(0).toUpperCase() + type.slice(1)}</strong>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Kapat"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        </div>
    `;
    
    // Toast'u konteyner'a ekle
    toastContainer.insertAdjacentHTML('beforeend', toastHtml);
    
    // Toast'u göster
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, {
        autohide: true,
        delay: 5000
    });
    
    toast.show();
    
    // Toast kapatıldığında DOM'dan kaldır
    toastElement.addEventListener('hidden.bs.toast', function() {
        toastElement.remove();
    });
} 