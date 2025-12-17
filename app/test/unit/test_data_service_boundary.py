"""
DataService Boundary Value ve Negative Test Cases

Bu dosya sınır değerleri ve negatif test senaryolarını içerir.
FIRST prensiplerine uygun olarak yazılmıştır.
"""

import unittest
from unittest.mock import patch, MagicMock
import sys
import os
import pandas as pd
import numpy as np
import tempfile
import shutil

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..')))

from app.data_service import DataService


class TestDataServiceBoundaryValues(unittest.TestCase):
    """
    Boundary value testleri - sınır değerleri test eder.
    """
    
    def setUp(self):
        """Test setup"""
        self.test_dir = tempfile.mkdtemp()
        self.test_csv_path = os.path.join(self.test_dir, 'test_data.csv')
    
    def tearDown(self):
        """Test cleanup"""
        if os.path.exists(self.test_dir):
            shutil.rmtree(self.test_dir)
    
    def test_predict_future_with_max_year(self):
        """Test: Maksimum yıl değeri ile tahmin yapılabilmeli"""
        # Arrange
        data = {
            'Country Name': ['Turkey'],
            'Country Code': ['TUR'],
            'Series Name': ['Renewable'],
            'Series Code': ['REN'],
            'YRbir': [10.5],
            'YRiki': [11.2],
            'YRuc': [12.0]
        }
        df = pd.DataFrame(data)
        df.to_csv(self.test_csv_path, index=False)
        service = DataService(data_path=self.test_csv_path)
        service.train_model('Turkey')
        
        # Act - Çok uzak gelecek yılı
        max_year = 2100
        result = service.predict_future('Turkey', max_year)
        
        # Assert
        self.assertIsInstance(result, dict)
        self.assertIn('predicted_value', result)
        # Tahmin değeri mantıklı olmalı (negatif olmamalı)
        self.assertGreaterEqual(result['predicted_value'], 0)
    
    def test_predict_future_with_min_year(self):
        """Test: Minimum geçerli yıl ile tahmin yapılabilmeli"""
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
        service = DataService(data_path=self.test_csv_path)
        service.train_model('Turkey')
        
        # Act - Mevcut yıldan sadece 1 yıl ileri
        current_max_year = int(service.melted_data['Year'].max())
        min_future_year = current_max_year + 1
        
        result = service.predict_future('Turkey', min_future_year)
        
        # Assert
        self.assertIsInstance(result, dict)
        self.assertEqual(result['future_year'], min_future_year)
    
    def test_get_country_data_with_single_data_point(self):
        """Test: Tek veri noktası olan ülke için veri döndürmeli"""
        # Arrange
        data = {
            'Country Name': ['SingleCountry'],
            'Country Code': ['SGL'],
            'Series Name': ['Renewable'],
            'Series Code': ['REN'],
            'YRbir': [10.5]
        }
        df = pd.DataFrame(data)
        df.to_csv(self.test_csv_path, index=False)
        service = DataService(data_path=self.test_csv_path)
        
        # Act
        country_data = service.get_country_data('SingleCountry')
        
        # Assert
        self.assertIsNotNone(country_data)
        self.assertEqual(country_data['country'], 'SingleCountry')
        # Tek veri noktası ile de çalışabilmeli
        self.assertIn('stats', country_data)
    
    def test_get_country_data_with_max_countries(self):
        """Test: Çok sayıda ülke içeren veri seti ile çalışabilmeli"""
        # Arrange - 100 ülke oluştur
        countries = [f'Country{i}' for i in range(100)]
        data = {
            'Country Name': countries,
            'Country Code': [f'C{i}' for i in range(100)],
            'Series Name': ['Renewable'] * 100,
            'Series Code': ['REN'] * 100,
            'YRbir': [10.0 + i * 0.1 for i in range(100)],
            'YRiki': [11.0 + i * 0.1 for i in range(100)]
        }
        df = pd.DataFrame(data)
        df.to_csv(self.test_csv_path, index=False)
        service = DataService(data_path=self.test_csv_path)
        
        # Act
        countries_list = service.get_countries()
        
        # Assert
        self.assertEqual(len(countries_list), 100)
        self.assertIn('Country0', countries_list)
        self.assertIn('Country99', countries_list)
    
    def test_train_model_with_minimum_data(self):
        """Test: Minimum veri ile model eğitilebilmeli"""
        # Arrange - Sadece 5 veri noktası (minimum)
        data = {
            'Country Name': ['Turkey'] * 5,
            'Country Code': ['TUR'] * 5,
            'Series Name': ['Renewable'] * 5,
            'Series Code': ['REN'] * 5,
            'YRbir': [10.5],
            'YRiki': [11.2],
            'YRuc': [12.0],
            'YRdort': [12.8],
            'YRbes': [13.5]
        }
        # Melt işlemi için düzgün format
        melted_data = []
        for i, year_col in enumerate(['YRbir', 'YRiki', 'YRuc', 'YRdort', 'YRbes']):
            melted_data.append({
                'Country Name': 'Turkey',
                'Country Code': 'TUR',
                'Series Name': 'Renewable',
                'Series Code': 'REN',
                'YR_label': year_col,
                'Renewable_Value': 10.5 + i * 0.7
            })
        
        # Bu test için basit bir yaklaşım
        df = pd.DataFrame(data)
        df.to_csv(self.test_csv_path, index=False)
        service = DataService(data_path=self.test_csv_path)
        
        # Act
        result = service.train_model('Turkey')
        
        # Assert
        # Minimum veri ile de model eğitilebilmeli (basit model)
        self.assertIsInstance(result, dict)


class TestDataServiceNegativeCases(unittest.TestCase):
    """
    Negative test cases - geçersiz girdiler ve hata senaryoları.
    """
    
    def setUp(self):
        """Test setup"""
        self.test_dir = tempfile.mkdtemp()
        self.test_csv_path = os.path.join(self.test_dir, 'test_data.csv')
        self._create_valid_csv()
        self.service = DataService(data_path=self.test_csv_path)
    
    def tearDown(self):
        """Test cleanup"""
        if os.path.exists(self.test_dir):
            shutil.rmtree(self.test_dir)
    
    def _create_valid_csv(self):
        """Geçerli test CSV oluştur"""
        data = {
            'Country Name': ['Turkey', 'Germany'],
            'Country Code': ['TUR', 'DEU'],
            'Series Name': ['Renewable', 'Renewable'],
            'Series Code': ['REN', 'REN'],
            'YRbir': [10.5, 15.2],
            'YRiki': [11.2, 16.1]
        }
        df = pd.DataFrame(data)
        df.to_csv(self.test_csv_path, index=False)
    
    def test_get_country_data_with_empty_string(self):
        """Test: Boş string ile get_country_data() ValueError fırlatmalı"""
        # Act & Assert
        with self.assertRaises(ValueError):
            self.service.get_country_data('')
    
    def test_get_country_data_with_none(self):
        """Test: None değeri ile get_country_data() TypeError fırlatmalı"""
        # Act & Assert
        with self.assertRaises((ValueError, TypeError)):
            self.service.get_country_data(None)
    
    def test_get_country_data_with_whitespace(self):
        """Test: Sadece boşluk içeren string ile hata döndürmeli"""
        # Act & Assert
        with self.assertRaises(ValueError):
            self.service.get_country_data('   ')
    
    def test_predict_future_with_negative_year(self):
        """Test: Negatif yıl ile predict_future() ValueError fırlatmalı"""
        # Arrange
        self.service.train_model('Turkey')
        
        # Act & Assert
        with self.assertRaises((ValueError, TypeError)):
            self.service.predict_future('Turkey', -2020)
    
    def test_predict_future_with_zero_year(self):
        """Test: Sıfır yıl ile predict_future() ValueError fırlatmalı"""
        # Arrange
        self.service.train_model('Turkey')
        
        # Act & Assert
        with self.assertRaises(ValueError):
            self.service.predict_future('Turkey', 0)
    
    def test_predict_future_with_string_year(self):
        """Test: String yıl ile predict_future() TypeError fırlatmalı"""
        # Arrange
        self.service.train_model('Turkey')
        
        # Act & Assert
        with self.assertRaises((ValueError, TypeError)):
            self.service.predict_future('Turkey', '2030')
    
    def test_predict_future_with_past_year(self):
        """Test: Geçmiş yıl ile predict_future() ValueError fırlatmalı"""
        # Arrange
        self.service.train_model('Turkey')
        current_max_year = int(self.service.melted_data['Year'].max())
        past_year = current_max_year - 1
        
        # Act & Assert
        with self.assertRaises(ValueError):
            self.service.predict_future('Turkey', past_year)
    
    def test_get_countries_comparison_with_empty_list(self):
        """Test: Boş liste ile get_countries_comparison() ValueError fırlatmalı"""
        # Act & Assert
        with self.assertRaises(ValueError):
            self.service.get_countries_comparison([])
    
    def test_get_countries_comparison_with_single_country(self):
        """Test: Tek ülke ile get_countries_comparison() ValueError fırlatmalı"""
        # Act & Assert
        with self.assertRaises(ValueError):
            self.service.get_countries_comparison(['Turkey'])
    
    def test_get_countries_comparison_with_duplicate_countries(self):
        """Test: Tekrarlanan ülkeler ile get_countries_comparison() çalışabilmeli"""
        # Act
        result = self.service.get_countries_comparison(['Turkey', 'Turkey', 'Germany'])
        
        # Assert
        # Tekrarlanan ülkeler filtrelenmeli veya işlenebilmeli
        self.assertIsInstance(result, dict)
    
    def test_train_model_with_empty_string_country(self):
        """Test: Boş string ülke adı ile train_model() hata döndürmeli"""
        # Act
        result = self.service.train_model('')
        
        # Assert
        # Hata döndürmeli veya ValueError fırlatmalı
        if isinstance(result, dict):
            self.assertFalse(result.get('success', True))
        else:
            # Exception fırlatılmış olabilir
            pass
    
    def test_get_model_metrics_with_invalid_country(self):
        """Test: Geçersiz ülke ile get_model_metrics() hata döndürmeli"""
        # Act
        result = self.service.get_model_metrics('NonExistentCountry')
        
        # Assert
        # Model eğitilmeye çalışılır ama başarısız olur
        self.assertIsInstance(result, dict)
    
    def test_get_feature_importance_with_invalid_country(self):
        """Test: Geçersiz ülke ile get_feature_importance() varsayılan değerler döndürmeli"""
        # Act
        result = self.service.get_feature_importance('NonExistentCountry')
        
        # Assert
        # Varsayılan değerler veya hata döndürmeli
        self.assertIsInstance(result, dict)
        # Hata durumunda bile yapı korunmalı


class TestDataServiceDataValidation(unittest.TestCase):
    """
    Veri doğrulama testleri - geçersiz veri formatları.
    """
    
    def setUp(self):
        """Test setup"""
        self.test_dir = tempfile.mkdtemp()
        self.test_csv_path = os.path.join(self.test_dir, 'test_data.csv')
    
    def tearDown(self):
        """Test cleanup"""
        if os.path.exists(self.test_dir):
            shutil.rmtree(self.test_dir)
    
    def test_load_data_with_missing_country_column(self):
        """Test: Country Name sütunu eksik CSV ile çalışabilmeli"""
        # Arrange
        data = {
            'Country Code': ['TUR', 'DEU'],
            'Series Name': ['Renewable', 'Renewable'],
            'YRbir': [10.5, 15.2]
        }
        df = pd.DataFrame(data)
        df.to_csv(self.test_csv_path, index=False)
        
        # Act
        service = DataService(data_path=self.test_csv_path)
        
        # Assert
        # Country Name sütunu bulunamazsa alternatif yollar denenmeli
        self.assertIsNotNone(service)
    
    def test_load_data_with_all_nan_values(self):
        """Test: Tüm değerler NaN olan CSV ile çalışabilmeli"""
        # Arrange
        data = {
            'Country Name': ['Turkey', 'Germany'],
            'Country Code': ['TUR', 'DEU'],
            'Series Name': ['Renewable', 'Renewable'],
            'Series Code': ['REN', 'REN'],
            'YRbir': [np.nan, np.nan],
            'YRiki': [np.nan, np.nan]
        }
        df = pd.DataFrame(data)
        df.to_csv(self.test_csv_path, index=False)
        
        # Act
        service = DataService(data_path=self.test_csv_path)
        
        # Assert
        # NaN değerler işlenebilmeli
        self.assertIsNotNone(service)
    
    def test_load_data_with_negative_values(self):
        """Test: Negatif değerler içeren CSV ile çalışabilmeli"""
        # Arrange
        data = {
            'Country Name': ['Turkey'],
            'Country Code': ['TUR'],
            'Series Name': ['Renewable'],
            'Series Code': ['REN'],
            'YRbir': [-10.5],  # Negatif değer
            'YRiki': [11.2]
        }
        df = pd.DataFrame(data)
        df.to_csv(self.test_csv_path, index=False)
        
        # Act
        service = DataService(data_path=self.test_csv_path)
        
        # Assert
        # Negatif değerler NaN'a dönüştürülmeli veya işlenebilmeli
        self.assertIsNotNone(service)
    
    def test_load_data_with_very_large_numbers(self):
        """Test: Çok büyük sayılar içeren CSV ile çalışabilmeli"""
        # Arrange
        data = {
            'Country Name': ['Turkey'],
            'Country Code': ['TUR'],
            'Series Name': ['Renewable'],
            'Series Code': ['REN'],
            'YRbir': [1e10],  # Çok büyük sayı
            'YRiki': [1e10 + 1000]
        }
        df = pd.DataFrame(data)
        df.to_csv(self.test_csv_path, index=False)
        
        # Act
        service = DataService(data_path=self.test_csv_path)
        
        # Assert
        self.assertIsNotNone(service)
        # Büyük sayılar işlenebilmeli
    
    def test_load_data_with_special_characters_in_country_name(self):
        """Test: Özel karakterler içeren ülke adları ile çalışabilmeli"""
        # Arrange
        data = {
            'Country Name': ['Côte d\'Ivoire', 'São Tomé'],
            'Country Code': ['CIV', 'STP'],
            'Series Name': ['Renewable', 'Renewable'],
            'Series Code': ['REN', 'REN'],
            'YRbir': [10.5, 12.3],
            'YRiki': [11.2, 13.1]
        }
        df = pd.DataFrame(data)
        df.to_csv(self.test_csv_path, index=False, encoding='utf-8')
        
        # Act
        service = DataService(data_path=self.test_csv_path)
        countries = service.get_countries()
        
        # Assert
        # Özel karakterler korunmalı
        self.assertIn('Côte d\'Ivoire', countries)
        self.assertIn('São Tomé', countries)


if __name__ == '__main__':
    unittest.main()




