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


class TestUserScenarios(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True

    def test_user_can_access_homepage(self):
        response = self.app.get('/')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'Yenilenebilir Enerji', response.data)

    def test_user_scenario_compare_countries(self):
        response = self.app.get('/api/data/comparison?countries=Turkey,Brazil')
        data = response.get_json()

        self.assertEqual(response.status_code, 200)
        self.assertTrue(data['success'])
        self.assertIn('Turkey', data['comparison_data'])
        self.assertIn('Brazil', data['comparison_data'])

    def test_user_scenario_get_future_forecast(self):
        response = self.app.get('/api/data/prediction/Turkey?year=2035')
        data = response.get_json()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(data['future_year'], 2035)
        self.assertIn('prediction', data)
        self.assertIn('trend_text', data['prediction'])
