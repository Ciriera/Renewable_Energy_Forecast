"""
Test Raporu PDF Oluşturucu

Bu script test çıktısını HTML formatından PDF formatına dönüştürür.
"""

import sys
import os
from datetime import datetime
from pathlib import Path

try:
    from weasyprint import HTML, CSS
    from weasyprint.text.fonts import FontConfiguration
    HAS_WEASYPRINT = True
except (ImportError, OSError, Exception):
    HAS_WEASYPRINT = False

try:
    import pdfkit
    HAS_PDFKIT = True
except ImportError:
    HAS_PDFKIT = False

try:
    from xhtml2pdf import pisa
    HAS_XHTML2PDF = True
except ImportError:
    HAS_XHTML2PDF = False

try:
    from reportlab.lib.pagesizes import A4, letter
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
    from reportlab.lib import colors
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    from reportlab.pdfgen import canvas
    from reportlab.lib.units import cm
    HAS_REPORTLAB = True
except ImportError:
    HAS_REPORTLAB = False


def generate_pdf_from_html(html_file: str, pdf_file: str) -> bool:
    """
    HTML dosyasını PDF'e dönüştürür
    
    Args:
        html_file: HTML dosya yolu
        pdf_file: Çıktı PDF dosya yolu
        
    Returns:
        Başarılı olup olmadığı
    """
    if not os.path.exists(html_file):
        print(f"[HATA] HTML dosyasi bulunamadi: {html_file}")
        return False
    
    # xhtml2pdf kullanarak dönüştür (Windows için önerilen)
    if HAS_XHTML2PDF:
        try:
            print(f"[INFO] xhtml2pdf kullanarak PDF olusturuluyor...")
            print(f"[INFO] HTML dosyasi okunuyor: {html_file}")
            
            # HTML dosyasını oku
            with open(html_file, 'r', encoding='utf-8') as f:
                html_content = f.read()
            
            if not html_content or len(html_content.strip()) == 0:
                print(f"[HATA] HTML dosyasi bos!")
                return False
            
            print(f"[INFO] HTML icerik boyutu: {len(html_content)} karakter")
            
            # PDF oluştur
            with open(pdf_file, 'wb') as pdf:
                result = pisa.CreatePDF(
                    html_content,
                    dest=pdf,
                    encoding='utf-8',
                    link_callback=None,
                    show_error_as_pdf=True
                )
            
            # Hataları kontrol et
            if result.err:
                print(f"[UYARI] xhtml2pdf ile hatalar olustu:")
                print(f"   Hata sayisi: {len(result.err)}")
                for i, error in enumerate(result.err[:5], 1):  # İlk 5 hatayı göster
                    print(f"   {i}. {error}")
                # Hata olsa bile PDF oluşturulmuş olabilir
                if os.path.exists(pdf_file) and os.path.getsize(pdf_file) > 0:
                    print(f"[OK] PDF olusturuldu (hatalarla birlikte): {pdf_file}")
                    return True
                else:
                    print(f"[HATA] PDF olusturulamadi (hata nedeniyle)")
                    return False
            else:
                if os.path.exists(pdf_file) and os.path.getsize(pdf_file) > 0:
                    print(f"[OK] PDF basariyla olusturuldu: {pdf_file}")
                    print(f"[INFO] PDF boyutu: {os.path.getsize(pdf_file)} byte")
                    return True
                else:
                    print(f"[HATA] PDF dosyasi olusturulamadi (dosya yok veya bos)")
                    return False
                    
        except Exception as e:
            print(f"[HATA] xhtml2pdf ile olusturulamadi: {e}")
            import traceback
            print(f"[HATA] Detayli hata:")
            traceback.print_exc()
            return False
    
    # WeasyPrint kullanarak dönüştür (Linux/Mac için)
    if HAS_WEASYPRINT:
        try:
            print(f"[INFO] WeasyPrint kullanarak PDF olusturuluyor...")
            HTML(filename=html_file).write_pdf(pdf_file)
            print(f"[OK] PDF basariyla olusturuldu: {pdf_file}")
            return True
        except (OSError, Exception) as e:
            print(f"[UYARI] WeasyPrint ile olusturulamadi (Windows'ta GTK+ gerekli): {e}")
    
    # pdfkit kullanarak dönüştür (alternatif)
    if HAS_PDFKIT:
        try:
            print(f"[INFO] pdfkit kullanarak PDF olusturuluyor...")
            options = {
                'page-size': 'A4',
                'margin-top': '0.75in',
                'margin-right': '0.75in',
                'margin-bottom': '0.75in',
                'margin-left': '0.75in',
                'encoding': "UTF-8",
                'no-outline': None,
                'enable-local-file-access': None
            }
            pdfkit.from_file(html_file, pdf_file, options=options)
            print(f"[OK] PDF basariyla olusturuldu: {pdf_file}")
            return True
        except Exception as e:
            print(f"[UYARI] pdfkit ile olusturulamadi: {e}")
    
    # ReportLab ile basit PDF oluştur (son çare)
    if HAS_REPORTLAB:
        try:
            print(f"[INFO] ReportLab ile basit PDF olusturuluyor...")
            return generate_simple_pdf_from_html(html_file, pdf_file)
        except Exception as e:
            print(f"[UYARI] ReportLab ile olusturulamadi: {e}")
    
    print("[HATA] PDF olusturmak icin gerekli kutuphaneler yuklu degil!")
    print("[INFO] Yuklemek icin:")
    print("      Windows: pip install xhtml2pdf (ONERILEN)")
    print("      veya: pip install weasyprint (GTK+ runtime gerekli)")
    print("      veya: pip install pdfkit (wkhtmltopdf binary gerekli)")
    return False


def generate_simple_pdf_from_html(html_file: str, pdf_file: str) -> bool:
    """
    HTML'i parse edip ReportLab ile basit PDF oluşturur
    """
    if not HAS_REPORTLAB:
        return False
    
    try:
        from html.parser import HTMLParser
        import re
        
        # HTML'i oku
        with open(html_file, 'r', encoding='utf-8') as f:
            html_content = f.read()
        
        # HTML'den metin çıkar (basit)
        text_content = re.sub(r'<[^>]+>', '', html_content)
        text_content = text_content.replace('&nbsp;', ' ').replace('&amp;', '&')
        
        # PDF oluştur
        doc = SimpleDocTemplate(pdf_file, pagesize=A4)
        story = []
        
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#2c3e50'),
            spaceAfter=30,
            alignment=1
        )
        
        # Başlık
        story.append(Paragraph("Test Raporu", title_style))
        story.append(Spacer(1, 0.2*inch))
        
        # HTML içeriğini satır satır ekle
        for line in text_content.split('\n'):
            line = line.strip()
            if line and len(line) > 0:
                try:
                    story.append(Paragraph(line.replace('<', '&lt;').replace('>', '&gt;'), styles['Normal']))
                    story.append(Spacer(1, 0.1*inch))
                except:
                    pass
        
        doc.build(story)
        return True
    except Exception as e:
        print(f"[HATA] ReportLab ile PDF olusturulurken hata: {e}")
        return False


def generate_simple_pdf_report(test_results_file: str, pdf_file: str) -> bool:
    """
    Test sonuçlarını basit bir PDF raporuna dönüştürür (ReportLab ile)
    
    Args:
        test_results_file: Test sonuçları dosyası (JSON veya metin)
        pdf_file: Çıktı PDF dosya yolu
        
    Returns:
        Başarılı olup olmadığı
    """
    if not HAS_REPORTLAB:
        print("[HATA] ReportLab kutuphanesi yuklu degil!")
        print("[INFO] Yuklemek icin: pip install reportlab")
        return False
    
    try:
        # PDF oluştur
        doc = SimpleDocTemplate(pdf_file, pagesize=A4)
        story = []
        
        # Stil tanımlamaları
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#2c3e50'),
            spaceAfter=30,
            alignment=1  # Center
        )
        
        # Başlık
        story.append(Paragraph("TEST RAPORU", title_style))
        story.append(Spacer(1, 0.2*inch))
        story.append(Paragraph(f"Olusturulma Zamani: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", styles['Normal']))
        story.append(Spacer(1, 0.3*inch))
        
        # Not: Bu basit bir örnek, gerçek test sonuçlarını parse etmek gerekir
        story.append(Paragraph("Test sonuçları HTML raporundan PDF'e dönüştürülmelidir.", styles['Normal']))
        
        doc.build(story)
        print(f"[OK] PDF basariyla olusturuldu: {pdf_file}")
        return True
    except Exception as e:
        print(f"[HATA] PDF olusturulurken hata: {e}")
        return False


def main():
    """Ana fonksiyon"""
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Test raporunu PDF formatına dönüştürür',
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument(
        '--html',
        default='test-report.html',
        help='HTML rapor dosyası (varsayılan: test-report.html)'
    )
    parser.add_argument(
        '--output',
        default='test-report.pdf',
        help='Çıktı PDF dosyası (varsayılan: test-report.pdf)'
    )
    
    args = parser.parse_args()
    
    if not os.path.exists(args.html):
        print(f"[HATA] HTML dosyasi bulunamadi: {args.html}")
        print("[INFO] Oncelikle HTML raporu olusturulmali:")
        print("      python run_tests.py --html")
        print("      veya")
        print("      .\\run_tests.ps1 -Html")
        sys.exit(1)
    
    success = generate_pdf_from_html(args.html, args.output)
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()
