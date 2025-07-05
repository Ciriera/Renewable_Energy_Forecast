/**
 * Çizelge Görselleştirme Modülü
 * Highcharts veya Chart.js kütüphaneleriyle çeşitli grafik ve çizelgeleri oluşturur
 */

// Sayfa yüklendiğinde grafik kütüphanelerini ve stilleri başlat
document.addEventListener('DOMContentLoaded', function() {
    console.log('Grafik modülü başlatılıyor...');
    
    // Highcharts kütüphanesini kontrol et ve yükle
    checkAndLoadHighchartsLibrary()
        .then(() => {
            // Grafik stillerini başlat
            initializeChartStyles();
            console.log('Grafik modülü hazır.');
        })
        .catch(error => {
            console.error('Grafik kütüphanesi yüklenirken hata:', error);
        });
});

/**
 * Highcharts kütüphanesini kontrol eder ve gerekirse yükler
 * @returns {Promise} - Kütüphane yükleme işlemini izleyen Promise
 */
function checkAndLoadHighchartsLibrary() {
    return new Promise((resolve, reject) => {
        // Highcharts zaten yüklü mü kontrol et
        if (window.Highcharts) {
            console.log('Highcharts zaten yüklenmiş.');
            resolve();
            return;
        }
        
        console.log('Highcharts yükleniyor...');
        
        // Highcharts'ı CDN'den yükle
        const script = document.createElement('script');
        script.src = 'https://code.highcharts.com/highcharts.js';
        script.async = true;
        
        script.onload = function() {
            console.log('Highcharts başarıyla yüklendi.');
            
            // Ek Highcharts modüllerini yükle
            const modulesToLoad = [
                'https://code.highcharts.com/modules/exporting.js',
                'https://code.highcharts.com/modules/export-data.js',
                'https://code.highcharts.com/modules/accessibility.js'
            ];
            
            let loadedModules = 0;
            
            modulesToLoad.forEach(moduleUrl => {
                const moduleScript = document.createElement('script');
                moduleScript.src = moduleUrl;
                moduleScript.async = true;
                
                moduleScript.onload = function() {
                    loadedModules++;
                    if (loadedModules === modulesToLoad.length) {
                        console.log('Tüm Highcharts modülleri yüklendi.');
                        resolve();
                    }
                };
                
                moduleScript.onerror = function() {
                    console.warn(`Highcharts modülü yüklenemedi: ${moduleUrl}`);
                    loadedModules++;
                    if (loadedModules === modulesToLoad.length) {
                        // Temel modül yüklendiyse, bir modül hatasında bile devam et
                        resolve();
                    }
                };
                
                document.head.appendChild(moduleScript);
            });
        };
        
        script.onerror = function() {
            console.error('Highcharts yüklenemedi. Alternatif grafik kütüphanesi denenecek.');
            
            // Highcharts yüklenemezse Chart.js'yi dene
            const chartJsScript = document.createElement('script');
            chartJsScript.src = 'https://cdn.jsdelivr.net/npm/chart.js';
            chartJsScript.async = true;
            
            chartJsScript.onload = function() {
                console.log('Chart.js başarıyla yüklendi (Yedek grafik kütüphanesi).');
                resolve();
            };
            
            chartJsScript.onerror = function() {
                console.error('Chart.js de yüklenemedi. Grafik fonksiyonları çalışmayabilir.');
                reject(new Error('Grafik kütüphaneleri yüklenemedi'));
            };
            
            document.head.appendChild(chartJsScript);
        };
        
        document.head.appendChild(script);
    });
}

/**
 * Highcharts için global stilleri ve renk temalarını başlatır
 */
function initializeChartStyles() {
    // Highcharts varsa stillerini ayarla
    if (window.Highcharts) {
        console.log('Highcharts stilleri uygulanıyor...');
        
        // Varsayılan renkler
        Highcharts.setOptions({
            colors: [
                '#2b908f', '#90ee7e', '#f45b5b', '#7798BF', '#aaeeee', 
                '#ff0066', '#eeaaee', '#55BF3B', '#DF5353', '#7798BF', '#aaeeee'
            ],
            chart: {
                backgroundColor: '#f8f9fa',
                style: {
                    fontFamily: 'Segoe UI, -apple-system, BlinkMacSystemFont, Arial, sans-serif'
                }
            },
            title: {
                style: {
                    color: '#333',
                    fontSize: '14px',
                    fontWeight: 'bold'
                }
            },
            subtitle: {
                style: {
                    color: '#666',
                    fontSize: '12px'
                }
            },
            tooltip: {
                borderWidth: 1,
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                shadow: true
            },
            legend: {
                itemStyle: {
                    fontWeight: 'normal',
                    fontSize: '12px'
                },
                itemHoverStyle: {
                    color: '#5c6bc0'
                }
            },
            xAxis: {
                labels: {
                    style: {
                        color: '#666',
                        fontSize: '11px'
                    }
                },
                title: {
                    style: {
                        color: '#333',
                        fontSize: '12px'
                    }
                }
            },
            yAxis: {
                labels: {
                    style: {
                        color: '#666',
                        fontSize: '11px'
                    }
                },
                title: {
                    style: {
                        color: '#333',
                        fontSize: '12px'
                    }
                }
            },
            plotOptions: {
                series: {
                    animation: {
                        duration: 1000
                    },
                    stacking: undefined
                }
            },
            credits: {
                enabled: false
            }
        });
    }
    
    // Chart.js varsa stillerini ayarla
    if (window.Chart) {
        console.log('Chart.js stilleri uygulanıyor...');
        
        // Global Chart.js ayarları
        Chart.defaults.color = '#666';
        Chart.defaults.font.family = 'Segoe UI, -apple-system, BlinkMacSystemFont, Arial, sans-serif';
        Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(255, 255, 255, 0.9)';
        Chart.defaults.plugins.tooltip.titleColor = '#333';
        Chart.defaults.plugins.tooltip.bodyColor = '#333';
        Chart.defaults.plugins.tooltip.borderWidth = 1;
        Chart.defaults.plugins.tooltip.borderColor = '#ddd';
        Chart.defaults.plugins.tooltip.displayColors = true;
    }
}

/**
 * Verilen element için yükleniyor göstergesi oluşturur
 * @param {string} elementId - Yükleniyor göstergesinin yerleştirileceği element ID'si
 * @param {string} message - Gösterilecek yükleniyor mesajı
 */
function showChartLoading(elementId, message = 'Grafik yükleniyor...') {
    const container = document.getElementById(elementId);
    if (container) {
        container.innerHTML = `
            <div class="d-flex justify-content-center align-items-center" style="height: 300px;">
                <div class="text-center">
                    <div class="spinner-border text-primary mb-3" role="status">
                        <span class="visually-hidden">${message}</span>
                    </div>
                    <p class="text-muted">${message}</p>
                </div>
            </div>
        `;
    }
}

/**
 * Grafik oluşturma hatası gösterir
 * @param {string} elementId - Hata mesajının gösterileceği element ID'si
 * @param {string} errorMessage - Gösterilecek hata mesajı
 */
function showChartError(elementId, errorMessage) {
    const container = document.getElementById(elementId);
    if (container) {
        container.innerHTML = `
            <div class="alert alert-danger d-flex align-items-center" role="alert">
                <i class="bi bi-exclamation-triangle-fill me-2"></i>
                <div>
                    <h5 class="alert-heading">Grafik oluşturulamadı</h5>
                    <hr>
                    <p class="mb-0">${errorMessage}</p>
                </div>
            </div>
        `;
    }
}

/**
 * Grafik verisi ve kütüphanesi için bekler, ardından uygun fonksiyonu çağırır
 * @param {string} elementId - Grafiğin çizileceği element ID'si
 * @param {Function} highchartsRenderFn - Highcharts ile çizim yapacak fonksiyon
 * @param {Function} chartJsRenderFn - Chart.js ile çizim yapacak fonksiyon 
 * @param {Function} fallbackFn - İkisi de yoksa kullanılacak yedek fonksiyon
 * @param {Array|Object} data - Grafik verisi
 * @param {...*} additionalArgs - Grafiğe geçirilecek ek parametreler
 */
function waitForChartData(elementId, highchartsRenderFn, chartJsRenderFn, fallbackFn, data, ...additionalArgs) {
    // Veri yoksa hata göster
    if (!data || (Array.isArray(data) && data.length === 0)) {
        showChartError(elementId, 'Gösterilecek veri bulunamadı.');
        return;
    }

    // Yükleniyor göster
    showChartLoading(elementId);
    
    // Highcharts varsa çiz
    if (window.Highcharts) {
        console.log('Highcharts ile grafik çiziliyor...');
        highchartsRenderFn(elementId, data, ...additionalArgs);
    }
    // Chart.js varsa çiz
    else if (window.Chart) {
        console.log('Chart.js ile grafik çiziliyor...');
        chartJsRenderFn(elementId, data, ...additionalArgs);
    }
    // Her ikisi de yoksa, yedek fonksiyonu çağır (örn. tablo gösterme)
    else {
        console.warn('Grafik kütüphanesi bulunamadı, alternatif görünüm kullanılıyor.');
        fallbackFn(elementId, data, ...additionalArgs);
    }
}

/**
 * Özellik önem grafiğini oluşturur
 * Veri içinde önem değerlerine göre sıralanmış özellikleri gösterir
 * 
 * @param {string} elementId - Grafiğin çizileceği element ID'si
 * @param {Array} featureData - Özellik önem verileri [{name: string, importance: number}, ...]
 * @param {string} country - Ülke adı (başlık için)
 */
function renderFeatureImportanceChart(elementId, featureData, country = 'global') {
    console.log(`Özellik önem grafiği oluşturuluyor [charts.js] - Ülke: ${country}, Element: ${elementId}`);
    
    // DOM elementi kontrolü
    const container = document.getElementById(elementId);
    if (!container) {
        console.error(`renderFeatureImportanceChart: Element bulunamadı: #${elementId}`);
        return;
    }

    // Veri kontrolü
    if (!featureData || !Array.isArray(featureData) || featureData.length === 0) {
        console.error(`renderFeatureImportanceChart: Geçerli özellik önem verisi bulunamadı (${country})`);
        container.innerHTML = `
            <div class="alert alert-warning">
                <i class="bi bi-exclamation-triangle me-2"></i> 
                Grafik için veri bulunamadı. Lütfen sayfayı yenileyin veya farklı bir ülke seçin.
            </div>
        `;
        return;
    }
    
    // Yükleniyor göster
    showChartLoading(elementId, 'Özellik önem grafiği oluşturuluyor...');
    
    // Top 10 özellikleri al
    const topFeatures = featureData.slice(0, 10);
    
    // Özellik isimlerini ve değerlerini ayır
    const processedData = topFeatures.map(feature => {
        // Özellik adını belirle
        const featureName = feature.name || feature.feature || 'Bilinmeyen';
        
        // Önem değerini al (çeşitli formatlara uyum sağlayacak şekilde)
        let importanceValue = feature.importance;
        if (importanceValue === undefined && feature.value !== undefined) {
            importanceValue = feature.value;
        }
        
        // Sayıya çevir
        importanceValue = parseFloat(importanceValue);
        
        // NaN kontrolü
        if (isNaN(importanceValue)) {
            importanceValue = 0;
        }
        
        // 0-1 aralığından yüzdeye çevir
        if (importanceValue <= 1) {
            importanceValue = importanceValue * 100;
        }
        
        return {
            name: featureName,
            y: parseFloat(importanceValue.toFixed(2))
        };
    });
    
    // Başlık metni
    const title = country.toLowerCase() === 'global' ? 
        'Global Özellik Önem Değerleri' : 
        `${country} Ülkesi için Özellik Önem Değerleri`;
    
    // Alt başlık metni
    const subtitle = `En önemli ${topFeatures.length} özellik gösteriliyor`;
    
    // Renk gradyan fonksiyonu - özellik sayısına göre renk oluşturur
    function generateColorGradient(count) {
        const baseColors = [
            { r: 43, g: 144, b: 143 },  // #2b908f
            { r: 231, g: 76, b: 60 }    // #e74c3c
        ];
        
        const colors = [];
        
        for (let i = 0; i < count; i++) {
            const ratio = i / (count - 1);
            
            const r = Math.round(baseColors[0].r + ratio * (baseColors[1].r - baseColors[0].r));
            const g = Math.round(baseColors[0].g + ratio * (baseColors[1].g - baseColors[0].g));
            const b = Math.round(baseColors[0].b + ratio * (baseColors[1].b - baseColors[0].b));
            
            colors.push(`rgb(${r}, ${g}, ${b})`);
        }
        
        return colors;
    }
    
    // Highcharts ile grafik çiz (varsa)
    function renderWithHighcharts(elementId, data, title, subtitle) {
        try {
            Highcharts.chart(elementId, {
                chart: {
                    type: 'bar'
                },
                title: {
                    text: title
                },
                subtitle: {
                    text: subtitle
                },
                xAxis: {
                    categories: data.map(item => item.name),
                    title: {
                        text: 'Özellikler'
                    }
                },
                yAxis: {
                    title: {
                        text: 'Önem Değeri (%)'
                    },
                    labels: {
                        format: '{value}%'
                    }
                },
                tooltip: {
                    formatter: function() {
                        return `<b>${this.x}</b><br/>Önem: ${this.y}%`;
                    }
                },
                plotOptions: {
                    bar: {
                        dataLabels: {
                            enabled: true,
                            format: '{y}%',
                            style: {
                                fontWeight: 'bold'
                            }
                        },
                        colorByPoint: true,
                        colors: generateColorGradient(data.length)
                    }
                },
                legend: {
                    enabled: false
                },
                credits: {
                    enabled: false
                },
                series: [{
                    name: 'Önem Değeri',
                    data: data.map(item => item.y)
                }],
                exporting: {
                    enabled: true,
                    buttons: {
                        contextButton: {
                            menuItems: ['downloadPNG', 'downloadJPEG', 'downloadPDF', 'downloadCSV']
                        }
                    }
                }
            });
            
            console.log('Highcharts grafik başarıyla oluşturuldu.');
        } catch (error) {
            console.error('Highcharts ile grafik oluşturulurken hata:', error);
            showChartError(elementId, `Grafik oluşturulamadı: ${error.message}`);
        }
    }
    
    // Chart.js ile grafik çiz (Highcharts yoksa)
    function renderWithChartJS(elementId, data, title, subtitle) {
        try {
            const container = document.getElementById(elementId);
            container.innerHTML = '';
            
            // Canvas elementi oluştur
            const canvas = document.createElement('canvas');
            container.appendChild(canvas);
            
            const ctx = canvas.getContext('2d');
            
    new Chart(ctx, {
        type: 'bar',
        data: {
                    labels: data.map(item => item.name),
            datasets: [{
                        label: 'Önem Değeri (%)',
                        data: data.map(item => item.y),
                        backgroundColor: generateColorGradient(data.length),
                borderWidth: 1
            }]
        },
        options: {
                    indexAxis: 'y',
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: title,
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                },
                        subtitle: {
                            display: true,
                            text: subtitle,
                            font: {
                                size: 14
                    }
                },
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                                    return `Önem: ${context.formattedValue}%`;
                        }
                    }
                }
            },
            scales: {
                        x: {
                    beginAtZero: true,
                    title: {
                        display: true,
                                text: 'Önem Değeri (%)'
                    },
                    ticks: {
                                callback: function(value) {
                                    return value + '%';
                                }
                    }
                }
            }
        }
    });
    
            console.log('Chart.js grafik başarıyla oluşturuldu.');
        } catch (error) {
            console.error('Chart.js ile grafik oluşturulurken hata:', error);
            showChartError(elementId, `Grafik oluşturulamadı: ${error.message}`);
        }
    }
    
    // Tablo ile gösterme fonksiyonu (yedek)
    function renderWithTable(elementId, data, title, subtitle) {
        try {
            const tableContainer = document.getElementById(elementId);
            if (!tableContainer) return;
            
            // Tablo HTML'ini oluştur
            tableContainer.innerHTML = `
                <div class="card">
                    <div class="card-header bg-primary text-white">
                        <h5 class="card-title mb-0">${title}</h5>
                    </div>
                    <div class="card-body">
                        <p class="text-muted">${subtitle}</p>
                        <div class="table-responsive">
                            <table class="table table-striped table-hover">
                                <thead>
                                    <tr>
                                        <th>Sıra</th>
                                        <th>Özellik</th>
                                        <th>Önem Değeri (%)</th>
                                        <th>Görselleştirme</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${data.map((feature, index) => `
                                        <tr>
                                            <td>${index + 1}</td>
                                            <td>${feature.name}</td>
                                            <td>${feature.y.toFixed(2)}%</td>
                                            <td>
                                                <div class="progress">
                                                    <div class="progress-bar bg-success" role="progressbar" 
                                                        style="width: ${Math.min(feature.y, 100)}%;" 
                                                        aria-valuenow="${feature.y}" 
                                                        aria-valuemin="0" aria-valuemax="100"></div>
                                                </div>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                        <div class="text-muted mt-3">
                            <small>
                                <i class="bi bi-info-circle"></i> 
                                Bu tablo, özellik önem değerlerini gösterir. Önem değeri yüksek olan özellikler, model tahmini üzerinde daha fazla etkiye sahiptir.
                            </small>
                        </div>
                    </div>
                </div>
            `;
            
            console.log('Tablo olarak başarıyla gösterildi.');
        } catch (error) {
            console.error('Tablo ile gösterirken hata:', error);
            showChartError(elementId, `Tablo oluşturulamadı: ${error.message}`);
        }
    }
    
    // Uygun grafik türüne göre çizimi gerçekleştir
    if (window.Highcharts) {
        renderWithHighcharts(elementId, processedData, title, subtitle);
    } else if (window.Chart) {
        renderWithChartJS(elementId, processedData, title, subtitle);
    } else {
        renderWithTable(elementId, processedData, title, subtitle);
    }
    
    // Not bölümü ekle
    const chartElement = document.getElementById(elementId);
    if (chartElement) {
        // Grafik alt kısmına not ekle
        setTimeout(() => {
            // Notları sadece halihazırda not yoksa ekle
            if (!chartElement.querySelector('.chart-notes')) {
                const notesElement = document.createElement('div');
                notesElement.className = 'chart-notes text-muted small mt-2';
                notesElement.innerHTML = `
                    <p><i class="bi bi-info-circle me-1"></i> Bu grafik, model tahmini üzerinde en fazla etkiye sahip özellikleri göstermektedir.</p>
                    <p><i class="bi bi-lightbulb me-1"></i> Önem değeri, modelin tahmin yapmasında bir özelliğin ne kadar etkili olduğunu belirtir.</p>
                `;
                chartElement.appendChild(notesElement);
            }
        }, 500);
    }
} 