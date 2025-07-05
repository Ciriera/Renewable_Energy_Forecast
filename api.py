from flask import Blueprint, jsonify, request
import pandas as pd
import numpy as np
from data_service import DataService
from data_viewmodel import DataViewModel

api_blueprint = Blueprint('api', __name__)
data_service = DataService()
data_viewmodel = DataViewModel()

@api_blueprint.route('/countries', methods=['GET'])
def get_countries():
    """
    Tüm ülkelerin listesini döndürür
    ---
    responses:
      200:
        description: Ülkeler listesi başarıyla döndürüldü
    """
    try:
        countries = data_service.get_countries()
        return jsonify(countries)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_blueprint.route('/years', methods=['GET'])
def get_years():
    """
    Veri setindeki tüm yılların listesini döndürür
    ---
    responses:
      200:
        description: Yıllar listesi başarıyla döndürüldü
    """
    try:
        years = data_service.get_years()
        return jsonify(years)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_blueprint.route('/country/<country_name>', methods=['GET'])
def get_country_data(country_name):
    """
    Belirli bir ülkenin tüm verilerini döndürür
    ---
    parameters:
      - name: country_name
        in: path
        type: string
        required: true
        description: Ülke adı
    responses:
      200:
        description: Ülke verileri başarıyla döndürüldü
      404:
        description: Ülke bulunamadı
    """
    try:
        country_data = data_service.get_country_data(country_name)
        if country_data is None:
            return jsonify({'error': 'Ülke bulunamadı'}), 404
        return jsonify(country_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_blueprint.route('/comparison', methods=['POST'])
def compare_countries():
    """
    Ülkeleri belirlenen metriğe göre karşılaştırır
    ---
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            countries:
              type: array
              items:
                type: string
              description: Karşılaştırılacak ülkeler
            metric:
              type: string
              description: Karşılaştırma metriği
            start_year:
              type: integer
              description: Başlangıç yılı
            end_year:
              type: integer
              description: Bitiş yılı
    responses:
      200:
        description: Karşılaştırma başarıyla yapıldı
      400:
        description: Geçersiz istek
      404:
        description: Ülke veya veri bulunamadı
    """
    try:
        # İstek verilerini al
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'İstek verileri bulunamadı'}), 400
        
        countries = data.get('countries', [])
        metric = data.get('metric')
        start_year = data.get('start_year')
        end_year = data.get('end_year')
        
        # Parametre kontrolü
        if not countries or not metric or not start_year or not end_year:
            return jsonify({'error': 'Ülkeler, metrik, başlangıç yılı ve bitiş yılı gereklidir'}), 400
        
        # Veri doğrulama
        try:
            start_year = int(start_year)
            end_year = int(end_year)
        except ValueError:
            return jsonify({'error': 'Yıllar tamsayı olmalıdır'}), 400
        
        if start_year > end_year:
            return jsonify({'error': 'Başlangıç yılı bitiş yılından büyük olamaz'}), 400
        
        # Karşılaştırma verilerini al
        comparison_data = {}
        country_stats = {}
        
        for country in countries:
            country_data = data_service.get_country_metrics(country, metric, start_year, end_year)
            
            if not country_data:
                return jsonify({'error': f'{country} için veri bulunamadı'}), 404
            
            comparison_data[country] = country_data
            
            # İstatistikleri hesapla
            values = [v for v in country_data.values() if v is not None]
            if values:
                country_stats[country] = {
                    'average': float(np.mean(values)),
                    'minimum': float(np.min(values)),
                    'maximum': float(np.max(values)),
                    'change_rate': float((values[-1] - values[0]) / values[0] * 100) if values[0] != 0 else 0,
                    'std_deviation': float(np.std(values))
                }
            else:
                country_stats[country] = {
                    'average': 0,
                    'minimum': 0,
                    'maximum': 0,
                    'change_rate': 0,
                    'std_deviation': 0
                }
        
        return jsonify({
            'comparison_data': comparison_data,
            'statistics': country_stats,
            'metric': metric
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_blueprint.route('/metrics', methods=['GET'])
def get_metrics():
    """
    Kullanılabilir metriklerin listesini döndürür
    ---
    responses:
      200:
        description: Metrikler başarıyla döndürüldü
    """
    try:
        metrics = {
            'gdp': 'Gayri Safi Yurtiçi Hasıla (GDP)',
            'population': 'Nüfus',
            'life_expectancy': 'Yaşam Beklentisi',
            'co2_emissions': 'CO2 Emisyonu',
            'energy_consumption': 'Enerji Tüketimi',
            'renewable_energy': 'Yenilenebilir Enerji Tüketimi',
            'renewable_percentage': 'Yenilenebilir Enerji Yüzdesi',
            'solar_energy': 'Güneş Enerjisi Kullanımı',
            'wind_energy': 'Rüzgar Enerjisi Kullanımı',
            'hydro_energy': 'Hidroelektrik Enerji Kullanımı',
            'nuclear_energy': 'Nükleer Enerji Kullanımı',
            'unemployment': 'İşsizlik Oranı',
            'inflation': 'Enflasyon Oranı'
        }
        return jsonify(metrics)
    except Exception as e:
        return jsonify({'error': str(e)}), 500 