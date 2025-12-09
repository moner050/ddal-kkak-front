#!/usr/bin/env node

/**
 * 백엔드 API에서 실제 데이터를 수집하여 JSON 파일로 저장하는 스크립트
 */

const fs = require('fs');
const path = require('path');

// 설정
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://finance-mhb-api.kro.kr';
const OUTPUT_DIR = path.join(__dirname, '../public/data');
const RECOMMENDATIONS_DIR = path.join(OUTPUT_DIR, 'recommendations');

// 디렉토리 생성
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}
if (!fs.existsSync(RECOMMENDATIONS_DIR)) {
  fs.mkdirSync(RECOMMENDATIONS_DIR, { recursive: true });
}

/**
 * API 호출 헬퍼
 */
async function fetchAPI(endpoint) {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`📡 Fetching: ${url}`);

  try {
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`❌ HTTP Error ${response.status}: ${endpoint}`);
      return null;
    }

    const data = await response.json();
    console.log(`✅ Success: ${endpoint}`);
    return data;
  } catch (error) {
    console.error(`❌ Error fetching ${endpoint}:`, error.message);
    return null;
  }
}

/**
 * 지연 함수 (rate limiting)
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 1단계: 전체 종목 목록 가져오기
 */
async function fetchStocksList() {
  console.log('\n📊 Step 1: Fetching stocks list...\n');

  const data = await fetchAPI('/api/undervalued-stocks/export?limit=1000');

  if (!data || !data.stocks) {
    console.error('❌ Failed to fetch stocks list');
    return null;
  }

  // undervalued-stocks.json 저장
  const outputPath = path.join(OUTPUT_DIR, 'undervalued-stocks.json');
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
  console.log(`💾 Saved: ${outputPath}`);
  console.log(`📈 Total stocks: ${data.stocks.length}`);

  return data.stocks;
}

/**
 * 2단계: 각 종목의 추천 데이터 수집
 */
async function fetchRecommendations(stocks) {
  console.log('\n📊 Step 2: Fetching recommendation data...\n');

  const summaryData = {};
  const priceGuidanceData = {};
  const investmentRatingData = {};

  let successCount = 0;
  let failCount = 0;

  // US 종목만 필터링 (marketType이 'US'인 것만)
  const usStocks = stocks.filter(stock => stock.marketType === 'US');
  console.log(`🇺🇸 US stocks to process: ${usStocks.length}\n`);

  for (let i = 0; i < usStocks.length; i++) {
    const stock = usStocks[i];
    const symbol = stock.ticker;

    console.log(`[${i + 1}/${usStocks.length}] Processing ${symbol}...`);

    try {
      // 1. Recommendation Summary
      const summary = await fetchAPI(`/stocks/${symbol}/recommendation-summary`);
      if (summary) {
        summaryData[symbol] = summary;
      }

      await sleep(100); // 100ms 대기

      // 2. Price Guidance
      const priceGuidance = await fetchAPI(`/stocks/${symbol}/price-guidance`);
      if (priceGuidance) {
        priceGuidanceData[symbol] = priceGuidance;
      }

      await sleep(100);

      // 3. Investment Rating
      const rating = await fetchAPI(`/stocks/${symbol}/investment-rating`);
      if (rating) {
        investmentRatingData[symbol] = rating;
      }

      await sleep(100);

      // 성공한 경우만 카운트 (3개 API 모두 성공)
      if (summary && priceGuidance && rating) {
        successCount++;
        console.log(`✅ ${symbol} - All data collected\n`);
      } else {
        failCount++;
        console.log(`⚠️  ${symbol} - Partial data collected\n`);
      }

    } catch (error) {
      failCount++;
      console.error(`❌ ${symbol} - Error:`, error.message, '\n');
    }

    // 10개마다 저장 (중간 저장)
    if ((i + 1) % 10 === 0) {
      console.log('💾 Saving intermediate results...\n');
      saveRecommendationData(summaryData, priceGuidanceData, investmentRatingData);
    }
  }

  console.log('\n📊 Collection Summary:');
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📈 Total: ${usStocks.length}\n`);

  return { summaryData, priceGuidanceData, investmentRatingData };
}

/**
 * 추천 데이터 저장
 */
function saveRecommendationData(summaryData, priceGuidanceData, investmentRatingData) {
  // Summary
  const summaryPath = path.join(RECOMMENDATIONS_DIR, 'summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(summaryData, null, 2));
  console.log(`💾 Saved: ${summaryPath} (${Object.keys(summaryData).length} stocks)`);

  // Price Guidance
  const guidancePath = path.join(RECOMMENDATIONS_DIR, 'price-guidance.json');
  fs.writeFileSync(guidancePath, JSON.stringify(priceGuidanceData, null, 2));
  console.log(`💾 Saved: ${guidancePath} (${Object.keys(priceGuidanceData).length} stocks)`);

  // Investment Rating
  const ratingPath = path.join(RECOMMENDATIONS_DIR, 'investment-rating.json');
  fs.writeFileSync(ratingPath, JSON.stringify(investmentRatingData, null, 2));
  console.log(`💾 Saved: ${ratingPath} (${Object.keys(investmentRatingData).length} stocks)`);
}

/**
 * 메인 실행
 */
async function main() {
  console.log('🚀 Starting API data collection...');
  console.log(`🌐 API Base URL: ${API_BASE_URL}\n`);

  try {
    // 1단계: 종목 목록 가져오기
    const stocks = await fetchStocksList();
    if (!stocks || stocks.length === 0) {
      console.error('❌ No stocks found. Exiting.');
      process.exit(1);
    }

    // 2단계: 추천 데이터 수집
    const { summaryData, priceGuidanceData, investmentRatingData } =
      await fetchRecommendations(stocks);

    // 3단계: 최종 저장
    console.log('\n💾 Saving final results...\n');
    saveRecommendationData(summaryData, priceGuidanceData, investmentRatingData);

    console.log('\n✅ Data collection completed successfully!\n');

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// 실행
main();
