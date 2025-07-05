import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional, Tuple
import json
import os

def calculate_trend(values: List[float], window_size: int = 5) -> float:
    """
    Zaman serisi verilerinde trend hesaplar (son n yıl ile ilk n yıl karşılaştırması)
    
    Args:
        values: Değerler listesi
        window_size: Karşılaştırma penceresi boyutu (yıl sayısı)
        
    Returns:
        Trend yüzdesi (pozitif değer artış, negatif değer azalış gösterir)
    """
    if len(values) < window_size * 2:
        return 0.0
    
    first_window = values[:window_size]
    last_window = values[-window_size:]
    
    first_avg = sum(first_window) / window_size
    last_avg = sum(last_window) / window_size
    
    if first_avg == 0:
        return 0.0
        
    return ((last_avg - first_avg) / first_avg) * 100

def interpolate_missing_years(data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Eksik yıllar için veri enterpolasyonu yapar
    
    Args:
        data: Yıl ve değer içeren veri noktaları listesi
        
    Returns:
        Eksik yılları doldurulmuş veri listesi
    """
    if not data:
        return []
    
    # Veriyi DataFrame'e dönüştür
    df = pd.DataFrame(data)
    
    # Eksik yılları bul
    years = df['year'].tolist()
    min_year, max_year = min(years), max(years)
    all_years = list(range(min_year, max_year + 1))
    
    # Tüm yıllar için bir DataFrame oluştur
    complete_df = pd.DataFrame({'year': all_years})
    
    # Orijinal veriyle birleştir
    merged_df = pd.merge(complete_df, df, on='year', how='left')
    
    # Eksik değerleri enterpolasyon ile doldur
    merged_df['value'] = merged_df['value'].interpolate(method='linear')
    
    # Sonucu liste formatına dönüştür
    result = []
    for _, row in merged_df.iterrows():
        result.append({
            'year': int(row['year']),
            'value': float(row['value']),
            'interpolated': row['value'] not in df['value'].values
        })
    
    return result

def format_percentage(value: float, decimal_places: int = 1) -> str:
    """
    Yüzdelik değeri formatlar
    
    Args:
        value: Formatlanacak değer
        decimal_places: Ondalık basamak sayısı
        
    Returns:
        Formatlanmış yüzde dizesi (örn: %12.5)
    """
    format_str = f"%.{decimal_places}f"
    return f"%{format_str % value}"

def save_to_json(data: Any, filename: str) -> bool:
    """
    Veriyi JSON dosyasına kaydeder
    
    Args:
        data: Kaydedilecek veri
        filename: Dosya adı
        
    Returns:
        İşlemin başarılı olup olmadığı
    """
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        print(f"JSON kaydetme hatası: {e}")
        return False

def load_from_json(filename: str) -> Optional[Any]:
    """
    JSON dosyasından veri yükler
    
    Args:
        filename: Dosya adı
        
    Returns:
        Yüklenen veri veya hata durumunda None
    """
    try:
        if not os.path.exists(filename):
            return None
            
        with open(filename, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"JSON yükleme hatası: {e}")
        return None

def generate_color_palette(n_colors: int) -> List[str]:
    """
    Belirli sayıda renk içeren bir palet oluşturur
    
    Args:
        n_colors: Renk sayısı
        
    Returns:
        Hex formatında renk kodları listesi
    """
    base_colors = [
        '#0d6efd',  # Primary blue
        '#dc3545',  # Danger red
        '#198754',  # Success green
        '#ffc107',  # Warning yellow
        '#0dcaf0',  # Info blue
        '#6f42c1',  # Purple
        '#fd7e14',  # Orange
        '#20c997',  # Teal
        '#6c757d',  # Secondary gray
        '#0B5345',  # Dark green
        '#7D3C98',  # Dark purple
        '#E74C3C',  # Bright red
        '#3498DB',  # Bright blue
        '#F1C40F'   # Bright yellow
    ]
    
    # Renk sayısı mevcut renk sayısından azsa, direkt döndür
    if n_colors <= len(base_colors):
        return base_colors[:n_colors]
    
    # Daha fazla renge ihtiyaç varsa, mevcut renkleri tekrarla
    result = []
    for i in range(n_colors):
        result.append(base_colors[i % len(base_colors)])
    
    return result

def get_trend_description(trend_value: float) -> Dict[str, str]:
    """
    Trend değerine göre açıklayıcı metin ve sınıf döndürür
    
    Args:
        trend_value: Trend yüzdesi
        
    Returns:
        Trend açıklaması ve CSS sınıfı
    """
    if trend_value > 30:
        return {
            'description': 'Çok Güçlü Artış',
            'class': 'very-positive'
        }
    elif trend_value > 15:
        return {
            'description': 'Güçlü Artış',
            'class': 'positive'
        }
    elif trend_value > 5:
        return {
            'description': 'Artış',
            'class': 'slightly-positive'
        }
    elif trend_value > -5:
        return {
            'description': 'Yatay',
            'class': 'neutral'
        }
    elif trend_value > -15:
        return {
            'description': 'Azalış',
            'class': 'slightly-negative'
        }
    elif trend_value > -30:
        return {
            'description': 'Güçlü Azalış',
            'class': 'negative'
        }
    else:
        return {
            'description': 'Çok Güçlü Azalış',
            'class': 'very-negative'
        } 