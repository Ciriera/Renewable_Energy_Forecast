import pandas as pd
import numpy as np
import os
import json
from pathlib import Path

# Veri klasör yolunu tanımla
DATA_DIR = Path(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'data'))

def load_dataset():
    """
    Özellik önemi analizinde kullanılacak ham veri setini yükler
    """
    try:
        # Gerçek veri setini yükle
        dataset_path = DATA_DIR / 'renewable_energy_dataset.csv'
        if dataset_path.exists():
            return pd.read_csv(dataset_path)
        
        # Demo veri setini yükle - gerçek veri seti yoksa
        mock_data_path = DATA_DIR / 'demo_dataset.csv'
        if mock_data_path.exists():
            return pd.read_csv(mock_data_path)
        
        # Demo veri de yoksa örnek veri oluştur
        return create_mock_dataset()
    except Exception as e:
        print(f"Veri seti yüklenirken hata: {str(e)}")
        return create_mock_dataset()

def create_mock_dataset():
    """
    Gerçek veri yoksa demo veri seti oluşturur
    """
    # Ülkeler
    countries = ['Turkey', 'Germany', 'France', 'Spain', 'Italy', 
                'United Kingdom', 'China', 'United States', 'Brazil', 'India']
    
    # Yıl aralığı
    years = list(range(2000, 2023))
    
    # Demo veri seti için DataFrame oluştur
    data = []
    for country in countries:
        for year in years:
            # Rastgele yenilenebilir enerji yüzdesi
            renewable_percentage = np.random.uniform(5, 40)
            
            # Rastgele özellikler
            gdp = np.random.uniform(500, 50000) 
            co2_emissions = np.random.uniform(0.5, 20)
            population = np.random.uniform(1, 1400) # Milyon cinsinden
            
            # Kıtayı belirle
            if country in ['Turkey', 'Germany', 'France', 'Spain', 'Italy', 'United Kingdom']:
                continent = 'Europe'
            elif country in ['China', 'India']:
                continent = 'Asia'
            elif country in ['United States']:
                continent = 'North America'
            else:
                continent = 'South America'
            
            data.append({
                'Country': country,
                'Year': year,
                'Continent': continent,
                'GDP_per_capita': gdp,
                'CO2_emissions': co2_emissions,
                'Population': population,
                'RenewableEnergyConsumption': renewable_percentage
            })
    
    # DataFrame oluştur
    df = pd.DataFrame(data)
    
    # Dosyaya kaydet (isteğe bağlı)
    os.makedirs(DATA_DIR, exist_ok=True)
    df.to_csv(DATA_DIR / 'demo_dataset.csv', index=False)
    
    return df

def get_country_list():
    """
    Veri setinden ülkelerin listesini döndürür
    """
    try:
        df = load_dataset()
        countries = df['Country'].unique().tolist()
        countries.sort()  # Alfabetik sırala
        return countries
    except Exception as e:
        print(f"Ülke listesi oluşturulurken hata: {str(e)}")
        return []

def get_feature_importance(country_id=None):
    """
    Özellik önem değerlerini hesaplar ve döndürür.
    
    Args:
        country_id (str, optional): Ülke ID'si. None ise global önem değerleri döndürülür.
    
    Returns:
        dict: Özellik adları ve önem değerleri içeren sözlük
    """
    try:
        df = load_dataset()
        
        # Ülkeye göre filtrele
        if country_id and country_id in df['Country'].unique():
            df = df[df['Country'] == country_id]
        elif country_id:  # Belirtilen ülke veri setinde yoksa
            return None
        
        # Özellik önem değerleri - gerçek bir model yerine demo değerler
        # Gerçek projede bu değerler bir makine öğrenimi modelinden gelmeli
        features = {
            'Year': np.random.uniform(0.15, 0.25),
            'Year_Squared': np.random.uniform(0.10, 0.20),
            'Year_Log': np.random.uniform(0.05, 0.15),
            'Continent': np.random.uniform(0.05, 0.15),
            'GDP_per_capita': np.random.uniform(0.15, 0.25),
            'CO2_emissions': np.random.uniform(0.10, 0.20),
            'Population': np.random.uniform(0.05, 0.15),
        }
        
        # Değerleri normalize et (toplam 1 olacak şekilde)
        total = sum(features.values())
        features = {k: v/total for k, v in features.items()}
        
        # Sonuçları hazırla
        result = []
        for feature, importance in features.items():
            result.append({
                'feature': feature,
                'importance': round(importance * 100, 2)  # Yüzde olarak
            })
        
        # Önem değerine göre azalan sırada sırala
        result = sorted(result, key=lambda x: x['importance'], reverse=True)
        
        return result
    except Exception as e:
        print(f"Özellik önemi hesaplanırken hata: {str(e)}")
        return [] 