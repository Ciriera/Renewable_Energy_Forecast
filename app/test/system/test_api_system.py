import unittest
import json
import os
import importlib.util


PROJECT_ROOT = os.path.abspath(
    os.path.join(os.path.dirname(__file__), '../../..')
)

APP_PATH = os.path.join(PROJECT_ROOT, 'app.py')

spec = importlib.util.spec_from_file_location("app_module", APP_PATH)
app_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(app_module)

app = app_module.app


class TestSystemIntegration(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True

    def test_api_status_health(self):
        """Sistem API ve data service'in saglikli oldugunu onayliyor."""
        response = self.app.get('/api/status')
        data = json.loads(response.data)
        
        self.assertEqual(response.status_code, 200)
        self.assertTrue(data['success'])
        self.assertEqual(data['status'], 'running')
        self.assertGreater(data['data_service']['total_countries'], 0)

    def test_country_data_flow(self):
        """Sistem gecerli bir ulke icin veriye CSV'den API'ye dogru veriyor."""
        response = self.app.get('/api/data/country/Turkey')
        data = json.loads(response.data)
        
        self.assertEqual(response.status_code, 200)
        self.assertTrue(data['success'])
        self.assertIn('statistics', data)

    def test_invalid_prediction_request(self):
        """System check: Sistem gecersiz tahminleri dogru handleliyor."""
        # Var olamyan ulke icin not found aliyor
        response = self.app.get('/api/data/prediction/NonExistentCountry?year=2030')
        self.assertEqual(response.status_code, 404)
        
        # Yanlis yil formatinda bad request aliyor
        response = self.app.get('/api/data/prediction/Turkey?year=invalid_year')
        self.assertEqual(response.status_code, 400)