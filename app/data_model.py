import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional, Tuple
import os
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime


class DataModel:
    """
    Veri modeli sınıfı - Yenilenebilir enerji veri analizini gerçekleştirir
    
    Sorumluluklar:
    - CSV verilerini yüklemek ve işlemek
    - Veri temizleme ve dönüştürme
    - İstatistiksel analiz
    - Özellik mühendisliği
    - Model eğitimi ve tahmin
    - Ülke verilerinin karşılaştırılması
    """
    
    def __init__(self, data_path: str):
        """
        DataModel sınıfını başlatır ve verileri yükler
        
        Args:
            data_path: CSV veri dosyasının yolu
        """
        self.data_path = data_path
        self.df = None               # Ham veri
        self.melted_df = None        # Uzun format veri
        self.models = {}             # Ülke bazlı modeller
        self.scalers = {}            # Ülke bazlı ölçekleyiciler
        self.model_metrics = {}      # Model metrikleri
        self.feature_importance = {} # Özellik önemleri
        
        # Modeller için klasörü oluştur
        os.makedirs('models', exist_ok=True)
        
        # Verileri yükle
        self.load_data()
        
    def load_data(self) -> bool:
        """
        CSV dosyasını yükler ve temel veri temizleme işlemlerini gerçekleştirir
        
        Returns:
            Yükleme başarılı ise True, değilse False
        """
        try:
            # CSV dosyasını yükle
            self.df = pd.read_csv(self.data_path)
            
            # Country Name sütununda eksik değer varsa çıkar
            self.df = self.df.dropna(subset=['Country Name'])
            
            # Sayısal sütunları belirle (ilk 4 sütun meta veri)
            numeric_cols = self.df.columns[4:]
            
            # Sayısal sütunları float'a dönüştür
            for col in numeric_cols:
                self.df[col] = pd.to_numeric(self.df[col], errors='coerce')
            
            # Eksik değerleri doldur
            # Önce doğrusal interpolasyon, sonra ileri/geri doldurma
            self.df[numeric_cols] = self.df[numeric_cols].interpolate(method='linear', axis=1)
            self.df[numeric_cols] = self.df[numeric_cols].ffill(axis=1).bfill(axis=1)
            
            # Veriyi uzun formata dönüştür
            self._melt_data()
            
            return True
        except Exception as e:
            print(f"Veri yükleme hatası: {e}")
            return False
    
    def _melt_data(self) -> None:
        """
        Veriyi geniş formattan uzun formata dönüştürür (yıl sütunları -> tek yıl sütunu)
        """
        if self.df is None:
            return
        
        # Yıl etiketleri ve sayısal değerler arası eşleştirme
        year_mapping = {f'YR{i}': i for i in range(1995, 2021)}
        
        # ID değişkenleri (değişmeyecek sütunlar)
        id_vars = ['Series Name', 'Series Code', 'Country Name', 'Country Code']
        
        # Veriyi uzun formata dönüştür
        self.melted_df = pd.melt(
            self.df,
            id_vars=id_vars,
            var_name='YR_label',
            value_name='Renewable_Value'
        )
        
        # Yıl etiketlerini sayısal değerlere dönüştür
        self.melted_df['Year'] = self.melted_df['YR_label'].apply(
            lambda x: year_mapping.get(x, 0)
        )
        
        # NaN değerleri temizle
        self.melted_df = self.melted_df.dropna(subset=['Renewable_Value'])
    
    def get_countries(self) -> List[str]:
        """
        Veri setindeki tüm ülkelerin listesini döndürür
        
        Returns:
            Ülke adları listesi
        """
        if self.melted_df is None:
            return []
        
        return sorted(self.melted_df['Country Name'].unique().tolist())
    
    def get_country_data(self, country_name: str) -> List[Dict[str, Any]]:
        """
        Belirli bir ülkenin verilerini döndürür
        
        Args:
            country_name: Ülke adı
            
        Returns:
            Ülkenin yıllara göre yenilenebilir enerji verileri
        """
        if self.melted_df is None:
            return []
        
        # Ülke verisini filtrele ve yıla göre sırala
        country_df = self.melted_df[self.melted_df['Country Name'] == country_name].sort_values('Year')
        
        # JSON formatına dönüştür
        result = []
        for _, row in country_df.iterrows():
            result.append({
                'year': int(row['Year']),
                'value': float(row['Renewable_Value']),
                'label': str(row['YR_label'])
            })
        
        return result
    
    def get_overview_data(self) -> Dict[str, Any]:
        """
        Veri seti hakkında genel bilgileri döndürür
        
        Returns:
            Veri seti özeti ve istatistikler
        """
        if self.melted_df is None:
            return {}
        
        # Temel istatistikler
        stats = self.melted_df['Renewable_Value'].describe().to_dict()
        
        # En yüksek ve en düşük değerli ülkeler (son yıl)
        latest_year = self.melted_df['Year'].max()
        latest_data = self.melted_df[self.melted_df['Year'] == latest_year]
        
        top_countries = latest_data.nlargest(5, 'Renewable_Value')[['Country Name', 'Renewable_Value']].to_dict('records')
        bottom_countries = latest_data.nsmallest(5, 'Renewable_Value')[['Country Name', 'Renewable_Value']].to_dict('records')
        
        return {
            'total_countries': int(self.melted_df['Country Name'].nunique()),
            'total_years': int(self.melted_df['Year'].nunique()),
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
            },
            'top_countries': top_countries,
            'bottom_countries': bottom_countries
        }
    
    def train_model(self, country_name: Optional[str] = None, force_retrain: bool = False) -> Dict[str, Any]:
        """
        Tahmin modeli eğitir
        
        Args:
            country_name: Eğitilecek ülke adı (None ise global model)
            force_retrain: Mevcut model olsa bile yeniden eğitilsin mi
            
        Returns:
            Eğitim sonuçları
        """
        # Tüm ülkeler için model eğitmek istiyorsak
        if country_name is None:
            countries = self.get_countries()
            results = {}
            
            for country in countries:
                result = self.train_model(country, force_retrain)
                results[country] = result
                
            return {
                'success': True,
                'message': f"{len(results)} ülke için model eğitildi",
                'results': results
            }
        
        # Belirli bir ülke için model eğitimi
        try:
            # Model dosya adı
            model_filename = f"models/{country_name.replace(' ', '_')}_model.joblib"
            scaler_filename = f"models/{country_name.replace(' ', '_')}_scaler.joblib"
            
            # Eğer model zaten eğitilmiş ve yeniden eğitim istenmiyorsa, varolan modeli kullan
            if os.path.exists(model_filename) and not force_retrain:
                self.models[country_name] = joblib.load(model_filename)
                self.scalers[country_name] = joblib.load(scaler_filename)
                
                # Önbelleğe özellik önemleri eklenmiş mi kontrol et
                if country_name not in self.feature_importance:
                    self.feature_importance[country_name] = self._calculate_feature_importance(country_name)
                
                return {
                    'success': True,
                    'message': f"{country_name} için kayıtlı model yüklendi",
                    'metrics': self.model_metrics.get(country_name, {})
                }
            
            # Ülke verisini filtrele
            country_data = self.melted_df[self.melted_df['Country Name'] == country_name].sort_values('Year')
            
            if len(country_data) < 10:
                return {
                    'success': False,
                    'message': f"{country_name} için yeterli veri yok (en az 10 yıl gerekli)"
                }
            
            # Özellikler oluştur
            X = pd.DataFrame({
                'Year': country_data['Year'],
                'Year_Squared': country_data['Year'] ** 2,
                'Year_Log': np.log1p(country_data['Year']),
                'Year_Diff': country_data['Year'].diff().fillna(0)
            })
            
            y = country_data['Renewable_Value']
            
            # Veriyi eğitim ve test olarak ayır
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
            
            # Özellikleri ölçeklendir
            scaler = StandardScaler()
            X_train_scaled = scaler.fit_transform(X_train)
            X_test_scaled = scaler.transform(X_test)
            
            # Random Forest modeli eğit
            model = RandomForestRegressor(n_estimators=100, random_state=42)
            model.fit(X_train_scaled, y_train)
            
            # Model performansını değerlendir
            y_pred = model.predict(X_test_scaled)
            
            metrics = {
                'mae': float(mean_absolute_error(y_test, y_pred)),
                'rmse': float(np.sqrt(mean_squared_error(y_test, y_pred))),
                'r2': float(r2_score(y_test, y_pred))
            }
            
            # Modeli kaydet
            self.models[country_name] = model
            self.scalers[country_name] = scaler
            self.model_metrics[country_name] = metrics
            
            # Özellik önemlerini hesapla
            self.feature_importance[country_name] = self._calculate_feature_importance(country_name)
            
            # Modeli diske kaydet
            joblib.dump(model, model_filename)
            joblib.dump(scaler, scaler_filename)
            
            return {
                'success': True,
                'message': f"{country_name} için model eğitildi",
                'metrics': metrics
            }
            
        except Exception as e:
            print(f"Model eğitim hatası ({country_name}): {e}")
            return {
                'success': False,
                'message': f"Model eğitim sırasında hata oluştu: {str(e)}"
            }
    
    def _calculate_feature_importance(self, country_name: str) -> Dict[str, Any]:
        """
        Model için özellik önemlerini hesaplar
        
        Args:
            country_name: Ülke adı
            
        Returns:
            Özellik önemleri
        """
        if country_name not in self.models:
            return {}
        
        model = self.models[country_name]
        feature_names = ['Year', 'Year_Squared', 'Year_Log', 'Year_Diff']
        
        importances = model.feature_importances_
        indices = np.argsort(importances)[::-1]
        
        features = []
        for idx in indices:
            features.append({
                'feature': feature_names[idx],
                'importance': float(importances[idx])
            })
        
        return {
            'features': features,
            'chart_data': {
                'labels': [f['feature'] for f in features],
                'values': [f['importance'] for f in features]
            }
        }
    
    def get_feature_importance(self, country_name: Optional[str] = None) -> Dict[str, Any]:
        """
        Özellik önemlerini döndürür
        
        Args:
            country_name: Ülke adı (None ise tüm ülkelerin ortalaması)
            
        Returns:
            Özellik önemleri
        """
        # Belirli bir ülke için
        if country_name is not None:
            # Model eğitilmemiş ise eğit
            if country_name not in self.models:
                train_result = self.train_model(country_name)
                if not train_result['success']:
                    return {
                        'success': False,
                        'message': train_result['message']
                    }
            
            # Eğitilmiş modelin özellik önemlerini döndür
            return {
                'success': True,
                'country': country_name,
                'feature_importance': self.feature_importance.get(country_name, {})
            }
        
        # Tüm ülkelerin ortalaması
        all_features = {}
        count = 0
        
        # Tüm ülkeler için modeller eğitilmemişse eğit
        if not self.models:
            self.train_model()
        
        # Tüm ülkelerin özellik önemlerini topla
        for country, importance in self.feature_importance.items():
            chart_data = importance.get('chart_data', {})
            labels = chart_data.get('labels', [])
            values = chart_data.get('values', [])
            
            for label, value in zip(labels, values):
                if label not in all_features:
                    all_features[label] = 0
                all_features[label] += value
            
            count += 1
        
        # Ortalama al
        if count > 0:
            for feature in all_features:
                all_features[feature] /= count
        
        # Sonuçları formatla
        sorted_features = sorted(all_features.items(), key=lambda x: x[1], reverse=True)
        
        return {
            'success': True,
            'country': 'Global',
            'feature_importance': {
                'features': [{'feature': f, 'importance': float(i)} for f, i in sorted_features],
                'chart_data': {
                    'labels': [f for f, _ in sorted_features],
                    'values': [float(i) for _, i in sorted_features]
                }
            }
        }
    
    def predict_future(self, country_name: str, years_ahead: int = 5) -> Dict[str, Any]:
        """
        Gelecekteki yenilenebilir enerji değerlerini tahmin eder
        
        Args:
            country_name: Ülke adı
            years_ahead: Kaç yıl ilerisi için tahmin yapılacak
            
        Returns:
            Tahmin sonuçları
        """
        # Model eğitilmemiş ise eğit
        if country_name not in self.models:
            train_result = self.train_model(country_name)
            if not train_result['success']:
                return {
                    'success': False,
                    'message': train_result['message']
                }
        
        try:
            # Modeli ve ölçekleyiciyi al
            model = self.models[country_name]
            scaler = self.scalers[country_name]
            
            # Ülke verisini al ve son yılı bul
            country_data = self.melted_df[self.melted_df['Country Name'] == country_name]
            last_year = int(country_data['Year'].max())
            
            # Tahmin yapılacak yıllar
            future_years = range(last_year + 1, last_year + years_ahead + 1)
            
            # Tahmin için özellikler oluştur
            future_X = pd.DataFrame({
                'Year': future_years,
                'Year_Squared': [y ** 2 for y in future_years],
                'Year_Log': [np.log1p(y) for y in future_years],
                'Year_Diff': [1] * len(future_years)  # Her zaman 1 yıl fark olacak
            })
            
            # Özellikleri ölçeklendir
            future_X_scaled = scaler.transform(future_X)
            
            # Tahmin yap
            predictions = model.predict(future_X_scaled)
            
            # Sonuçları formatla
            result = []
            for i, year in enumerate(future_years):
                result.append({
                    'year': int(year),
                    'value': float(max(0, predictions[i])),  # Negatif değerleri engelle
                    'is_prediction': True
                })
            
            return {
                'success': True,
                'country': country_name,
                'predictions': result,
                'model_metrics': self.model_metrics.get(country_name, {})
            }
        
        except Exception as e:
            print(f"Tahmin hatası ({country_name}): {e}")
            return {
                'success': False,
                'message': f"Tahmin sırasında hata oluştu: {str(e)}"
            }
    
    def get_model_metrics(self, country_name: Optional[str] = None) -> Dict[str, Any]:
        """
        Model metriklerini döndürür
        
        Args:
            country_name: Ülke adı (None ise tüm ülkelerin ortalaması)
            
        Returns:
            Model metrikleri
        """
        # Belirli bir ülke için
        if country_name is not None:
            # Model eğitilmemiş ise eğit
            if country_name not in self.models:
                train_result = self.train_model(country_name)
                if not train_result['success']:
                    return {
                        'success': False,
                        'message': train_result['message']
                    }
            
            metrics = self.model_metrics.get(country_name, {})
            
            # Model kalitesi belirle
            model_quality = 'Bilinmiyor'
            r2 = metrics.get('r2', 0)
            
            if r2 > 0.9:
                model_quality = 'Mükemmel'
            elif r2 > 0.8:
                model_quality = 'Çok İyi'
            elif r2 > 0.7:
                model_quality = 'İyi'
            elif r2 > 0.5:
                model_quality = 'Orta'
            elif r2 > 0:
                model_quality = 'Zayıf'
            
            return {
                'success': True,
                'country': country_name,
                'metrics': metrics,
                'model_quality': model_quality
            }
        
        # Tüm ülkelerin ortalaması
        all_metrics = {'mae': 0, 'rmse': 0, 'r2': 0}
        count = 0
        
        # Tüm ülkeler için modeller eğitilmemişse eğit
        if not self.models:
            self.train_model()
        
        # Tüm ülkelerin metriklerini topla
        for country, metrics in self.model_metrics.items():
            for key in all_metrics:
                all_metrics[key] += metrics.get(key, 0)
            count += 1
        
        # Ortalama al
        if count > 0:
            for key in all_metrics:
                all_metrics[key] /= count
        
        # Model kalitesi belirle
        model_quality = 'Bilinmiyor'
        r2 = all_metrics.get('r2', 0)
        
        if r2 > 0.9:
            model_quality = 'Mükemmel'
        elif r2 > 0.8:
            model_quality = 'Çok İyi'
        elif r2 > 0.7:
            model_quality = 'İyi'
        elif r2 > 0.5:
            model_quality = 'Orta'
        elif r2 > 0:
            model_quality = 'Zayıf'
        
        return {
            'success': True,
            'country': 'Global',
            'metrics': {k: float(v) for k, v in all_metrics.items()},
            'model_quality': model_quality
        }
    
    def compare_countries(self, country_names: List[str]) -> Dict[str, Any]:
        """
        Ülkeleri karşılaştırır
        
        Args:
            country_names: Karşılaştırılacak ülke adları
            
        Returns:
            Karşılaştırma sonuçları
        """
        if self.melted_df is None or not country_names or len(country_names) < 2:
            return {
                'success': False,
                'message': 'Karşılaştırma için en az iki ülke gereklidir'
            }
        
        try:
            # Ülkelerin verilerini al
            comparison_data = {}
            avg_values = {}
            growth_rates = {}
            
            # Her bir ülke için veri topla
            for country in country_names:
                country_data = self.get_country_data(country)
                
                if not country_data:
                    return {
                        'success': False,
                        'message': f"{country} için veri bulunamadı"
                    }
                
                comparison_data[country] = country_data
                
                # Ortalama değer
                values = [d['value'] for d in country_data]
                avg_values[country] = sum(values) / len(values)
                
                # Büyüme oranı (son yıl - ilk yıl) / ilk yıl
                if values[0] > 0:
                    growth_rates[country] = (values[-1] - values[0]) / values[0]
                else:
                    growth_rates[country] = 0
            
            # Karşılaştırma için tahminleri al
            predictions = {}
            for country in country_names:
                pred_result = self.predict_future(country, 5)
                if pred_result['success']:
                    predictions[country] = pred_result['predictions']
            
            return {
                'success': True,
                'countries': country_names,
                'comparison_data': comparison_data,
                'statistics': {
                    'average_values': avg_values,
                    'growth_rates': growth_rates
                },
                'predictions': predictions
            }
        
        except Exception as e:
            print(f"Karşılaştırma hatası: {e}")
            return {
                'success': False,
                'message': f"Karşılaştırma sırasında hata oluştu: {str(e)}"
            } 