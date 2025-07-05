/**
 * Ülke Karşılaştırma JavaScript Dosyası
 * 
 * Bu dosya, ülke karşılaştırma bölümünün fonksiyonlarını içerir:
 * - Karşılaştırma grafiği
 * - Karşılaştırma tablosu
 */

// Global değişkenler
let comparisonChart = null;
let selectedCountries = [];

// Sayfa yüklendiğinde çalışacak işlemler
document.addEventListener('DOMContentLoaded', function() {
    // Ülke listesini yükle
    loadComparisonCountryList();
    
    // Ülke seçimini izle
    document.getElementById('comparison-select').addEventListener('change', function() {
        const selectedCountry = this.value;
        
        if (selectedCountry && !selectedCountries.includes(selectedCountry)) {
            // Ülkeyi listeye ekle
            selectedCountries.push(selectedCountry);
            
            // Seçimi sıfırla
            this.selectedIndex = 0;
            
            // Karşılaştırma verilerini yükle
            if (selectedCountries.length >= 2) {
                loadComparisonData(selectedCountries);
            }
            
            // Seçili ülkeleri göster
            updateSelectedCountriesList();
        }
    });
});

/**
 * Karşılaştırma için ülke listesini yükler
 */
async function loadComparisonCountryList() {
    try {
        const response = await fetch('/api/data/countries');
        const countries = await response.json();
        
        const countrySelect = document.getElementById('comparison-select');
        
        // Alfabetik sırala
        countries.sort((a, b) => a.name.localeCompare(b.name));
        
        // Seçim kutusunu doldur
        countries.forEach(country => {
            const option = document.createElement('option');
            option.value = country.name;
            option.textContent = country.name;
            countrySelect.appendChild(option);
        });
        
    } catch (error) {
        console.error('Ülke listesi yüklenirken hata oluştu:', error);
        
        const countrySelect = document.getElementById('comparison-select');
        countrySelect.disabled = true;
        
        const option = document.createElement('option');
        option.textContent = 'Ülke listesi yüklenemedi';
        countrySelect.appendChild(option);
    }
}

/**
 * Seçili ülkeleri listeler
 */
function updateSelectedCountriesList() {
    const container = document.getElementById('comparison-select').parentNode;
    
    // Varsa eski listeyi kaldır
    const oldList = container.querySelector('.selected-countries');
    if (oldList) {
        container.removeChild(oldList);
    }
    
    // Yeni liste oluştur
    const listContainer = document.createElement('div');
    listContainer.className = 'selected-countries mt-3';
    
    const title = document.createElement('p');
    title.className = 'mb-2';
    title.textContent = 'Seçili Ülkeler:';
    listContainer.appendChild(title);
    
    const list = document.createElement('div');
    list.className = 'd-flex flex-wrap gap-2';
    
    selectedCountries.forEach(country => {
        const badge = document.createElement('span');
        badge.className = 'badge bg-primary d-flex align-items-center';
        
        badge.innerHTML = `
            ${country}
            <button type="button" class="btn-close btn-close-white ms-2" 
                    aria-label="Kaldır" 
                    onclick="removeCountryFromComparison('${country}')"></button>
        `;
        
        list.appendChild(badge);
    });
    
    listContainer.appendChild(list);
    container.appendChild(listContainer);
    
    // En az 2 ülke seçimi yapıldıysa karşılaştır
    if (selectedCountries.length >= 2) {
        // Karşılaştırma sonucunu göster
        document.getElementById('comparison-details').classList.remove('d-none');
    } else {
        // Karşılaştırma sonucunu gizle
        document.getElementById('comparison-details').classList.add('d-none');
    }
}

/**
 * Ülkeyi karşılaştırma listesinden kaldırır
 * @param {string} country - Kaldırılacak ülke
 */
function removeCountryFromComparison(country) {
    // Ülkeyi listeden kaldır
    selectedCountries = selectedCountries.filter(c => c !== country);
    
    // Listeyi güncelle
    updateSelectedCountriesList();
    
    // Karşılaştırma verilerini güncelle
    if (selectedCountries.length >= 2) {
        loadComparisonData(selectedCountries);
    }
}

/**
 * Karşılaştırma verilerini API'den yükler
 * @param {Array} countries - Karşılaştırılacak ülkeler
 */
async function loadComparisonData(countries) {
    try {
        // Yükleniyor göster
        showComparisonLoading(true);
        
        // Ülkeleri string'e dönüştür
        const countriesParam = countries.join(',');
        
        // API'den verileri al
        const response = await fetch(`/api/data/comparison?countries=${encodeURIComponent(countriesParam)}`);
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Karşılaştırma yapılamadı');
        }
        
        // Karşılaştırma grafiğini oluştur
        createOrUpdateComparisonChart(data.chart_data);
        
        // Karşılaştırma tablosunu doldur
        fillComparisonTable(data.comparison_table);
        
        // Yükleme durumunu kaldır
        showComparisonLoading(false);
        
    } catch (error) {
        console.error('Karşılaştırma verileri yüklenirken hata oluştu:', error);
        showComparisonError(error.message);
    }
}

/**
 * Karşılaştırma grafiğini oluşturur veya günceller
 * @param {Object} chartData - Grafik için veriler
 */
function createOrUpdateComparisonChart(chartData) {
    const ctx = document.getElementById('comparison-chart').getContext('2d');
    
    // Renk paleti oluştur
    const colors = [
        'rgba(13, 110, 253, 0.7)',   // Primary
        'rgba(220, 53, 69, 0.7)',    // Danger
        'rgba(25, 135, 84, 0.7)',    // Success
        'rgba(255, 193, 7, 0.7)',    // Warning
        'rgba(13, 202, 240, 0.7)',   // Info
        'rgba(108, 117, 125, 0.7)',  // Secondary
        'rgba(111, 66, 193, 0.7)'    // Purple
    ];
    
    // Veri setlerini oluştur
    const datasets = chartData.series.map((series, index) => {
        const color = colors[index % colors.length];
        
        return {
            label: series.country,
            data: series.values,
            backgroundColor: color,
            borderColor: color.replace('0.7', '1'),
            borderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 5,
            tension: 0.1
        };
    });
    
    // Eğer grafik zaten varsa, güncelle
    if (comparisonChart) {
        comparisonChart.data.labels = chartData.labels;
        comparisonChart.data.datasets = datasets;
        comparisonChart.update();
        return;
    }
    
    // Yeni grafik oluştur
    comparisonChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Ülke Bazında Yenilenebilir Enerji Tüketimi (%)',
                    font: {
                        size: 16
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: %${context.raw !== null ? context.raw.toFixed(1) : 'Veri yok'}`;
                        }
                    }
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
}

/**
 * Karşılaştırma tablosunu doldurur
 * @param {Array} tableData - Tablo için veriler
 */
function fillComparisonTable(tableData) {
    const tableBody = document.querySelector('#comparison-data-table tbody');
    tableBody.innerHTML = '';
    
    if (!tableData || tableData.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="2" class="text-center">Veri bulunamadı</td>';
        tableBody.appendChild(row);
        return;
    }
    
    // Verileri ülkeye göre sırala
    tableData.sort((a, b) => b.mean - a.mean);
    
    tableData.forEach(country => {
        const row = document.createElement('tr');
        
        // Trend sınıfı
        let trendClass = '';
        let trendIcon = '';
        
        if (country.trend > 10) {
            trendClass = 'text-success';
            trendIcon = '<i class="bi bi-arrow-up"></i>';
        } else if (country.trend > 0) {
            trendClass = 'text-success';
            trendIcon = '<i class="bi bi-arrow-up-right"></i>';
        } else if (country.trend > -10) {
            trendClass = 'text-danger';
            trendIcon = '<i class="bi bi-arrow-down-right"></i>';
        } else {
            trendClass = 'text-danger';
            trendIcon = '<i class="bi bi-arrow-down"></i>';
        }
        
        row.innerHTML = `
            <td>${country.country}</td>
            <td>%${country.mean.toFixed(1)}</td>
            <td>%${country.max.toFixed(1)}</td>
            <td>%${country.min.toFixed(1)}</td>
            <td class="${trendClass}">${trendIcon} %${country.trend.toFixed(1)}</td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Tablo başlığını güncelle
    const tableHeader = document.querySelector('#comparison-data-table thead tr');
    tableHeader.innerHTML = `
        <th scope="col">Ülke</th>
        <th scope="col">Ortalama</th>
        <th scope="col">En Yüksek</th>
        <th scope="col">En Düşük</th>
        <th scope="col">Trend</th>
    `;
}

/**
 * Yükleme durumunu gösterir veya gizler
 * @param {boolean} isLoading - Yükleniyor mu?
 */
function showComparisonLoading(isLoading) {
    // Metrikleri temizle
    if (isLoading) {
        document.querySelectorAll('#comparison-details h3, #comparison-details h4').forEach(el => {
            el.textContent = '--';
        });
        
        document.querySelectorAll('#comparison-details .progress-bar').forEach(el => {
            el.style.width = '0%';
        });
    }
}

/**
 * Hata mesajını gösterir
 * @param {string} message - Hata mesajı
 */
function showComparisonError(message) {
    document.getElementById('comparison-details').innerHTML = `
        <div class="alert alert-danger">
            <i class="bi bi-exclamation-triangle-fill me-2"></i>
            ${message || 'Karşılaştırma yapılırken bir hata oluştu.'}
        </div>
    `;
} 