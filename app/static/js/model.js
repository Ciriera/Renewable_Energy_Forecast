/**
 * Model Analiz JavaScript Dosyası
 * 
 * Bu dosya, model analiz bölümünün fonksiyonlarını içerir:
 * - Model metrikleri görselleştirme
 * - Model özellikleri listeleme
 */

// Sayfa yüklendiğinde çalışacak işlemler
document.addEventListener('DOMContentLoaded', function() {
    // Model analiz verilerini yükle
    loadModelAnalysisData();
});

/**
 * Model analiz verilerini API'den yükler
 */
async function loadModelAnalysisData() {
    try {
        const response = await fetch('/api/data/model');
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Veri alınamadı');
        }
        
        // Model metriklerini göster
        displayModelMetrics(data.metrics, data.model_quality);
        
        // Model özelliklerini göster
        displayModelFeatures(data.features);
        
    } catch (error) {
        console.error('Model analiz verileri yüklenirken hata oluştu:', error);
        displayModelError();
    }
}

/**
 * Model metriklerini gösterir
 * @param {Object} metrics - Model metrikleri
 * @param {string} quality - Model kalitesi değerlendirmesi
 */
function displayModelMetrics(metrics, quality) {
    // Yükleniyor spinnerını kaldır
    document.getElementById('model-quality').innerHTML = '';
    
    // Metrikleri göster
    document.getElementById('model-metrics').classList.remove('d-none');
    
    // R² skoru
    document.getElementById('r2-metric').textContent = metrics.r2.toFixed(3);
    
    // MAE
    document.getElementById('mae-metric').textContent = metrics.mae.toFixed(3);
    
    // RMSE
    document.getElementById('rmse-metric').textContent = metrics.rmse.toFixed(3);
    
    // Model kalitesi değerlendirmesi
    const qualityContainer = document.getElementById('model-quality');
    
    // Kalite göstergesi
    let badgeClass = 'bg-danger';
    if (quality === 'Çok İyi') {
        badgeClass = 'bg-success';
    } else if (quality === 'İyi') {
        badgeClass = 'bg-primary';
    } else if (quality === 'Orta') {
        badgeClass = 'bg-warning text-dark';
    }
    
    qualityContainer.innerHTML = `
        <div class="mb-2">
            <span class="badge ${badgeClass} p-2 fs-5">${quality}</span>
        </div>
        <p class="text-muted">Model Kalitesi</p>
    `;
}

/**
 * Model özelliklerini listeler
 * @param {Array} features - Model özellikleri
 */
function displayModelFeatures(features) {
    // Spinner'ı gizle
    document.getElementById('model-features-container').innerHTML = '';
    
    // Feature içeriğini göster
    document.getElementById('model-features-content').classList.remove('d-none');
    
    // Özellikleri listele
    const featuresList = document.getElementById('model-features-list');
    
    // Özellikleri okunabilir formata dönüştür
    features.forEach(feature => {
        const li = document.createElement('li');
        
        if (feature === 'Year') {
            li.textContent = 'Yıl: Zaman serisi değişkeni';
        } else if (feature === 'Year_Squared') {
            li.textContent = 'Yıl (Kare): Polinom özellik, yıl değerinin karesi';
        } else if (feature === 'Year_Cubed') {
            li.textContent = 'Yıl (Küp): Polinom özellik, yıl değerinin küpü';
        } else {
            li.textContent = feature;
        }
        
        featuresList.appendChild(li);
    });
}

/**
 * Hata mesajını gösterir
 */
function displayModelError() {
    document.getElementById('model-quality').innerHTML = '<div class="alert alert-danger">Model kalitesi bilgisi yüklenemedi.</div>';
    document.getElementById('model-features-container').innerHTML = '<div class="alert alert-danger">Model özellikleri yüklenemedi.</div>';
} 