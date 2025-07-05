/**
 * Özellik Mühendisliği JavaScript Dosyası
 * 
 * Bu dosya, özellik mühendisliği bölümünün fonksiyonlarını içerir:
 * - Özellik önem grafiği
 * - En önemli özelliklerin listesi
 */

// Global değişkenler
let featureChart = null;
let selectedCountry = null;
let allFeatures = [];

/**
 * Özellik Önem Analizi Modülü
 * MVVM mimarisine uygun şekilde özellik önem analizini görselleştiren modül
 */

// Küresel değişkenler
let featureChartGlobal = null;
let currentCountry = null;

/**
 * Özellik önem derecelerini API'den yükler
 * @param {string} endpoint - Kullanılacak API endpoint'i
 * @param {string} title - Gösterilecek başlık
 * @returns {Promise} - Asenkron işlemi temsil eden promise
 */
async function loadFeatureImportance(endpoint = '/api/feature_importance', title = 'Global Özellik Önem Dereceleri') {
    try {
        // Yükleme göstergelerini göster
        showLoadingIndicators();
        
        // API'den verileri al
        const data = await fetchFeatureData(endpoint);
        
        // Veriyi işle ve görüntüle
        displayFeatureImportance(data, title);
        
        // Başarılı bildirim göster
        showNotification('Özellik önem dereceleri başarıyla yüklendi', 'success');
        
        return data;
    } catch (error) {
        console.error('Özellik önem derecelerini yüklerken hata:', error);
        
        // Hata mesajlarını container'lara ekle
        displayFeatureError(error.message || 'Veri yüklenirken bir hata oluştu');
        
        // Hata bildirimi göster
        showNotification('Özellik verileri yüklenemedi: ' + error.message, 'error');
        
        throw error;
    }
}

/**
 * API'den özellik verilerini getirir
 * 
 * @param {string} endpoint - API endpoint'i
 * @returns {Promise<Object>} - İşlenmiş veri nesnesi
 */
async function fetchFeatureData(endpoint) {
    const response = await fetch(endpoint);
    
    if (!response.ok) {
        throw new Error(`HTTP hata! Durum: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Veri formatını kontrol et
    if (!data || !data.features || !Array.isArray(data.features) || data.features.length === 0) {
        throw new Error('API geçerli bir veri yapısı döndürmedi');
    }
    
    return data;
}

/**
 * Tüm yükleme göstergelerini gösterir
 */
function showLoadingIndicators() {
    const containers = [
        'feature-chart-container',
        'feature-list-container',
        'feature-description-container'
    ];
    
    containers.forEach(containerId => {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div class="d-flex justify-content-center align-items-center" style="height: 300px;">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Yükleniyor...</span>
                    </div>
                </div>
            `;
        }
    });
}

/**
 * Özellik önem grafiğini ve ilgili UI bileşenlerini görüntüler
 * 
 * @param {Array} data - Görüntülenecek özellik verileri
 * @param {string} title - Grafik başlığı
 */
function displayFeatureImportance(data, title = "Özellik Önem Analizi") {
    try {
        // Gerekli HTML elementlerinin kontrolü
        const chartContainer = document.getElementById('feature-chart-container');
        const chartCanvas = document.getElementById('feature-importance-chart');
        
        if (!chartContainer || !chartCanvas) {
            throw new Error('Grafik için gerekli HTML elementleri bulunamadı');
        }
        
        // Yükleme göstergelerini gizle
        hideLoadingIndicators();
        
        // Başlığı güncelle
        updateTitle(title);
        
        // Veriyi işle
        const features = processFeatureData(data);
        
        // Grafiği oluştur (ilk 10 özelliği göster)
        createFeatureImportanceChart(features, 10);
        
        // Özellik açıklamalarını görüntüle (ilk 5 özelliği göster)
        displayFeatureDescriptions(features, 5);
        
        // En önemli özellikleri liste olarak görüntüle
        updateTopFeatures(features.slice(0, 5));
        
        return features; // İşlenmiş özellikleri döndür
    } catch (error) {
        console.error('Özellik önemi görüntülenirken hata:', error);
        displayFeatureError(error.message);
        return null;
    }
}

/**
 * Yükleme göstergelerini gizler
 */
function hideLoadingIndicators() {
    // Tüm yükleme göstergelerini bul ve gizle
    const loaders = document.querySelectorAll('.feature-loading, .loading-spinner, .spinner-border');
    loaders.forEach(loader => {
        loader.style.display = 'none';
    });
    
    // Ana içerik alanlarını görünür hale getir
    const contentAreas = document.querySelectorAll('.feature-content');
    contentAreas.forEach(content => {
        content.style.display = 'block';
    });
}

/**
 * Başlığı günceller
 * 
 * @param {string} title - Yeni başlık
 */
function updateTitle(title) {
    const titleElement = document.getElementById('feature-title');
    if (titleElement) {
        titleElement.textContent = title;
    }
}

/**
 * Özellik verilerini işleyerek tutarlı bir formata dönüştürür
 * 
 * @param {Array} features - API'den gelen özellik verileri
 * @returns {Array} - İşlenmiş özellik verileri
 */
function processFeatureData(features) {
    if (!Array.isArray(features)) {
        throw new Error('Özellik verisi dizi formatında değil');
    }
    
    // Verileri normalize et ve sırala
    const processedFeatures = features.map(feature => {
        // Özellik adı (name, feature, label gibi farklı anahtar adları olabilir)
        let name = '';
        if (feature.name) name = feature.name;
        else if (feature.feature) name = feature.feature;
        else if (feature.label) name = feature.label;
        else if (Object.keys(feature).length > 0) name = Object.keys(feature)[0];
        else name = 'Bilinmeyen Özellik';
        
        // Önem değeri (importance, value, score gibi farklı anahtar adları olabilir)
        let importance = 0;
        if (feature.importance !== undefined) importance = feature.importance;
        else if (feature.value !== undefined) importance = feature.value;
        else if (feature.score !== undefined) importance = feature.score;
        else if (feature.weight !== undefined) importance = feature.weight;
        else if (typeof feature[name] === 'number') importance = feature[name];
        else if (Object.values(feature).length > 0) {
            const firstValue = Object.values(feature)[0];
            if (typeof firstValue === 'number') importance = firstValue;
        }
        
        // Önem değeri 0-100 arasında olmalı
        if (importance < 0) importance = 0;
        if (importance > 1 && importance <= 1000) {
            // 0-1 arasında normalize et (muhtemelen zaten 0-100 arasındadır)
            if (importance > 100) importance = importance / 1000;
            else importance = importance / 100;
        }
        
        // Önem değerini yüzde olarak dönüştür (0-100 arası)
        if (importance <= 1) {
            importance = importance * 100;
        }
        
        return {
            name: name,
            importance: importance
        };
    });
    
    // Önem derecesine göre azalan sıralama
    return processedFeatures.sort((a, b) => b.importance - a.importance);
}

/**
 * Özellik önem grafiğini oluşturur ve görüntüler
 * 
 * @param {Array} features - Görüntülenecek özellikler
 * @param {number} limit - Grafikte gösterilecek özellik sayısı
 * @returns {Chart} - Oluşturulan Chart.js nesnesi veya hata durumunda null
 */
function createFeatureImportanceChart(features, limit = 10) {
    try {
        // Önceki grafik varsa temizle
        if (featureChart instanceof Chart) {
            featureChart.destroy();
        }
        
        // Canvas elementini kontrol et
        const canvas = document.getElementById('feature-importance-chart');
        if (!canvas) {
            throw new Error('Grafik canvas elementi bulunamadı');
        }
        
        // Grafik verilerini hazırla
        const chartData = prepareChartData(features, limit);
        
        // Grafik yapılandırmasını oluştur
        const config = createChartConfig(chartData);
        
        // Canvas elementini seç
        const ctx = canvas.getContext('2d');
        
        // Grafiği oluştur
        featureChart = new Chart(ctx, config);
        
        // Grafik açıklaması ekle
        addChartLegend(features, limit);
        
        return featureChart;
    } catch (error) {
        console.error('Grafik oluşturulurken hata:', error);
        displayFeatureError(`Grafik oluşturulurken hata: ${error.message}`);
        return null;
    }
}

/**
 * Grafik için veri hazırlar
 * 
 * @param {Array} features - Tüm özellikler
 * @param {number} limit - Gösterilen maksimum özellik sayısı
 * @returns {Object} - Grafik için hazırlanmış veri
 */
function prepareChartData(features, limit) {
    // Gösterilecek özellikleri sınırla
    const displayFeatures = features.slice(0, limit);
    
    // Grafik verilerini hazırla
    const labels = displayFeatures.map(f => formatFeatureName(f.name));
    const values = displayFeatures.map(f => f.importance);
    
    // Renk setini oluştur
    const colors = generateChartColors(displayFeatures.length);
    
    return {
        labels,
        values,
        colors
    };
}

/**
 * Özellik adını formatlar (çok uzun olması durumunda kısaltır)
 * 
 * @param {string} name - Özellik adı
 * @returns {string} - Formatlanmış özellik adı
 */
function formatFeatureName(name) {
    // Özellik adını kısalt (25 karakterden uzunsa)
    if (name.length > 25) {
        return name.substring(0, 22) + '...';
    }
    return name;
}

/**
 * Chart.js yapılandırmasını oluşturur
 * 
 * @param {Object} chartData - Grafik verileri
 * @returns {Object} - Chart.js yapılandırması
 */
function createChartConfig(chartData) {
    return {
        type: 'bar',
        data: {
            labels: chartData.labels,
            datasets: [{
                label: 'Önem Derecesi (%)',
                data: chartData.values,
                backgroundColor: chartData.colors.background,
                borderColor: chartData.colors.border,
                borderWidth: 1,
                borderRadius: 4,
                barThickness: 'flex',
                maxBarThickness: 25,
                minBarLength: 5
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    left: 10,
                    right: 30,
                    top: 20,
                    bottom: 10
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 13
                    },
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            return `Önem Derecesi: %${value.toFixed(2)}`;
                        },
                        afterLabel: function(context) {
                            const value = context.raw;
                            let impactText = '';
                            
                            if (value >= 50) {
                                impactText = 'Çok Yüksek Etki';
                            } else if (value >= 30) {
                                impactText = 'Yüksek Etki';
                            } else if (value >= 15) {
                                impactText = 'Orta Etki';
                            } else {
                                impactText = 'Düşük Etki';
                            }
                            
                            return `Etki Seviyesi: ${impactText}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Önem Derecesi (%)',
                        font: {
                            size: 13,
                            weight: 'bold'
                        },
                        padding: { top: 10, bottom: 0 }
                    },
                    max: 100,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        callback: function(value) {
                            return `%${value}`;
                        }
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Özellikler',
                        font: {
                            size: 13,
                            weight: 'bold'
                        }
                    },
                    grid: {
                        display: false
                    }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeOutQuart'
            }
        }
    };
}

/**
 * Grafik için açıklamalı lejant ekler
 * 
 * @param {Array} features - Tüm özellikler
 * @param {number} limit - Gösterilen özellik sayısı
 */
function addChartLegend(features, limit) {
    // Lejant için container'ı kontrol et
    const legendContainer = document.getElementById('feature-chart-legend');
    if (!legendContainer) return;
    
    // Toplam özellik sayısını al
    const totalFeatures = features.length;
    
    // Lejant içeriğini oluştur
    let legendHTML = `
        <div class="chart-legend-info mb-3">
            <div class="d-flex justify-content-between align-items-center">
                <span class="text-muted">Toplam ${totalFeatures} özellikten ilk ${limit} tanesi gösteriliyor</span>
                <div class="legend-items d-flex">
                    <div class="legend-item me-3"><span class="badge bg-danger">&nbsp;</span> Çok Yüksek Etki</div>
                    <div class="legend-item me-3"><span class="badge bg-warning">&nbsp;</span> Yüksek Etki</div>
                    <div class="legend-item me-3"><span class="badge bg-info">&nbsp;</span> Orta Etki</div>
                    <div class="legend-item"><span class="badge bg-secondary">&nbsp;</span> Düşük Etki</div>
                </div>
            </div>
        </div>
    `;
    
    // Lejantı ekle
    legendContainer.innerHTML = legendHTML;
}

/**
 * Özellik açıklamalarını görüntüler
 * 
 * @param {Array} features - Görüntülenecek özellikler
 * @param {number} limit - Gösterilecek özellik sayısı
 */
function displayFeatureDescriptions(features, limit = 5) {
    try {
        const container = document.getElementById('feature-description-container');
        if (!container) {
            console.error('Açıklama konteyneri bulunamadı');
            return;
        }
        
        // Konteyneri temizle
        container.innerHTML = '';
        
        // Bölüm başlık ve açıklaması
        createSectionHeader(container);
        
        // Sadece belirtilen sayıda özelliği göster
        const topFeatures = features.slice(0, limit);
        
        // Özellik kartları için container
        const cardsContainer = document.createElement('div');
        cardsContainer.className = 'feature-cards';
        container.appendChild(cardsContainer);
        
        // Her özellik için özelleştirilmiş kart oluştur
        topFeatures.forEach((feature, index) => {
            const featureCard = createFeatureCard(feature, index);
            cardsContainer.appendChild(featureCard);
        });
        
        // Genel açıklama ekle
        addFeatureExplanation(container);
        
        return true;
    } catch (error) {
        console.error('Özellik açıklamaları görüntülenirken hata:', error);
        return false;
    }
}

/**
 * Bölüm başlık ve açıklamasını oluşturur
 * 
 * @param {HTMLElement} container - Ekleneceği konteyner
 */
function createSectionHeader(container) {
    // Başlık ekle
    const header = document.createElement('h4');
    header.className = 'mb-3 feature-section-title';
    header.innerHTML = '<i class="fas fa-info-circle me-2"></i>Özellik Açıklamaları';
    container.appendChild(header);
    
    // Açıklama ekle
    const description = document.createElement('p');
    description.className = 'text-muted mb-4 feature-section-desc';
    description.textContent = 'Aşağıda en önemli özelliklerin açıklamaları ve model üzerindeki etkileri yer almaktadır. Her özelliğin modelin tahmin gücüne ne kadar katkıda bulunduğunu görebilirsiniz.';
    container.appendChild(description);
}

/**
 * Özellik kartı oluşturur
 * 
 * @param {Object} feature - Özellik verisi
 * @param {number} index - Özelliğin sıra numarası
 * @returns {HTMLElement} - Oluşturulan kart elementi
 */
function createFeatureCard(feature, index) {
    // Kart elementini oluştur
    const card = document.createElement('div');
    card.className = 'card mb-3 feature-card shadow-sm';
    
    // Önem derecesine göre kart rengini belirle
    const importance = feature.importance;
    let cardClass = getCardStyleClass(importance);
    card.classList.add(cardClass);
    
    // Özellik açıklaması için metin oluştur
    const description = generateFeatureDescription(feature, index);
    
    // Önem seviyesi
    const importanceLevel = getImportanceLevel(importance);
    
    // Kart içeriğini oluştur
    card.innerHTML = `
        <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0 feature-name">
                <span class="badge bg-secondary me-2">${index + 1}</span>
                ${feature.name}
            </h5>
            <span class="${getImportanceBadge(importance)}">%${importance.toFixed(2)}</span>
        </div>
        <div class="card-body">
            <p class="card-text">${description}</p>
            <div class="feature-impact">
                <small class="text-muted d-block mb-2">Etki Seviyesi: <strong>${importanceLevel}</strong></small>
                <div class="progress" style="height: 10px;">
                    <div class="progress-bar ${getProgressBarColor(importance)}" 
                         role="progressbar" 
                         style="width: ${importance}%" 
                         aria-valuenow="${importance}" 
                         aria-valuemin="0" 
                         aria-valuemax="100">
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Etkileşim ekleme
    addCardInteraction(card, feature);
    
    return card;
}

/**
 * Özellik kartına etkileşim ekler
 * 
 * @param {HTMLElement} cardElement - Kart elementi
 * @param {Object} feature - Özellik verisi
 */
function addCardInteraction(cardElement, feature) {
    // Tıklama efekti
    cardElement.style.cursor = 'pointer';
    
    // Karta tıklandığında detaylı bilgi göster
    cardElement.addEventListener('click', (event) => {
        // Detaylı bilgi için modal göster
        showFeatureDetailModal(feature);
    });
    
    // Hover efekti
    cardElement.addEventListener('mouseenter', (event) => {
        cardElement.classList.add('shadow');
    });
    
    cardElement.addEventListener('mouseleave', (event) => {
        cardElement.classList.remove('shadow');
    });
}

/**
 * Özellik detaylarını gösteren modal
 * 
 * @param {Object} feature - Özellik verisi
 */
function showFeatureDetailModal(feature) {
    // Modal HTML'i hazırla
    const modalId = `feature-modal-${Date.now()}`;
    const importance = feature.importance;
    const importanceLevel = getImportanceLevel(importance);
    
    // Modal HTML
    const modalHTML = `
        <div class="modal fade" id="${modalId}" tabindex="-1" aria-labelledby="${modalId}-label" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header ${getHeaderClass(importance)}">
                        <h5 class="modal-title" id="${modalId}-label">
                            <i class="fas fa-chart-line me-2"></i>${feature.name}
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Kapat"></button>
                    </div>
                    <div class="modal-body">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <span>Önem Derecesi:</span>
                            <span class="${getImportanceBadge(importance)}">%${importance.toFixed(2)}</span>
                        </div>
                        <div class="mb-3">
                            <div class="progress" style="height: 12px;">
                                <div class="progress-bar ${getProgressBarColor(importance)}" 
                                     role="progressbar" 
                                     style="width: ${importance}%" 
                                     aria-valuenow="${importance}" 
                                     aria-valuemin="0" 
                                     aria-valuemax="100">
                                </div>
                            </div>
                        </div>
                        <div class="alert ${getAlertClass(importance)} mb-3">
                            <strong>Etki Seviyesi:</strong> ${importanceLevel}
                        </div>
                        <h6>Özellik Açıklaması:</h6>
                        <p>${generateFeatureDescription(feature, 0, true)}</p>
                        <h6 class="mt-3">Öneriler:</h6>
                        <ul>
                            ${generateRecommendations(feature).map(rec => `<li>${rec}</li>`).join('')}
                        </ul>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Kapat</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Modal'ı DOM'a ekle
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer);
    
    // Modal'ı göster
    const modalElement = document.getElementById(modalId);
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
    
    // Modal kapatıldığında DOM'dan kaldır
    modalElement.addEventListener('hidden.bs.modal', () => {
        document.body.removeChild(modalContainer);
    });
}

/**
 * Önem derecesine göre başlık sınıfı döndürür
 * 
 * @param {number} importance - Önem derecesi
 * @returns {string} - CSS sınıfı
 */
function getHeaderClass(importance) {
    if (importance >= 50) return 'bg-danger text-white';
    if (importance >= 30) return 'bg-warning';
    if (importance >= 15) return 'bg-info text-white';
    return 'bg-secondary text-white';
}

/**
 * Önem derecesine göre alert sınıfı döndürür
 * 
 * @param {number} importance - Önem derecesi
 * @returns {string} - CSS sınıfı
 */
function getAlertClass(importance) {
    if (importance >= 50) return 'alert-danger';
    if (importance >= 30) return 'alert-warning';
    if (importance >= 15) return 'alert-info';
    return 'alert-secondary';
}

/**
 * Önem derecesine göre kart stil sınıfı döndürür
 * 
 * @param {number} importance - Önem derecesi
 * @returns {string} - CSS sınıfı
 */
function getCardStyleClass(importance) {
    if (importance >= 50) return 'border-danger';
    if (importance >= 30) return 'border-warning';
    if (importance >= 15) return 'border-info';
    return 'border-secondary';
}

/**
 * Önem derecesine göre seviye metni döndürür
 * 
 * @param {number} importance - Önem derecesi
 * @returns {string} - Önem seviyesi metni
 */
function getImportanceLevel(importance) {
    if (importance >= 50) return 'Çok Yüksek';
    if (importance >= 30) return 'Yüksek';
    if (importance >= 15) return 'Orta';
    return 'Düşük';
}

/**
 * Özellik açıklaması metni oluşturur
 * 
 * @param {Object} feature - Özellik verisi
 * @param {number} index - Özelliğin sıra numarası (açıklama çeşitlendirmesi için)
 * @param {boolean} isDetailed - Detaylı açıklama mı?
 * @returns {string} - Açıklama metni
 */
function generateFeatureDescription(feature, index, isDetailed = false) {
    // Farklı açıklama şablonları
    const descriptions = [
        `Bu özellik, müşteri davranışlarını belirlemede %IMPORTANCE_LEVEL% öneme sahiptir. %INSIGHT%`,
        `Ekonomik göstergelere dayalı bu özellik, modelin tahmin gücünü %IMPORTANCE_LEVEL% derecede etkiler. %INSIGHT%`,
        `Bölgesel farklılıkları yansıtan bu özellik, hedef değişkeni %IMPORTANCE_LEVEL% seviyede etkiler. %INSIGHT%`,
        `Kullanıcı etkileşimlerini ölçen bu özellik, %IMPORTANCE_LEVEL% bir göstergedir. %INSIGHT%`,
        `Zaman bazlı analizler için %IMPORTANCE_LEVEL% öneme sahip bir özelliktir. %INSIGHT%`
    ];
    
    // İlave detay metinleri (detaylı mod için)
    const additionalInsights = [
        "Bu değişken, tahmin modelinde kritik faktörlerden biridir ve sonuçları doğrudan etkiler.",
        "Analiz sonuçları, bu özelliğin model performansında önemli rol oynadığını göstermektedir.",
        "İstatistiksel analizler, bu özellik ile hedef değişken arasında güçlü bir ilişki olduğunu ortaya koymaktadır.",
        "Bu özellik, makine öğrenimi algoritmasının tahmin gücünü artıran faktörlerden biridir.",
        "Uzman analizleri, bu özelliğin modelin açıklayıcı gücüne katkı sağladığını doğrulamaktadır."
    ];
    
    // Önem seviyesi metni
    const importanceLevel = feature.importance >= 50 ? "çok yüksek" : 
                          feature.importance >= 30 ? "yüksek" : 
                          feature.importance >= 15 ? "orta" : "düşük";
    
    // Şablon seçimi (sıra numarasına göre veya rastgele)
    const templateIndex = isDetailed ? Math.floor(Math.random() * descriptions.length) : (index % descriptions.length);
    let description = descriptions[templateIndex].replace('%IMPORTANCE_LEVEL%', importanceLevel);
    
    // Ek içgörüleri ekle
    const insightIndex = isDetailed ? Math.floor(Math.random() * additionalInsights.length) : (index % additionalInsights.length);
    description = description.replace('%INSIGHT%', additionalInsights[insightIndex]);
    
    // Detaylı mod için ek bilgi
    if (isDetailed) {
        const detailedInfo = `<br><br>Önem puanı %${feature.importance.toFixed(2)} olan bu özellik, 
        modelin genel performansına önemli katkı sağlamaktadır. İstatistiksel analizler, 
        bu özelliğin hedef değişkenle güçlü bir korelasyon içinde olduğunu göstermektedir.`;
        
        description += detailedInfo;
    }
    
    return description;
}

/**
 * Özellik için öneriler oluşturur
 * 
 * @param {Object} feature - Özellik verisi
 * @returns {Array<string>} - Öneriler dizisi
 */
function generateRecommendations(feature) {
    const importance = feature.importance;
    const recommendations = [];
    
    if (importance >= 50) {
        recommendations.push('Bu özelliği koruyun ve geliştirin, model performansı için kritik öneme sahip.');
        recommendations.push('Bu özellikle ilgili daha fazla veri toplayın ve analiz edin.');
        recommendations.push('Bu özelliğin diğer özelliklerle etkileşimini araştırın.');
    } else if (importance >= 30) {
        recommendations.push('Bu özelliği modelde tutun, önemli katkı sağlıyor.');
        recommendations.push('Bu özelliği geliştirmek için ek çalışmalar yapabilirsiniz.');
        recommendations.push('Veri kalitesini iyileştirerek bu özelliğin etkisini artırabilirsiniz.');
    } else if (importance >= 15) {
        recommendations.push('Bu özellik orta düzeyde katkı sağlıyor, geliştirilmesi düşünülebilir.');
        recommendations.push('Bu özelliğin farklı formülasyonlarını deneyerek etkisini artırabilirsiniz.');
        recommendations.push('Benzer özelliklerle birleştirerek daha güçlü bir sinyal oluşturabilirsiniz.');
    } else {
        recommendations.push('Bu özellik düşük etki gösteriyor, modelden çıkarılması değerlendirilebilir.');
        recommendations.push('Daha etkili özellikler geliştirmek için kaynaklarınızı yönlendirebilirsiniz.');
        recommendations.push('Bu özelliği dönüştürerek veya başka özelliklerle birleştirerek etkisini artırabilirsiniz.');
    }
    
    return recommendations;
}

/**
 * Özellik önemi verilerini görselleştirir
 * @param {Array} data - Özellik önemi verileri
 * @param {string} title - Grafik başlığı
 */
function displayFeatureImportance(data, title) {
    const ctx = document.getElementById('featureImportanceChart');
    if (!ctx) {
        console.error('Grafik kanvası bulunamadı');
        return;
    }

    // Varolan grafik varsa temizle
    if (featureChart) {
        featureChart.destroy();
    }

    // Veriyi grafik için hazırla
    const labels = data.map(item => item.name);
    const importanceValues = data.map(item => item.importance);
    
    // Renk paleti oluştur
    const backgroundColors = generateColorPalette(data.length);

    // Chart.js ile yeni grafik oluştur
    featureChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Önem Yüzdesi',
                data: importanceValues,
                backgroundColor: backgroundColors,
                borderColor: backgroundColors.map(color => color.replace('0.7', '1')),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            indexAxis: 'y',  // Yatay bar grafik
            plugins: {
                title: {
                    display: true,
                    text: title,
                    font: {
                        size: 16
                    }
                },
                legend: {
                    display: false
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
                    title: {
                        display: true,
                        text: 'Önem Yüzdesi (%)'
                    },
                    max: 100 // Maksimum değer
                }
            }
        }
    });
}

/**
 * Grafik için renk paleti oluşturur
 * @param {number} count - Renk sayısı
 * @returns {Array} - RGBA renk dizisi
 */
function generateColorPalette(count) {
    const baseColors = [
        'rgba(75, 192, 192, 0.7)',    // Turkuaz
        'rgba(54, 162, 235, 0.7)',    // Mavi
        'rgba(153, 102, 255, 0.7)',   // Mor
        'rgba(255, 159, 64, 0.7)',    // Turuncu
        'rgba(255, 99, 132, 0.7)',    // Kırmızı
        'rgba(255, 205, 86, 0.7)',    // Sarı
        'rgba(201, 203, 207, 0.7)',   // Gri
        'rgba(22, 160, 133, 0.7)',    // Yeşil-Turkuaz
        'rgba(142, 68, 173, 0.7)',    // Mor
        'rgba(243, 156, 18, 0.7)'     // Amber
    ];
    
    if (count <= baseColors.length) {
        return baseColors.slice(0, count);
    }
    
    // Eğer daha fazla renk gerekiyorsa, rastgele renkler üret
    const colors = [...baseColors];
    
    for (let i = baseColors.length; i < count; i++) {
        const r = Math.floor(Math.random() * 255);
        const g = Math.floor(Math.random() * 255);
        const b = Math.floor(Math.random() * 255);
        colors.push(`rgba(${r}, ${g}, ${b}, 0.7)`);
    }
    
    return colors;
}

// Sayfa yüklendiğinde ülke seçimini başlat
document.addEventListener('DOMContentLoaded', function() {
    initializeCountrySelect();
});

/**
 * En önemli özellikleri listeler ve görselleştirir
 * 
 * @param {Array} data - Özellik önemi verileri
 * @param {number} limit - Gösterilecek özellik sayısı (varsayılan: 5)
 */
function updateTopFeatures(data, limit = 5) {
    try {
        const topFeaturesElement = document.getElementById('topFeatures');
        if (!topFeaturesElement) return;
        
        // Başlık ve açıklama ekle
        const headerHTML = `
            <div class="top-features-header mb-3">
                <h5><i class="fas fa-trophy me-2"></i>En Etkili Özellikler</h5>
                <p class="text-muted small">Modelin tahminlerinde en yüksek öneme sahip özellikler</p>
            </div>
        `;
        
        // Verileri önem sırasına göre sırala
        const sortedData = [...data].sort((a, b) => b.importance - a.importance);
        
        // Belirtilen sayıda özelliği al
        const topItems = sortedData.slice(0, limit);
        
        // Liste elementlerini oluştur
        const listItems = topItems.map((item, index) => createTopFeatureItem(item, index));
        
        // Etkileşimli filtre ve sıralama kontrollerini oluştur
        const controlsHTML = createFeatureControls(data.length);
        
        // Özet istatistikleri oluştur
        const statsHTML = createFeatureStats(data);
        
        // Tüm içeriği bir araya getir
        topFeaturesElement.innerHTML = `
            ${headerHTML}
            ${controlsHTML}
            <div class="top-features-list mb-3">
                <ul class="list-group shadow-sm">
                    ${listItems.join('')}
                </ul>
            </div>
            ${statsHTML}
        `;
        
        // Etkileşim için event listener'ları ekle
        addTopFeaturesInteraction(topFeaturesElement, data);
        
    } catch (error) {
        console.error('Top features listesi güncellenirken hata:', error);
        if (document.getElementById('topFeatures')) {
            document.getElementById('topFeatures').innerHTML = `
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Özellik listesi oluşturulurken bir hata oluştu.
                </div>
            `;
        }
    }
}

/**
 * Özellik listesi için en etkili özellik öğesi oluşturur
 * 
 * @param {Object} feature - Özellik nesnesi
 * @param {number} index - Özelliğin sıra numarası
 * @returns {string} - Özellik öğesi HTML kodu
 */
function createTopFeatureItem(feature, index) {
    // Sıra numarasına göre renk sınıfını belirle
    const colorClass = getFeatureColorClass(index);
    
    // Önem seviyesi için rozet rengi belirle
    const badgeClass = getImportanceBadge(feature.importance);
    
    // Sıra numarası için simge belirle
    const rankIcon = index === 0 ? 'crown' : 
                     index === 1 ? 'medal' : 
                     index === 2 ? 'award' :
                     'star';
    
    // Özellik öğesi HTML'i
    return `
        <li class="list-group-item ${colorClass} feature-item d-flex justify-content-between align-items-center" 
            data-feature-name="${feature.name}" 
            data-feature-importance="${feature.importance.toFixed(2)}">
            <div class="d-flex align-items-center">
                <span class="feature-rank me-2">
                    <i class="fas fa-${rankIcon} ${index < 3 ? 'text-warning' : 'text-secondary'}"></i>
                    <span class="rank-number">${index + 1}</span>
                </span>
                <span class="feature-name">${feature.name}</span>
            </div>
            <div class="d-flex align-items-center">
                <div class="progress flex-grow-1 me-2" style="width: 100px; height: 8px;">
                    <div class="progress-bar ${getProgressBarColor(feature.importance)}" 
                         role="progressbar" 
                         style="width: ${feature.importance}%" 
                         aria-valuenow="${feature.importance}" 
                         aria-valuemin="0" 
                         aria-valuemax="100"></div>
                </div>
                <span class="${badgeClass}">%${feature.importance.toFixed(2)}</span>
            </div>
        </li>
    `;
}

/**
 * Sıra numarasına göre renk sınıfı döndürür
 * 
 * @param {number} index - Sıra numarası
 * @returns {string} - CSS sınıfı
 */
function getFeatureColorClass(index) {
    switch(index) {
        case 0: return 'list-group-item-primary';
        case 1: return 'list-group-item-success';
        case 2: return 'list-group-item-info';
        case 3: return 'list-group-item-warning';
        default: return 'list-group-item-light';
    }
}

/**
 * Özellik kontrol panelini oluşturur
 * 
 * @param {number} totalCount - Toplam özellik sayısı
 * @returns {string} - HTML kodu
 */
function createFeatureControls(totalCount) {
    return `
        <div class="feature-controls d-flex justify-content-between align-items-center mb-3">
            <span class="feature-count badge bg-secondary">
                <i class="fas fa-list-ul me-1"></i> Toplam: ${totalCount} özellik
            </span>
            <div class="btn-group btn-group-sm" role="group" aria-label="Görüntüleme seçenekleri">
                <button type="button" class="btn btn-outline-primary" data-limit="5">Top 5</button>
                <button type="button" class="btn btn-outline-primary" data-limit="10">Top 10</button>
                <button type="button" class="btn btn-outline-primary" data-limit="all">Tümü</button>
            </div>
        </div>
    `;
}

/**
 * Özellik istatistiklerini içeren özet paneli oluşturur
 * 
 * @param {Array} data - Tüm özellik verisi
 * @returns {string} - HTML kodu
 */
function createFeatureStats(data) {
    // Özet istatistikler hesapla
    const totalCount = data.length;
    const highImpactCount = data.filter(f => f.importance >= 30).length;
    const mediumImpactCount = data.filter(f => f.importance >= 15 && f.importance < 30).length;
    const lowImpactCount = data.filter(f => f.importance < 15).length;
    
    // Yüzdelik değerleri hesapla
    const highPercent = (highImpactCount / totalCount * 100).toFixed(0);
    const mediumPercent = (mediumImpactCount / totalCount * 100).toFixed(0);
    const lowPercent = (lowImpactCount / totalCount * 100).toFixed(0);
    
    return `
        <div class="feature-stats mt-3 card shadow-sm">
            <div class="card-header bg-light">
                <small><i class="fas fa-chart-pie me-2"></i>Özellik Dağılımı</small>
            </div>
            <div class="card-body p-2">
                <div class="row g-2 text-center">
                    <div class="col-4">
                        <div class="p-2 border rounded">
                            <span class="d-block badge bg-danger mb-1">${highImpactCount}</span>
                            <small class="d-block text-muted">Yüksek Etki</small>
                            <small class="d-block">%${highPercent}</small>
                        </div>
                    </div>
                    <div class="col-4">
                        <div class="p-2 border rounded">
                            <span class="d-block badge bg-info mb-1">${mediumImpactCount}</span>
                            <small class="d-block text-muted">Orta Etki</small>
                            <small class="d-block">%${mediumPercent}</small>
                        </div>
                    </div>
                    <div class="col-4">
                        <div class="p-2 border rounded">
                            <span class="d-block badge bg-secondary mb-1">${lowImpactCount}</span>
                            <small class="d-block text-muted">Düşük Etki</small>
                            <small class="d-block">%${lowPercent}</small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Özellik listesine etkileşim özelliği ekler
 * 
 * @param {HTMLElement} container - Konteyner elementi
 * @param {Array} data - Tüm özellik verisi
 */
function addTopFeaturesInteraction(container, data) {
    // Limit butonlarına tıklama
    const limitButtons = container.querySelectorAll('.btn-group .btn');
    limitButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Aktif butonu işaretle
            limitButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Listeyi güncelle
            const limitValue = this.getAttribute('data-limit');
            const limit = limitValue === 'all' ? data.length : parseInt(limitValue, 10);
            
            // Özellik listesini güncelle (sadece liste kısmını)
            updateFeatureList(container, data, limit);
        });
    });
    
    // İlk butonu aktif yap
    if (limitButtons.length > 0) {
        limitButtons[0].classList.add('active');
    }
    
    // Özellik öğelerine tıklama
    const featureItems = container.querySelectorAll('.feature-item');
    featureItems.forEach(item => {
        item.addEventListener('click', function() {
            const featureName = this.getAttribute('data-feature-name');
            const feature = data.find(f => f.name === featureName);
            
            if (feature) {
                // Özellik detaylarını göster
                showFeatureDetailModal(feature);
            }
        });
        
        // Hover efekti
        item.style.cursor = 'pointer';
        item.addEventListener('mouseenter', () => {
            item.classList.add('shadow-sm');
        });
        
        item.addEventListener('mouseleave', () => {
            item.classList.remove('shadow-sm');
        });
    });
}

/**
 * Özellik listesini günceller
 * 
 * @param {HTMLElement} container - Konteyner elementi
 * @param {Array} data - Tüm özellik verisi
 * @param {number} limit - Gösterilecek özellik sayısı
 */
function updateFeatureList(container, data, limit) {
    const listContainer = container.querySelector('.top-features-list ul');
    if (!listContainer) return;
    
    // Verileri önem sırasına göre sırala
    const sortedData = [...data].sort((a, b) => b.importance - a.importance);
    
    // Belirtilen sayıda özelliği al
    const topItems = sortedData.slice(0, limit);
    
    // Liste elementlerini oluştur
    const listItems = topItems.map((item, index) => createTopFeatureItem(item, index));
    
    // Listeyi güncelle
    listContainer.innerHTML = listItems.join('');
    
    // Etkileşim ekle
    addTopFeaturesInteraction(container, data);
}

/**
 * Özellik önemi için uygun renk kodunu döndürür
 * 
 * @param {number} importance - Özellik önemi değeri
 * @returns {string} - Badge sınıfı
 */
function getImportanceBadge(importance) {
    if (importance >= 50) return 'badge bg-danger';
    if (importance >= 30) return 'badge bg-warning text-dark';
    if (importance >= 15) return 'badge bg-info text-dark';
    return 'badge bg-secondary';
}

/**
 * Özellik Mühendisliği Modülü
 * 
 * Bu modül, ülke bazlı özellik önem derecelerini görselleştirmek ve
 * analiz etmek için gerekli fonksiyonları içerir.
 */

/**
 * Ülke seçim kutusunu başlatır ve event listener ekler
 */
function initializeCountrySelect() {
    const countrySelect = document.getElementById('feature-country-select');
    
    if (!countrySelect) {
        console.error('Ülke seçim kutusu bulunamadı');
        return;
    }
    
    // Varsayılan "Global" seçeneğini ekle
    const defaultOption = document.createElement('option');
    defaultOption.value = 'global';
    defaultOption.textContent = 'Global (Tüm Ülkeler)';
    defaultOption.selected = true;
    countrySelect.appendChild(defaultOption);
    
    // Yükleniyor seçeneği ekle
    const loadingOption = document.createElement('option');
    loadingOption.value = '';
    loadingOption.textContent = 'Ülkeler yükleniyor...';
    loadingOption.disabled = true;
    countrySelect.appendChild(loadingOption);
    
    // Ülkeleri API'den yükle - Doğru API endpoint'i kullan
    fetch('/api/countries')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP hata! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // API yanıtını kontrol et
            let countriesList = [];
            
            if (Array.isArray(data)) {
                // Doğrudan dizi ise
                countriesList = data;
            } else if (data && data.countries && Array.isArray(data.countries)) {
                // {countries: [...]} formatında ise
                countriesList = data.countries;
            } else if (data && typeof data === 'object') {
                // Başka bir obje formatında olabilir, ilk array'i bul
                for (const key in data) {
                    if (Array.isArray(data[key]) && data[key].length > 0) {
                        countriesList = data[key];
                        break;
                    }
                }
            }
            
            if (!Array.isArray(countriesList) || countriesList.length === 0) {
                throw new Error('Ülke listesi bulunamadı veya boş');
            }
            
            // Yükleniyor seçeneğini kaldır
            countrySelect.removeChild(loadingOption);
            
            // Ülkeleri sırala ve ekle
            if (typeof countriesList[0] === 'string') {
                // String listesi
                countriesList.sort((a, b) => String(a).localeCompare(String(b), 'tr'));
                
                countriesList.forEach(country => {
                    const option = document.createElement('option');
                    option.value = country;
                    option.textContent = country;
                    countrySelect.appendChild(option);
                });
            } else if (typeof countriesList[0] === 'object') {
                // Obje listesi - alan adlarını belirle
                const nameKey = countriesList[0].hasOwnProperty('name') ? 'name' : 
                               countriesList[0].hasOwnProperty('country') ? 'country' : 
                               countriesList[0].hasOwnProperty('title') ? 'title' : 
                               Object.keys(countriesList[0])[0];
                
                const valueKey = countriesList[0].hasOwnProperty('id') ? 'id' : 
                                countriesList[0].hasOwnProperty('code') ? 'code' : nameKey;
                
                countriesList.sort((a, b) => String(a[nameKey]).localeCompare(String(b[nameKey]), 'tr'));
                
                countriesList.forEach(country => {
                    const option = document.createElement('option');
                    option.value = country[valueKey];
                    option.textContent = country[nameKey];
                    countrySelect.appendChild(option);
                });
            }
            
            // Event listener ekle
            countrySelect.addEventListener('change', function() {
                const selectedValue = this.value;
                
                if (selectedValue === 'global') {
                    loadGlobalFeatureImportance();
                } else {
                    loadCountryFeatureImportance(selectedValue);
                }
            });
            
            // Başlangıçta global verileri yükle
            loadGlobalFeatureImportance();
            
        })
        .catch(error => {
            console.error('Ülke listesi yüklenirken hata oluştu:', error);
            
            // Yükleniyor seçeneğini hata mesajı ile değiştir
            if (countrySelect.contains(loadingOption)) {
                countrySelect.removeChild(loadingOption);
            }
            
            const errorOption = document.createElement('option');
            errorOption.value = '';
            errorOption.textContent = 'Ülkeler yüklenemedi';
            errorOption.disabled = true;
            countrySelect.appendChild(errorOption);
            
            // Hata mesajını göster
            showNotification('Ülke listesi yüklenemedi: ' + error.message, 'error', 5000);
            
            // Yine de global verileri yüklemeyi dene
            loadGlobalFeatureImportance();
        });
}

/**
 * Belirli bir ülke için özellik önem derecesi verilerini API'den çeker
 * 
 * @param {string|number} countryId - Ülke ID'si veya adı
 * @returns {Promise} - Fetch promise
 */
async function fetchFeatureImportance(countryId) {
    try {
        let url = '/api/feature-importance';
        
        // Ülke ID'si varsa ekle
        if (countryId && countryId !== 'global') {
            url = countryId.toString().match(/^\d+$/) ? 
                `${url}?country_id=${countryId}` : 
                `${url}?country=${encodeURIComponent(countryId)}`;
        }
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`API yanıtı başarısız: ${response.status}`);
        }
        
        const data = await response.json();
        
        // API yanıtını kontrol et
        if (!data) {
            throw new Error('API geçersiz veri döndürdü');
        }
        
        if (data.hasOwnProperty('success') && !data.success) {
            throw new Error(data.error || data.message || 'API hatası');
        }
        
        // features verisini al (farklı formatlar için)
        let features = [];
        
        if (data.hasOwnProperty('features') && Array.isArray(data.features)) {
            features = data.features;
        } else if (Array.isArray(data)) {
            features = data;
        } else if (typeof data === 'object') {
            // Önemli özellikleri bulmaya çalış
            for (const key in data) {
                if (Array.isArray(data[key]) && data[key].length > 0 && 
                    typeof data[key][0] === 'object' && 
                    (data[key][0].hasOwnProperty('name') || data[key][0].hasOwnProperty('feature'))) {
                    features = data[key];
                    break;
                }
            }
        }
        
        if (!Array.isArray(features) || features.length === 0) {
            throw new Error('Özellik verileri bulunamadı veya boş');
        }
        
        // Veri formatını normalize et
        const normalizedFeatures = features.map(feature => {
            // Farklı API yanıt formatlarını destekle
            const name = feature.name || feature.feature || feature.title || Object.keys(feature)[0];
            const importance = feature.importance || feature.value || feature.score || Object.values(feature)[0];
            
            return {
                name: name,
                importance: typeof importance === 'string' ? parseFloat(importance) : importance
            };
        });
        
        return {
            features: normalizedFeatures,
            title: data.title || (countryId === 'global' ? 'Global' : countryId)
        };
        
    } catch (error) {
        console.error('Özellik önem verisi getirilirken hata:', error);
        throw error;
    }
}

/**
 * Global özellik önem derecesi verilerini yükler
 */
async function loadGlobalFeatureImportance() {
    const chartContainer = document.getElementById('feature-chart-container');
    const featureListContainer = document.getElementById('feature-list-container');
    
    // Yükleme durumunu göster
    if (chartContainer) {
        chartContainer.innerHTML = `
            <div class="d-flex justify-content-center align-items-center" style="height: 300px;">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Yükleniyor...</span>
                </div>
            </div>
        `;
    }
    
    try {
        const data = await fetchFeatureImportance('global');
        displayFeatureImportance(data, 'Global Model Özellikleri');
    } catch (error) {
        displayFeatureError(error.message);
    }
}

/**
 * Belirli bir ülke için özellik önem derecesi verilerini yükler
 * 
 * @param {string|number} countryId - Ülke ID'si veya adı
 */
async function loadCountryFeatureImportance(countryId) {
    const chartContainer = document.getElementById('feature-chart-container');
    const featureListContainer = document.getElementById('feature-list-container');
    
    // Ülke adını veya ID'sini göster
    let countryTitle = countryId;
    
    // Eğer ülke bilgisini global değişkenden alabiliyorsak
    if (window.countriesData && Array.isArray(window.countriesData)) {
        const country = window.countriesData.find(c => {
            if (typeof c === 'string') {
                return c === countryId;
            } else if (typeof c === 'object') {
                return c.id === countryId || c.name === countryId || c.code === countryId;
            }
            return false;
        });
        
        if (country) {
            countryTitle = typeof country === 'string' ? country : (country.name || country.title || countryId);
        }
    }
    
    // Yükleme durumunu göster
    if (chartContainer) {
        chartContainer.innerHTML = `
            <div class="d-flex justify-content-center align-items-center" style="height: 300px;">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Yükleniyor...</span>
                </div>
            </div>
        `;
    }
    
    try {
        const data = await fetchFeatureImportance(countryId);
        displayFeatureImportance(data, `${countryTitle} için Önemli Özellikler`);
    } catch (error) {
        displayFeatureError(`${countryTitle} için özellik verileri alınamadı: ${error.message}`);
    }
}

/**
 * Özellik hatasını görüntüler ve UI'ı günceller
 * 
 * @param {string} message - Hata mesajı
 * @param {boolean} isRetryable - Yeniden deneme seçeneği gösterilsin mi?
 */
function displayFeatureError(message, isRetryable = true) {
    try {
        // Hata mesajı için varsayılan metin
        const errorText = message || 'Özellik verileri yüklenirken bir hata oluştu';
        
        // Loglama
        console.error('Özellik Görüntüleme Hatası:', errorText);
        
        // UI'ı güncelle
        updateUIForError(errorText, isRetryable);
        
        // Kullanıcıya bildirim göster
        showErrorNotification(errorText);
        
        // Grafikleri temizle
        cleanupCharts();
    } catch (innerError) {
        // Hata gösterme sırasında başka bir hata oluştu
        console.error('Hata gösterilirken ikincil hata oluştu:', innerError);
        
        // Son çare olarak basit bir alert göster
        showErrorAlert(message);
    }
}

/**
 * Hata durumunda UI bileşenlerini günceller
 * 
 * @param {string} errorText - Hata mesajı
 * @param {boolean} isRetryable - Yeniden deneme düğmesi gösterilsin mi?
 */
function updateUIForError(errorText, isRetryable) {
    // Yükleme göstergelerini gizle
    hideLoadingIndicators();
    
    // Grafik container'ını güncelle
    updateChartContainer(errorText, isRetryable);
    
    // Açıklama container'ını temizle
    clearDescriptionContainer();
    
    // Liste container'ını temizle
    clearFeatureListContainer();
}

/**
 * Grafik konteynerini hata mesajıyla günceller
 * 
 * @param {string} errorText - Hata mesajı
 * @param {boolean} isRetryable - Yeniden deneme düğmesi gösterilsin mi?
 */
function updateChartContainer(errorText, isRetryable) {
    const chartContainer = document.getElementById('feature-chart-container');
    if (!chartContainer) return;
    
    // Hata kartını oluştur (Bootstrap alert)
    let errorHtml = `
        <div class="error-container p-4 rounded shadow-sm">
            <div class="alert alert-danger mb-0" role="alert">
                <div class="d-flex align-items-center mb-3">
                    <i class="fas fa-exclamation-circle fa-2x me-3"></i>
                    <h4 class="alert-heading mb-0">Veri Yükleme Hatası</h4>
                </div>
                <p class="mb-3">${errorText}</p>
                <hr>
                <div class="d-flex justify-content-between align-items-center">
                    <p class="mb-0 text-muted small">
                        <i class="fas fa-info-circle me-1"></i>
                        Lütfen daha sonra tekrar deneyin veya sistem yöneticisiyle iletişime geçin.
                    </p>
    `;
    
    // Eğer yeniden deneme mümkünse buton ekle
    if (isRetryable) {
        errorHtml += `
                    <button type="button" class="btn btn-outline-danger btn-sm" 
                            onclick="retryLoadFeatureData()">
                        <i class="fas fa-sync-alt me-1"></i> Yeniden Dene
                    </button>
        `;
    }
    
    errorHtml += `
                </div>
            </div>
        </div>
    `;
    
    chartContainer.innerHTML = errorHtml;
}

/**
 * Özellik açıklama konteynerini temizler
 */
function clearDescriptionContainer() {
    const descriptionContainer = document.getElementById('feature-description-container');
    if (descriptionContainer) {
        descriptionContainer.innerHTML = `
            <div class="alert alert-secondary" role="alert">
                <i class="fas fa-info-circle me-2"></i>
                Özellik açıklamaları, veriler başarıyla yüklendiğinde burada görüntülenecektir.
            </div>
        `;
    }
}

/**
 * Özellik listesi konteynerini temizler
 */
function clearFeatureListContainer() {
    const listContainer = document.getElementById('feature-list-container');
    if (listContainer) {
        listContainer.innerHTML = '';
    }
}

/**
 * Hata bildirimi gösterir
 * 
 * @param {string} errorText - Hata mesajı
 */
function showErrorNotification(errorText) {
    showNotification(
        errorText.length > 100 ? errorText.substring(0, 97) + '...' : errorText,
        'error',
        6000
    );
}

/**
 * Son çare olarak basit bir hata uyarısı gösterir
 * 
 * @param {string} message - Hata mesajı
 */
function showErrorAlert(message) {
    try {
        // Olabildiğince basit tut, çünkü bu bir fallback
        alert('Hata: ' + (message || 'Bilinmeyen hata'));
    } catch (e) {
        // Sessizce başarısız ol
    }
}

/**
 * Grafik nesnelerini temizler
 */
function cleanupCharts() {
    // Grafik canvas'ını temizle (eğer varsa)
    const canvas = document.getElementById('feature-importance-chart');
    if (canvas && canvas.getContext) {
        try {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Eğer bir Chart.js nesnesi varsa temizle
            if (featureChart) {
                featureChart.destroy();
                featureChart = null;
            }
        } catch (e) {
            console.error('Grafik temizlenirken hata:', e);
        }
    }
}

/**
 * Özellik verilerini yeniden yüklemeyi dener
 */
function retryLoadFeatureData() {
    try {
        // Ülke seçimi kontrol et
        const countrySelect = document.getElementById('feature-country-select');
        if (countrySelect) {
            const selectedValue = countrySelect.value;
            
            if (selectedValue === 'global') {
                loadGlobalFeatureImportance();
            } else {
                loadCountryFeatureImportance(selectedValue);
            }
        } else {
            // Varsayılan olarak global veriyi yükle
            loadGlobalFeatureImportance();
        }
        
        // Bildirim göster
        showNotification('Veriler yeniden yükleniyor...', 'info');
    } catch (error) {
        console.error('Yeniden yükleme başlatılırken hata:', error);
        showNotification('Yeniden yükleme başlatılamadı', 'error');
    }
}

// ... existing code ... 