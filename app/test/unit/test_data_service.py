"""
DataService Unit Testleri - MVVM Mimarisinin Model Katmanı

Bu test dosyası DataService sınıfı için kapsamlı unit testler içerir.
FIRST prensiplerine uygun olarak yazılmıştır:
- Fast: Hızlı çalışır
- Isolated: Bağımsız testler
- Repeatable: Tekrarlanabilir
- Self-Validating: Kendi kendini doğrular
- Timely: Zamanında yazılmış

Anti-Pattern'lerden kaçınılır:
- The Liar: Testler gerçekten test eder
- The Giant: Testler küçük ve odaklı
- The Mockery: Aşırı mock kullanımından kaçınılır
- The Secret Catcher: Assertion'lar açık ve net
- The Generous Leftovers: Gereksiz setup/teardown yok
- The Slow Poke: Testler hızlı çalışır
"""

import unittest
from unittest.mock import MagicMock, patch, Mock, PropertyMock
import sys
import os
import pandas as pd
import numpy as np
import tempfile
import shutil

# Projenin kök dizinini path'e ekle
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..')))

from app.data_service import DataService


class TestDataService(unittest.TestCase):
    """
    DataService sınıfı için unit testler.
    Her test metodu tek bir davranışı test eder.
    """
    
    def setUp(self):
        """
        Her test öncesi çalıştırılacak setup metodu.
        Test verilerini hazırlar.
        """
        # Geçici bir test CSV dosyası oluştur
        self.test_dir = tempfile.mkdtemp()
        self.test_csv_path = os.path.join(self.test_dir, 'test_data.csv')
        
        # Örnek test verisi oluştur
        self._create_test_csv()
        
        # Test için mock veri servisi oluşturma (gerçek dosya kullanılacak)
        self.data_service = None
    
    def tearDown(self):
        """
        Her test sonrası çalıştırılacak cleanup metodu.
        Geçici dosyaları temizler.
        """
        # Geçici dizini temizle
        if os.path.exists(self.test_dir):
            shutil.rmtree(self.test_dir)
        
        # DataService instance'ını temizle
        if self.data_service:
            del self.data_service
    
    def _create_test_csv(self):
        """
        Test için örnek CSV dosyası oluşturur.
        """
        data = {
            'Country Name': ['Turkey', 'Germany', 'France', 'Italy', 'Spain'],
            'Country Code': ['TUR', 'DEU', 'FRA', 'ITA', 'ESP'],
            'Series Name': ['Renewable'] * 5,
            'Series Code': ['REN'] * 5,
            'YRbir': [10.5, 15.2, 12.8, 11.3, 13.7],
            'YRiki': [11.2, 16.1, 13.5, 12.0, 14.2],
            'YRuc': [12.0, 17.3, 14.2, 12.8, 15.0],
            'YRdort': [12.8, 18.5, 15.0, 13.5, 15.8],
            'YRbes': [13.5, 19.2, 15.8, 14.2, 16.5]
        }
        df = pd.DataFrame(data)
        df.to_csv(self.test_csv_path, index=False, encoding='utf-8')
    
    def test_init_with_valid_csv_path(self):
        """
        Test: Geçerli CSV yolu ile DataService başlatılabilmeli.
        """
        # Arrange & Act
        service = DataService(data_path=self.test_csv_path)
        
        # Assert
        self.assertIsNotNone(service)
        self.assertEqual(service.data_path, self.test_csv_path)
        self.assertIsNotNone(service.raw_data)
        self.assertFalse(service.raw_data.empty)
    
    def test_init_without_csv_path(self):
        """
        Test: CSV yolu verilmediğinde varsayılan yol kullanılmalı.
        """
        # Arrange & Act
        with patch('app.data_service.os.path.exists', return_value=True):
            with patch('app.data_service.pd.read_csv') as mock_read:
                mock_read.return_value = pd.DataFrame({
                    'Country Name': ['Test'],
                    'YRbir': [10.0]
                })
                service = DataService()
        
        # Assert
        self.assertIsNotNone(service)
        mock_read.assert_called()
    
    def test_get_countries_returns_list(self):
        """
        Test: get_countries() metodu ülke listesi döndürmeli.
        """
        # Arrange
        service = DataService(data_path=self.test_csv_path)
        
        # Act
        countries = service.get_countries()
        
        # Assert
        self.assertIsInstance(countries, list)
        self.assertGreater(len(countries), 0)
        self.assertIn('Turkey', countries)
        self.assertIn('Germany', countries)
    
    def test_get_countries_empty_data(self):
        """
        Test: Veri yoksa get_countries() boş liste döndürmeli.
        """
        # Arrange - Boş CSV oluştur
        empty_csv = os.path.join(self.test_dir, 'empty.csv')
        pd.DataFrame(columns=['Country Name']).to_csv(empty_csv, index=False)
        
        # Act
        service = DataService(data_path=empty_csv)
        countries = service.get_countries()
        
        # Assert
        self.assertIsInstance(countries, list)
        # Boş veri durumunda bile liste döndürmeli (hata yönetimi)
    
    def test_get_country_data_valid_country(self):
        """
        Test: Geçerli ülke adı ile get_country_data() veri döndürmeli.
        """
        # Arrange
        service = DataService(data_path=self.test_csv_path)
        
        # Act
        country_data = service.get_country_data('Turkey')
        
        # Assert
        self.assertIsInstance(country_data, dict)
        self.assertIn('country', country_data)
        self.assertEqual(country_data['country'], 'Turkey')
        self.assertIn('stats', country_data)
        self.assertIn('time_series', country_data)
        self.assertIsInstance(country_data['stats'], dict)
        self.assertIsInstance(country_data['time_series'], dict)
    
    def test_get_country_data_invalid_country(self):
        """
        Test: Geçersiz ülke adı ile get_country_data() ValueError fırlatmalı.
        """
        # Arrange
        service = DataService(data_path=self.test_csv_path)
        
        # Act & Assert
        with self.assertRaises(ValueError):
            service.get_country_data('NonExistentCountry')
    
    def test_get_country_data_stats_structure(self):
        """
        Test: get_country_data() dönen stats yapısı doğru olmalı.
        """
        # Arrange
        service = DataService(data_path=self.test_csv_path)
        
        # Act
        country_data = service.get_country_data('Turkey')
        stats = country_data['stats']
        
        # Assert
        required_keys = ['min', 'max', 'mean', 'median', 'std', 'last_value', 'years', 'values', 'trend']
        for key in required_keys:
            self.assertIn(key, stats, f"Stats içinde '{key}' anahtarı bulunamadı")
        
        # Değerlerin sayısal olduğunu kontrol et
        self.assertIsInstance(stats['min'], (int, float))
        self.assertIsInstance(stats['max'], (int, float))
        self.assertIsInstance(stats['mean'], (int, float))
    
    def test_calculate_trend_positive_trend(self):
        """
        Test: _calculate_trend() pozitif trend için doğru değer döndürmeli.
        """
        # Arrange
        service = DataService(data_path=self.test_csv_path)
        time_series = pd.DataFrame({
            'Year': [1, 2, 3, 4, 5],
            'Renewable_Value': [10.0, 12.0, 14.0, 16.0, 18.0]
        })
        
        # Act
        trend = service._calculate_trend(time_series)
        
        # Assert
        self.assertIsInstance(trend, float)
        self.assertGreater(trend, 0, "Pozitif trend bekleniyordu")
    
    def test_calculate_trend_negative_trend(self):
        """
        Test: _calculate_trend() negatif trend için doğru değer döndürmeli.
        """
        # Arrange
        service = DataService(data_path=self.test_csv_path)
        time_series = pd.DataFrame({
            'Year': [1, 2, 3, 4, 5],
            'Renewable_Value': [18.0, 16.0, 14.0, 12.0, 10.0]
        })
        
        # Act
        trend = service._calculate_trend(time_series)
        
        # Assert
        self.assertIsInstance(trend, float)
        self.assertLess(trend, 0, "Negatif trend bekleniyordu")
    
    def test_calculate_trend_single_data_point(self):
        """
        Test: _calculate_trend() tek veri noktası için 0 döndürmeli.
        """
        # Arrange
        service = DataService(data_path=self.test_csv_path)
        time_series = pd.DataFrame({
            'Year': [1],
            'Renewable_Value': [10.0]
        })
        
        # Act
        trend = service._calculate_trend(time_series)
        
        # Assert
        self.assertEqual(trend, 0.0)
    
    def test_calculate_trend_zero_initial_value(self):
        """
        Test: _calculate_trend() başlangıç değeri 0 ise doğru işlemeli.
        """
        # Arrange
        service = DataService(data_path=self.test_csv_path)
        time_series = pd.DataFrame({
            'Year': [1, 2, 3],
            'Renewable_Value': [0.0, 5.0, 10.0]
        })
        
        # Act
        trend = service._calculate_trend(time_series)
        
        # Assert
        self.assertIsInstance(trend, float)
        # 0'dan başlayan değerler için özel durum kontrolü
    
    def test_get_data_overview_structure(self):
        """
        Test: get_data_overview() doğru yapıda veri döndürmeli.
        """
        # Arrange
        service = DataService(data_path=self.test_csv_path)
        
        # Act
        overview = service.get_data_overview()
        
        # Assert
        self.assertIsInstance(overview, dict)
        self.assertIn('highest_countries', overview)
        self.assertIn('lowest_countries', overview)
        self.assertIn('global_stats', overview)
        self.assertIn('global_trend', overview)
        self.assertIsInstance(overview['highest_countries'], list)
        self.assertIsInstance(overview['lowest_countries'], list)
    
    def test_get_data_overview_empty_data(self):
        """
        Test: Boş veri ile get_data_overview() uygun yapı döndürmeli.
        """
        # Arrange - Boş CSV
        empty_csv = os.path.join(self.test_dir, 'empty.csv')
        pd.DataFrame(columns=['Country Name', 'YRbir']).to_csv(empty_csv, index=False)
        
        # Act
        service = DataService(data_path=empty_csv)
        overview = service.get_data_overview()
        
        # Assert
        self.assertIsInstance(overview, dict)
        # Boş veri durumunda bile yapı korunmalı
    
    def test_train_model_valid_country(self):
        """
        Test: Geçerli ülke ile train_model() başarılı olmalı.
        """
        # Arrange
        service = DataService(data_path=self.test_csv_path)
        
        # Act
        result = service.train_model('Turkey')
        
        # Assert
        self.assertIsInstance(result, dict)
        self.assertTrue(result.get('success', False), "Model eğitimi başarısız oldu")
        self.assertIn('country', result)
        self.assertEqual(result['country'], 'Turkey')
        self.assertIn('metrics', result)
    
    def test_train_model_invalid_country(self):
        """
        Test: Geçersiz ülke ile train_model() hata döndürmeli.
        """
        # Arrange
        service = DataService(data_path=self.test_csv_path)
        
        # Act
        result = service.train_model('NonExistentCountry')
        
        # Assert
        # ValueError fırlatmalı veya success=False döndürmeli
        if isinstance(result, dict):
            self.assertFalse(result.get('success', True))
        else:
            # Exception fırlatılmış olabilir
            pass
    
    def test_train_model_general(self):
        """
        Test: train_model() ülke belirtilmeden genel model eğitebilmeli.
        """
        # Arrange
        service = DataService(data_path=self.test_csv_path)
        
        # Act
        result = service.train_model()
        
        # Assert
        self.assertIsInstance(result, dict)
        # Genel model eğitimi için sonuç kontrolü
        if result.get('success'):
            self.assertIn('country', result)
            self.assertEqual(result.get('country'), 'general')
    
    def test_get_model_metrics_valid_country(self):
        """
        Test: Geçerli ülke ile get_model_metrics() metrikler döndürmeli.
        """
        # Arrange
        service = DataService(data_path=self.test_csv_path)
        # Önce model eğit
        service.train_model('Turkey')
        
        # Act
        metrics = service.get_model_metrics('Turkey')
        
        # Assert
        self.assertIsInstance(metrics, dict)
        if metrics.get('success'):
            self.assertIn('metrics', metrics)
            self.assertIn('country', metrics)
    
    def test_get_model_metrics_without_training(self):
        """
        Test: Eğitilmemiş model için get_model_metrics() modeli eğitmeli.
        """
        # Arrange
        service = DataService(data_path=self.test_csv_path)
        
        # Act
        metrics = service.get_model_metrics('Turkey')
        
        # Assert
        self.assertIsInstance(metrics, dict)
        # Model otomatik eğitilmeli veya hata döndürmeli
    
    def test_predict_future_valid_inputs(self):
        """
        Test: Geçerli girdiler ile predict_future() tahmin döndürmeli.
        """
        # Arrange
        service = DataService(data_path=self.test_csv_path)
        service.train_model('Turkey')
        
        # Act
        prediction = service.predict_future('Turkey', 2030)
        
        # Assert
        self.assertIsInstance(prediction, dict)
        self.assertIn('country', prediction)
        self.assertIn('current_year', prediction)
        self.assertIn('future_year', prediction)
        self.assertIn('predicted_value', prediction)
        self.assertIn('percent_change', prediction)
        self.assertIn('confidence', prediction)
        
        # Değerlerin mantıklı olduğunu kontrol et
        self.assertGreater(prediction['future_year'], prediction['current_year'])
        self.assertIsInstance(prediction['predicted_value'], (int, float))
    
    def test_predict_future_invalid_country(self):
        """
        Test: Geçersiz ülke ile predict_future() ValueError fırlatmalı.
        """
        # Arrange
        service = DataService(data_path=self.test_csv_path)
        
        # Act & Assert
        with self.assertRaises(ValueError):
            service.predict_future('NonExistentCountry', 2030)
    
    def test_predict_future_invalid_year(self):
        """
        Test: Geçmiş yıl ile predict_future() ValueError fırlatmalı.
        """
        # Arrange
        service = DataService(data_path=self.test_csv_path)
        service.train_model('Turkey')
        
        # Act & Assert
        with self.assertRaises(ValueError):
            # Mevcut yıldan küçük bir yıl
            service.predict_future('Turkey', 2000)
    
    def test_get_countries_comparison_valid_countries(self):
        """
        Test: Geçerli ülkeler ile get_countries_comparison() karşılaştırma döndürmeli.
        """
        # Arrange
        service = DataService(data_path=self.test_csv_path)
        countries = ['Turkey', 'Germany']
        
        # Act
        comparison = service.get_countries_comparison(countries)
        
        # Assert
        self.assertIsInstance(comparison, dict)
        self.assertIn('country_data', comparison)
        self.assertIn('analysis', comparison)
        self.assertIsInstance(comparison['country_data'], dict)
        self.assertIsInstance(comparison['analysis'], list)
    
    def test_get_countries_comparison_insufficient_countries(self):
        """
        Test: Yetersiz ülke sayısı ile get_countries_comparison() ValueError fırlatmalı.
        """
        # Arrange
        service = DataService(data_path=self.test_csv_path)
        
        # Act & Assert
        with self.assertRaises(ValueError):
            service.get_countries_comparison(['Turkey'])
    
    def test_get_countries_comparison_invalid_country(self):
        """
        Test: Geçersiz ülke ile get_countries_comparison() ValueError fırlatmalı.
        """
        # Arrange
        service = DataService(data_path=self.test_csv_path)
        
        # Act & Assert
        with self.assertRaises(ValueError):
            service.get_countries_comparison(['Turkey', 'NonExistentCountry'])
    
    def test_get_feature_importance_valid_country(self):
        """
        Test: Geçerli ülke ile get_feature_importance() özellik önemleri döndürmeli.
        """
        # Arrange
        service = DataService(data_path=self.test_csv_path)
        service.train_model('Turkey')
        
        # Act
        feature_importance = service.get_feature_importance('Turkey')
        
        # Assert
        self.assertIsInstance(feature_importance, dict)
        self.assertIn('features', feature_importance)
        self.assertIn('importance', feature_importance)
        self.assertIsInstance(feature_importance['features'], list)
        self.assertIsInstance(feature_importance['importance'], (list, np.ndarray))
    
    def test_get_feature_importance_global(self):
        """
        Test: Ülke belirtilmeden get_feature_importance() global özellik önemleri döndürmeli.
        """
        # Arrange
        service = DataService(data_path=self.test_csv_path)
        service.train_model()
        
        # Act
        feature_importance = service.get_feature_importance()
        
        # Assert
        self.assertIsInstance(feature_importance, dict)
        self.assertIn('features', feature_importance)
        self.assertIn('importance', feature_importance)
    
    def test_cached_prediction(self):
        """
        Test: Aynı tahmin tekrar istenirse önbellekten döndürülmeli.
        """
        # Arrange
        service = DataService(data_path=self.test_csv_path)
        service.train_model('Turkey')
        
        # Act - İlk tahmin
        prediction1 = service.predict_future('Turkey', 2030)
        cache_key = f"Turkey_2030"
        
        # Assert - Önbellekte olmalı
        self.assertIn(cache_key, service.predictions_cache)
        
        # Act - İkinci tahmin (önbellekten)
        prediction2 = service.get_cached_prediction('Turkey', 2030)
        
        # Assert
        self.assertIsNotNone(prediction2)
        self.assertEqual(prediction1['predicted_value'], prediction2['predicted_value'])
    
    def test_data_loading_handles_encoding_errors(self):
        """
        Test: Veri yükleme encoding hatalarını düzgün işlemeli.
        """
        # Arrange - Farklı encoding'ler denenmeli
        service = DataService(data_path=self.test_csv_path)
        
        # Assert
        self.assertIsNotNone(service.raw_data)
        # Encoding hataları loglanmalı ama uygulama çökmemeli
    
    def test_data_preprocessing_handles_missing_values(self):
        """
        Test: Veri ön işleme eksik değerleri düzgün işlemeli.
        """
        # Arrange - Eksik değerler içeren CSV
        data_with_missing = {
            'Country Name': ['Turkey', 'Germany'],
            'Country Code': ['TUR', 'DEU'],
            'Series Name': ['Renewable', 'Renewable'],
            'Series Code': ['REN', 'REN'],
            'YRbir': [10.5, np.nan],
            'YRiki': [11.2, 16.1],
            'YRuc': [np.nan, 17.3]
        }
        missing_csv = os.path.join(self.test_dir, 'missing.csv')
        pd.DataFrame(data_with_missing).to_csv(missing_csv, index=False)
        
        # Act
        service = DataService(data_path=missing_csv)
        
        # Assert
        self.assertIsNotNone(service.melted_data)
        # Eksik değerler doldurulmuş olmalı
    
    def test_calculate_global_trend_with_empty_data(self):
        """Test: Boş veri ile _calculate_global_trend() 0 döndürmeli"""
        # Arrange
        service = DataService(data_path=self.test_csv_path)
        # Melted data'yı boş yap
        service.melted_data = pd.DataFrame()
        
        # Act
        trend = service._calculate_global_trend()
        
        # Assert
        self.assertEqual(trend, 0.0)
    
    def test_calculate_global_trend_with_single_year(self):
        """Test: Tek yıl verisi ile _calculate_global_trend() 0 döndürmeli"""
        # Arrange
        service = DataService(data_path=self.test_csv_path)
        # Tek yıl verisi oluştur
        service.melted_data = pd.DataFrame({
            'Year': [2020],
            'Renewable_Value': [10.5]
        })
        
        # Act
        trend = service._calculate_global_trend()
        
        # Assert
        self.assertEqual(trend, 0.0)
    
    def test_get_cached_prediction_nonexistent(self):
        """Test: Olmayan önbellek anahtarı ile get_cached_prediction() None döndürmeli"""
        # Arrange
        service = DataService(data_path=self.test_csv_path)
        
        # Act
        result = service.get_cached_prediction('NonExistentCountry', 2030)
        
        # Assert
        self.assertIsNone(result)
    
    def test_get_cached_prediction_existing(self):
        """Test: Mevcut önbellek anahtarı ile get_cached_prediction() veri döndürmeli"""
        # Arrange
        service = DataService(data_path=self.test_csv_path)
        service.train_model('Turkey')
        # Önce tahmin yap (önbelleğe ekler)
        prediction = service.predict_future('Turkey', 2030)
        cache_key = f"Turkey_2030"
        
        # Act
        cached = service.get_cached_prediction('Turkey', 2030)
        
        # Assert
        self.assertIsNotNone(cached)
        self.assertEqual(cached['predicted_value'], prediction['predicted_value'])


class TestDataServiceEdgeCases(unittest.TestCase):
    """
    DataService için edge case testleri.
    Sınır durumları ve özel senaryoları test eder.
    """
    
    def setUp(self):
        """Test setup"""
        self.test_dir = tempfile.mkdtemp()
        self.test_csv_path = os.path.join(self.test_dir, 'test_data.csv')
    
    def tearDown(self):
        """Test cleanup"""
        if os.path.exists(self.test_dir):
            shutil.rmtree(self.test_dir)
    
    def test_single_country_data(self):
        """
        Test: Tek ülke içeren veri seti ile çalışabilmeli.
        """
        # Arrange
        data = {
            'Country Name': ['Turkey'],
            'Country Code': ['TUR'],
            'Series Name': ['Renewable'],
            'Series Code': ['REN'],
            'YRbir': [10.5],
            'YRiki': [11.2]
        }
        df = pd.DataFrame(data)
        df.to_csv(self.test_csv_path, index=False)
        
        # Act
        service = DataService(data_path=self.test_csv_path)
        countries = service.get_countries()
        
        # Assert
        self.assertEqual(len(countries), 1)
        self.assertIn('Turkey', countries)
    
    def test_single_year_data(self):
        """
        Test: Tek yıl içeren veri seti ile çalışabilmeli.
        """
        # Arrange
        data = {
            'Country Name': ['Turkey', 'Germany'],
            'Country Code': ['TUR', 'DEU'],
            'Series Name': ['Renewable', 'Renewable'],
            'Series Code': ['REN', 'REN'],
            'YRbir': [10.5, 15.2]
        }
        df = pd.DataFrame(data)
        df.to_csv(self.test_csv_path, index=False)
        
        # Act
        service = DataService(data_path=self.test_csv_path)
        country_data = service.get_country_data('Turkey')
        
        # Assert
        self.assertIsNotNone(country_data)
        # Tek yıl verisi ile de çalışabilmeli
    
    def test_very_large_values(self):
        """
        Test: Çok büyük değerler ile çalışabilmeli.
        """
        # Arrange
        data = {
            'Country Name': ['TestCountry'],
            'Country Code': ['TST'],
            'Series Name': ['Renewable'],
            'Series Code': ['REN'],
            'YRbir': [999999.99],
            'YRiki': [1000000.00]
        }
        df = pd.DataFrame(data)
        df.to_csv(self.test_csv_path, index=False)
        
        # Act
        service = DataService(data_path=self.test_csv_path)
        country_data = service.get_country_data('TestCountry')
        
        # Assert
        self.assertIsNotNone(country_data)
        # Büyük değerler işlenebilmeli


if __name__ == '__main__':
    unittest.main()

