#!/usr/bin/env node

/**
 * 빌드 타임 데이터 Fetch 스크립트
 * 백엔드 API에서 데이터를 가져와 public/data/ 에 JSON 파일로 저장
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

// API Base URL (환경변수 또는 기본값)
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:9876';
const DATA_DIR = path.join(__dirname, '../public/data');

// Axios 인스턴스 생성 (10분 timeout)
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 600000,
  headers: {
    'Content-Type': 'application/json',
  },
});

console.log('🚀 Starting data fetch...');
console.log(`📡 API Base URL: ${API_BASE_URL}`);
console.log(`📂 Data Directory: ${DATA_DIR}`);

// 데이터 디렉토리 생성
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  console.log('✅ Created data directory');
}

/**
 * JSON 파일 저장 헬퍼 함수
 */
function saveJSON(filename, data) {
  const filePath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`✅ Saved: ${filename} (${Object.keys(data).length} keys)`);
}

/**
 * 메인 데이터 fetch 함수
 */
async function fetchAllData() {
  const startTime = Date.now();
  const metadata = {
    lastUpdated: new Date().toISOString(),
    dataDate: null,
    sources: {},
  };

  try {
    // 1. 저평가 우량주 데이터 (10000개)
    console.log('\n📊 Fetching undervalued stocks...');
    try {
      const undervaluedResponse = await apiClient.get('/api/undervalued-stocks/export', {
        params: { limit: 10000 },
      });

      saveJSON('undervalued-stocks.json', {
        lastUpdated: undervaluedResponse.data.lastUpdated,
        dataDate: undervaluedResponse.data.dataDate,
        totalCount: undervaluedResponse.data.totalCount,
        stocks: undervaluedResponse.data.stocks,
      });

      metadata.dataDate = undervaluedResponse.data.dataDate;
      metadata.sources.undervaluedStocks = {
        count: undervaluedResponse.data.totalCount,
        updatedAt: undervaluedResponse.data.lastUpdated,
      };

      console.log(`   ✓ ${undervaluedResponse.data.totalCount} stocks fetched`);
    } catch (error) {
      console.error('   ✗ Failed to fetch undervalued stocks:', error.message);
      // 실패 시 빈 데이터 저장
      saveJSON('undervalued-stocks.json', {
        lastUpdated: new Date().toISOString(),
        dataDate: null,
        totalCount: 0,
        stocks: [],
      });
    }

    // 2. 오늘의 주목 종목 (Featured Stocks)
    console.log('\n⭐ Fetching featured stocks...');
    try {
      const featuredResponse = await apiClient.get('/api/undervalued-stocks/featured', {
        params: { limit: 10 },
      });

      saveJSON('featured-stocks.json', {
        lastUpdated: new Date().toISOString(),
        totalCount: featuredResponse.data.length,
        stocks: featuredResponse.data,
      });

      metadata.sources.featuredStocks = {
        count: featuredResponse.data.length,
        updatedAt: new Date().toISOString(),
      };

      console.log(`   ✓ ${featuredResponse.data.length} featured stocks fetched`);
    } catch (error) {
      console.error('   ✗ Failed to fetch featured stocks:', error.message);
      saveJSON('featured-stocks.json', {
        lastUpdated: new Date().toISOString(),
        totalCount: 0,
        stocks: [],
      });
    }

    // 3. 공시 정보 (Filings)
    console.log('\n📋 Fetching filings...');
    try {
      const filingsResponse = await apiClient.get('/api/sec-filings/latest', {
        params: { limit: 20 },
      });

      saveJSON('filings.json', {
        lastUpdated: new Date().toISOString(),
        totalCount: filingsResponse.data.length,
        filings: filingsResponse.data,
      });

      metadata.sources.filings = {
        count: filingsResponse.data.length,
        updatedAt: new Date().toISOString(),
      };

      console.log(`   ✓ ${filingsResponse.data.length} filings fetched`);
    } catch (error) {
      console.error('   ✗ Failed to fetch filings:', error.message);
      saveJSON('filings.json', {
        lastUpdated: new Date().toISOString(),
        totalCount: 0,
        filings: [],
      });
    }

    // 4. 주가 히스토리 데이터 (Featured 종목의 3개월 데이터)
    console.log('\n📈 Fetching stock price history...');
    try {
      // 최신 데이터 날짜 조회
      const latestDateResponse = await apiClient.get('/api/undervalued-stocks/latest-date');
      const latestDate = latestDateResponse.data.latestDate;

      if (!latestDate) {
        throw new Error('Latest date not available');
      }

      console.log(`   Latest data date: ${latestDate}`);

      // 날짜 범위 생성 (3개월, 주 단위)
      const generateDateRange = (endDate, months, interval = 7) => {
        const end = new Date(endDate);
        const start = new Date(endDate);
        start.setMonth(start.getMonth() - months);

        const dates = [];
        const current = new Date(start);

        while (current <= end) {
          dates.push(current.toISOString().split('T')[0]);
          current.setDate(current.getDate() + interval);
        }

        if (dates[dates.length - 1] !== endDate) {
          dates.push(endDate);
        }

        return dates;
      };

      const dates = generateDateRange(latestDate, 3, 7);
      console.log(`   Generated ${dates.length} dates to fetch`);

      // Featured stocks 목록 가져오기
      const featuredResponse = await apiClient.get('/api/undervalued-stocks/featured', {
        params: { limit: 10 },
      });

      const featuredStocks = featuredResponse.data;
      console.log(`   Featured stocks: ${featuredStocks.length}`);

      // 각 종목의 히스토리 데이터 수집
      const stockHistories = {};
      let totalFetched = 0;

      for (const stock of featuredStocks) {
        const ticker = stock.ticker || stock.symbol;
        console.log(`   Fetching history for ${ticker}...`);

        const historyData = [];

        for (const date of dates) {
          try {
            const historyResponse = await apiClient.get(
              `/api/undervalued-stocks/${ticker}/history`,
              { params: { date } }
            );
            historyData.push(historyResponse.data);
            totalFetched++;
          } catch (err) {
            console.warn(`     ⚠ Failed to fetch ${ticker} on ${date}: ${err.message}`);
          }
        }

        stockHistories[ticker] = {
          ticker,
          name: stock.name || stock.companyName,
          dataPoints: historyData.length,
          history: historyData,
        };

        console.log(`     ✓ ${ticker}: ${historyData.length}/${dates.length} data points`);
      }

      saveJSON('stock-histories.json', {
        lastUpdated: new Date().toISOString(),
        latestDate: latestDate,
        dateRange: {
          start: dates[0],
          end: dates[dates.length - 1],
          interval: 7,
          totalDates: dates.length,
        },
        totalStocks: Object.keys(stockHistories).length,
        totalDataPoints: totalFetched,
        stocks: stockHistories,
      });

      metadata.sources.stockHistories = {
        count: Object.keys(stockHistories).length,
        dataPoints: totalFetched,
        updatedAt: new Date().toISOString(),
      };

      console.log(`   ✓ Stock histories saved: ${Object.keys(stockHistories).length} stocks, ${totalFetched} total data points`);
    } catch (error) {
      console.error('   ✗ Failed to fetch stock histories:', error.message);
      saveJSON('stock-histories.json', {
        lastUpdated: new Date().toISOString(),
        latestDate: null,
        totalStocks: 0,
        totalDataPoints: 0,
        stocks: {},
      });
    }

    // 5. 메타데이터 저장
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    metadata.duration = `${duration}s`;
    saveJSON('metadata.json', metadata);

    console.log('\n✅ All data fetched successfully!');
    console.log(`⏱️  Total time: ${duration}s`);
    console.log(`📅 Data date: ${metadata.dataDate || 'N/A'}`);

    return 0;
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
    return 1;
  }
}

// 스크립트 실행
fetchAllData()
  .then((exitCode) => {
    process.exit(exitCode);
  })
  .catch((error) => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
