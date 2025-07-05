/**
 * Ülke Karşılaştırma JavaScript Dosyası
 */

// Global değişkenler
let comparisonChart = null;
let selectedCountries = [];
let availableCountries = []; // Sonradan tekrar yüklememek için ülke listesini saklayalım

// Sayfa yüklendiğinde çalışacak işlemler
document.addEventListener('DOMContentLoaded', function() {
    console.log('Karşılaştırma sayfası yükleniyor...');
    
    // DOM elementlerinin varlığını kontrol et
    ensureElementsExist();
    
    // Ülke listesini yükle
    loadComparisonCountryList();
    
    // Ülke seçimini izle
    const countrySelect = document.getElementById('comparison-select');
    if (countrySelect) {
        countrySelect.addEventListener('change', function() {
            const selectedCountry = this.value;
            
            if (selectedCountry && !selectedCountries.includes(selectedCountry)) {
                console.log('Seçilen ülke:', selectedCountry);
                
                // Ülkeyi listeye ekle
                selectedCountries.push(selectedCountry);
                
                // Seçilen metni göster
                const selectedText = this.options[this.selectedIndex].text;
                console.log('Seçilen ülke metni:', selectedText);
                
                // Seçimi sıfırla
                this.selectedIndex = 0;
                
                // Karşılaştırma verilerini yükle
                if (selectedCountries.length >= 1) {
                    loadComparisonData(selectedCountries);
                }
                
                // Seçili ülkeleri göster
                updateSelectedCountriesList();
            }
        });
    }
    
    // Yılları yükle
    populateYears();
    
    // Karşılaştırma formunu başlat
    initializeComparisonForm();
    
    // Yeni ülke ekleme butonu
    const addCountryButton = document.getElementById('add-country-btn');
    if (addCountryButton) {
        addCountryButton.addEventListener('click', addCountrySelector);
    }
    
    // Ülke kaldırma butonları için event listener'lar ekle
    setupRemoveButtons();
    
    // Hata yakalama mekanizması ekle
    window.addEventListener('error', function(e) {
        console.error('Global hata yakalandı:', e.error || e.message);
        
        // Karşılaştırma alanlarında yükleniyor görüntüsü varsa kaldır
        const loadingElements = document.querySelectorAll('.spinner-border');
        loadingElements.forEach(el => {
            const parent = el.parentNode;
            if (parent) {
                parent.textContent = 'Hata oluştu';
                parent.classList.add('text-danger');
            }
        });
        
        return false; // Hata işlemeye devam et
    });
    
    // Sayfa yüklendiğinde örnek karşılaştırma göster - hızlı görselleştirme için
    // Bu varsayılan olarak seçili ülkelerle grafikler üretir
    setTimeout(showDefaultComparison, 500);
});

/**
 * Sayfa yüklendiğinde varsayılan ülkelerle karşılaştırma gösterir
 */
function showDefaultComparison() {
    // Seçili ülkeleri al
    const selects = document.querySelectorAll('.country-select');
    const countries = [];
    
    // Seçili ülkeleri bul
    for (let i = 0; i < selects.length; i++) {
        if (selects[i].value) {
            countries.push(selects[i].value);
        }
    }
    
    // En az 2 ülke seçili ise karşılaştırma yap
    if (countries.length >= 2) {
        // Varsayılan metrik
        const metricSelect = document.getElementById('metric');
        const metric = metricSelect ? metricSelect.value : 'gdp';
        
        console.log('Varsayılan karşılaştırma yapılıyor...');
        console.log('Seçili Ülkeler:', countries);
        console.log('Metrik:', metric);
        
        // Demo veri oluştur ve göster
        const demoData = generateDemoComparisonData(countries, metric);
        displayComparisonData(demoData, countries, metric);
        
        // Formu onaylanmış gibi göster
        const submitBtn = document.querySelector('#comparison-form button[type="submit"]');
        if (submitBtn) {
            submitBtn.classList.add('btn-success');
            submitBtn.classList.remove('btn-primary');
            setTimeout(() => {
                submitBtn.classList.add('btn-primary');
                submitBtn.classList.remove('btn-success');
            }, 1000);
        }
    }
}

/**
 * Ülke kaldırma butonları için event listener'lar ekler
 */
function setupRemoveButtons() {
    const removeButtons = document.querySelectorAll('.remove-country-btn');
    
    removeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const container = this.closest('.country-selector');
            const parent = container.parentNode;
            
            // En az 2 ülke seçicisi kalmalı
            if (parent.querySelectorAll('.country-selector').length > 2) {
                parent.removeChild(container);
            } else {
                alert('En az 2 ülke karşılaştırması gereklidir.');
            }
        });
    });
}

/**
 * Yıl seçimlerini doldurur
 */
function populateYears() {
    // Başlangıç ve bitiş yılı select elementlerini bul
    const startYearSelect = document.getElementById('start-year');
    const endYearSelect = document.getElementById('end-year');
    
    if (!startYearSelect || !endYearSelect) return;
    
    // Yıl aralığını belirle (2000-2023)
    const startYear = 2000;
    const endYear = 2023;
    
    // Başlangıç yılını doldur
    for (let year = startYear; year <= endYear; year++) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        
        // 2010 yılını varsayılan olarak seç
        if (year === 2010) {
            option.selected = true;
        }
        
        startYearSelect.appendChild(option);
    }
    
    // Bitiş yılını doldur
    for (let year = startYear; year <= endYear; year++) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        
        // 2020 yılını varsayılan olarak seç
        if (year === 2020) {
            option.selected = true;
        }
        
        endYearSelect.appendChild(option);
    }
}

/**
 * Karşılaştırma formunu başlatır
 */
function initializeComparisonForm() {
    // Ülke listelerini yükle
    initializeComparisonCountryList();
    
    // Form gönderimini izle
    const form = document.getElementById('comparison-form');
    if (form) {
        form.addEventListener('submit', submitComparisonForm);
    }
}

/**
 * Karşılaştırma için ülke listesini başlatır
 */
async function initializeComparisonCountryList() {
    // Loading göster
    const loadingEl = document.getElementById('comparison-loading');
    if (loadingEl) {
        loadingEl.style.display = 'block';
    }
    
    // Form submit butonunu devre dışı bırak
    const submitBtn = document.querySelector('#comparison-form button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
    }
    
    try {
        // Eğer daha önceden ülkeler yüklendiyse, tekrar API'ye istek yapmadan kullan
        if (availableCountries.length > 0) {
            populateCountrySelects(availableCountries);
            if (submitBtn) {
                submitBtn.disabled = false;
            }
            if (loadingEl) {
                loadingEl.style.display = 'none';
            }
            return;
        }
        
        // İlk API endpoint'i dene
        let response = await fetch('/api/countries');
        
        // İlk endpoint başarısız olursa alternatif endpoint'i dene
        if (!response.ok) {
            console.log('İlk countries endpoint başarısız, alternatif deneniyor');
            response = await fetch('/api/data/countries');
            
            if (!response.ok) {
                throw new Error(`Ülke listesi alınamadı: HTTP ${response.status}`);
            }
        }
        
        let data = await response.json();
        console.log('API yanıtı:', data);
        
        // API yanıtına göre ülke listesini al
        let countries = [];
        
        if (Array.isArray(data)) {
            countries = data; // Direkt dizi yanıtı
        } else if (data.countries && Array.isArray(data.countries)) {
            countries = data.countries; // {countries: [...]} formatında yanıt
        } else if (data.success && data.data && Array.isArray(data.data)) {
            countries = data.data; // {success: true, data: [...]} formatında yanıt 
        }
        
        // Eğer hiçbir formatta veri gelmezse, demoCountries kullan
        if (!countries.length) {
            console.log('Ülke listesi boş geliyor, demo veri kullanılacak');
            countries = getDemoCountries();
        }
        
        // Ülkeleri string dizisine dönüştür
        if (countries.length > 0 && typeof countries[0] !== 'string') {
            countries = countries.map(country => {
                if (typeof country === 'string') return country;
                return country.name || country.code || country;
            });
        }
        
        // Ülkeleri alfabetik sıraya koy
        countries.sort((a, b) => {
            if (typeof a === 'string' && typeof b === 'string') {
                return a.localeCompare(b, 'tr');
            }
            return 0;
        });
        
        // Global değişkene kaydet
        availableCountries = countries;
        
        // Ülke seçimlerini doldur
        populateCountrySelects(countries);
        
        // Form butonunu aktif et
        if (submitBtn) {
            submitBtn.disabled = false;
        }
        
    } catch (error) {
        console.error('Ülke listesi yüklenirken hata:', error);
        
        // Hata durumunda demo ülkeleri kullan
        const demoCountries = getDemoCountries();
        
        // Global değişkene kaydet
        availableCountries = demoCountries;
        
        // Ülke seçimlerini doldur
        populateCountrySelects(demoCountries);
        
        // Form butonunu aktif et
        if (submitBtn) {
            submitBtn.disabled = false;
        }
        
        // Hata mesajı göster
        showComparisonError(`Ülke listesi yüklenemedi, demo veriler kullanıldı: ${error.message || 'Bilinmeyen hata'}`);
    } finally {
        // Loading gizle
        if (loadingEl) {
            loadingEl.style.display = 'none';
        }
    }
}

/**
 * Demo ülke listesini döndürür
 * @returns {Array} - Demo ülke listesi
 */
function getDemoCountries() {
    return [
        'Türkiye',
        'Almanya',
        'Fransa',
        'İtalya',
        'İspanya',
        'Birleşik Krallık',
        'ABD',
        'Kanada',
        'Japonya',
        'Çin',
        'Hindistan',
        'Brezilya',
        'Rusya',
        'Avustralya',
        'Güney Afrika'
    ];
}

/**
 * Ülke seçimlerini doldurur
 * @param {Array} countries - Ülke listesi
 */
function populateCountrySelects(countries) {
    // Tüm ülke select elementlerini bul
    const selects = document.querySelectorAll('.country-select');
    
    // Select elementlerini temizleyip ve doldurmak için belge fragmanı kullan (daha performanslı)
    const fragment = document.createDocumentFragment();
    const defaultOption = document.createElement('option');
    defaultOption.value = "";
    defaultOption.textContent = "Ülke Seçiniz";
    fragment.appendChild(defaultOption);
    
    // Tüm ülke seçeneklerini fragment'a ekle
        countries.forEach(country => {
            const option = document.createElement('option');
            option.value = country;
            option.textContent = country;
        fragment.appendChild(option);
    });
    
    // Her bir select elementini doldur
    selects.forEach((select, index) => {
        // Mevcut seçimi koru
        const currentValue = select.value;
        
        // Select'i temizle
        select.innerHTML = '';
        
        // Fragment'ın klonunu ekle (performans için)
        select.appendChild(fragment.cloneNode(true));
        
        // Eğer önceden bir değer varsa, onu seç
        if (currentValue && countries.includes(currentValue)) {
            select.value = currentValue;
        } else {
            // Yoksa, sırasıyla varsayılan ülkeler ata (ilk 3 ülke)
            if (index < 3 && countries.length > index) {
                select.value = countries[index];
            }
        }
    });
    
    // Global değişkene ülkeleri kaydet
    window.availableCountries = countries;
}

/**
 * Karşılaştırma formunu gönderir
 * @param {Event} event - Form submit olayı
 */
async function submitComparisonForm(event) {
    event.preventDefault();
    
    // Seçili ülkeleri al
    const countries = [];
    const selects = document.querySelectorAll('.country-select');
    
    // NodeList.forEach yerine for döngüsü kullan (daha performanslı)
    for (let i = 0; i < selects.length; i++) {
        if (selects[i].value) {
            countries.push(selects[i].value);
        }
    }
    
    // En az 2 ülke seçilmiş mi kontrol et
    if (countries.length < 2) {
        alert('Lütfen en az 2 ülke seçiniz.');
        return;
    }
    
    // Seçilen metrik
    const metricSelect = document.getElementById('metric');
    const metric = metricSelect ? metricSelect.value : 'gdp';
    
    try {
        // Yükleniyor göster
        showComparisonLoading();
        
        // Verileri yükle
        await loadComparisonData(countries, metric);
        
    } catch (error) {
        console.error('Karşılaştırma yüklenirken hata:', error);
        showComparisonError(error.message || 'Karşılaştırma verileri yüklenemedi');
    }
}

/**
 * Karşılaştırma verilerini API'den yükler
 * @param {Array} countries - Karşılaştırılacak ülkeler
 */
async function loadComparisonData(countries) {
    try {
        // Log ekleme
        console.log('Karşılaştırma verileri yükleniyor:', countries);
        
        // Yükleniyor göster
        showComparisonLoading(true);
        
        // Ülkeleri string'e dönüştür
        const countriesParam = countries.join(',');
        
        // API'den verileri almayı dene
        let data = null;
        
        try {
            // API'ye istek gönder
            const response = await fetch(`/api/data/comparison?countries=${encodeURIComponent(countriesParam)}`);
            console.log('API yanıtı alındı, durum:', response.status);
            
            if (!response.ok) {
                throw new Error(`API yanıtı başarısız: ${response.status}`);
            }
            
            data = await response.json();
            console.log('API yanıtı:', data);
            
            // API yanıtı başarılı mı kontrolü
            if (!data || !data.success) {
                throw new Error((data && data.error) || 'API geçerli veri döndürmedi');
            }
        } catch (apiError) {
            console.warn('API hatası, demo veriler kullanılacak:', apiError);
            // Demo veriler oluştur
            data = generateDemoComparisonData(countries);
            console.log('Demo veriler oluşturuldu:', data);
        }
        
        // Karşılaştırma detaylarını göster
        document.getElementById('comparison-details').style.display = 'block';
        
        // İstatistik verilerini göster
        updateComparisonStatistics(data);
        
        // Trend grafiğini her zaman güncelle
        updateTrendChart(data);
        
        // Karşılaştırma grafiğini oluştur
        createOrUpdateComparisonChart(data);
        
        // Karşılaştırma tablosunu doldur
        fillComparisonTable(data);
        
        // Yükleme durumunu kaldır
        showComparisonLoading(false);
        
    } catch (error) {
        console.error('Karşılaştırma verileri yüklenirken hata oluştu:', error);
        
        // Yine de karşılaştırma detaylarını göster ama hata mesajıyla
        document.getElementById('comparison-details').style.display = 'block';
        showComparisonError(error.message);
    }
}

/**
 * Karşılaştırma istatistiklerini günceller
 * @param {Object} data - Karşılaştırma verileri
 */
function updateComparisonStatistics(data) {
    try {
        console.log('İstatistikler güncelleniyor:', data);
        
        // İstatistik kartlarını al
        const avgElement = document.getElementById('comparison-avg');
        const maxElement = document.getElementById('comparison-max');
        const minElement = document.getElementById('comparison-min');
        const trendElement = document.getElementById('comparison-trend-value');
        
        // Verinin doğru formatta olduğunu kontrol et
        if (!data || !data.stats || !data.stats.analysis) {
            throw new Error('İstatistik verileri bulunamadı');
        }
        
        const stats = data.stats.analysis;
        
        // Ortalama değer
        if (avgElement) {
            avgElement.textContent = stats.mean ? `%${stats.mean.toFixed(2)}` : 'Veri yok';
            avgElement.classList.remove('text-secondary');
        }
        
        // En yüksek değer
        if (maxElement) {
            maxElement.textContent = stats.max ? `%${stats.max.toFixed(2)}` : 'Veri yok';
            maxElement.classList.remove('text-secondary');
        }
        
        // En düşük değer
        if (minElement) {
            minElement.textContent = stats.min ? `%${stats.min.toFixed(2)}` : 'Veri yok';
            minElement.classList.remove('text-secondary');
        }
        
        // Trend değeri
        if (trendElement) {
            if (stats.trend !== undefined) {
                const trendValue = stats.trend.toFixed(2);
                const isPositive = stats.trend > 0;
                const trendText = `${isPositive ? '+' : ''}${trendValue}%`;
                
                trendElement.textContent = trendText;
                trendElement.classList.remove('text-secondary');
                
                // Trend yönüne göre renk ver
                if (isPositive) {
                    trendElement.classList.add('text-success');
                    trendElement.classList.remove('text-danger');
                } else {
                    trendElement.classList.add('text-danger');
                    trendElement.classList.remove('text-success');
                }
            } else {
                trendElement.textContent = 'Veri yok';
                trendElement.classList.remove('text-success', 'text-danger');
            }
        }
        
        // Yıllara göre verileri ve trend grafikleri için ek alanları doldur
        updateYearlyDataTable(data);
        updateTrendChart(data);
        
    } catch (error) {
        console.error('İstatistik güncellemesi sırasında hata:', error);
        
        // Hata durumunda varsayılan değerler göster
        const elements = ['comparison-avg', 'comparison-max', 'comparison-min', 'comparison-trend-value'];
        elements.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.textContent = 'Hata';
                el.classList.add('text-danger');
            }
        });
    }
}

/**
 * Yıllara göre veri tablosunu günceller
 * @param {Object} data - Karşılaştırma verileri
 */
function updateYearlyDataTable(data) {
    // comparison-data-table ID'li elementi kullan (HTML'deki ile aynı)
    const tableBody = document.querySelector('#comparison-data-table tbody');
    if (!tableBody) {
        console.error('comparison-data-table tbody elementi bulunamadı');
        return;
    }
    
    try {
        // Veri yapısı kontrolü
        if (!data || !data.country_data || Object.keys(data.country_data).length === 0) {
            tableBody.innerHTML = '<tr><td colspan="2" class="text-center">Veri bulunamadı</td></tr>';
            return;
        }
        
        // Yılları ve ülkeleri al
        const countries = Object.keys(data.country_data);
        const years = [];
        
        // İlk ülkeden tüm yılları topla
        const firstCountry = data.country_data[countries[0]];
        if (firstCountry && firstCountry.time_series) {
            Object.keys(firstCountry.time_series).forEach(year => {
                if (!years.includes(year)) years.push(year);
            });
        }
        
        years.sort(); // Yılları sırala
        
        // Tablo başlıklarını güncelle (th) 
        const tableHeader = document.querySelector('#comparison-data-table thead tr');
        if (tableHeader) {
            tableHeader.innerHTML = `<th scope="col">Yıl</th>`;
            countries.forEach(country => {
                tableHeader.innerHTML += `<th scope="col">${country}</th>`;
            });
        }
        
        // Tablo içeriğini oluştur
        let tableRows = '';
        
        // Yıllara göre satırlar
        years.forEach(year => {
            tableRows += `<tr><td>${year}</td>`;
            
            // Her ülke için değerler
            countries.forEach(country => {
                const countryData = data.country_data[country];
                const value = countryData && countryData.time_series && countryData.time_series[year];
                
                if (value !== undefined) {
                    tableRows += `<td>%${parseFloat(value).toFixed(2)}</td>`;
                } else {
                    tableRows += '<td>-</td>';
                }
            });
            
            tableRows += '</tr>';
        });
        
        // Tabloyu DOM'a ekle
        tableBody.innerHTML = tableRows;
        
    } catch (error) {
        console.error('Yıllık veri tablosu oluşturulurken hata:', error);
        tableBody.innerHTML = `<tr><td colspan="2" class="text-center text-danger">Tablo oluşturulamadı: ${error.message}</td></tr>`;
    }
}

/**
 * Trend grafiğini günceller
 * @param {Object} data - Karşılaştırma verileri
 */
function updateTrendChart(data) {
    const chartContainer = document.getElementById('trend-chart-container');
    if (!chartContainer) {
        console.error('trend-chart-container elementi bulunamadı');
        return;
    }
    
    try {
        // Veri yapısı kontrolü
        if (!data || !data.country_data || Object.keys(data.country_data).length === 0) {
            chartContainer.innerHTML = '<p class="text-center text-muted">Veri bulunamadı</p>';
            return;
        }
        
        // Eğer Highcharts yoksa yüklemeyi dene
        if (typeof Highcharts === 'undefined') {
            chartContainer.innerHTML = '<div class="alert alert-warning">Grafik kütüphanesi yüklenemedi</div>';
            console.error('Highcharts kütüphanesi bulunamadı');
            return;
        }
        
        // Grafik verilerini hazırla
        const countries = Object.keys(data.country_data);
        const series = [];
        
        // Her ülke için seri oluştur
        countries.forEach((country, index) => {
            const countryData = data.country_data[country];
            
            if (countryData && countryData.time_series) {
                const timeSeriesData = [];
                
                // Yıl-değer çiftlerini diziye dönüştür
                Object.entries(countryData.time_series).forEach(([year, value]) => {
                    timeSeriesData.push([parseInt(year), parseFloat(value)]);
                });
                
                // Yıla göre sırala
                timeSeriesData.sort((a, b) => a[0] - b[0]);
                
                // Seriyi ekle
                series.push({
                    name: country,
                    data: timeSeriesData,
                    color: CHART_COLORS[index % CHART_COLORS.length].border
                });
            }
        });
        
        // Grafik oluştur
        Highcharts.chart(chartContainer, {
            title: {
                text: 'Yenilenebilir Enerji Oranı Trendi',
                style: {
                    fontSize: '16px'
                }
            },
            subtitle: {
                text: 'Yıllara göre değişim'
            },
            xAxis: {
                title: {
                    text: 'Yıl'
                },
                type: 'linear'
            },
            yAxis: {
                title: {
                    text: 'Yenilenebilir Enerji Oranı (%)'
                },
                min: 0
            },
            legend: {
                layout: 'vertical',
                align: 'right',
                verticalAlign: 'middle'
            },
            plotOptions: {
                series: {
                    label: {
                        connectorAllowed: false
                    },
                    marker: {
                        enabled: true,
                        radius: 3
                    }
                }
            },
            series: series,
            responsive: {
                rules: [{
                    condition: {
                        maxWidth: 500
                    },
                    chartOptions: {
                        legend: {
                            layout: 'horizontal',
                            align: 'center',
                            verticalAlign: 'bottom'
                        }
                    }
                }]
            },
            credits: {
                enabled: false
            }
        });
        
    } catch (error) {
        console.error('Trend grafiği oluşturulurken hata:', error);
        chartContainer.innerHTML = `<div class="alert alert-danger">Grafik oluşturulamadı: ${error.message}</div>`;
    }
}

/**
 * Demo karşılaştırma verileri üretir
 * @param {Array} countries - Karşılaştırılacak ülkeler
 * @returns {Object} - Karşılaştırma verileri
 */
function generateDemoComparisonData(countries) {
    // Yıllar
    const years = [];
    const currentYear = new Date().getFullYear();
    for (let year = currentYear - 10; year <= currentYear; year++) {
        years.push(year.toString());
    }
    
    // Ülkelere göre seri verileri oluştur
    const datasets = countries.map((country, index) => {
        // Her ülke için farklı bir temel değer (ülke adına göre deterministik)
        const baseValue = 10 + (country.charCodeAt(0) % 15);
        const colorIndex = index % CHART_COLORS.length;
        const color = CHART_COLORS[colorIndex];
        
        // Değerleri üret
        const values = years.map((year, i) => {
            // Yıla ve ülkeye göre değer üret
            const yearEffect = i * 0.7; // Yıl geçtikçe artan trend
            const randomVariation = Math.sin(country.charCodeAt(0) * parseInt(year)) * 3; // Ülkeye ve yıla özgü varyasyon
            
            // Hesaplanan değeri döndür (0-100 arası sınırla)
            return Math.min(100, Math.max(0, baseValue + yearEffect + randomVariation));
        });
        
        return {
            label: country,
            data: values,
            borderColor: color.border,
            backgroundColor: color.background,
            borderWidth: 2,
            tension: 0.4
        };
    });
    
    // Demo karşılaştırma verilerini oluştur
    const chartData = {
        labels: years,
        datasets: datasets
    };
    
    // Tablo verilerini oluştur
    const countryData = {};
    datasets.forEach(item => {
        const values = item.data;
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const max = Math.max(...values);
        const min = Math.min(...values);
        
        // Trend hesapla (son 5 yıl vs ilk 5 yıl)
        const firstHalf = values.slice(0, Math.floor(values.length / 2));
        const secondHalf = values.slice(Math.floor(values.length / 2));
        const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
        const trend = ((secondAvg - firstAvg) / firstAvg) * 100;
        
        countryData[item.label] = {
            time_series: Object.fromEntries(years.map((year, i) => [year, values[i]])),
            last_value: values[values.length - 1],
            average: mean,
            max: max,
            min: min,
            trend: trend
        };
    });
    
    // API yanıtını taklit et
    return {
        success: true,
        chart_data: chartData,
        countries: countries,
        country_data: countryData,
        stats: {
            countries: countryData,
            analysis: {
                mean: Object.values(countryData).reduce((sum, val) => sum + val.average, 0) / Object.values(countryData).length,
                max: Math.max(...Object.values(countryData).map(val => val.max)),
                min: Math.min(...Object.values(countryData).map(val => val.min)),
                trend: Object.values(countryData).reduce((sum, val) => sum + val.trend, 0) / Object.values(countryData).length
            }
        }
    };
}

/**
 * Karşılaştırma grafiğini oluşturur veya günceller
 * @param {Object} data - Karşılaştırma verileri
 */
function createOrUpdateComparisonChart(data) {
    const chartContainer = document.getElementById('comparison-chart');
    if (!chartContainer) {
        console.error('comparison-chart elementi bulunamadı');
        return;
    }
    
    try {
        // Grafik kütüphanesini kontrol et
        if (typeof Chart === 'undefined') {
            chartContainer.innerHTML = '<div class="alert alert-warning">Grafik kütüphanesi yüklenemedi</div>';
            console.error('Chart.js kütüphanesi yüklenmemiş');
            return;
        }
        
        console.log('Grafik oluşturuluyor, veriler:', data);
        
        // Grafik verilerini hazırla
        let chartData = null;
        
        if (data.chart_data) {
            // API'den direkt chart_data gelmiş
            chartData = data.chart_data;
        } else if (data.country_data) {
            // country_data'dan chart_data oluştur
            const countries = Object.keys(data.country_data);
            const timeSeriesData = {};
            const years = [];
            
            // İlk ülkeden yılları çıkar
            if (countries.length > 0) {
                const firstCountry = data.country_data[countries[0]];
                if (firstCountry.time_series) {
                    Object.keys(firstCountry.time_series).forEach(year => {
                        if (!years.includes(year)) {
                            years.push(year);
                        }
                    });
                    years.sort();
                }
            }
            
            // Her ülke için dataset oluştur
            const datasets = countries.map((country, index) => {
                const countryData = data.country_data[country];
                const values = [];
                
                years.forEach(year => {
                    if (countryData.time_series && countryData.time_series[year] !== undefined) {
                        values.push(countryData.time_series[year]);
                    } else {
                        values.push(null);
                    }
                });
                
                // Renk indeksi
                const colorIndex = index % CHART_COLORS.length;
                const color = CHART_COLORS[colorIndex];
                
                return {
                    label: country,
                    data: values,
                    borderColor: color.border,
                    backgroundColor: color.background,
                    borderWidth: 2,
                    tension: 0.4
                };
            });
            
            chartData = {
                labels: years,
                datasets: datasets
            };
        } else {
            throw new Error('Grafik için geçerli veri formatı bulunamadı');
        }
        
        // Mevcut grafiği temizle
        if (comparisonChart) {
            comparisonChart.destroy();
        }
        
        // Yeni grafik oluştur
        comparisonChart = new Chart(chartContainer, {
            type: 'line',
            data: chartData,
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
                        },
                        min: 0,
                        suggestedMax: 100
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
        
        console.log('Grafik başarıyla oluşturuldu');
        
    } catch (error) {
        console.error('Grafik oluşturulurken hata:', error);
        chartContainer.innerHTML = `<div class="alert alert-danger">Grafik oluşturulamadı: ${error.message}</div>`;
    }
}

/**
 * Karşılaştırma tablosunu doldurur
 * @param {Object} data - Karşılaştırma verileri
 */
function fillComparisonTable(data) {
    const tableContainer = document.querySelector('.table-responsive');
    if (!tableContainer) {
        console.warn('Tablo container bulunamadı');
        return;
    }
    
    try {
        console.log('Karşılaştırma tablosu hazırlanıyor');
        
        // Veri yapısını hazırla
        let tableData = [];
        let years = [];
        
        if (data.country_data) {
            // API'den gelen veri
            const countries = Object.keys(data.country_data);
            
            // Tüm yılları topla
            countries.forEach(country => {
                const timeSeries = data.country_data[country].time_series;
                if (timeSeries) {
                    Object.keys(timeSeries).forEach(year => {
                        if (!years.includes(year)) years.push(year);
                    });
                }
            });
            
            // Yılları sırala
            years.sort();
            
            // Tablo başlıklarını hazırla (ülkeler)
            const headers = ['Yıl', ...countries];
            
            // Her yıl için satır oluştur
            const rows = years.map(year => {
                const rowData = [year];
                
                // Her ülke için değer ekle
                countries.forEach(country => {
                    const timeSeries = data.country_data[country].time_series;
                    const value = timeSeries && timeSeries[year] !== undefined ? 
                        parseFloat(timeSeries[year]).toFixed(2) : '-';
                    rowData.push(value);
                });
                
                return rowData;
            });
            
            tableData = {
                headers: headers,
                rows: rows
            };
        } else {
            console.warn('Tablo verisi oluşturulamadı, geçerli format bulunamadı');
            tableContainer.innerHTML = '<p class="text-center text-muted">Veri bulunamadı</p>';
            return;
        }
        
        // Tabloyu oluştur
        let tableHTML = `
            <table class="table table-hover" id="comparison-data-table">
                <thead>
                    <tr>
        `;
        
        // Başlıklar
        tableData.headers.forEach(header => {
            tableHTML += `<th scope="col">${header}</th>`;
        });
        
        tableHTML += `
                    </tr>
                </thead>
                <tbody>
        `;
        
        // Satırlar
        tableData.rows.forEach(row => {
            tableHTML += '<tr>';
            row.forEach((cell, index) => {
                if (index === 0) {
                    // İlk sütun (yıl) için
                    tableHTML += `<th scope="row">${cell}</th>`;
                } else {
                    // Değer sütunları için
                    tableHTML += `<td>${cell === '-' ? '-' : `%${cell}`}</td>`;
                }
            });
            tableHTML += '</tr>';
        });
        
        tableHTML += `
                </tbody>
            </table>
        `;
        
        // Tabloyu DOM'a ekle
        tableContainer.innerHTML = tableHTML;
        console.log('Tablo başarıyla oluşturuldu');
        
    } catch (error) {
        console.error('Tablo oluşturulurken hata:', error);
        tableContainer.innerHTML = `<div class="alert alert-danger">Tablo oluşturulamadı: ${error.message}</div>`;
    }
}

/**
 * Yükleniyor gösterir veya gizler
 * @param {boolean} show - Göster veya gizle
 */
function showComparisonLoading(show = true) {
    // İstatistik kartları için yükleniyor
    const statCards = [
        'comparison-avg',
        'comparison-max',
        'comparison-min',
        'comparison-trend-value'
    ];
    
    statCards.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            if (show) {
                element.innerHTML = '<div class="spinner-border spinner-border-sm text-primary" role="status"><span class="visually-hidden">Yükleniyor...</span></div>';
            } else {
                // Yükleme durumunu kaldır, ancak updateComparisonStatistics fonksiyonu değerleri dolduracak
                if (element.querySelector('.spinner-border')) {
                    element.textContent = 'Veri yok';
                }
            }
        }
    });
    
    // Grafik için yükleniyor
    const chartContainer = document.getElementById('comparison-chart');
    if (chartContainer) {
        if (show) {
            chartContainer.innerHTML = `
                <div class="d-flex justify-content-center align-items-center" style="height: 300px;">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Yükleniyor...</span>
                    </div>
                </div>
            `;
        }
    }
    
    // Tablo için yükleniyor
    const tableContainer = document.querySelector('.table-responsive');
    if (tableContainer) {
        if (show) {
            tableContainer.innerHTML = `
                <div class="d-flex justify-content-center py-4">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Yükleniyor...</span>
                    </div>
                </div>
            `;
        }
    }
    
    // Trend grafiği için yükleniyor
    const trendChartContainer = document.getElementById('trend-chart-container');
    if (trendChartContainer && show) {
        trendChartContainer.innerHTML = `
            <div class="d-flex justify-content-center align-items-center h-100">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Yükleniyor...</span>
                </div>
            </div>
        `;
    }
    
    // Yıllara göre veriler için yükleniyor
    const yearlyDataContainer = document.getElementById('yearly-data-container');
    if (yearlyDataContainer && show) {
        yearlyDataContainer.innerHTML = `
            <div class="d-flex justify-content-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Yükleniyor...</span>
                </div>
            </div>
        `;
    }
    
    // DOM elementlerinin varlığını kontrol et
    ensureElementsExist();
}

/**
 * Gerekli DOM elementlerinin varlığını kontrol eder ve yoksa oluşturur
 */
function ensureElementsExist() {
    // Karşılaştırma detaylarının varlığını kontrol et
    const comparisonDetails = document.getElementById('comparison-details');
    if (!comparisonDetails) {
        console.error('comparison-details elementi bulunamadı');
        return;
    }
    
    const cardBody = comparisonDetails.querySelector('.card-body');
    if (!cardBody) {
        console.error('card-body elementi bulunamadı');
        return;
    }
    
    // İstatistik kartları için kontrol
    const statIds = ['comparison-avg', 'comparison-max', 'comparison-min', 'comparison-trend-value'];
    let missingStatElements = false;
    
    statIds.forEach(id => {
        if (!document.getElementById(id)) {
            missingStatElements = true;
            console.warn(`${id} elementi bulunamadı`);
        }
    });
    
    // Eğer istatistik kartları eksikse
    if (missingStatElements) {
        console.warn('Bazı istatistik kartları eksik, oluşturuluyor');
        
        // İstatistik kartları bölümünü bul veya oluştur
        let statsRow = cardBody.querySelector('.row');
        if (!statsRow) {
            statsRow = document.createElement('div');
            statsRow.className = 'row mb-4';
            cardBody.prepend(statsRow);
        }
        
        // Stat kartlarını oluştur
        const statTitles = [
            'Ortalama Yenilenebilir Enerji Oranı',
            'En Yüksek Değer',
            'En Düşük Değer',
            'Trend Analizi'
        ];
        
        statIds.forEach((id, index) => {
            if (!document.getElementById(id)) {
                const colDiv = document.createElement('div');
                colDiv.className = 'col-md-3 mb-3';
                
                colDiv.innerHTML = `
                    <div class="card h-100">
                        <div class="card-body text-center">
                            <h6 class="card-title text-muted">${statTitles[index]}</h6>
                            <h3 class="my-3" id="${id}">
                                <div class="spinner-border text-primary" role="status">
                                    <span class="visually-hidden">Yükleniyor...</span>
                                </div>
                            </h3>
                        </div>
                    </div>
                `;
                
                statsRow.appendChild(colDiv);
            }
        });
    }
    
    // Grafik container kontrol et
    if (!document.getElementById('comparison-chart')) {
        console.error('comparison-chart elementi bulunamadı');
    }
    
    // Trend grafiği kontrol et
    if (!document.getElementById('trend-chart-container')) {
        console.error('trend-chart-container elementi bulunamadı, trend grafiği gösterilemeyecek');
    }
    
    // Yıllara göre veri tablosu kontrol et
    if (!document.getElementById('yearly-data-container')) {
        console.error('yearly-data-container elementi bulunamadı, yıllık veriler gösterilemeyecek');
    }
}

// Grafik renkleri
const CHART_COLORS = [
    {border: 'rgba(54, 162, 235, 1)', background: 'rgba(54, 162, 235, 0.2)'},
    {border: 'rgba(255, 99, 132, 1)', background: 'rgba(255, 99, 132, 0.2)'},
    {border: 'rgba(75, 192, 192, 1)', background: 'rgba(75, 192, 192, 0.2)'},
    {border: 'rgba(255, 159, 64, 1)', background: 'rgba(255, 159, 64, 0.2)'},
    {border: 'rgba(153, 102, 255, 1)', background: 'rgba(153, 102, 255, 0.2)'},
    {border: 'rgba(255, 205, 86, 1)', background: 'rgba(255, 205, 86, 0.2)'},
    {border: 'rgba(201, 203, 207, 1)', background: 'rgba(201, 203, 207, 0.2)'},
    {border: 'rgba(255, 99, 71, 1)', background: 'rgba(255, 99, 71, 0.2)'}
];

/**
 * Karşılaştırma verilerini görüntüler
 * @param {Object} data - API'den gelen karşılaştırma verileri
 * @param {Array} countries - Karşılaştırılan ülkeler
 * @param {string} metric - Kullanılan metrik
 */
function displayComparisonData(data, countries, metric) {
    // Sonuç alanını temizle
    const resultContainer = document.getElementById('comparison-result');
    if (!resultContainer) {
        console.error('comparison-result elementi bulunamadı');
        return;
    }
    
    // Loading durumunu kaldır
    const loadingElement = document.getElementById('comparison-loading');
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
    
    // Metrik başlığını tanımla
    const metricTitle = getMetricTitle(metric);
    
    // HTML şablonu oluştur
    const template = `
        <div class="row mb-4">
            <div class="col-12">
                <h3>Ülke Karşılaştırması: ${metricTitle}</h3>
                <p class="lead">${countries.join(' vs ')} karşılaştırma sonuçları</p>
            </div>
        </div>
    
        <div class="row mb-4">
            <div class="col-12">
                <div class="card">
                    <div class="card-header">
                        <h5>${metricTitle} - Yıllara Göre Değişim</h5>
                    </div>
                    <div class="card-body">
                        <div id="comparison-chart" style="height: 400px;"></div>
                    </div>
                </div>
            </div>
        </div>
    
        <div class="row mb-4">
            <div class="col-12">
                <div class="card">
                    <div class="card-header">
                        <h5>Detaylı Veri Tablosu</h5>
                    </div>
                    <div class="card-body table-responsive">
                        <table class="table table-striped table-hover">
                            <thead>
                                <tr>
                                    <th>Yıl</th>
                                    ${countries.map(country => `<th>${country}</th>`).join('')}
                                </tr>
                            </thead>
                            <tbody id="comparison-table-body">
                                <!-- Tablo verileri JavaScript ile doldurulacak -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    
        <div class="row mb-4">
            <div class="col-12">
                <div class="card">
                    <div class="card-header">
                        <h5>Özet İstatistikler</h5>
                    </div>
                    <div class="card-body">
                        <div class="row" id="comparison-stats"></div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // innerHTML sadece bir kez çalıştır (daha performanslı)
    resultContainer.innerHTML = template;
    
    // Sonuçları göster
    resultContainer.style.display = 'block';
    
    console.log('Karşılaştırma verilerini gösterme:', data);
    
    // Grafik ve tabloyu doldur
    if (data && data.data && data.years) {
        console.log('Veriler uygun formatta, tabloları doldurma başlıyor...');
        
        // Element varlığını kontrol et
        const chartContainer = document.getElementById('comparison-chart');
        const tableBody = document.getElementById('comparison-table-body');
        const statsContainer = document.getElementById('comparison-stats');
        
        console.log('Elementler var mı?', {
            chartContainer: !!chartContainer,
            tableBody: !!tableBody,
            statsContainer: !!statsContainer
        });
        
        // Verilerin hazırlanması ve görüntülenmesi için timeouts kullan
        // Böylece tarayıcı UI thread'i bloke olmaz
        setTimeout(() => {
            try {
        createComparisonChart(data.data, data.years, countries, metric);
                console.log('Grafik oluşturuldu');
                
                setTimeout(() => {
                    try {
        fillComparisonTable(data.data, data.years, countries);
                        console.log('Tablo dolduruldu');
                        
                        setTimeout(() => {
                            try {
        displayComparisonStats(data.stats, countries, metric);
                                console.log('İstatistikler gösterildi');
                            } catch (e) {
                                console.error('İstatistikler gösterilirken hata:', e);
                            }
                        }, 0);
                    } catch (e) {
                        console.error('Tablo doldurulurken hata:', e);
                    }
                }, 0);
            } catch (e) {
                console.error('Grafik oluşturulurken hata:', e);
            }
        }, 0);
    } else {
        console.error('Veriler uygun formatta değil:', data);
        
        // Hata durumunda bilgilendirici bir mesaj göster
        const errorHtml = `
            <div class="alert alert-warning">
                <h5><i class="bi bi-exclamation-triangle"></i> Veri Formatı Hatası</h5>
                <p>Karşılaştırma verileri beklenen formatta değil. Lütfen farklı ülkeler veya metrikler seçerek tekrar deneyin.</p>
                <details>
                    <summary>Teknik Detaylar</summary>
                    <pre>${JSON.stringify(data, null, 2)}</pre>
                </details>
            </div>
        `;
        
        resultContainer.innerHTML += errorHtml;
    }
}

/**
 * Metriğe ait başlığı döndürür
 * @param {string} metric - Metrik adı
 * @returns {string} - Metrik başlığı
 */
function getMetricTitle(metric) {
    const metricTitles = {
        'gdp': 'Gayri Safi Yurtiçi Hasıla (GDP)',
        'population': 'Nüfus',
        'life_expectancy': 'Yaşam Beklentisi',
        'co2_emissions': 'CO2 Emisyonu',
        'energy_consumption': 'Enerji Tüketimi',
        'renewable_energy': 'Yenilenebilir Enerji Tüketimi',
        'renewable_percentage': 'Yenilenebilir Enerji Yüzdesi',
        'solar_energy': 'Güneş Enerjisi Kullanımı',
        'wind_energy': 'Rüzgar Enerjisi Kullanımı',
        'hydro_energy': 'Hidroelektrik Enerji Kullanımı',
        'nuclear_energy': 'Nükleer Enerji Kullanımı',
        'unemployment': 'İşsizlik Oranı',
        'inflation': 'Enflasyon Oranı'
    };
    
    return metricTitles[metric] || 'Bilinmeyen Metrik';
}

/**
 * Karşılaştırma grafiğini oluşturur
 * @param {Object} data - Karşılaştırma verileri 
 * @param {Array} years - Yıl listesi
 * @param {Array} countries - Ülke listesi
 * @param {string} metric - Metrik adı
 */
function createComparisonChart(data, years, countries, metric) {
    const chartContainer = document.getElementById('comparison-chart');
    if (!chartContainer) return;
    
    // Eğer Highcharts yüklü değilse, hata mesajı göster
    if (typeof Highcharts === 'undefined') {
        chartContainer.innerHTML = '<div class="alert alert-warning">Grafik kütüphanesi yüklenemedi</div>';
        return;
    }
    
    // Metrik için birim belirle
    let yAxisTitle = getMetricTitle(metric);
    let tooltipSuffix = '';
    
    // Metriğe göre ekstra ayarlar
    if (metric === 'renewable_percentage') {
        tooltipSuffix = '%';
    } else if (metric.includes('energy')) {
        tooltipSuffix = ' TWh';
    } else if (metric === 'co2_emissions') {
        tooltipSuffix = ' Mt';
    }
    
    // Seri verilerini oluştur (data memoization için)
    const seriesData = [];
    
    for (let i = 0; i < countries.length; i++) {
        const country = countries[i];
        const countryData = [];
        
        for (let j = 0; j < years.length; j++) {
            const year = years[j];
                // Ülkeye ait veri yoksa null döndür
                if (!data[country] || data[country][year] === undefined) {
                countryData.push(null);
            } else {
                countryData.push(data[country][year]);
            }
        }
        
        seriesData.push({
            name: country,
            data: countryData
        });
    }
    
    // Eğer chart zaten varsa yenile
    if (comparisonChart) {
        comparisonChart.destroy();
    }
    
    // Yeni chart oluştur
    comparisonChart = Highcharts.chart('comparison-chart', {
        chart: {
            type: 'line',
            events: {
                load() {
                    setTimeout(() => {
                        if (this && typeof this.reflow === 'function') {
                            this.reflow();
                        }
                    }, 100);
                }
            }
        },
        title: {
            text: null
        },
        xAxis: {
            categories: years,
            title: {
                text: 'Yıl'
            }
        },
        yAxis: {
            title: {
                text: yAxisTitle
            }
        },
        tooltip: {
            shared: true,
            valueDecimals: 2,
            valueSuffix: tooltipSuffix
        },
        legend: {
            enabled: true
        },
        series: seriesData,
        plotOptions: {
            line: {
                marker: {
                    enabled: false
                }
            }
        },
        credits: {
            enabled: false
        },
        boost: {
            useGPUTranslations: true,
            usePreallocated: true
        }
    });
}

/**
 * İstatistik kartlarını gösterir
 * @param {Object} stats - İstatistik verileri
 * @param {Array} countries - Ülke listesi
 * @param {string} metric - Metrik adı
 */
function displayComparisonStats(stats, countries, metric) {
    const statsContainer = document.getElementById('comparison-stats');
    if (!statsContainer) return;
    
    // Her ülke için istatistik kartı oluştur
    let statHtml = '';
    
    for (let i = 0; i < countries.length; i++) {
        const country = countries[i];
        if (!stats[country]) continue;
        
        const countryStats = stats[country];
        
        statHtml += `
            <div class="col-md-4 mb-3">
                <div class="card">
                    <div class="card-header bg-primary text-white">
                        ${country}
                    </div>
                    <div class="card-body">
                        <ul class="list-group list-group-flush">
                            <li class="list-group-item d-flex justify-content-between">
                                <span>Ortalama:</span>
                                <strong>${formatNumber(countryStats.mean)}</strong>
                            </li>
                            <li class="list-group-item d-flex justify-content-between">
                                <span>Minimum:</span>
                                <strong>${formatNumber(countryStats.min)}</strong>
                            </li>
                            <li class="list-group-item d-flex justify-content-between">
                                <span>Maksimum:</span>
                                <strong>${formatNumber(countryStats.max)}</strong>
                            </li>
                            <li class="list-group-item d-flex justify-content-between">
                                <span>Std. Sapma:</span>
                                <strong>${formatNumber(countryStats.std)}</strong>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }
    
    // İstatistikleri bir kerede güncelle
    statsContainer.innerHTML = statHtml;
}

/**
 * Karşılaştırma sayfasında hata mesajı gösterir
 * @param {string} message - Hata mesajı
 */
function showComparisonError(message) {
    const resultContainer = document.getElementById('comparison-result');
    const loadingElement = document.getElementById('comparison-loading');
    
    // Loading gizle
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
    
    // Hata mesajını göster
    if (resultContainer) {
        resultContainer.innerHTML = `
            <div class="alert alert-danger" role="alert">
                <i class="fas fa-exclamation-triangle me-2"></i> ${message}
            </div>
        `;
    }
}

/**
 * Sayıyı formatlı şekilde döndürür
 * @param {number} value - Formatlanacak sayı
 * @returns {string} - Formatlanmış sayı
 */
function formatNumber(value) {
    if (value === null || value === undefined) return 'Veri yok';
    
    if (typeof value !== 'number') {
        return value.toString();
    }
    
    // Belirli bir değerin altında olan sayılar için formatlanmış string'i önbelleğe al
    const cacheKey = value.toString();
    
    // Büyük sayılar için bin ayırıcı kullan
    if (Math.abs(value) >= 1000) {
        return value.toLocaleString('tr-TR');
    }
    
    // Küçük sayılar için ondalık basamak kullan
    return value.toFixed(2);
}

// Önceden belirlenmiş renkler
const COLOR_PALETTE = ['primary', 'success', 'warning', 'danger', 'info'];

/**
 * Rastgele renk sınıfı döndürür (Bootstrap renkleri)
 * @returns {string} - Renk sınıfı
 */
function getRandomColor() {
    const index = Math.floor(Math.random() * COLOR_PALETTE.length);
    return COLOR_PALETTE[index];
}

/**
 * Yeni bir ülke seçici ekler
 */
function addCountrySelector() {
    const countryContainer = document.getElementById('countries-container');
    
    if (!countryContainer) return;
    
    // Maksimum 5 ülke seçilebilir
    const existingSelectors = countryContainer.querySelectorAll('.country-selector');
    if (existingSelectors.length >= 5) {
        // Eğer maksimuma ulaştıysa bilgilendirme mesajı göster ve çık
        const message = document.createElement('div');
        message.className = 'alert alert-info mt-2 mb-2 fade show';
        message.setAttribute('role', 'alert');
        message.innerHTML = 'En fazla 5 ülke karşılaştırabilirsiniz.';
        
        countryContainer.appendChild(message);
        
        // 3 saniye sonra mesajı kaldır
        setTimeout(() => {
            if (message.parentNode) {
            countryContainer.removeChild(message);
            }
        }, 3000);
        
        return;
    }
    
    // Yeni ülke seçici oluştur (template kullanarak)
    const template = `
        <div class="country-selector mb-3 d-flex align-items-center">
            <div class="input-group">
                <select class="form-select country-select" required aria-label="Ülke Seçimi">
                    <option value="">Ülke Seçiniz</option>
                </select>
            </div>
            <button type="button" class="btn btn-outline-danger ms-2">
                <i class="bi bi-trash"></i>
            </button>
        </div>
    `;
    
    // Template string'i DOM elementlerine çevir
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = template.trim();
    const selectorDiv = tempDiv.firstChild;
    
    // Ülke listesi ile seçim kutusunu doldur
    const select = selectorDiv.querySelector('select');
    populateCountrySelector(select, false);
    
    // Silme butonu işlevselliği
    const removeButton = selectorDiv.querySelector('button');
    removeButton.addEventListener('click', function() {
        countryContainer.removeChild(selectorDiv);
    });
    
    // Ülke seçicisini container'a ekle
    countryContainer.appendChild(selectorDiv);
    
    // İlk ülke seçicisinde silme butonu gizlensin
    const allSelectors = countryContainer.querySelectorAll('.country-selector');
    if (allSelectors.length <= 2) {
        // For döngüsü daha performanslı
        for (let i = 0; i < allSelectors.length; i++) {
            const button = allSelectors[i].querySelector('button');
            if (button) button.style.display = 'none';
        }
    } else {
        for (let i = 0; i < allSelectors.length; i++) {
            const button = allSelectors[i].querySelector('button');
            if (button) button.style.display = 'block';
        }
    }
}

/**
 * Ülke seçicisini mevcut ülke listesiyle doldurur
 * @param {HTMLSelectElement} selectElement - Doldurulacak select elementi
 * @param {boolean} selectTurkey - Türkiye'yi seçili duruma getir
 */
function populateCountrySelector(selectElement, selectTurkey) {
    if (!selectElement) return;
    
    // Global değişken kullan veya yüklü olan ülke listesini
    const countries = window.availableCountries || availableCountries;
    
    if (!countries || !countries.length) {
        console.warn('Ülke listesi bulunamadı');
        return;
    }
    
    // Document fragment kullanarak sadece bir kere DOM güncelleme
    const fragment = document.createDocumentFragment();
    
    // İlk seçenek olarak "Ülke Seçiniz" ekle
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Ülke Seçiniz';
    fragment.appendChild(defaultOption);
    
    // Tüm ülkeleri ekle
    for (let i = 0; i < countries.length; i++) {
        const country = countries[i];
        const option = document.createElement('option');
        option.value = country;
        option.textContent = country;
        
        // Eğer Türkiye seçilecekse ve ülke Türkiye ise seçili yap
        if (selectTurkey && country === 'Turkey') {
            option.selected = true;
        }
        
        fragment.appendChild(option);
    }
    
    // Select elementini temizle ve tüm seçenekleri bir kerede ekle
    selectElement.innerHTML = '';
    selectElement.appendChild(fragment);
}

/**
 * Karşılaştırma için ülke listesini yükler
 */
async function loadComparisonCountryList() {
    const countrySelect = document.getElementById('comparison-select');
    if (!countrySelect) return;

    // Mevcut ülke seçeneklerini temizle
    countrySelect.innerHTML = '<option value="" selected disabled>Bir ülke seçin</option>';
    
    try {
        console.log('Ülke listesi yükleniyor');
        
        // Sırayla denenecek API endpointleri
        const endpoints = [
            '/api/countries',
            '/api/data/countries'
        ];
        
        let success = false;
        let countries = [];
        
        // Her endpoint'i sırayla dene
        for (const endpoint of endpoints) {
            try {
                console.log(`${endpoint} deneniyor...`);
                const response = await fetch(endpoint);
                
                if (!response.ok) {
                    console.warn(`${endpoint} başarısız, durum:`, response.status);
                    continue;
                }
                
                const data = await response.json();
                console.log(`${endpoint} yanıtı:`, data);
                
                // API yanıtının yapısını kontrol et
                if (Array.isArray(data)) {
                    // Direkt dizi döndüyse
                    countries = data;
                } else if (data.countries && Array.isArray(data.countries)) {
                    // {countries: [...]} yapısında döndüyse
                    countries = data.countries;
                } else if (data.success && data.countries && Array.isArray(data.countries)) {
                    // {success: true, countries: [...]} yapısında döndüyse
                    countries = data.countries;
                }
                
                if (countries.length > 0) {
                    success = true;
                    break; // Başarılı olduysa diğer endpoint'leri deneme
                }
            } catch (endpointError) {
                console.warn(`${endpoint} hata verdi:`, endpointError);
            }
        }
        
        // Ülke dizisinden listeyi oluştur
        if (success && countries.length > 0) {
            // Formatı kontrol et ve düzenle
            const formattedCountries = countries.map(country => {
                if (typeof country === 'object' && country !== null) {
                    return country.name || country.code || country.value || country;
                }
                return country;
            });
            
            // Alfabetik sırala
            formattedCountries.sort((a, b) => String(a).localeCompare(String(b), 'tr'));
            
            // Seçim kutusunu doldur
            formattedCountries.forEach(country => {
                const option = document.createElement('option');
                option.value = country;
                option.textContent = country;
                countrySelect.appendChild(option);
            });
            
            // Global değişkene kaydet
            availableCountries = formattedCountries;
            
            console.log('Ülke listesi başarıyla yüklendi:', formattedCountries.length, 'ülke');
            return;
        }
        
        // Başarılı olamadıysa demo ülkeleri kullan
        throw new Error('API\'den ülke listesi alınamadı');
    } catch (error) {
        console.error('Ülke listesi yüklenirken hata:', error);
        
        // Demo ülkeleri kullan
        const demoCountries = [
            'Türkiye', 'Almanya', 'Fransa', 'İtalya', 'İspanya',
            'Birleşik Krallık', 'ABD', 'Kanada', 'Japonya', 'Çin',
            'Hindistan', 'Brezilya', 'Rusya', 'Avustralya', 'Güney Afrika'
        ];
        
        // Demo ülkeleriyle doldur
        demoCountries.forEach(country => {
            const option = document.createElement('option');
            option.value = country;
            option.textContent = country;
            countrySelect.appendChild(option);
        });
        
        // Global değişkene kaydet
        availableCountries = demoCountries;
        
        console.log('Demo ülke listesi kullanılıyor:', demoCountries.length, 'ülke');
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
    title.className = 'mb-2 fw-bold';
    title.textContent = 'Seçili Ülkeler:';
    listContainer.appendChild(title);
    
    const list = document.createElement('div');
    list.className = 'd-flex flex-wrap gap-2';
    
    if (selectedCountries.length === 0) {
        const noCountry = document.createElement('p');
        noCountry.className = 'text-muted fst-italic mb-0';
        noCountry.textContent = 'Henüz ülke seçilmedi';
        list.appendChild(noCountry);
    } else {
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
    }
    
    listContainer.appendChild(list);
    container.appendChild(listContainer);
    
    // Karşılaştırma sonucunu gösterme kontrolü
    const comparisonDetails = document.getElementById('comparison-details');
    if (comparisonDetails) {
        if (selectedCountries.length >= 1) {
            comparisonDetails.classList.remove('d-none');
        } else {
            comparisonDetails.classList.add('d-none');
        }
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
    if (selectedCountries.length >= 1) {
        loadComparisonData(selectedCountries);
    } else {
        // Ülke kalmadıysa karşılaştırma sonucunu gizle
        document.getElementById('comparison-details').classList.add('d-none');
    }
} 