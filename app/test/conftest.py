"""
Pytest konfigürasyon dosyası

Test ortamı için paylaşılan fixture'lar ve konfigürasyonlar.
"""

import pytest
import pandas as pd
import numpy as np
import tempfile
import os
import shutil
from unittest.mock import MagicMock


@pytest.fixture
def temp_dir():
    """
    Geçici dizin oluşturur ve test sonrası temizler.
    """
    test_dir = tempfile.mkdtemp()
    yield test_dir
    if os.path.exists(test_dir):
        shutil.rmtree(test_dir)


@pytest.fixture
def sample_csv_data(temp_dir):
    """
    Örnek CSV verisi oluşturur ve dosya yolunu döndürür.
    """
    csv_path = os.path.join(temp_dir, 'test_data.csv')
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
    df.to_csv(csv_path, index=False, encoding='utf-8')
    return csv_path


@pytest.fixture
def sample_country_data():
    """
    Örnek ülke verisi döndürür.
    """
    return {
        'country': 'Turkey',
        'stats': {
            'min': 10.5,
            'max': 13.5,
            'mean': 12.0,
            'median': 12.0,
            'std': 1.2,
            'last_value': 13.5,
            'years': [1, 2, 3, 4, 5],
            'values': [10.5, 11.2, 12.0, 12.8, 13.5],
            'trend': 28.57
        },
        'time_series': {
            '1': 10.5,
            '2': 11.2,
            '3': 12.0,
            '4': 12.8,
            '5': 13.5
        }
    }


@pytest.fixture
def mock_data_service():
    """
    Mock DataService instance'ı oluşturur.
    """
    mock_service = MagicMock()
    mock_service.get_countries.return_value = ['Turkey', 'Germany', 'France']
    mock_service.get_country_data.return_value = {
        'country': 'Turkey',
        'stats': {
            'min': 10.5,
            'max': 13.5,
            'mean': 12.0,
            'trend': 28.57
        },
        'time_series': {
            '1': 10.5,
            '2': 11.2,
            '3': 12.0
        }
    }
    return mock_service


@pytest.fixture
def sample_time_series():
    """
    Örnek zaman serisi verisi döndürür.
    """
    return pd.DataFrame({
        'Year': [2000, 2001, 2002, 2003, 2004],
        'Renewable_Value': [10.0, 12.0, 14.0, 16.0, 18.0]
    })


@pytest.fixture(autouse=True)
def reset_random_seed():
    """
    Her test öncesi random seed'i sıfırlar.
    Testlerin tekrarlanabilir olmasını sağlar.
    """
    np.random.seed(42)
    yield
    np.random.seed(None)




