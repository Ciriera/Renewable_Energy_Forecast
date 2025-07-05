import numpy as np
import pandas as pd
import logging
from data_service import DataService

# Logger tanımlanması
logger = logging.getLogger(__name__)
handler = logging.FileHandler('app.log')
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)
logger.setLevel(logging.INFO)

class DataViewModel:
    """
    Görünüm modeli (ViewModel) sınıfı, veri servisi ile UI arasındaki iş mantığını yönetir
    """
    
    def __init__(self, data_service=None):
        """
        DataViewModel sınıfının yapıcı metodu
        Args:
            data_service (DataService, optional): Veri servisi örneği
        """
        self.data_service = data_service if data_service is not None else DataService()
        logger.info("DataViewModel başlatıldı.")
    
    def get_all_countries(self):
        """
        Tüm ülkelerin listesini döndürür
        
        Returns:
            list: Ülke adlarının listesi
        """
        countries = self.data_service.get_countries()
        return countries
    
    def get_all_years(self):
        """
        Tüm yılların listesini döndürür
        
        Returns:
            list: Yılların listesi
        """
        years = self.data_service.get_years()
        return years
    
    def get_all_metrics(self):
        """
        Kullanılabilir tüm metriklerin listesini döndürür
        
        Returns:
            list: Metrik adlarının listesi
        """
        metrics = [
            {
                'id': 'renewable_percentage',
                'name': 'Yenilenebilir Enerji Yüzdesi',
                'unit': '%'
            },
            {
                'id': 'renewable_energy',
                'name': 'Yenilenebilir Enerji Üretimi',
                'unit': 'TWh'
            },
            {
                'id': 'solar_energy',
                'name': 'Güneş Enerjisi Üretimi',
                'unit': 'TWh'
            },
            {
                'id': 'wind_energy',
                'name': 'Rüzgar Enerjisi Üretimi',
                'unit': 'TWh'
            },
            {
                'id': 'hydro_energy',
                'name': 'Hidroelektrik Enerji Üretimi',
                'unit': 'TWh'
            },
            {
                'id': 'nuclear_energy',
                'name': 'Nükleer Enerji Üretimi',
                'unit': 'TWh'
            },
            {
                'id': 'energy_consumption',
                'name': 'Toplam Enerji Tüketimi',
                'unit': 'TWh'
            },
            {
                'id': 'co2_emissions',
                'name': 'CO2 Emisyonları',
                'unit': 'Mt'
            },
            {
                'id': 'gdp',
                'name': 'GSYH (GDP)',
                'unit': 'Milyar $'
            },
            {
                'id': 'population',
                'name': 'Nüfus',
                'unit': 'Milyon'
            },
            {
                'id': 'life_expectancy',
                'name': 'Yaşam Beklentisi',
                'unit': 'Yıl'
            },
            {
                'id': 'unemployment',
                'name': 'İşsizlik Oranı',
                'unit': '%'
            },
            {
                'id': 'inflation',
                'name': 'Enflasyon Oranı',
                'unit': '%'
            }
        ]
        return metrics
    
    def get_country_data(self, country_name):
        """
        Belirli bir ülkenin tüm verilerini döndürür
        
        Args:
            country_name (str): Ülke adı
            
        Returns:
            dict: Ülke verileri
        """
        return self.data_service.get_country_data(country_name)
    
    def compare_countries(self, countries, metric, start_year, end_year):
        """
        Belirli ülkeleri belirli bir metriğe göre karşılaştırır
        
        Args:
            countries (list): Karşılaştırılacak ülke adlarının listesi
            metric (str): Karşılaştırılacak metrik adı
            start_year (int): Başlangıç yılı
            end_year (int): Bitiş yılı
            
        Returns:
            dict: Karşılaştırma sonuçları
        """
        try:
            if not countries or not metric or not start_year or not end_year:
                logger.error("Karşılaştırma için gerekli parametreler eksik")
                return {
                    'success': False,
                    'error': 'Eksik parametreler'
                }
            
            # Ülke verilerini al
            countries_data = {}
            for country in countries:
                country_metrics = self.data_service.get_country_metrics(country, metric, start_year, end_year)
                if country_metrics:
                    countries_data[country] = country_metrics
            
            if not countries_data:
                logger.warning("Verilen parametrelerle hiçbir veri bulunamadı")
                return {
                    'success': False,
                    'error': 'Verilen parametrelerle veri bulunamadı'
                }
            
            # İstatistikler hesapla
            stats = {}
            for country, years_data in countries_data.items():
                values = [v for v in years_data.values() if v is not None]
                if values:
                    stats[country] = {
                        'average': np.mean(values),
                        'min': np.min(values),
                        'max': np.max(values),
                        'change_rate': self._calculate_change_rate(values),
                        'std_dev': np.std(values)
                    }
            
            # Ortalama değere göre ülkeleri sırala
            ranking = sorted(stats.keys(), key=lambda x: stats[x]['average'], reverse=True)
            
            # Veri serisi ve istatistikleri birleştir
            result = {
                'success': True,
                'data': countries_data,
                'statistics': stats,
                'ranking': ranking
            }
            
            metric_info = next((m for m in self.get_all_metrics() if m['id'] == metric), None)
            if metric_info:
                result['metric_info'] = metric_info
            
            logger.info(f"{len(countries)} ülke karşılaştırıldı: {', '.join(countries)}")
            return result
            
        except Exception as e:
            logger.error(f"Ülke karşılaştırma hatası: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _calculate_change_rate(self, values):
        """
        Değerler listesi için değişim oranını hesaplar
        
        Args:
            values (list): Hesaplanacak değerler listesi
            
        Returns:
            float: Değişim oranı (yüzde olarak)
        """
        if len(values) < 2:
            return 0
        
        first_value = values[0]
        last_value = values[-1]
        
        if first_value == 0:
            return float('inf') if last_value > 0 else 0
        
        change_rate = ((last_value - first_value) / first_value) * 100
        return change_rate 