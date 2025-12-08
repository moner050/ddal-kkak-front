/**
 * Production Web Server for Expo Web Build
 * Express 기반 정적 파일 서버 + 로깅
 *
 * 사용법:
 * 1. 빌드: npm run build:web
 * 2. 직접 실행: npm run serve 또는 node server.js
 * 3. PM2로 실행: npm run pm2:start
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const compression = require('compression');
const morgan = require('morgan');
const { createStream } = require('rotating-file-stream');
const cron = require('node-cron');
const { fetchAllData } = require('./scripts/fetch-data');

// ============================================
// Configuration
// ============================================

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'production';
const BUILD_DIR = path.join(__dirname, 'dist'); // Expo web build output
const LOG_DIR = path.join(__dirname, 'logs');

// ============================================
// Initialize Express App
// ============================================

const app = express();

// ============================================
// Logging Setup
// ============================================

// 로그 디렉토리 생성
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
  console.log(`✅ Created log directory: ${LOG_DIR}`);
}

// Access Log Stream (매일 자동 로테이션)
const accessLogStream = createStream('access.log', {
  interval: '1d', // 매일 로테이션
  path: LOG_DIR,
  maxFiles: 30, // 최대 30개 파일 보관 (30일치)
  compress: 'gzip', // 오래된 로그는 gzip 압축
});

// Error Log Stream (매일 자동 로테이션)
const errorLogStream = createStream('error.log', {
  interval: '1d',
  path: LOG_DIR,
  maxFiles: 30,
  compress: 'gzip',
});

// 커스텀 Morgan 로그 포맷
const customFormat =
  ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" ' +
  ':status :res[content-length] ":referrer" ":user-agent" :response-time ms';

// Access Log: 모든 요청 로깅
app.use(morgan(customFormat, { stream: accessLogStream }));

// Console Log: 개발 환경에서는 콘솔에도 출력
if (NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Error Log: 4xx, 5xx 에러만 에러 로그 파일에 기록
app.use(
  morgan(customFormat, {
    stream: errorLogStream,
    skip: (req, res) => res.statusCode < 400, // 400 미만 상태코드는 스킵
  })
);

// ============================================
// Middleware
// ============================================

// Gzip Compression
app.use(compression());

// Security Headers
app.use((req, res, next) => {
  // HSTS (HTTPS 강제)
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  // XSS Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Clickjacking Protection
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  // MIME Type Sniffing 방지
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  next();
});

// ============================================
// Static File Serving
// ============================================

// 빌드된 파일이 있는지 확인
if (!fs.existsSync(BUILD_DIR)) {
  console.error(`❌ Build directory not found: ${BUILD_DIR}`);
  console.error('Please run "npm run build:web" first');
  process.exit(1);
}

// 정적 파일 서빙 (캐싱 설정)
app.use(
  express.static(BUILD_DIR, {
    maxAge: '1y', // 1년 캐싱 (브라우저 캐시)
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
      // HTML 파일은 캐싱하지 않음 (항상 최신 버전)
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      }
      // JSON 데이터 파일도 캐싱 제한
      else if (filePath.endsWith('.json')) {
        res.setHeader('Cache-Control', 'public, max-age=300'); // 5분 캐싱
      }
    },
  })
);

// ============================================
// Routes
// ============================================

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV,
    nodeVersion: process.version,
    memoryUsage: process.memoryUsage(),
  });
});

// API Proxy (선택사항) - 백엔드 API로 프록시
// 필요시 주석 해제
// const { createProxyMiddleware } = require('http-proxy-middleware');
// app.use('/api', createProxyMiddleware({
//   target: process.env.EXPO_PUBLIC_API_URL || 'http://finance-mhb-api.kro.kr',
//   changeOrigin: true,
// }));

// SPA Routing: 모든 요청을 index.html로 리다이렉트
app.get('*', (req, res) => {
  res.sendFile(path.join(BUILD_DIR, 'index.html'));
});

// ============================================
// Error Handling
// ============================================

// 404 Error Handler
app.use((req, res) => {
  const errorMsg = `404 Not Found: ${req.method} ${req.url}`;
  console.error(errorMsg);
  errorLogStream.write(`${new Date().toISOString()} - ${errorMsg}\n`);

  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found',
    path: req.url,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  const errorMsg = `Server Error: ${err.message}\nStack: ${err.stack}`;
  console.error(errorMsg);
  errorLogStream.write(`${new Date().toISOString()} - ${errorMsg}\n`);

  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: NODE_ENV === 'production' ? 'Something went wrong' : err.message,
  });
});

// ============================================
// Start Server
// ============================================

const server = app.listen(PORT, () => {
  console.log('');
  console.log('='.repeat(60));
  console.log('🚀 Ddal-Kkak Front Server Started');
  console.log('='.repeat(60));
  console.log(`📍 Port:        ${PORT}`);
  console.log(`🌍 Environment: ${NODE_ENV}`);
  console.log(`📂 Build Dir:   ${BUILD_DIR}`);
  console.log(`📝 Logs Dir:    ${LOG_DIR}`);
  console.log(`🔗 Local URL:   http://localhost:${PORT}`);
  console.log('='.repeat(60));
  console.log('');
  console.log('📊 실시간 로그 확인 방법:');
  console.log(`   - Access Log: tail -f ${path.join(LOG_DIR, 'access.log')}`);
  console.log(`   - Error Log:  tail -f ${path.join(LOG_DIR, 'error.log')}`);
  console.log(`   - PM2 Log:    tail -f ${path.join(LOG_DIR, 'pm2-combined.log')}`);
  console.log(`   - PM2 명령어: npm run pm2:logs`);
  console.log('');
});

// ============================================
// Scheduled Tasks (Cron Jobs)
// ============================================

// 매일 한국시간 오전 8시 30분에 데이터 fetch
// Cron 표현식: 분 시 일 월 요일
// 30 8 * * * = 매일 08:30
const dataFetchJob = cron.schedule('30 8 * * *', async () => {
  const now = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
  console.log('');
  console.log('='.repeat(60));
  console.log(`🕐 Scheduled Data Fetch Started (KST: ${now})`);
  console.log('='.repeat(60));

  try {
    await fetchAllData();
    console.log('✅ Scheduled data fetch completed successfully');
  } catch (error) {
    console.error('❌ Scheduled data fetch failed:', error.message);
    errorLogStream.write(`${new Date().toISOString()} - SCHEDULED_FETCH_ERROR: ${error.message}\n${error.stack}\n`);
  }

  console.log('='.repeat(60));
  console.log('');
}, {
  scheduled: true,
  timezone: 'Asia/Seoul'
});

console.log('⏰ Scheduled task registered:');
console.log('   - Daily data fetch at 08:30 KST (Korea Standard Time)');
console.log('');

// Graceful Shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  // Cron job 중지
  if (dataFetchJob) {
    dataFetchJob.stop();
    console.log('✅ Scheduled tasks stopped');
  }

  server.close(() => {
    console.log('✅ HTTP server closed');

    // 로그 스트림 종료
    accessLogStream.end();
    errorLogStream.end();

    console.log('✅ Log streams closed');
    console.log('👋 Server shutdown complete');
    process.exit(0);
  });

  // 강제 종료 타임아웃 (30초)
  setTimeout(() => {
    console.error('⚠️  Forcing shutdown after timeout');
    process.exit(1);
  }, 30000);
};

// SIGTERM, SIGINT 처리
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Uncaught Exception 처리
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
  errorLogStream.write(`${new Date().toISOString()} - UNCAUGHT EXCEPTION: ${err.message}\n${err.stack}\n`);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Unhandled Rejection 처리
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  errorLogStream.write(`${new Date().toISOString()} - UNHANDLED REJECTION: ${reason}\n`);
});

module.exports = app;
