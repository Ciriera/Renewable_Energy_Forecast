import unittest
from unittest.mock import MagicMock, patch
import sys
import os
import json

# Projenin kök dizinini path'e ekle
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..')))

from app.data_viewmodel import DataViewModel
from app.data_service import DataService

class TestDataViewModel(unittest.TestCase):
    """DataViewModel sınıfı için unit testler"""
    
    def setUp(self):
        """Her test öncesi çalıştırılacak kod"""
        # DataService mocklanıyor
        self.data_service_mock = MagicMock(spec=DataService)
        self.viewmodel = DataViewModel(self.data_service_mock)
    
    def test_get_countries(self):
        """get_countries metodu için test"""
        # Mock veri hazırla
        mock_countries = ["Turkey", "Germany", "France"]
        self.data_service_mock.get_countries.return_value = mock_countries
        
        # Metodu çağır
        result = self.viewmodel.get_countries()
        
        # Sonucu kontrol et
        self.assertTrue(result["success"])
        self.assertEqual(result["countries"], mock_countries)
        self.assertEqual(result["count"], len(mock_countries))
        
        # DataService'in get_countries metodunun çağrıldığını doğrula
        self.data_service_mock.get_countries.assert_called_once()
    
    def test_get_countries_error(self):
        """get_countries metodunun hata durumunu test et"""
        # Mock hata oluştur
        self.data_service_mock.get_countries.side_effect = Exception("Test error")
        
        # Metodu çağır
        result = self.viewmodel.get_countries()
        
        # Sonucu kontrol et
        self.assertFalse(result["success"])
        self.assertIn("error", result)
    
    def test_get_country_data(self):
        """get_country_data metodu için test"""
        # Mock veri hazırla
        country_name = "Turkey"
        mock_country_data = {
            "country": country_name,
            "stats": {
                "min": 10.5,
                "max": 30.2,
                "mean": 20.1,
                "median": 19.8,
                "std": 5.2,
                "last_value": 29.8,
                "trend": 15.3
            },
            "time_series": {
                "2000": 15.2,
                "2005": 18.7,
                "2010": 22.4,
                "2015": 26.3,
                "2020": 29.8
            }
        }
        
        self.data_service_mock.get_country_data.return_value = mock_country_data
        
        # Metodu çağır
        result = self.viewmodel.get_country_data(country_name)
        
        # Sonucu kontrol et
        self.assertTrue(result["success"])
        self.assertEqual(result["country"], country_name)
        self.assertIn("chart_data", result)
        self.assertIn("stats", result)
        
        # Trend bilgisinin doğru formatlandığını kontrol et
        self.assertEqual(result["stats"]["trend_text"], "%15.30 artış")
        self.assertEqual(result["stats"]["trend_class"], "positive")
        
        # DataService'in get_country_data metodunun doğru parametre ile çağrıldığını doğrula
        self.data_service_mock.get_country_data.assert_called_once_with(country_name)
    
    def test_get_country_data_negative_trend(self):
        """get_country_data metodu negatif trend için test"""
        # Mock veri hazırla
        country_name = "France"
        mock_country_data = {
            "country": country_name,
            "stats": {
                "min": 10.5,
                "max": 30.2,
                "mean": 20.1,
                "median": 19.8,
                "std": 5.2,
                "last_value": 18.5,
                "trend": -7.8
            },
            "time_series": {
                "2000": 22.1,
                "2005": 21.3,
                "2010": 20.5,
                "2015": 19.2,
                "2020": 18.5
            }
        }
        
        self.data_service_mock.get_country_data.return_value = mock_country_data
        
        # Metodu çağır
        result = self.viewmodel.get_country_data(country_name)
        
        # Sonucu kontrol et
        self.assertTrue(result["success"])
        
        # Trend bilgisinin doğru formatlandığını kontrol et
        self.assertEqual(result["stats"]["trend_text"], "%7.80 azalış")
        self.assertEqual(result["stats"]["trend_class"], "negative")
    
    def test_get_country_data_error(self):
        """get_country_data metodunun hata durumunu test et"""
        # Mock hata oluştur
        country_name = "Turkey"
        self.data_service_mock.get_country_data.side_effect = Exception("Country not found")
        
        # Metodu çağır
        result = self.viewmodel.get_country_data(country_name)
        
        # Sonucu kontrol et
        self.assertFalse(result["success"])
        self.assertIn("error", result)
    
    def test_get_data_overview(self):
        """get_data_overview metodu için test"""
        # Mock veri hazırla
        mock_overview_data = {
            "highest_countries": [
                {"country": "Iceland", "value": 78.5},
                {"country": "Norway", "value": 69.2}
            ],
            "lowest_countries": [
                {"country": "Qatar", "value": 0.2},
                {"country": "Kuwait", "value": 0.5}
            ],
            "global_stats": {
                "min": 0.1,
                "max": 98.5,
                "mean": 18.3,
                "median": 15.2,
                "std": 20.1,
                "total_countries": 180,
                "years_range": "1995-2020"
            },
            "global_trend": 5.6
        }
        
        self.data_service_mock.get_data_overview.return_value = mock_overview_data
        
        # Metodu çağır
        result = self.viewmodel.get_data_overview()
        
        # Sonucu kontrol et
        self.assertTrue(result["success"])
        self.assertIn("highest_chart", result)
        self.assertIn("lowest_chart", result)
        self.assertIn("global_stats", result)
        
        # Trend bilgisinin doğru formatlandığını kontrol et
        self.assertEqual(result["global_stats"]["trend_text"], "%5.60 artış")
        self.assertEqual(result["global_stats"]["trend_class"], "positive")
        
        # Chart verilerinin doğru formatta olduğunu kontrol et
        self.assertIn("labels", result["highest_chart"])
        self.assertIn("datasets", result["highest_chart"])
        
        # DataService'in get_data_overview metodunun çağrıldığını doğrula
        self.data_service_mock.get_data_overview.assert_called_once()
    
    def test_get_country_prediction(self):
        """get_country_prediction metodu için test"""
        # Mock veri hazırla
        country_name = "Turkey"
        future_year = 2030
        
        mock_prediction = {
            "current_year": 2020,
            "current_value": 29.8,
            "future_year": 2030,
            "predicted_value": 45.2,
            "percent_change": 51.7,
            "confidence": 85.3
        }
        
        self.data_service_mock.predict_future.return_value = mock_prediction
        self.data_service_mock.get_country_data.return_value = {
            "time_series": {
                "2000": 15.2,
                "2005": 18.7,
                "2010": 22.4,
                "2015": 26.3,
                "2020": 29.8
            }
        }
        
        # Metodu çağır
        result = self.viewmodel.get_country_prediction(country_name, future_year)
        
        # Sonucu kontrol et
        self.assertTrue(result["success"])
        self.assertEqual(result["country"], country_name)
        self.assertIn("chart_data", result)
        self.assertIn("prediction", result)
        
        # Değişim yüzdesinin doğru formatlandığını kontrol et
        self.assertEqual(result["prediction"]["change_text"], "%51.70 artış")
        self.assertEqual(result["prediction"]["change_class"], "positive")
        
        # DataService metodlarının doğru parametrelerle çağrıldığını doğrula
        self.data_service_mock.predict_future.assert_called_once_with(country_name, future_year)
        self.data_service_mock.get_country_data.assert_called_once_with(country_name)
    
    def test_get_model_metrics(self):
        """get_model_metrics metodu için test"""
        # Mock veri hazırla
        country_name = "Turkey"
        mock_metrics_data = {
            "country": country_name,
            "metrics": {
                "train_rmse": 0.0254,
                "test_rmse": 0.0312,
                "train_mae": 0.0198,
                "test_mae": 0.0241,
                "r2_score": 0.8732
            },
            "model_quality": "iyi"
        }
        
        self.data_service_mock.get_model_metrics.return_value = mock_metrics_data
        
        # Metodu çağır
        result = self.viewmodel.get_model_metrics(country_name)
        
        # Sonucu kontrol et
        self.assertTrue(result["success"])
        self.assertEqual(result["country"], country_name)
        self.assertIn("metrics", result)
        self.assertIn("chart_data", result)
        self.assertIn("r2_chart_data", result)
        
        # Renk kodunun doğru atandığını kontrol et
        self.assertEqual(result["quality_color"], "#28a745")  # iyi: yeşil
        
        # DataService'in get_model_metrics metodunun doğru parametre ile çağrıldığını doğrula
        self.data_service_mock.get_model_metrics.assert_called_once_with(country_name)
    
    def test_get_countries_comparison(self):
        """get_countries_comparison metodu için test"""
        # Mock veri hazırla
        countries = ["Turkey", "Germany", "France"]
        
        mock_comparison_data = {
            "country_data": {
                "Turkey": {
                    "time_series": {"2010": 15.2, "2015": 18.3, "2020": 22.1},
                    "last_value": 22.1,
                    "average": 17.5,
                    "min": 15.2,
                    "max": 22.1,
                    "trend": 45.4
                },
                "Germany": {
                    "time_series": {"2010": 25.6, "2015": 32.1, "2020": 41.5},
                    "last_value": 41.5,
                    "average": 33.1,
                    "min": 25.6,
                    "max": 41.5,
                    "trend": 62.1
                },
                "France": {
                    "time_series": {"2010": 12.3, "2015": 16.1, "2020": 19.8},
                    "last_value": 19.8,
                    "average": 16.1,
                    "min": 12.3,
                    "max": 19.8,
                    "trend": 60.9
                }
            },
            "analysis": [
                "Almanya en yüksek yenilenebilir enerji kullanım oranına sahiptir.",
                "Tüm ülkeler son 10 yılda yenilenebilir enerji kullanımlarını artırmıştır."
            ]
        }
        
        self.data_service_mock.get_countries_comparison.return_value = mock_comparison_data
        
        # Metodu çağır
        result = self.viewmodel.get_countries_comparison(countries)
        
        # Sonucu kontrol et
        self.assertTrue(result["success"])
        self.assertEqual(result["countries"], countries)
        self.assertIn("chart_data", result)
        self.assertIn("stats_table", result)
        self.assertIn("analysis", result)
        
        # Her ülke için trend sınıfının doğru atandığını kontrol et
        stats_table = result["stats_table"]
        self.assertEqual(len(stats_table), 3)
        
        # Tüm ülkelerin trendi pozitif olmalı
        for stat in stats_table:
            self.assertEqual(stat["trend_class"], "positive")
        
        # DataService'in get_countries_comparison metodunun doğru parametre ile çağrıldığını doğrula
        self.data_service_mock.get_countries_comparison.assert_called_once_with(countries)

if __name__ == '__main__':
    unittest.main() 