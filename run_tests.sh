#!/bin/bash
# Bash Test Çalıştırma Scripti
# Bu script tüm testleri çalıştırır ve detaylı rapor oluşturur

# Renkli çıktı için
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Parametreler
TEST_DIR="${1:-app/test/unit}"
NO_COVERAGE="${2:-false}"
HTML_REPORT="${3:-false}"

# Başlangıç
echo "================================================================================"
echo -e "${CYAN}🧪 TEST ÇALIŞTIRMA BAŞLATILIYOR...${NC}"
echo "================================================================================"
echo -e "${CYAN}📁 Test Dizini: $TEST_DIR${NC}"
echo -e "${CYAN}📊 Coverage: $([ "$NO_COVERAGE" = "true" ] && echo "Kapalı" || echo "Açık")${NC}"
echo -e "${CYAN}⏰ Başlangıç Zamanı: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
echo "================================================================================"
echo ""

START_TIME=$(date +%s)

# Pytest komutunu oluştur
PYTEST_CMD="python -m pytest $TEST_DIR -v --tb=short --junit-xml=test-results.xml"

if [ "$NO_COVERAGE" != "true" ]; then
    PYTEST_CMD="$PYTEST_CMD --cov=app --cov-report=html:htmlcov --cov-report=term-missing --cov-report=json:coverage.json"
fi

# Testleri çalıştır
echo -e "${CYAN}🚀 Testler çalıştırılıyor...${NC}"
OUTPUT=$(eval $PYTEST_CMD 2>&1)
EXIT_CODE=$?

END_TIME=$(date +%s)
EXECUTION_TIME=$((END_TIME - START_TIME))

# Çıktıyı göster
echo "$OUTPUT"

# Sonuçları parse et
PASSED=$(echo "$OUTPUT" | grep -oP '\d+(?= passed)' | tail -1 || echo "0")
FAILED=$(echo "$OUTPUT" | grep -oP '\d+(?= failed)' | tail -1 || echo "0")
ERRORS=$(echo "$OUTPUT" | grep -oP '\d+(?= error)' | tail -1 || echo "0")
SKIPPED=$(echo "$OUTPUT" | grep -oP '\d+(?= skipped)' | tail -1 || echo "0")

TOTAL=$((PASSED + FAILED + ERRORS + SKIPPED))

# Coverage bilgisini bul
if [ "$NO_COVERAGE" != "true" ]; then
    COVERAGE=$(echo "$OUTPUT" | grep -oP 'TOTAL\s+\d+\s+\d+\s+\K\d+(?=%)' | tail -1 || echo "0")
else
    COVERAGE="0"
fi

# Rapor
echo ""
echo "================================================================================"
echo -e "${CYAN}📊 TEST RAPORU${NC}"
echo "================================================================================"
echo ""

echo -e "${CYAN}📈 GENEL İSTATİSTİKLER${NC}"
echo "--------------------------------------------------------------------------------"
echo "✅ Toplam Test:     $TOTAL"

if [ "$TOTAL" -gt 0 ]; then
    SUCCESS_RATE=$(awk "BEGIN {printf \"%.2f\", ($PASSED/$TOTAL)*100}")
    FAILURE_RATE=$(awk "BEGIN {printf \"%.2f\", (($FAILED+$ERRORS)/$TOTAL)*100}")
    
    echo -e "${GREEN}✅ Başarılı:        $PASSED ($SUCCESS_RATE%)${NC}"
    echo -e "${RED}❌ Başarısız:       $FAILED ($FAILURE_RATE%)${NC}"
else
    echo -e "${YELLOW}⚠️  Test bulunamadı!${NC}"
fi

echo -e "${YELLOW}⚠️  Hatalar:         $ERRORS${NC}"
echo "⏭️  Atlanan:         $SKIPPED"
echo "⏱️  Süre:            ${EXECUTION_TIME} saniye"

if [ "$NO_COVERAGE" != "true" ]; then
    echo "📊 Coverage:        ${COVERAGE}%"
fi

echo ""

# Başarısız testleri bul
FAILED_TESTS=$(echo "$OUTPUT" | grep -E "FAILED.*::.*::" | sed 's/.*FAILED[[:space:]]*//' | sed 's/[[:space:]]*::[[:space:]]*/::/g')

if [ -n "$FAILED_TESTS" ]; then
    echo -e "${RED}❌ BAŞARISIZ TESTLER${NC}"
    echo "--------------------------------------------------------------------------------"
    COUNT=1
    echo "$FAILED_TESTS" | while IFS= read -r line; do
        echo "$COUNT. $line"
        COUNT=$((COUNT + 1))
    done
    echo ""
fi

# Sonuç
echo "================================================================================"
if [ "$FAILED" -eq 0 ] && [ "$ERRORS" -eq 0 ]; then
    echo -e "${GREEN}🎉 TÜM TESTLER BAŞARILI!${NC}"
    echo "================================================================================"
    exit 0
else
    echo -e "${RED}⚠️  $((FAILED + ERRORS)) TEST BAŞARISIZ!${NC}"
    echo "================================================================================"
    exit 1
fi




