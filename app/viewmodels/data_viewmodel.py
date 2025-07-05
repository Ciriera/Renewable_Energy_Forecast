from typing import Dict, List, Any, Optional
from app.models.data_model import DataModel

class DataViewModel:
    """
    Veri ViewModel sınıfı - Model ve View arasında bir köprü görevi görür
    
    Sorumluluklar:
    - Model'den alınan verileri görünüm için formatlar
    - API yanıtlarını hazırlar
    - İstemci tarafı görünümler için veri yapılarını hazırlar
    """
    
    def __init__(self, data_model: DataModel):
        """
        DataViewModel sınıfını başlatır
        
        Args:
            data_model: DataModel sınıfı örneği
        """
        self.data_model = data_model
        self._country_cache = {}  # Ülke verileri önbelleği
    
    def get_countries(self) -> Dict[str, Any]:
        """
        Ülkelerin listesini döndürür
        
        Returns:
            Ülke listesi
        """
        countries = self.data_model.get_countries()
        
        return {
            'success': True,
            'data': {
                'countries': countries
            }
        }
    
    def get_country_data(self, country_name: str) -> Dict[str, Any]:
        """
        Belirli bir ülkenin verilerini döndürür
        
        Args:
            country_name: Ülke adı
            
        Returns:
            Ülke verisi
        """
        # Önbellekte varsa kullan
        if country_name in self._country_cache:
            return self._country_cache[country_name]
            
        country_data = self.data_model.get_country_data(country_name)
        
        if not country_data:
            return {
                'success': False,
                'message': f"{country_name} için veri bulunamadı"
            }
        
        # Grafik verisi oluştur
        chart_data = {
            'labels': [str(item['year']) for item in country_data],
            'values': [item['value'] for item in country_data]
        }
        
        # İstatistiksel veriler
        values = [item['value'] for item in country_data]
        stats = {
            'mean': sum(values) / len(values) if values else 0,
            'max': max(values) if values else 0,
            'min': min(values) if values else 0,
            'latest': values[-1] if values else 0,
            'growth': (values[-1] - values[0]) / values[0] if values and values[0] > 0 else 0
        }
        
        # Sonuç oluştur
        result = {
            'success': True,
            'data': {
                'country_name': country_name,
                'chart_data': chart_data,
                'stats': stats,
                'raw_data': country_data
            }
        }
        
        # Sonucu önbelleğe al
        self._country_cache[country_name] = result
        
        return result
    
    def get_data_overview(self) -> Dict[str, Any]:
        """
        Veri seti hakkında genel bilgileri görselleştirme için hazırlar
        
        Returns:
            Genel veri seti bilgileri ve istatistikler
        """
        # Model'den ham verileri al
        overview = self.data_model.get_overview_data()
        
        # En yüksek ve en düşük değerlere sahip ülkeleri bul
        top_countries = []
        bottom_countries = []
        
        if self.data_model.melted_df is not None:
            # En son yıla ait verileri al
            latest_year = overview.get('year_range', {}).get('max', 26)
            top_countries = self.data_model.get_top_countries(latest_year, 5)
            bottom_countries = self.data_model.get_top_countries(latest_year, 5, ascending=True)
        
        # Döndürülecek formatı hazırla
        result = {
            'overview': overview,
            'top_countries': top_countries,
            'bottom_countries': bottom_countries
        }
        
        return {
            'success': True,
            'data': result
        }
    
    def get_feature_importance(self, country_name: Optional[str] = None) -> Dict[str, Any]:
        """
        Özellik önemlerini döndürür
        
        Args:
            country_name: Ülke adı (None ise global veriler)
            
        Returns:
            Özellik önemleri
        """
        feature_data = self.data_model.get_feature_importance(country_name)
        
        if not feature_data.get('success', False):
            return feature_data
        
        return {
            'success': True,
            'data': {
                'country': feature_data.get('country', 'Global'),
                'feature_importance': feature_data.get('feature_importance', {})
            }
        }
    
    def get_country_prediction(self, country_name: str, years_ahead: int = 5) -> Dict[str, Any]:
        """
        Ülkenin gelecek tahminlerini döndürür
        
        Args:
            country_name: Ülke adı
            years_ahead: Kaç yıl ilerisi için tahmin yapılacak
            
        Returns:
            Tahmin sonuçları
        """
        prediction_data = self.data_model.predict_future(country_name, years_ahead)
        
        if not prediction_data.get('success', False):
            return prediction_data
        
        # Mevcut verileri al
        current_data = self.data_model.get_country_data(country_name)
        
        # Tahmin verilerini al
        predictions = prediction_data.get('predictions', [])
        
        # Grafik verileri için birleştir
        combined_data = []
        
        # Önce mevcut veriler
        for item in current_data:
            combined_data.append({
                'year': item['year'],
                'value': item['value'],
                'is_prediction': False
            })
        
        # Sonra tahmin verileri
        combined_data.extend(predictions)
        
        # Grafik verisi oluştur
        chart_data = {
            'labels': [str(item['year']) for item in combined_data],
            'values': [item['value'] for item in combined_data],
            'is_prediction': [item.get('is_prediction', False) for item in combined_data]
        }
        
        return {
            'success': True,
            'data': {
                'country_name': country_name,
                'chart_data': chart_data,
                'model_metrics': prediction_data.get('model_metrics', {}),
                'predictions': predictions
            }
        }
    
    def get_model_metrics(self, country_name: Optional[str] = None) -> Dict[str, Any]:
        """
        Model metriklerini döndürür
        
        Args:
            country_name: Ülke adı (None ise global veriler)
            
        Returns:
            Model metrikleri
        """
        metrics_data = self.data_model.get_model_metrics(country_name)
        
        if not metrics_data.get('success', False):
            return metrics_data
        
        return {
            'success': True,
            'data': {
                'country': metrics_data.get('country', 'Global'),
                'metrics': metrics_data.get('metrics', {}),
                'model_quality': metrics_data.get('model_quality', 'Bilinmiyor')
            }
        }
    
    def train_model(self, country_name: Optional[str] = None, force_retrain: bool = False) -> Dict[str, Any]:
        """
        Model eğitir
        
        Args:
            country_name: Ülke adı (None ise tüm ülkeler)
            force_retrain: Mevcut model olsa bile yeniden eğitilsin mi
            
        Returns:
            Eğitim sonuçları
        """
        train_result = self.data_model.train_model(country_name, force_retrain)
        
        if not train_result.get('success', False):
            return train_result
        
        return {
            'success': True,
            'data': train_result
        }
    
    def get_countries_comparison(self, country_names: List[str]) -> Dict[str, Any]:
        """
        Ülkeleri karşılaştırır
        
        Args:
            country_names: Karşılaştırılacak ülke adları
            
        Returns:
            Karşılaştırma sonuçları
        """
        if not country_names or len(country_names) < 2:
            return {
                'success': False,
                'message': 'Karşılaştırma için en az iki ülke gereklidir'
            }
        
        comparison_data = self.data_model.compare_countries(country_names)
        
        if not comparison_data.get('success', False):
            return comparison_data
        
        # Grafik verisi oluştur
        countries = comparison_data.get('countries', [])
        comparison_values = comparison_data.get('comparison_data', {})
        
        # En uzun zaman serisini bul
        max_years = 0
        year_labels = []
        
        for country, data in comparison_values.items():
            if len(data) > max_years:
                max_years = len(data)
                year_labels = [str(item['year']) for item in data]
                
        # Her ülke için değerleri formatla
        datasets = []
        
        # Grafik data oluştur - her ülke için bir seri
        for country in countries:
            if country in comparison_values:
                country_data = comparison_values[country]
                
                # Değerleri yıla göre eşle
                values_by_year = {item['year']: item['value'] for item in country_data}
                
                # Tüm yıllar için değer dizisi oluştur
                values = []
                for year_label in year_labels:
                    year = int(year_label)
                    values.append(values_by_year.get(year, None))
                
                datasets.append({
                    'label': country,
                    'data': values
                })
        
        # Grafik verisi
        chart_data = {
            'labels': year_labels,
            'datasets': datasets
        }
        
        # Ülke karşılaştırma istatistikleri
        comparison_stats = {
            'highest': comparison_data.get('highest', {}),
            'lowest': comparison_data.get('lowest', {})
        }
        
        return {
            'success': True,
            'data': {
                'countries': countries,
                'chart_data': chart_data,
                'comparison_stats': comparison_stats
            }
        } 