/**
 * PM2 Ecosystem Configuration
 * CentOS 서버 배포용 PM2 설정 파일
 *
 * 사용법:
 * - 시작: npm run pm2:start 또는 pm2 start ecosystem.config.js
 * - 중지: npm run pm2:stop 또는 pm2 stop ecosystem.config.js
 * - 재시작: npm run pm2:restart 또는 pm2 restart ecosystem.config.js
 * - 로그: npm run pm2:logs 또는 pm2 logs ddal-kkak-front
 * - 모니터링: npm run pm2:monit 또는 pm2 monit
 */

module.exports = {
  apps: [
    {
      // Application Name
      name: 'ddal-kkak-front',

      // Application Entry Point
      script: './server.js',

      // Working Directory
      cwd: './',

      // Execution Mode
      exec_mode: 'cluster', // 클러스터 모드로 여러 인스턴스 실행
      instances: 2, // CPU 코어 수에 맞게 조정 (또는 'max'로 설정하면 모든 코어 사용)

      // Auto-restart Settings
      autorestart: true, // 크래시 시 자동 재시작
      watch: false, // 파일 변경 감지 비활성화 (프로덕션에서는 false 권장)
      max_memory_restart: '1G', // 메모리 1GB 초과 시 재시작

      // Environment Variables
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        EXPO_PUBLIC_API_URL: 'http://localhost:9876', // 백엔드 API URL (서버에 맞게 수정)
      },

      env_development: {
        NODE_ENV: 'development',
        PORT: 3000,
        EXPO_PUBLIC_API_URL: 'http://localhost:9876',
      },

      env_staging: {
        NODE_ENV: 'staging',
        PORT: 3000,
        EXPO_PUBLIC_API_URL: 'http://staging-api.example.com',
      },

      // Log Settings
      error_file: './logs/pm2-error.log', // 에러 로그 파일
      out_file: './logs/pm2-out.log', // 표준 출력 로그 파일
      log_file: './logs/pm2-combined.log', // 통합 로그 파일
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z', // 로그 날짜 형식
      merge_logs: true, // 로그 병합

      // Advanced Settings
      min_uptime: '10s', // 최소 가동 시간 (10초 이하면 비정상 재시작으로 간주)
      max_restarts: 10, // 1분 내 최대 재시작 횟수
      kill_timeout: 5000, // SIGINT 후 SIGKILL까지 대기 시간 (ms)
      listen_timeout: 10000, // 앱 시작 후 리스닝까지 대기 시간 (ms)

      // Source Map Support
      source_map_support: false,

      // Time Settings
      time: true, // 타임스탬프 표시
    },
  ],

  /**
   * PM2 Deploy Configuration (선택사항)
   * SSH를 통한 자동 배포 설정
   */
  deploy: {
    production: {
      user: 'deploy', // SSH 사용자명
      host: 'your-server-ip', // 서버 IP 또는 도메인
      ref: 'origin/main', // 배포할 Git 브랜치
      repo: 'https://github.com/moner050/ddal-kkak-front.git', // Git 저장소
      path: '/var/www/ddal-kkak-front', // 서버 배포 경로
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build:web && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
    },
  },
};
