import pandas as pd
import numpy as np
import os
import logging
from datetime import datetime

# Logger tanımlanması
logger = logging.getLogger(__name__)
handler = logging.FileHandler('app.log')
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)
logger.setLevel(logging.INFO)

class DataService:
    """
    Veri işlemlerini yönetmek için servis sınıfı
    """
    
    def __init__(self):
        """
        DataService sınıfının yapıcı metodu
        Veri setlerini yükler ve temel işlemler için hazırlar
        """
        self.data = None
        self.load_data()
        logger.info("DataService başlatıldı.")
    
    def load_data(self):
        """
        Veri dosyalarını yükler ve ana veri çerçevesine dönüştürür
        """
        try:
            file_path = os.path.join('data', 'renewable_energy_data.csv')
            if not os.path.exists(file_path):
                logger.error(f"Veri dosyası bulunamadı: {file_path}")
                return False
            
            self.data = pd.read_csv(file_path)
            logger.info(f"Veri başarıyla yüklendi. Satır sayısı: {len(self.data)}")
            
            # Sütun isimlerini kontrol et
            if 'Year' not in self.data.columns or 'Country' not in self.data.columns:
                logger.warning("Veri setinde gerekli sütunlar eksik")
                
            # Eksik değerleri işle
            missing_count = self.data.isnull().sum().sum()
            if missing_count > 0:
                logger.warning(f"Veri setinde {missing_count} eksik değer var")
                # Eksik değerleri NaN ile doldur
                self.data = self.data.fillna(np.nan)
            
            # Veri türlerini kontrol et ve dönüştür
            if 'Year' in self.data.columns:
                self.data['Year'] = pd.to_numeric(self.data['Year'], errors='coerce')
            
            # Sıfır değerleri kontrol et
            zero_count = (self.data == 0).sum().sum()
            if zero_count > 0:
                logger.warning(f"Veri setinde {zero_count} sıfır değer var")
            
            return True
        except Exception as e:
            logger.error(f"Veri yükleme hatası: {str(e)}")
            return False
    
    def get_countries(self):
        """
        Veri setindeki tüm ülkelerin listesini döndürür
        
        Returns:
            list: Ülke adlarının listesi
        """
        try:
            if self.data is None:
                logger.error("Veri yüklenmedi")
                return []
            
            countries = self.data['Country'].unique().tolist()
            countries.sort()
            logger.info(f"{len(countries)} ülke bulundu")
            return countries
        except Exception as e:
            logger.error(f"Ülke listesi alınırken hata: {str(e)}")
            return []
    
    def get_years(self):
        """
        Veri setindeki tüm yılların listesini döndürür
        
        Returns:
            list: Yılların listesi
        """
        try:
            if self.data is None:
                logger.error("Veri yüklenmedi")
                return []
            
            years = sorted(self.data['Year'].unique().tolist())
            logger.info(f"{len(years)} yıl bulundu")
            return years
        except Exception as e:
            logger.error(f"Yıl listesi alınırken hata: {str(e)}")
            return []
    
    def get_country_data(self, country_name):
        """
        Belirli bir ülkenin tüm verilerini döndürür
        
        Args:
            country_name (str): Ülke adı
            
        Returns:
            dict: Ülke verileri
        """
        try:
            if self.data is None:
                logger.error("Veri yüklenmedi")
                return None
            
            # Ülke adının veri setinde olup olmadığını kontrol et
            if country_name not in self.data['Country'].values:
                logger.warning(f"Ülke bulunamadı: {country_name}")
                return None
            
            # Ülke verilerini al
            country_df = self.data[self.data['Country'] == country_name]
            
            # Sonuçları yapılandır
            result = {}
            for year in sorted(country_df['Year'].unique()):
                year_data = country_df[country_df['Year'] == year].iloc[0].to_dict()
                # Country ve Year'ı tekrar eklemek istemediğimiz için kaldır
                year_data.pop('Country', None)
                year_data.pop('Year', None)
                result[int(year)] = year_data
            
            logger.info(f"{country_name} için {len(result)} yıllık veri bulundu")
            return result
        except Exception as e:
            logger.error(f"Ülke verisi alınırken hata: {str(e)}")
            return None
    
    def get_country_metrics(self, country_name, metric, start_year, end_year):
        """
        Belirli bir ülkenin belirli bir metrik için yıllara göre verilerini döndürür
        
        Args:
            country_name (str): Ülke adı
            metric (str): Metrik adı
            start_year (int): Başlangıç yılı
            end_year (int): Bitiş yılı
            
        Returns:
            dict: Yıllara göre metrik değerleri
        """
        try:
            if self.data is None:
                logger.error("Veri yüklenmedi")
                return None
            
            # Ülke ve metrik kontrolü
            if country_name not in self.data['Country'].values:
                logger.warning(f"Ülke bulunamadı: {country_name}")
                return None
            
            # Metrik adını sütun adına dönüştür
            column_mapping = {
                'gdp': 'GDP',
                'population': 'Population',
                'life_expectancy': 'Life_Expectancy',
                'co2_emissions': 'CO2_Emissions',
                'energy_consumption': 'Energy_Consumption',
                'renewable_energy': 'Renewable_Energy',
                'renewable_percentage': 'Renewable_Percentage',
                'solar_energy': 'Solar_Energy',
                'wind_energy': 'Wind_Energy',
                'hydro_energy': 'Hydro_Energy',
                'nuclear_energy': 'Nuclear_Energy',
                'unemployment': 'Unemployment',
                'inflation': 'Inflation'
            }
            
            column_name = column_mapping.get(metric)
            if column_name is None or column_name not in self.data.columns:
                logger.warning(f"Metrik bulunamadı: {metric}")
                return None
            
            # Ülke ve yıl aralığına göre verileri filtrele
            filtered_data = self.data[
                (self.data['Country'] == country_name) & 
                (self.data['Year'] >= start_year) & 
                (self.data['Year'] <= end_year)
            ]
            
            # Sonuçları yapılandır
            result = {}
            for _, row in filtered_data.iterrows():
                year = int(row['Year'])
                value = row[column_name]
                result[year] = float(value) if pd.notna(value) else None
            
            # Yılları sırala
            result = {year: result.get(year) for year in range(start_year, end_year + 1)}
            
            logger.info(f"{country_name} için {metric} metriği {start_year}-{end_year} aralığında {len(result)} yıllık veri bulundu")
            return result
        except Exception as e:
            logger.error(f"Ülke metriği alınırken hata: {str(e)}")
            return None 