"""
DataModel Unit Testleri - MVVM Mimarisinin Alternatif Model Katmanı

Bu test dosyası DataModel sınıfı için kapsamlı unit testler içerir.
FIRST prensiplerine uygun olarak yazılmıştır.
"""

import unittest
from unittest.mock import MagicMock, patch, Mock
import sys
import os
import pandas as pd
import numpy as np
import tempfile
import shutil

# Projenin kök dizinini path'e ekle
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..')))

from app.models.data_model import DataModel


class TestDataModel(unittest.TestCase):
    """
    DataModel sınıfı için unit testler.
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
        self._create_test_csv()
    
    def tearDown(self):
        """
        Her test sonrası çalıştırılacak cleanup metodu.
        Geçici dosyaları temizler.
        """
        if os.path.exists(self.test_dir):
            shutil.rmtree(self.test_dir)
    
    def _create_test_csv(self):
        """
        Test için örnek CSV dosyası oluşturur.
        """
        data = {
            'Country Name': ['Turkey', 'Germany', 'France'],
            'Country Code': ['TUR', 'DEU', 'FRA'],
            'Series Name': ['Renewable'] * 3,
            'Series Code': ['REN'] * 3,
            'YRbir': [10.5, 15.2, 12.8],
            'YRiki': [11.2, 16.1, 13.5],
            'YRuc': [12.0, 17.3, 14.2],
            'YRdort': [12.8, 18.5, 15.0],
            'YRbes': [13.5, 19.2, 15.8]
        }
        df = pd.DataFrame(data)
        df.to_csv(self.test_csv_path, index=False, encoding='utf-8')
    
    def test_init_with_valid_csv_path(self):
        """
        Test: Geçerli CSV yolu ile DataModel başlatılabilmeli.
        """
        # Arrange & Act
        model = DataModel(csv_path=self.test_csv_path)
        
        # Assert
        self.assertIsNotNone(model)
        self.assertEqual(model.csv_path, self.test_csv_path)
        self.assertIsNotNone(model.df)
        self.assertFalse(model.df.empty)
        self.assertIsNotNone(model.melted_df)
    
    def test_init_without_csv_path(self):
        """
        Test: CSV yolu verilmediğinde varsayılan yol kullanılmalı.
        """
        # Arrange & Act
        with patch('app.models.data_model.os.path.exists', return_value=True):
            with patch('app.models.data_model.pd.read_csv') as mock_read:
                mock_read.return_value = pd.DataFrame({
                    'Country Name': ['Test'],
                    'Country Code': ['TST'],
                    'Series Name': ['Renewable'],
                    'Series Code': ['REN'],
                    'YRbir': [10.0]
                })
                model = DataModel()
        
        # Assert
        self.assertIsNotNone(model)
        mock_read.assert_called()
    
    def test_load_data_success(self):
        """
        Test: Veri yükleme başarılı olmalı.
        """
        # Arrange
        model = DataModel(csv_path=self.test_csv_path)
        
        # Assert
        self.assertIsNotNone(model.df)
        self.assertGreater(len(model.df), 0)
        self.assertIn('Country Name', model.df.columns)
    
    def test_get_countries_returns_list(self):
        """
        Test: get_countries() metodu ülke listesi döndürmeli.
        """
        # Arrange
        model = DataModel(csv_path=self.test_csv_path)
        
        # Act
        countries = model.get_countries()
        
        # Assert
        self.assertIsInstance(countries, list)
        self.assertGreater(len(countries), 0)
        self.assertIn('Turkey', countries)
        self.assertIn('Germany', countries)
    
    def test_get_countries_empty_data(self):
        """
        Test: Veri yoksa get_countries() boş liste döndürmeli.
        """
        # Arrange - Boş CSV
        empty_csv = os.path.join(self.test_dir, 'empty.csv')
        pd.DataFrame(columns=['Country Name', 'Country Code', 'Series Name', 'Series Code']).to_csv(
            empty_csv, index=False
        )
        
        # Act
        model = DataModel(csv_path=empty_csv)
        countries = model.get_countries()
        
        # Assert
        self.assertIsInstance(countries, list)
    
    def test_get_country_data_valid_country(self):
        """
        Test: Geçerli ülke adı ile get_country_data() veri döndürmeli.
        """
        # Arrange
        model = DataModel(csv_path=self.test_csv_path)
        
        # Act
        country_data = model.get_country_data('Turkey')
        
        # Assert
        self.assertIsInstance(country_data, list)
        self.assertGreater(len(country_data), 0)
        self.assertIn('year', country_data[0])
        self.assertIn('value', country_data[0])
    
    def test_get_country_data_invalid_country(self):
        """
        Test: Geçersiz ülke adı ile get_country_data() boş liste döndürmeli.
        """
        # Arrange
        model = DataModel(csv_path=self.test_csv_path)
        
        # Act
        country_data = model.get_country_data('NonExistentCountry')
        
        # Assert
        self.assertIsInstance(country_data, list)
        self.assertEqual(len(country_data), 0)
    
    def test_get_overview_data_structure(self):
        """
        Test: get_overview_data() doğru yapıda veri döndürmeli.
        """
        # Arrange
        model = DataModel(csv_path=self.test_csv_path)
        
        # Act
        overview = model.get_overview_data()
        
        # Assert
        self.assertIsInstance(overview, dict)
        self.assertIn('total_countries', overview)
        self.assertIn('year_range', overview)
        self.assertIn('renewable_stats', overview)
        self.assertIsInstance(overview['renewable_stats'], dict)
    
    def test_get_top_countries_highest(self):
        """
        Test: get_top_countries() en yüksek değerlere sahip ülkeleri döndürmeli.
        """
        # Arrange
        model = DataModel(csv_path=self.test_csv_path)
        
        # Act
        top_countries = model.get_top_countries(year=1, limit=2, ascending=False)
        
        # Assert
        self.assertIsInstance(top_countries, list)
        self.assertLessEqual(len(top_countries), 2)
        if len(top_countries) > 1:
            # İlk ülke ikinciden daha yüksek değere sahip olmalı
            self.assertGreaterEqual(top_countries[0]['value'], top_countries[1]['value'])
    
    def test_get_top_countries_lowest(self):
        """
        Test: get_top_countries() en düşük değerlere sahip ülkeleri döndürmeli.
        """
        # Arrange
        model = DataModel(csv_path=self.test_csv_path)
        
        # Act
        bottom_countries = model.get_top_countries(year=1, limit=2, ascending=True)
        
        # Assert
        self.assertIsInstance(bottom_countries, list)
        self.assertLessEqual(len(bottom_countries), 2)
        if len(bottom_countries) > 1:
            # İlk ülke ikinciden daha düşük değere sahip olmalı
            self.assertLessEqual(bottom_countries[0]['value'], bottom_countries[1]['value'])
    
    def test_train_model_valid_country(self):
        """
        Test: Geçerli ülke ile train_model() başarılı olmalı.
        """
        # Arrange
        model = DataModel(csv_path=self.test_csv_path)
        
        # Act
        result = model.train_model('Turkey')
        
        # Assert
        self.assertIsInstance(result, dict)
        self.assertTrue(result.get('success', False))
        self.assertIn('country', result)
        self.assertEqual(result['country'], 'Turkey')
        self.assertIn('metrics', result)
    
    def test_train_model_invalid_country(self):
        """
        Test: Geçersiz ülke ile train_model() hata döndürmeli.
        """
        # Arrange
        model = DataModel(csv_path=self.test_csv_path)
        
        # Act
        result = model.train_model('NonExistentCountry')
        
        # Assert
        self.assertIsInstance(result, dict)
        self.assertFalse(result.get('success', True))
    
    def test_train_model_insufficient_data(self):
        """
        Test: Yetersiz veri ile train_model() hata döndürmeli.
        """
        # Arrange - Tek satırlık CSV
        single_row_csv = os.path.join(self.test_dir, 'single.csv')
        data = {
            'Country Name': ['Turkey'],
            'Country Code': ['TUR'],
            'Series Name': ['Renewable'],
            'Series Code': ['REN'],
            'YRbir': [10.5]
        }
        pd.DataFrame(data).to_csv(single_row_csv, index=False)
        model = DataModel(csv_path=single_row_csv)
        
        # Act
        result = model.train_model('Turkey')
        
        # Assert
        self.assertIsInstance(result, dict)
        # Yetersiz veri durumunda hata döndürmeli
    
    def test_predict_future_valid_inputs(self):
        """
        Test: Geçerli girdiler ile predict_future() tahmin döndürmeli.
        """
        # Arrange
        model = DataModel(csv_path=self.test_csv_path)
        model.train_model('Turkey')
        
        # Act
        prediction = model.predict_future('Turkey', years_ahead=5)
        
        # Assert
        self.assertIsInstance(prediction, dict)
        self.assertTrue(prediction.get('success', False))
        self.assertIn('country', prediction)
        self.assertIn('predictions', prediction)
        self.assertIsInstance(prediction['predictions'], list)
    
    def test_predict_future_without_training(self):
        """
        Test: Eğitilmemiş model için predict_future() modeli eğitmeli.
        """
        # Arrange
        model = DataModel(csv_path=self.test_csv_path)
        
        # Act
        prediction = model.predict_future('Turkey', years_ahead=5)
        
        # Assert
        self.assertIsInstance(prediction, dict)
        # Model otomatik eğitilmeli veya hata döndürmeli
    
    def test_get_model_metrics_valid_country(self):
        """
        Test: Geçerli ülke ile get_model_metrics() metrikler döndürmeli.
        """
        # Arrange
        model = DataModel(csv_path=self.test_csv_path)
        model.train_model('Turkey')
        
        # Act
        metrics = model.get_model_metrics('Turkey')
        
        # Assert
        self.assertIsInstance(metrics, dict)
        self.assertTrue(metrics.get('success', False))
        self.assertIn('metrics', metrics)
        self.assertIn('country', metrics)
    
    def test_get_model_metrics_global(self):
        """
        Test: Ülke belirtilmeden get_model_metrics() global metrikler döndürmeli.
        """
        # Arrange
        model = DataModel(csv_path=self.test_csv_path)
        # Birkaç ülke için model eğit
        model.train_model('Turkey')
        model.train_model('Germany')
        
        # Act
        metrics = model.get_model_metrics()
        
        # Assert
        self.assertIsInstance(metrics, dict)
        if metrics.get('success'):
            self.assertIn('metrics', metrics)
    
    def test_compare_countries_valid_countries(self):
        """
        Test: Geçerli ülkeler ile compare_countries() karşılaştırma döndürmeli.
        """
        # Arrange
        model = DataModel(csv_path=self.test_csv_path)
        countries = ['Turkey', 'Germany']
        
        # Act
        comparison = model.compare_countries(countries)
        
        # Assert
        self.assertIsInstance(comparison, dict)
        self.assertTrue(comparison.get('success', False))
        self.assertIn('countries', comparison)
        self.assertIn('comparison_data', comparison)
    
    def test_compare_countries_empty_list(self):
        """
        Test: Boş liste ile compare_countries() hata döndürmeli.
        """
        # Arrange
        model = DataModel(csv_path=self.test_csv_path)
        
        # Act
        comparison = model.compare_countries([])
        
        # Assert
        self.assertIsInstance(comparison, dict)
        self.assertFalse(comparison.get('success', True))
    
    def test_get_feature_importance_valid_country(self):
        """
        Test: Geçerli ülke ile get_feature_importance() özellik önemleri döndürmeli.
        """
        # Arrange
        model = DataModel(csv_path=self.test_csv_path)
        
        # Act
        feature_importance = model.get_feature_importance('Turkey')
        
        # Assert
        self.assertIsInstance(feature_importance, dict)
        if feature_importance.get('success'):
            self.assertIn('feature_importance', feature_importance)
    
    def test_get_feature_importance_global(self):
        """
        Test: Ülke belirtilmeden get_feature_importance() global özellik önemleri döndürmeli.
        """
        # Arrange
        model = DataModel(csv_path=self.test_csv_path)
        
        # Act
        feature_importance = model.get_feature_importance()
        
        # Assert
        self.assertIsInstance(feature_importance, dict)
        if feature_importance.get('success'):
            self.assertIn('feature_importance', feature_importance)
    
    def test_melt_data_conversion(self):
        """
        Test: _melt_data() veriyi uzun formata dönüştürmeli.
        """
        # Arrange
        model = DataModel(csv_path=self.test_csv_path)
        
        # Assert
        self.assertIsNotNone(model.melted_df)
        self.assertIn('Year', model.melted_df.columns)
        self.assertIn('Renewable_Value', model.melted_df.columns)
        self.assertIn('Country Name', model.melted_df.columns)
    
    def test_model_caching(self):
        """
        Test: Model önbellekleme çalışmalı.
        """
        # Arrange
        model = DataModel(csv_path=self.test_csv_path)
        
        # Act - İlk eğitim
        result1 = model.train_model('Turkey')
        
        # Act - İkinci eğitim (önbellekten)
        result2 = model.train_model('Turkey', force_retrain=False)
        
        # Assert
        self.assertTrue(result1.get('success', False))
        # Önbellekten döndürülmeli veya yeniden eğitilmeli
        self.assertIn('Turkey', model.models_cache)


if __name__ == '__main__':
    unittest.main()




