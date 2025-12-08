#!/usr/bin/env node

/**
 * Scheduler 테스트 스크립트
 * Cron job이 제대로 동작하는지 테스트
 *
 * 사용법:
 *   node scripts/test-scheduler.js
 */

const cron = require('node-cron');
const { fetchAllData } = require('./fetch-data');

console.log('');
console.log('='.repeat(60));
console.log('🧪 Scheduler Test Script');
console.log('='.repeat(60));
console.log('');

// 현재 시간 출력 (KST)
const now = new Date();
const kstTime = now.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
const utcTime = now.toISOString();

console.log(`⏰ Current Time (KST): ${kstTime}`);
console.log(`⏰ Current Time (UTC): ${utcTime}`);
console.log('');

// 1분 후에 실행되는 테스트 cron job
const testMinute = (now.getMinutes() + 1) % 60;
const testHour = testMinute === 0 ? (now.getHours() + 1) % 24 : now.getHours();

console.log(`📅 Test cron will run at: ${String(testHour).padStart(2, '0')}:${String(testMinute).padStart(2, '0')} (1 minute from now)`);
console.log('');

const testJob = cron.schedule(`${testMinute} ${testHour} * * *`, async () => {
  const runTime = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
  console.log('');
  console.log('='.repeat(60));
  console.log(`🎯 Test Cron Job Triggered! (KST: ${runTime})`);
  console.log('='.repeat(60));

  try {
    await fetchAllData();
    console.log('✅ Test data fetch completed successfully');
  } catch (error) {
    console.error('❌ Test data fetch failed:', error.message);
  }

  console.log('='.repeat(60));
  console.log('');
  console.log('✅ Test completed. Exiting in 5 seconds...');

  setTimeout(() => {
    testJob.stop();
    process.exit(0);
  }, 5000);
}, {
  scheduled: true,
  timezone: 'Asia/Seoul'
});

console.log('✅ Test cron job scheduled');
console.log('⏳ Waiting for trigger... (Press Ctrl+C to cancel)');
console.log('');

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Test cancelled by user');
  testJob.stop();
  process.exit(0);
});
