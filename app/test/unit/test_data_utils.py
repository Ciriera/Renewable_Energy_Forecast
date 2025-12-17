"""
Data Utils Unit Testleri

Utility fonksiyonları için unit testler.
FIRST prensiplerine uygun olarak yazılmıştır.
"""

import unittest
import sys
import os
import tempfile
import json
import pandas as pd

# Projenin kök dizinini path'e ekle
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..')))

from app.utils.data_utils import (
    calculate_trend,
    interpolate_missing_years,
    format_percentage,
    save_to_json,
    load_from_json,
    generate_color_palette,
    get_trend_description
)


class TestCalculateTrend(unittest.TestCase):
    """calculate_trend() fonksiyonu için testler"""
    
    def test_positive_trend(self):
        """Test: Pozitif trend doğru hesaplanmalı"""
        values = [10.0, 12.0, 14.0, 16.0, 18.0, 20.0, 22.0, 24.0, 26.0, 28.0]
        trend = calculate_trend(values, window_size=5)
        self.assertGreater(trend, 0)
    
    def test_negative_trend(self):
        """Test: Negatif trend doğru hesaplanmalı"""
        values = [28.0, 26.0, 24.0, 22.0, 20.0, 18.0, 16.0, 14.0, 12.0, 10.0]
        trend = calculate_trend(values, window_size=5)
        self.assertLess(trend, 0)
    
    def test_insufficient_data(self):
        """Test: Yetersiz veri ile 0 döndürmeli"""
        values = [10.0, 12.0]
        trend = calculate_trend(values, window_size=5)
        self.assertEqual(trend, 0.0)
    
    def test_zero_initial_value(self):
        """Test: Başlangıç değeri 0 ise 0 döndürmeli"""
        values = [0.0, 5.0, 10.0, 15.0, 20.0, 25.0, 30.0, 35.0, 40.0, 45.0]
        trend = calculate_trend(values, window_size=5)
        self.assertEqual(trend, 0.0)
    
    def test_empty_list(self):
        """Test: Boş liste ile 0 döndürmeli"""
        values = []
        trend = calculate_trend(values)
        self.assertEqual(trend, 0.0)


class TestInterpolateMissingYears(unittest.TestCase):
    """interpolate_missing_years() fonksiyonu için testler"""
    
    def test_no_missing_years(self):
        """Test: Eksik yıl yoksa orijinal veri döndürmeli"""
        data = [
            {'year': 2000, 'value': 10.0},
            {'year': 2001, 'value': 12.0},
            {'year': 2002, 'value': 14.0}
        ]
        result = interpolate_missing_years(data)
        self.assertEqual(len(result), 3)
    
    def test_with_missing_years(self):
        """Test: Eksik yıllar interpolasyon ile doldurulmalı"""
        data = [
            {'year': 2000, 'value': 10.0},
            {'year': 2002, 'value': 14.0},
            {'year': 2004, 'value': 18.0}
        ]
        result = interpolate_missing_years(data)
        # 2001 ve 2003 yılları eklenmiş olmalı
        years = [item['year'] for item in result]
        self.assertIn(2001, years)
        self.assertIn(2003, years)
    
    def test_empty_data(self):
        """Test: Boş veri ile boş liste döndürmeli"""
        data = []
        result = interpolate_missing_years(data)
        self.assertEqual(result, [])
    
    def test_single_data_point(self):
        """Test: Tek veri noktası ile aynı veri döndürmeli"""
        data = [{'year': 2000, 'value': 10.0}]
        result = interpolate_missing_years(data)
        self.assertEqual(len(result), 1)


class TestFormatPercentage(unittest.TestCase):
    """format_percentage() fonksiyonu için testler"""
    
    def test_positive_percentage(self):
        """Test: Pozitif yüzde doğru formatlanmalı"""
        result = format_percentage(12.5)
        self.assertEqual(result, "%12.5")
    
    def test_negative_percentage(self):
        """Test: Negatif yüzde doğru formatlanmalı"""
        result = format_percentage(-5.3)
        self.assertEqual(result, "%-5.3")
    
    def test_zero_percentage(self):
        """Test: Sıfır yüzde doğru formatlanmalı"""
        result = format_percentage(0.0)
        self.assertEqual(result, "%0.0")
    
    def test_custom_decimal_places(self):
        """Test: Özel ondalık basamak sayısı kullanılabilmeli"""
        result = format_percentage(12.5678, decimal_places=2)
        self.assertEqual(result, "%12.57")


class TestSaveToJson(unittest.TestCase):
    """save_to_json() fonksiyonu için testler"""
    
    def setUp(self):
        """Test setup"""
        self.test_dir = tempfile.mkdtemp()
        self.test_file = os.path.join(self.test_dir, 'test.json')
    
    def tearDown(self):
        """Test cleanup"""
        import shutil
        if os.path.exists(self.test_dir):
            shutil.rmtree(self.test_dir)
    
    def test_save_simple_data(self):
        """Test: Basit veri kaydedilebilmeli"""
        data = {'key': 'value', 'number': 42}
        result = save_to_json(data, self.test_file)
        self.assertTrue(result)
        self.assertTrue(os.path.exists(self.test_file))
    
    def test_save_complex_data(self):
        """Test: Karmaşık veri kaydedilebilmeli"""
        data = {
            'list': [1, 2, 3],
            'nested': {'a': 1, 'b': 2},
            'unicode': 'Türkçe karakterler: ışğüöç'
        }
        result = save_to_json(data, self.test_file)
        self.assertTrue(result)
    
    def test_save_invalid_path(self):
        """Test: Geçersiz yol ile False döndürmeli"""
        result = save_to_json({'key': 'value'}, '/invalid/path/file.json')
        self.assertFalse(result)


class TestLoadFromJson(unittest.TestCase):
    """load_from_json() fonksiyonu için testler"""
    
    def setUp(self):
        """Test setup"""
        self.test_dir = tempfile.mkdtemp()
        self.test_file = os.path.join(self.test_dir, 'test.json')
    
    def tearDown(self):
        """Test cleanup"""
        import shutil
        if os.path.exists(self.test_dir):
            shutil.rmtree(self.test_dir)
    
    def test_load_existing_file(self):
        """Test: Mevcut dosya yüklenebilmeli"""
        data = {'key': 'value', 'number': 42}
        save_to_json(data, self.test_file)
        loaded = load_from_json(self.test_file)
        self.assertEqual(loaded, data)
    
    def test_load_nonexistent_file(self):
        """Test: Olmayan dosya None döndürmeli"""
        loaded = load_from_json('nonexistent.json')
        self.assertIsNone(loaded)
    
    def test_load_invalid_json(self):
        """Test: Geçersiz JSON None döndürmeli"""
        with open(self.test_file, 'w') as f:
            f.write('invalid json content')
        loaded = load_from_json(self.test_file)
        self.assertIsNone(loaded)


class TestGenerateColorPalette(unittest.TestCase):
    """generate_color_palette() fonksiyonu için testler"""
    
    def test_small_palette(self):
        """Test: Küçük palet oluşturulabilmeli"""
        colors = generate_color_palette(3)
        self.assertEqual(len(colors), 3)
        self.assertIsInstance(colors[0], str)
        self.assertTrue(colors[0].startswith('#'))
    
    def test_large_palette(self):
        """Test: Büyük palet oluşturulabilmeli (renkler tekrarlanmalı)"""
        colors = generate_color_palette(20)
        self.assertEqual(len(colors), 20)
        # Tüm renkler hex formatında olmalı
        for color in colors:
            self.assertTrue(color.startswith('#'))
            self.assertEqual(len(color), 7)  # #RRGGBB formatı
    
    def test_zero_colors(self):
        """Test: Sıfır renk ile boş liste döndürmeli"""
        colors = generate_color_palette(0)
        self.assertEqual(colors, [])
    
    def test_single_color(self):
        """Test: Tek renk döndürmeli"""
        colors = generate_color_palette(1)
        self.assertEqual(len(colors), 1)


class TestGetTrendDescription(unittest.TestCase):
    """get_trend_description() fonksiyonu için testler"""
    
    def test_very_positive_trend(self):
        """Test: Çok güçlü artış için doğru açıklama"""
        result = get_trend_description(35.0)
        self.assertEqual(result['description'], 'Çok Güçlü Artış')
        self.assertEqual(result['class'], 'very-positive')
    
    def test_positive_trend(self):
        """Test: Güçlü artış için doğru açıklama"""
        result = get_trend_description(20.0)
        self.assertEqual(result['description'], 'Güçlü Artış')
        self.assertEqual(result['class'], 'positive')
    
    def test_slight_positive_trend(self):
        """Test: Artış için doğru açıklama"""
        result = get_trend_description(10.0)
        self.assertEqual(result['description'], 'Artış')
        self.assertEqual(result['class'], 'slightly-positive')
    
    def test_neutral_trend(self):
        """Test: Yatay trend için doğru açıklama"""
        result = get_trend_description(0.0)
        self.assertEqual(result['description'], 'Yatay')
        self.assertEqual(result['class'], 'neutral')
    
    def test_slight_negative_trend(self):
        """Test: Azalış için doğru açıklama"""
        result = get_trend_description(-10.0)
        self.assertEqual(result['description'], 'Azalış')
        self.assertEqual(result['class'], 'slightly-negative')
    
    def test_negative_trend(self):
        """Test: Güçlü azalış için doğru açıklama"""
        result = get_trend_description(-20.0)
        self.assertEqual(result['description'], 'Güçlü Azalış')
        self.assertEqual(result['class'], 'negative')
    
    def test_very_negative_trend(self):
        """Test: Çok güçlü azalış için doğru açıklama"""
        result = get_trend_description(-35.0)
        self.assertEqual(result['description'], 'Çok Güçlü Azalış')
        self.assertEqual(result['class'], 'very-negative')


if __name__ == '__main__':
    unittest.main()




