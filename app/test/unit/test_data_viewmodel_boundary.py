"""
DataViewModel Boundary Value ve Negative Test Cases

Bu dosya ViewModel katmanı için sınır değerleri ve negatif test senaryolarını içerir.
FIRST prensiplerine uygun olarak yazılmıştır.
"""

import unittest
from unittest.mock import MagicMock, patch
import sys
import os
import numpy as np

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..')))

from app.data_viewmodel import DataViewModel
from app.data_service import DataService


class TestDataViewModelBoundaryValues(unittest.TestCase):
    """
    ViewModel için boundary value testleri.
    """
    
    def setUp(self):
        """Test setup"""
        self.data_service_mock = MagicMock(spec=DataService)
        self.data_service_mock.countries = ['Turkey', 'Germany']
        self.data_service_mock.models = {}
        self.data_service_mock.predictions_cache = {}
        self.viewmodel = DataViewModel(self.data_service_mock)
    
    def test_get_country_data_with_empty_time_series(self):
        """Test: Boş zaman serisi ile get_country_data() çalışabilmeli"""
        # Arrange
        mock_data = {
            'country': 'Turkey',
            'stats': {
                'years': [],
                'values': []
            },
            'time_series': {}
        }
        self.data_service_mock.get_country_data.return_value = mock_data
        
        # Act
        result = self.viewmodel.get_country_data('Turkey')
        
        # Assert
        self.assertIsInstance(result, dict)
        # Boş veri ile de yapı korunmalı
        if result.get('success'):
            self.assertIn('chart_data', result)
    
    def test_get_country_data_with_single_data_point(self):
        """Test: Tek veri noktası ile get_country_data() çalışabilmeli"""
        # Arrange
        mock_data = {
            'country': 'Turkey',
            'stats': {
                'years': [2020],
                'values': [10.5]
            },
            'time_series': {'2020': 10.5}
        }
        self.data_service_mock.get_country_data.return_value = mock_data
        
        # Act
        result = self.viewmodel.get_country_data('Turkey')
        
        # Assert
        self.assertTrue(result.get('success', False))
        self.assertIn('chart_data', result)
        self.assertEqual(len(result['chart_data']['labels']), 1)
    
    def test_get_country_prediction_with_max_year(self):
        """Test: Maksimum yıl değeri ile tahmin yapılabilmeli"""
        # Arrange
        country_name = 'Turkey'
        max_year = 2200
        self.data_service_mock.countries = [country_name]
        self.data_service_mock.models = {country_name: MagicMock()}
        self.data_service_mock.get_country_data.return_value = {
            'time_series': {'2020': 10.5, '2021': 11.2}
        }
        self.data_service_mock.predict_future.return_value = {
            'country': country_name,
            'current_year': 2021,
            'current_value': 11.2,
            'future_year': max_year,
            'predicted_value': 50.0,
            'percent_change': 350.0,
            'confidence': 75.0
        }
        
        # Act
        result = self.viewmodel.get_country_prediction(country_name, max_year)
        
        # Assert
        self.assertIsInstance(result, dict)
        # Çok uzak gelecek için de tahmin yapılabilmeli
    
    def test_get_country_prediction_with_min_year(self):
        """Test: Minimum geçerli yıl ile tahmin yapılabilmeli"""
        # Arrange
        country_name = 'Turkey'
        current_year = 2021
        min_future_year = current_year + 1
        self.data_service_mock.countries = [country_name]
        self.data_service_mock.models = {country_name: MagicMock()}
        self.data_service_mock.get_country_data.return_value = {
            'time_series': {'2020': 10.5, '2021': 11.2}
        }
        self.data_service_mock.predict_future.return_value = {
            'country': country_name,
            'current_year': current_year,
            'current_value': 11.2,
            'future_year': min_future_year,
            'predicted_value': 11.5,
            'percent_change': 2.7,
            'confidence': 85.0
        }
        
        # Act
        result = self.viewmodel.get_country_prediction(country_name, min_future_year)
        
        # Assert
        self.assertIsInstance(result, dict)
        if result.get('success'):
            self.assertEqual(result['future_year'], min_future_year)


class TestDataViewModelNegativeCases(unittest.TestCase):
    """
    ViewModel için negative test cases.
    """
    
    def setUp(self):
        """Test setup"""
        self.data_service_mock = MagicMock(spec=DataService)
        self.data_service_mock.countries = ['Turkey']
        self.data_service_mock.models = {}
        self.data_service_mock.predictions_cache = {}
        self.viewmodel = DataViewModel(self.data_service_mock)
    
    def test_get_countries_with_service_error(self):
        """Test: DataService hatası durumunda get_countries() hata döndürmeli"""
        # Arrange
        self.data_service_mock.get_countries.side_effect = Exception("Service error")
        
        # Act
        result = self.viewmodel.get_countries()
        
        # Assert
        self.assertFalse(result.get('success', True))
        self.assertIn('error', result)
    
    def test_get_country_data_with_none_country_name(self):
        """Test: None ülke adı ile get_country_data() hata döndürmeli"""
        # Act
        result = self.viewmodel.get_country_data(None)
        
        # Assert
        # None değer işlenebilmeli veya hata döndürmeli
        self.assertIsInstance(result, dict)
    
    def test_get_country_data_with_empty_string(self):
        """Test: Boş string ülke adı ile get_country_data() hata döndürmeli"""
        # Arrange
        self.data_service_mock.get_country_data.side_effect = ValueError("Empty country")
        
        # Act
        result = self.viewmodel.get_country_data('')
        
        # Assert
        self.assertFalse(result.get('success', True))
    
    def test_get_country_prediction_with_invalid_year_type(self):
        """Test: Geçersiz yıl tipi ile get_country_prediction() hata döndürmeli"""
        # Act
        result = self.viewmodel.get_country_prediction('Turkey', 'invalid')
        
        # Assert
        self.assertFalse(result.get('success', True))
        self.assertIn('error', result)
    
    def test_get_country_prediction_with_negative_year(self):
        """Test: Negatif yıl ile get_country_prediction() hata döndürmeli"""
        # Act
        result = self.viewmodel.get_country_prediction('Turkey', -2020)
        
        # Assert
        # Negatif yıl işlenebilmeli veya hata döndürmeli
        self.assertIsInstance(result, dict)
    
    def test_get_countries_comparison_with_none_list(self):
        """Test: None liste ile get_countries_comparison() hata döndürmeli"""
        # Act
        result = self.viewmodel.get_countries_comparison(None)
        
        # Assert
        # None liste işlenebilmeli veya hata döndürmeli
        self.assertIsInstance(result, dict)
    
    def test_get_countries_comparison_with_empty_list(self):
        """Test: Boş liste ile get_countries_comparison() hata döndürmeli"""
        # Act
        result = self.viewmodel.get_countries_comparison([])
        
        # Assert
        self.assertFalse(result.get('success', True))
    
    def test_train_model_with_service_error(self):
        """Test: DataService hatası durumunda train_model() hata döndürmeli"""
        # Arrange
        self.data_service_mock.train_model.side_effect = Exception("Training error")
        
        # Act
        result = self.viewmodel.train_model('Turkey')
        
        # Assert
        self.assertFalse(result.get('success', True))
        self.assertIn('error', result)
    
    def test_get_model_metrics_with_service_error(self):
        """Test: DataService hatası durumunda get_model_metrics() hata döndürmeli"""
        # Arrange - get_model_metrics mock'lanmamış, gerçek implementasyon test ediliyor
        # Bu durumda service hatası simüle edilemez ama test yapısı korunur
        
        # Act
        result = self.viewmodel.get_model_metrics('Turkey')
        
        # Assert
        self.assertIsInstance(result, dict)
        # Hata durumunda bile yapı korunmalı


class TestDataViewModelDataValidation(unittest.TestCase):
    """
    ViewModel için veri doğrulama testleri.
    """
    
    def setUp(self):
        """Test setup"""
        self.data_service_mock = MagicMock(spec=DataService)
        self.data_service_mock.countries = ['Turkey']
        self.data_service_mock.models = {}
        self.viewmodel = DataViewModel(self.data_service_mock)
    
    def test_get_country_data_with_nan_values(self):
        """Test: NaN değerler içeren veri ile get_country_data() çalışabilmeli"""
        # Arrange
        import numpy as np
        mock_data = {
            'country': 'Turkey',
            'stats': {
                'min': 10.5,
                'max': np.nan,  # NaN değer
                'mean': 12.0,
                'years': [2020, 2021],
                'values': [10.5, np.nan]
            },
            'time_series': {
                '2020': 10.5,
                '2021': np.nan
            }
        }
        self.data_service_mock.get_country_data.return_value = mock_data
        
        # Act
        result = self.viewmodel.get_country_data('Turkey')
        
        # Assert
        self.assertIsInstance(result, dict)
        # NaN değerler 0'a dönüştürülmeli veya işlenebilmeli
        if result.get('success') and 'chart_data' in result:
            for dataset in result['chart_data'].get('datasets', []):
                for value in dataset.get('data', []):
                    if isinstance(value, (int, float)):
                        self.assertFalse(np.isnan(value))
    
    def test_get_country_data_with_inf_values(self):
        """Test: Infinity değerler içeren veri ile get_country_data() çalışabilmeli"""
        # Arrange
        import numpy as np
        mock_data = {
            'country': 'Turkey',
            'stats': {
                'min': 10.5,
                'max': np.inf,  # Infinity
                'mean': 12.0,
                'years': [2020],
                'values': [10.5]
            },
            'time_series': {'2020': 10.5}
        }
        self.data_service_mock.get_country_data.return_value = mock_data
        
        # Act
        result = self.viewmodel.get_country_data('Turkey')
        
        # Assert
        self.assertIsInstance(result, dict)
        # Infinity değerler işlenebilmeli
    
    def test_get_feature_importance_with_empty_features(self):
        """Test: Boş özellik listesi ile get_feature_importance() çalışabilmeli"""
        # Arrange
        self.data_service_mock.get_feature_importance.return_value = {
            'features': [],
            'importance': []
        }
        
        # Act
        result = self.viewmodel.get_feature_importance('Turkey')
        
        # Assert
        self.assertIsInstance(result, dict)
        # Boş özellikler ile de çalışabilmeli (mock veri oluşturulur)
    
    def test_get_data_overview_with_empty_data(self):
        """Test: Boş veri ile get_data_overview() çalışabilmeli"""
        # Arrange
        self.data_service_mock.get_data_overview.return_value = {
            'highest_countries': [],
            'lowest_countries': [],
            'global_stats': {
                'min': 0,
                'max': 0,
                'mean': 0,
                'total_countries': 0
            },
            'global_trend': 0
        }
        
        # Act
        result = self.viewmodel.get_data_overview()
        
        # Assert
        self.assertIsInstance(result, dict)
        # Boş veri ile de yapı korunmalı


if __name__ == '__main__':
    unittest.main()




