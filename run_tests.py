"""
Test Çalıştırma ve Raporlama Scripti

Bu script tüm testleri çalıştırır ve detaylı rapor oluşturur.
Başarı/başarısızlık istatistikleri ve sorunlu testleri gösterir.
"""

import subprocess
import sys
import os
import json
import re
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Tuple


class TestRunner:
    """Test çalıştırma ve raporlama sınıfı"""
    
    def __init__(self, test_dir: str = "app/test/unit", coverage: bool = True):
        """
        TestRunner başlatıcı
        
        Args:
            test_dir: Test dizini
            coverage: Coverage raporu oluşturulsun mu
        """
        self.test_dir = test_dir
        self.coverage = coverage
        self.results = {
            'total_tests': 0,
            'passed': 0,
            'failed': 0,
            'skipped': 0,
            'errors': 0,
            'failed_tests': [],
            'error_tests': [],
            'test_files': {},
            'coverage_percentage': 0.0,
            'execution_time': 0.0
        }
        self.start_time = None
        self.end_time = None
    
    def run_tests(self) -> bool:
        """
        Testleri çalıştırır ve sonuçları toplar
        
        Returns:
            bool: Tüm testler başarılı mı
        """
        print("=" * 80)
        print("🧪 TEST ÇALIŞTIRMA BAŞLATILIYOR...")
        print("=" * 80)
        print(f"📁 Test Dizini: {self.test_dir}")
        print(f"📊 Coverage: {'Açık' if self.coverage else 'Kapalı'}")
        print(f"⏰ Başlangıç Zamanı: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 80)
        print()
        
        self.start_time = datetime.now()
        
        # Pytest komutunu oluştur
        cmd = [
            sys.executable, "-m", "pytest",
            self.test_dir,
            "-v",
            "--tb=short",
            "--junit-xml=test-results.xml"
        ]
        
        # JSON rapor (opsiyonel - pytest-json-report paketi gerekli)
        try:
            import pytest_jsonreport
            cmd.extend(["--json-report", "--json-report-file=test-report.json"])
        except ImportError:
            pass  # JSON rapor paketi yoksa devam et
        
        if self.coverage:
            cmd.extend([
                "--cov=app",
                "--cov-report=html:htmlcov",
                "--cov-report=term-missing",
                "--cov-report=json:coverage.json"
            ])
        
        try:
            # Testleri çalıştır
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                encoding='utf-8'
            )
            
            self.end_time = datetime.now()
            execution_time = (self.end_time - self.start_time).total_seconds()
            self.results['execution_time'] = execution_time
            
            # Çıktıyı parse et
            self._parse_output(result.stdout, result.stderr, result.returncode)
            
            # JSON raporu varsa oku
            self._parse_json_report()
            
            # Coverage raporu varsa oku
            if self.coverage:
                self._parse_coverage_report()
            
            return result.returncode == 0
            
        except Exception as e:
            print(f"❌ Test çalıştırma hatası: {str(e)}")
            return False
    
    def _parse_output(self, stdout: str, stderr: str, returncode: int):
        """Pytest çıktısını parse eder"""
        # Test sonuçlarını bul
        # Örnek: "=== 25 passed, 2 failed, 1 skipped in 2.34s ==="
        summary_pattern = r'=== (\d+) passed(?:, (\d+) failed)?(?:, (\d+) error)?(?:, (\d+) skipped)?'
        summary_match = re.search(summary_pattern, stdout)
        
        if summary_match:
            self.results['passed'] = int(summary_match.group(1) or 0)
            self.results['failed'] = int(summary_match.group(2) or 0)
            self.results['errors'] = int(summary_match.group(3) or 0)
            self.results['skipped'] = int(summary_match.group(4) or 0)
            self.results['total_tests'] = (
                self.results['passed'] + 
                self.results['failed'] + 
                self.results['errors'] + 
                self.results['skipped']
            )
        
        # Başarısız testleri bul
        failed_pattern = r'FAILED\s+(.+?)\s+::\s+(.+?)\s+::\s+(.+?)$'
        for match in re.finditer(failed_pattern, stdout, re.MULTILINE):
            test_file = match.group(1)
            test_class = match.group(2)
            test_method = match.group(3)
            self.results['failed_tests'].append({
                'file': test_file,
                'class': test_class,
                'method': test_method
            })
        
        # Hata testlerini bul
        error_pattern = r'ERROR\s+(.+?)\s+::\s+(.+?)\s+::\s+(.+?)$'
        for match in re.finditer(error_pattern, stdout, re.MULTILINE):
            test_file = match.group(1)
            test_class = match.group(2)
            test_method = match.group(3)
            self.results['error_tests'].append({
                'file': test_file,
                'class': test_class,
                'method': test_method
            })
        
        # Test dosyalarını analiz et
        test_file_pattern = r'(.+?\.py)\s+::\s+(.+?)\s+PASSED|FAILED|ERROR|SKIPPED'
        for match in re.finditer(test_file_pattern, stdout):
            file_name = match.group(1)
            if file_name not in self.results['test_files']:
                self.results['test_files'][file_name] = {
                    'passed': 0,
                    'failed': 0,
                    'errors': 0,
                    'skipped': 0
                }
    
    def _parse_json_report(self):
        """JSON rapor dosyasını parse eder"""
        if os.path.exists('test-report.json'):
            try:
                with open('test-report.json', 'r', encoding='utf-8') as f:
                    report = json.load(f)
                    if 'summary' in report:
                        summary = report['summary']
                        self.results['total_tests'] = summary.get('total', 0)
                        self.results['passed'] = summary.get('passed', 0)
                        self.results['failed'] = summary.get('failed', 0)
                        self.results['skipped'] = summary.get('skipped', 0)
                    
                    # Başarısız testleri topla
                    if 'tests' in report:
                        for test in report['tests']:
                            if test.get('outcome') == 'failed':
                                self.results['failed_tests'].append({
                                    'file': test.get('nodeid', '').split('::')[0],
                                    'method': test.get('nodeid', '').split('::')[-1],
                                    'message': test.get('call', {}).get('longrepr', '')
                                })
            except Exception as e:
                print(f"⚠️  JSON rapor parse hatası: {str(e)}")
    
    def _parse_coverage_report(self):
        """Coverage raporunu parse eder"""
        if os.path.exists('coverage.json'):
            try:
                with open('coverage.json', 'r', encoding='utf-8') as f:
                    coverage_data = json.load(f)
                    if 'totals' in coverage_data:
                        totals = coverage_data['totals']
                        self.results['coverage_percentage'] = totals.get('percent_covered', 0.0)
            except Exception as e:
                print(f"⚠️  Coverage rapor parse hatası: {str(e)}")
    
    def generate_report(self):
        """Detaylı rapor oluşturur"""
        print()
        print("=" * 80)
        print("📊 TEST RAPORU")
        print("=" * 80)
        print()
        
        # Genel İstatistikler
        total = self.results['total_tests']
        passed = self.results['passed']
        failed = self.results['failed']
        errors = self.results['errors']
        skipped = self.results['skipped']
        
        if total > 0:
            success_rate = (passed / total) * 100
            failure_rate = ((failed + errors) / total) * 100
        else:
            success_rate = 0.0
            failure_rate = 0.0
        
        print("📈 GENEL İSTATİSTİKLER")
        print("-" * 80)
        print(f"✅ Toplam Test:     {total}")
        print(f"✅ Başarılı:        {passed} ({success_rate:.2f}%)")
        print(f"❌ Başarısız:       {failed} ({failure_rate:.2f}%)")
        print(f"⚠️  Hatalar:         {errors}")
        print(f"⏭️  Atlanan:         {skipped}")
        print(f"⏱️  Süre:            {self.results['execution_time']:.2f} saniye")
        
        if self.coverage:
            print(f"📊 Coverage:        {self.results['coverage_percentage']:.2f}%")
        
        print()
        
        # Başarısız Testler
        if self.results['failed_tests']:
            print("❌ BAŞARISIZ TESTLER")
            print("-" * 80)
            for i, test in enumerate(self.results['failed_tests'], 1):
                print(f"{i}. {test.get('file', 'Unknown')}::{test.get('method', 'Unknown')}")
                if 'message' in test:
                    print(f"   Mesaj: {test['message'][:100]}...")
            print()
        
        # Hata Testleri
        if self.results['error_tests']:
            print("⚠️  HATA TESTLERİ")
            print("-" * 80)
            for i, test in enumerate(self.results['error_tests'], 1):
                print(f"{i}. {test.get('file', 'Unknown')}::{test.get('method', 'Unknown')}")
            print()
        
        # Test Dosyaları Özeti
        if self.results['test_files']:
            print("📁 TEST DOSYALARI ÖZETİ")
            print("-" * 80)
            for file_name, stats in self.results['test_files'].items():
                file_total = stats['passed'] + stats['failed'] + stats['errors'] + stats['skipped']
                if file_total > 0:
                    file_success = (stats['passed'] / file_total) * 100
                    status = "✅" if stats['failed'] == 0 and stats['errors'] == 0 else "❌"
                    print(f"{status} {file_name}")
                    print(f"   Başarılı: {stats['passed']}, Başarısız: {stats['failed']}, "
                          f"Hatalar: {stats['errors']}, Atlanan: {stats['skipped']} "
                          f"({file_success:.1f}%)")
            print()
        
        # Sonuç
        print("=" * 80)
        if failed == 0 and errors == 0:
            print("🎉 TÜM TESTLER BAŞARILI!")
            print("=" * 80)
            return True
        else:
            print(f"⚠️  {failed + errors} TEST BAŞARISIZ!")
            print("=" * 80)
            return False
    
    def save_html_report(self):
        """HTML raporu kaydeder"""
        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <title>Test Raporu - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 20px; }}
        .header {{ background-color: #4CAF50; color: white; padding: 20px; }}
        .stats {{ display: flex; gap: 20px; margin: 20px 0; }}
        .stat-box {{ flex: 1; padding: 15px; border-radius: 5px; }}
        .success {{ background-color: #d4edda; border: 1px solid #c3e6cb; }}
        .failure {{ background-color: #f8d7da; border: 1px solid #f5c6cb; }}
        .info {{ background-color: #d1ecf1; border: 1px solid #bee5eb; }}
        table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
        th, td {{ padding: 10px; text-align: left; border: 1px solid #ddd; }}
        th {{ background-color: #4CAF50; color: white; }}
        .failed {{ background-color: #f8d7da; }}
    </style>
</head>
<body>
    <div class="header">
        <h1>🧪 Test Raporu</h1>
        <p>Oluşturulma Zamanı: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
    </div>
    
    <div class="stats">
        <div class="stat-box success">
            <h3>✅ Başarılı</h3>
            <p style="font-size: 24px; font-weight: bold;">{self.results['passed']}</p>
            <p>{(self.results['passed']/self.results['total_tests']*100) if self.results['total_tests'] > 0 else 0:.2f}%</p>
        </div>
        <div class="stat-box failure">
            <h3>❌ Başarısız</h3>
            <p style="font-size: 24px; font-weight: bold;">{self.results['failed']}</p>
            <p>{(self.results['failed']/self.results['total_tests']*100) if self.results['total_tests'] > 0 else 0:.2f}%</p>
        </div>
        <div class="stat-box info">
            <h3>📊 Toplam</h3>
            <p style="font-size: 24px; font-weight: bold;">{self.results['total_tests']}</p>
            <p>Süre: {self.results['execution_time']:.2f}s</p>
        </div>
    </div>
    
    <h2>Başarısız Testler</h2>
    <table>
        <tr>
            <th>#</th>
            <th>Dosya</th>
            <th>Test Metodu</th>
        </tr>
"""
        for i, test in enumerate(self.results['failed_tests'], 1):
            html_content += f"""
        <tr class="failed">
            <td>{i}</td>
            <td>{test.get('file', 'Unknown')}</td>
            <td>{test.get('method', 'Unknown')}</td>
        </tr>
"""
        
        html_content += """
    </table>
</body>
</html>
"""
        
        with open('test-report.html', 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        print(f"📄 HTML raporu oluşturuldu: test-report.html")


def main():
    """Ana fonksiyon"""
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Test çalıştırma ve raporlama scripti',
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument(
        '--test-dir',
        default='app/test/unit',
        help='Test dizini (varsayılan: app/test/unit)'
    )
    parser.add_argument(
        '--no-coverage',
        action='store_true',
        help='Coverage raporu oluşturma'
    )
    parser.add_argument(
        '--html',
        action='store_true',
        help='HTML raporu oluştur'
    )
    
    try:
        args = parser.parse_args()
    except SystemExit:
        # --help durumunda normal çıkış
        return
    
    runner = TestRunner(
        test_dir=args.test_dir,
        coverage=not args.no_coverage
    )
    
    success = runner.run_tests()
    report_success = runner.generate_report()
    
    if args.html:
        runner.save_html_report()
    
    # Çıkış kodu
    sys.exit(0 if success and report_success else 1)


if __name__ == '__main__':
    main()

