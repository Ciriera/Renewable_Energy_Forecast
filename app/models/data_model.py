import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional, Tuple
import os
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.preprocessing import StandardScaler
import joblib

class DataModel:
    """
    Veri modeli sınıfı - CSV verilerini yükler ve işler
    
    Sorumluluklar:
    - CSV dosyasını yüklemek
    - Veriyi temizlemek ve işlemek
    - Veri analizi işlemlerini gerçekleştirmek
    - Model eğitimi ve tahmin yapma
    - Özellik mühendisliği
    """
    
    def __init__(self, csv_path=None):
        """
        Veri modelini başlatır ve veri setini yükler
        
        Args:
            csv_path: CSV dosya yolu (varsayılan=None, kök dizindeki dosya kullanılır)
        """
        self.df = None
        self.melted_df = None
        self.model = None
        self.model_features = None
        self.scaler = None
        self.model_metrics = None
        self.feature_importance = None
        self.models_cache = {}  # Ülke başına model önbelleği
        
        # CSV dosya yolunu belirle
        if csv_path is None:
            # Proje kök dizininden CSV dosyasını al
            self.csv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 
                                        'yenilenebilirenerjikaynaklarituketimi.csv')
        else:
            self.csv_path = csv_path
            
        self.load_data()
        
    def load_data(self) -> None:
        """CSV dosyasını yükler ve temel veri temizliği işlemlerini gerçekleştirir"""
        try:
            # CSV dosyasını yükle
            self.df = pd.read_csv(self.csv_path)
            
            # Country Name sütununda eksik veri varsa at
            self.df = self.df.dropna(subset=['Country Name'])
            
            # Numeric sütunları belirle ve float'a çevir
            numeric_cols = self.df.columns[4:]  # İlk 4 sütun meta veri
            
            # Tüm numeric kolonları float'a çevir
            for col in numeric_cols:
                self.df[col] = pd.to_numeric(self.df[col], errors='coerce')
            
            # Eksik değerleri doldur
            self.df[numeric_cols] = self.df[numeric_cols].interpolate(method='linear', axis=1, limit_direction='both')
            self.df[numeric_cols] = self.df[numeric_cols].ffill(axis=1).bfill(axis=1)
            
            # Veriyi long format'a dönüştür
            self._melt_data()
        except Exception as e:
            print(f"Veri yükleme hatası: {e}")
            # Gerçek uygulamada hata loglama yapılmalı
            
    def _melt_data(self) -> None:
        """Veriyi geniş formattan uzun formata dönüştürür"""
        if self.df is None:
            return
            
        # Yıl etiketlerini sayısal değerlere dönüştürmek için sözlük
        year_map = {
            'bir': 1, 'iki': 2, 'uc': 3, 'dort': 4, 'bes': 5, 'alti': 6,
            'yedi': 7, 'sekiz': 8, 'dokuz': 9, 'on': 10, 'onbir': 11, 'oniki': 12, 'onuc': 13,
            'ondort': 14, 'onbes': 15, 'onalti': 16, 'onyedi': 17, 'onsekiz': 18, 'ondokuz': 19,
            'yirmi': 20, 'yirmibir': 21, 'yirmiiki': 22, 'yirmiuc': 23,
            'yirmidort': 24, 'yirmibes': 25, 'yirmialti': 26
        }
        
        numeric_cols = self.df.columns[4:]
        
        # Veriyi long format'a dönüştür
        self.melted_df = self.df.melt(
            id_vars=['Series Name', 'Series Code', 'Country Name', 'Country Code'],
            value_vars=numeric_cols,
            var_name='YR_label',
            value_name='Renewable_Value'
        )
        
        # Yıl etiketlerini sayısal değerlere dönüştür
        def convert_yr_to_numeric(yr_label: str) -> float:
            if yr_label.startswith("YR"):
                suffix = yr_label[2:].strip().lower()
                return year_map.get(suffix, np.nan)
            return np.nan
        
        self.melted_df['Year'] = self.melted_df['YR_label'].apply(convert_yr_to_numeric)
        
        # Geçersiz yıl satırlarını at
        self.melted_df = self.melted_df.dropna(subset=['Year'])
        
        # Yılları integer'a çevir
        self.melted_df['Year'] = self.melted_df['Year'].astype(int)
    
    def get_countries(self) -> List[str]:
        """Tüm ülkelerin listesini döndürür"""
        if self.melted_df is None:
            return []
        
        return sorted(self.melted_df['Country Name'].unique().tolist())
    
    def get_country_data(self, country_name: str) -> List[Dict[str, Any]]:
        """
        Belirli bir ülkenin tüm yıllardaki verilerini döndürür
        
        Args:
            country_name: Ülke adı
            
        Returns:
            Ülke verisi (yıl ve değerler listesi)
        """
        if self.melted_df is None:
            return []
        
        # Ülkeye göre filtrele ve yıla göre sırala
        country_df = self.melted_df[self.melted_df['Country Name'] == country_name].sort_values('Year')
        
        # JSON formatında veriyi döndür
        result = []
        for _, row in country_df.iterrows():
            result.append({
                'year': int(row['Year']),
                'value': float(row['Renewable_Value']),
                'label': f"YR{row['YR_label'][2:]}"
            })
        
        return result
    
    def get_overview_data(self) -> Dict[str, Any]:
        """
        Veri seti hakkında genel bilgiler döndürür
        
        Returns:
            Genel veri seti bilgileri ve istatistikler
        """
        if self.melted_df is None:
            return {}
        
        # Temel istatistikler
        stats = self.melted_df['Renewable_Value'].describe().to_dict()
        
        return {
            'total_countries': int(self.melted_df['Country Name'].nunique()),
            'year_range': {
                'min': int(self.melted_df['Year'].min()),
                'max': int(self.melted_df['Year'].max())
            },
            'renewable_stats': {
                'mean': float(stats['mean']),
                'median': float(stats['50%']),
                'min': float(stats['min']),
                'max': float(stats['max']),
                'std': float(stats['std'])
            }
        }
    
    def get_top_countries(self, year: int, limit: int = 10, ascending: bool = False) -> List[Dict[str, Any]]:
        """
        Belirli bir yılda en yüksek/en düşük yenilenebilir enerji oranına sahip ülkeleri döndürür
        
        Args:
            year: Yıl
            limit: Kaç ülke döndürüleceği
            ascending: True ise en düşük değerden başlar, False ise en yüksek değerden başlar
            
        Returns:
            Ülke listesi ve değerleri
        """
        if self.melted_df is None:
            return []
        
        # Yıla göre filtrele
        year_df = self.melted_df[self.melted_df['Year'] == year]
        
        # Ülkeleri yenilenebilir enerji değerine göre sırala
        top_countries = year_df.sort_values('Renewable_Value', ascending=ascending).head(limit)
        
        # JSON formatında veriyi döndür
        result = []
        for _, row in top_countries.iterrows():
            result.append({
                'country': row['Country Name'],
                'country_code': row['Country Code'],
                'value': float(row['Renewable_Value'])
            })
        
        return result
        
    def get_feature_importance(self, country_name: Optional[str] = None) -> Dict[str, Any]:
        """
        Özellik önemlerini döndürür
        
        Args:
            country_name: Ülke adı (None ise global veriler)
            
        Returns:
            Özellik önemleri
        """
        try:
            # Özellik mühendisliği uygula
            feature_data = self.apply_feature_engineering()
            
            # Önemler ve özellikler
            features = feature_data.get('features', [])
            importance = feature_data.get('importance', [])
            
            # Boşsa hata döndür
            if not features or not importance:
                return {
                    'success': False,
                    'error': 'Özellik bilgisi oluşturulamadı'
                }
            
            # Özellik önemlerini formatlayarak döndür
            result = {
                'success': True,
                'country': country_name if country_name else 'Global',
                'feature_importance': {
                    'labels': features,
                    'values': importance
                }
            }
            
            return result
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

    def apply_feature_engineering(self) -> Dict[str, Any]:
        """
        Özellik mühendisliği uygular ve önemli özellikleri döndürür
        
        Returns:
            Özellik mühendisliği sonuçları
        """
        if self.melted_df is None:
            return {'features': [], 'importance': []}
            
        # Daha önce oluşturulmuş özellikleri kullan
        if self.feature_importance is not None:
            return self.feature_importance
            
        # Ülke ve yıl verilerinden yeni özellikler oluştur
        features_df = self.melted_df.copy()
        
        # Yeni özellikler ekle
        features_df['Year_Squared'] = features_df['Year'] ** 2
        features_df['Log_Year'] = np.log1p(features_df['Year'])
        
        # Kıtalar bazında ortalama değerler
        continent_map = {
            'Turkey': 'Asia', 'Germany': 'Europe', 'France': 'Europe', 'Italy': 'Europe',
            'United States': 'North America', 'Canada': 'North America', 'Brazil': 'South America',
            'China': 'Asia', 'Japan': 'Asia', 'Australia': 'Oceania', 'South Africa': 'Africa',
            'Egypt': 'Africa', 'India': 'Asia', 'United Kingdom': 'Europe', 'Russia': 'Europe'
        }
        
        # En yaygın ülkeler için kıta bilgisi ekle
        features_df['Continent'] = features_df['Country Name'].map(continent_map)
        
        # Veri setinden öğrenme için hazırlık (RandomForest için)
        prep_df = features_df.dropna(subset=['Continent'])
        
        # Kukla değişkenler oluştur
        continent_dummies = pd.get_dummies(prep_df['Continent'], prefix='Continent')
        prep_df = pd.concat([prep_df, continent_dummies], axis=1)
        
        # Özellikleri ve hedef değişkeni ayır
        features = ['Year', 'Year_Squared', 'Log_Year'] + [col for col in prep_df.columns if col.startswith('Continent_')]
        target = 'Renewable_Value'
        
        X = prep_df[features]
        y = prep_df[target]
        
        # Rastgele orman modeli eğit
        rf_model = RandomForestRegressor(n_estimators=100, random_state=42)
        rf_model.fit(X, y)
        
        # Özellik önemlerini kaydet
        importance = rf_model.feature_importances_
        
        # Sonuçları oluştur
        result = {
            'features': features,
            'importance': importance.tolist()
        }
        
        # Sonuçları önbelleğe al
        self.feature_importance = result
        
        return result
    
    def train_model(self, country_name: Optional[str] = None, force_retrain: bool = False) -> Dict[str, Any]:
        """
        Model eğitir
        
        Args:
            country_name: Ülke adı (None ise tüm ülkeler için)
            force_retrain: Mevcut model olsa bile yeniden eğitilsin mi
            
        Returns:
            Eğitim sonuçları
        """
        if self.melted_df is None:
            return {'success': False, 'error': 'Veri bulunamadı'}
            
        try:
            # Tek ülke için model eğitimi
            if country_name:
                # Önbellekte model var mı ve zorunlu yeniden eğitim değilse mevcut modeli kullan
                if country_name in self.models_cache and not force_retrain:
                    return {
                        'success': True,
                        'message': f"{country_name} için model zaten eğitilmiş",
                        'country': country_name,
                        'metrics': self.models_cache[country_name].get('metrics', {})
                    }
                    
                # Ülkeye ait verileri filtrele
                country_data = self.melted_df[self.melted_df['Country Name'] == country_name].sort_values('Year')
                
                if len(country_data) < 10:
                    return {'success': False, 'error': 'Yeterli veri yok'}
                
                # Özellikleri oluştur
                X = country_data[['Year']]
                X['Year_Squared'] = X['Year'] ** 2
                X['Year_Cubed'] = X['Year'] ** 3
                y = country_data['Renewable_Value']
                
                # Veriyi eğitim ve test olarak ayır
                X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
                
                # Özellikleri ölçeklendir
                scaler = StandardScaler()
                X_train_scaled = scaler.fit_transform(X_train)
                X_test_scaled = scaler.transform(X_test)
                
                # Lineer regresyon modeli eğit
                model = LinearRegression()
                model.fit(X_train_scaled, y_train)
                
                # Model performansını değerlendir
                y_pred = model.predict(X_test_scaled)
                
                metrics = {
                    'mae': float(mean_absolute_error(y_test, y_pred)),
                    'rmse': float(np.sqrt(mean_squared_error(y_test, y_pred))),
                    'r2': float(r2_score(y_test, y_pred))
                }
                
                # Modeli önbelleğe al
                self.models_cache[country_name] = {
                    'model': model,
                    'scaler': scaler,
                    'features': ['Year', 'Year_Squared', 'Year_Cubed'],
                    'metrics': metrics
                }
                
                return {
                    'success': True,
                    'message': f"{country_name} için model eğitildi",
                    'country': country_name,
                    'metrics': metrics
                }
                
            else:
                # Tüm ülkeler için model eğitimi (burada basit bir yaklaşım)
                trained_count = 0
                countries = self.get_countries()
                
                for country in countries:
                    result = self.train_model(country, force_retrain)
                    if result.get('success', False):
                        trained_count += 1
                
                return {
                    'success': True,
                    'message': f"{trained_count} ülke için model eğitildi",
                    'total_countries': len(countries),
                    'trained_countries': trained_count
                }
                
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def predict_future(self, country_name: str, years_ahead: int = 5) -> Dict[str, Any]:
        """
        Gelecek için tahmin yapar
        
        Args:
            country_name: Ülke adı
            years_ahead: Kaç yıl ilerisi için tahmin yapılacak
            
        Returns:
            Tahmin sonuçları
        """
        if self.melted_df is None:
            return {'success': False, 'error': 'Veri bulunamadı'}
            
        try:
            # Ülke için model eğit veya mevcut modeli kullan
            if country_name not in self.models_cache:
                train_result = self.train_model(country_name)
                if not train_result.get('success', False):
                    return train_result
            
            # Model ve scaler al
            model_data = self.models_cache[country_name]
            model = model_data['model']
            scaler = model_data['scaler']
            features = model_data['features']
            metrics = model_data['metrics']
            
            # Ülkeye ait maksimum yılı bul
            country_data = self.melted_df[self.melted_df['Country Name'] == country_name]
            max_year = country_data['Year'].max()
            
            # Tahmin yıllarını oluştur
            future_years = np.arange(max_year + 1, max_year + years_ahead + 1)
            
            # Tahmin için özellikleri hazırla
            pred_features = pd.DataFrame({'Year': future_years})
            pred_features['Year_Squared'] = pred_features['Year'] ** 2
            pred_features['Year_Cubed'] = pred_features['Year'] ** 3
            
            # Özellikleri ölçeklendir
            pred_scaled = scaler.transform(pred_features)
            
            # Tahmin yap
            predictions = model.predict(pred_scaled)
            
            # Negatif değerleri sıfıra çevir (anlamlı minimum)
            predictions = np.maximum(predictions, 0)
            
            # Sonuçları formatlı
            result_predictions = []
            for i, year in enumerate(future_years):
                result_predictions.append({
                    'year': int(year),
                    'value': float(predictions[i]),
                    'is_prediction': True
                })
            
            return {
                'success': True,
                'country': country_name,
                'predictions': result_predictions,
                'model_metrics': metrics
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def get_model_metrics(self, country_name: Optional[str] = None) -> Dict[str, Any]:
        """
        Model metriklerini döndürür
        
        Args:
            country_name: Ülke adı (None ise global metrikler)
            
        Returns:
            Model metrikleri
        """
        try:
            # Belirli bir ülke için metrikler
            if country_name:
                if country_name not in self.models_cache:
                    # Model yoksa eğit
                    train_result = self.train_model(country_name)
                    if not train_result.get('success', False):
                        return train_result
                
                # Metrikleri al
                metrics = self.models_cache[country_name].get('metrics', {})
                
                # Model kalitesi değerlendirmesi
                r2_value = metrics.get('r2', 0)
                if r2_value > 0.8:
                    model_quality = 'Çok İyi'
                elif r2_value > 0.6:
                    model_quality = 'İyi'
                elif r2_value > 0.4:
                    model_quality = 'Orta'
                else:
                    model_quality = 'Zayıf'
                
                return {
                    'success': True,
                    'country': country_name,
                    'metrics': metrics,
                    'model_quality': model_quality
                }
                
            else:
                # Tüm modellerin ortalama metriklerini hesapla
                if not self.models_cache:
                    return {
                        'success': False,
                        'error': 'Henüz hiçbir model eğitilmemiş'
                    }
                
                # Tüm ülkelerin metriklerini topla
                all_metrics = {
                    'mae': [],
                    'rmse': [],
                    'r2': []
                }
                
                for country, data in self.models_cache.items():
                    metrics = data.get('metrics', {})
                    for key in all_metrics:
                        if key in metrics:
                            all_metrics[key].append(metrics[key])
                
                # Ortalama metrikler
                avg_metrics = {
                    'mae': float(np.mean(all_metrics['mae'])) if all_metrics['mae'] else 0,
                    'rmse': float(np.mean(all_metrics['rmse'])) if all_metrics['rmse'] else 0,
                    'r2': float(np.mean(all_metrics['r2'])) if all_metrics['r2'] else 0
                }
                
                # Model kalitesi değerlendirmesi
                r2_value = avg_metrics.get('r2', 0)
                if r2_value > 0.8:
                    model_quality = 'Çok İyi'
                elif r2_value > 0.6:
                    model_quality = 'İyi'
                elif r2_value > 0.4:
                    model_quality = 'Orta'
                else:
                    model_quality = 'Zayıf'
                
                return {
                    'success': True,
                    'country': 'Global',
                    'metrics': avg_metrics,
                    'model_quality': model_quality,
                    'trained_models_count': len(self.models_cache)
                }
                
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def compare_countries(self, country_names: List[str]) -> Dict[str, Any]:
        """
        Ülkeleri karşılaştırır ve analiz sonuçlarını döndürür
        
        Args:
            country_names: Karşılaştırılacak ülke adları
            
        Returns:
            Karşılaştırma sonuçları
        """
        if self.melted_df is None or not country_names:
            return {'success': False, 'error': 'Veri veya ülke adı bulunamadı'}
        
        try:
            # Veriyi filtrele
            comparison_data = self.melted_df[self.melted_df['Country Name'].isin(country_names)]
            
            if len(comparison_data) == 0:
                return {'success': False, 'error': 'Belirtilen ülkeler için veri bulunamadı'}
            
            # Her ülke için verileri grupla
            countries_data = {}
            
            for country in country_names:
                country_df = comparison_data[comparison_data['Country Name'] == country].sort_values('Year')
                
                if len(country_df) == 0:
                    continue
                    
                # Ülke verilerini formatlı
                country_data = []
                for _, row in country_df.iterrows():
                    country_data.append({
                        'year': int(row['Year']),
                        'value': float(row['Renewable_Value'])
                    })
                    
                # İstatistikler
                values = [item['value'] for item in country_data]
                stats = {
                    'mean': float(np.mean(values)) if values else 0,
                    'min': float(np.min(values)) if values else 0,
                    'max': float(np.max(values)) if values else 0,
                    'growth': float((values[-1] - values[0]) / values[0]) if values and values[0] > 0 else 0
                }
                
                countries_data[country] = country_data
                
                # Model metrikleri ekle (eğer mevcutsa)
                if country in self.models_cache:
                    stats['model_metrics'] = self.models_cache[country].get('metrics', {})
                
            # En yüksek ve en düşük değerlere sahip ülkeler
            latest_year = int(self.melted_df['Year'].max())
            
            # Son yıl verisi olan ülkeleri bul
            latest_data = comparison_data[comparison_data['Year'] == latest_year]
            
            highest_country = None
            lowest_country = None
            highest_value = -float('inf')
            lowest_value = float('inf')
            
            for _, row in latest_data.iterrows():
                country = row['Country Name']
                value = row['Renewable_Value']
                
                if value > highest_value:
                    highest_value = value
                    highest_country = country
                    
                if value < lowest_value:
                    lowest_value = value
                    lowest_country = country
            
            return {
                'success': True,
                'countries': country_names,
                'comparison_data': countries_data,
                'highest': {
                    'country': highest_country,
                    'value': float(highest_value) if highest_country else 0
                },
                'lowest': {
                    'country': lowest_country,
                    'value': float(lowest_value) if lowest_country else 0
                }
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)} 