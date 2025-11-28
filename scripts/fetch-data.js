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
 * 파일 존재 여부 확인
 */
function fileExists(filename) {
  const filePath = path.join(DATA_DIR, filename);
  return fs.existsSync(filePath);
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

    let latestDataDate = null;

    try {
      const undervaluedResponse = await apiClient.get('/api/undervalued-stocks/export', {
        params: { limit: 10000 },
      });

      const stocksData = {
        lastUpdated: undervaluedResponse.data.lastUpdated,
        dataDate: undervaluedResponse.data.dataDate,
        totalCount: undervaluedResponse.data.totalCount,
        stocks: undervaluedResponse.data.stocks,
      };

      saveJSON('undervalued-stocks.json', stocksData);

      // historical data 디렉토리에도 오늘 날짜로 저장하여 중복 방지
      const historicalDir = path.join(DATA_DIR, 'undervalued-stocks');
      if (!fs.existsSync(historicalDir)) {
        fs.mkdirSync(historicalDir, { recursive: true });
      }

      const todayFile = `${undervaluedResponse.data.dataDate}.json`;
      const todayFilePath = path.join(historicalDir, todayFile);
      fs.writeFileSync(todayFilePath, JSON.stringify({
        date: undervaluedResponse.data.dataDate,
        lastUpdated: new Date().toISOString(),
        totalCount: undervaluedResponse.data.totalCount,
        stocks: undervaluedResponse.data.stocks,
      }, null, 2), 'utf-8');
      console.log(`   ✓ Also saved to ${todayFile} (avoiding duplicate fetch later)`);

      metadata.dataDate = undervaluedResponse.data.dataDate;
      latestDataDate = undervaluedResponse.data.dataDate;
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

    // 4. 날짜별 전체 종목 히스토리 데이터 (분산 저장)
    console.log('\n📈 Fetching historical stock data by date...');
    const historicalDates = [];
    try {
      // latestDataDate가 없으면 최신 데이터 날짜 조회
      let latestDate = latestDataDate;
      if (!latestDate) {
        const latestDateResponse = await apiClient.get('/api/undervalued-stocks/latest-date');
        latestDate = latestDateResponse.data.latestDate;
      }

      if (!latestDate) {
        throw new Error('Latest date not available');
      }

      console.log(`   Latest data date: ${latestDate}`);

      // 날짜 범위 생성 (1개월, 일 단위)
      const generateDateRange = (endDate, months, interval = 1) => {
        const end = new Date(endDate);
        const start = new Date(endDate);
        start.setMonth(start.getMonth() - months);

        const dates = [];
        const current = new Date(start);

        while (current <= end) {
          dates.push(current.toISOString().split('T')[0]);
          current.setDate(current.getDate() + interval);
        }

        // 오늘 날짜는 이미 위에서 저장했으므로 제외
        return dates.filter(date => date !== endDate);
      };

      const dates = generateDateRange(latestDate, 1, 1);
      console.log(`   Generated ${dates.length} dates to fetch (excluding today: ${latestDate})`);

      // undervalued-stocks 디렉토리 생성
      const historicalDir = path.join(DATA_DIR, 'undervalued-stocks');
      if (!fs.existsSync(historicalDir)) {
        fs.mkdirSync(historicalDir, { recursive: true });
        console.log('   ✓ Created undervalued-stocks directory');
      }

      // 각 날짜별로 전체 종목 데이터 수집
      let successCount = 0;
      let skippedCount = 0;
      for (let i = 0; i < dates.length; i++) {
        const date = dates[i];
        const filename = `${date}.json`;
        const filePath = path.join(historicalDir, filename);

        // 이미 파일이 존재하면 스킵
        if (fs.existsSync(filePath)) {
          console.log(`   [${i + 1}/${dates.length}] Skipping ${date} (already exists)`);
          historicalDates.push(date);
          skippedCount++;
          continue;
        }

        console.log(`   [${i + 1}/${dates.length}] Fetching data for ${date}...`);

        try {
          // 특정 날짜의 전체 종목 데이터 조회
          const historicalResponse = await apiClient.get('/api/undervalued-stocks/export', {
            params: {
              limit: 10000,
              date: date,
            },
          });

          const stocksData = historicalResponse.data.stocks || [];

          // 데이터가 비어있으면 경고
          if (stocksData.length === 0) {
            console.warn(`     ⚠️ No stocks returned for ${date} - API may not support date parameter`);
          }

          // 날짜별 파일로 저장
          fs.writeFileSync(filePath, JSON.stringify({
            date: date,
            lastUpdated: new Date().toISOString(),
            totalCount: stocksData.length,
            stocks: stocksData,
          }, null, 2), 'utf-8');

          historicalDates.push(date);
          successCount++;
          console.log(`     ✓ Saved ${stocksData.length} stocks to ${filename}`);
        } catch (err) {
          console.error(`     ✗ Failed to fetch data for ${date}: ${err.message}`);
        }

        // API 부하 방지를 위한 딜레이 (100ms)
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      metadata.sources.historicalData = {
        dates: historicalDates,
        totalDates: historicalDates.length,
        dateRange: historicalDates.length > 0 ? {
          start: historicalDates[0],
          end: historicalDates[historicalDates.length - 1],
        } : null,
        updatedAt: new Date().toISOString(),
      };

      console.log(`   ✓ Historical data: ${successCount} fetched, ${skippedCount} skipped (${successCount + skippedCount}/${dates.length} total)`);
    } catch (error) {
      console.error('   ✗ Failed to fetch historical data:', error.message);
      metadata.sources.historicalData = {
        dates: [],
        totalDates: 0,
        updatedAt: new Date().toISOString(),
      };
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
