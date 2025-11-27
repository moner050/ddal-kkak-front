/**
 * 접속 로그 및 분석 유틸리티
 * 사용자 접속 정보를 수집하고 콘솔/서버에 기록
 */

import { Platform } from 'react-native';

export interface VisitLog {
  timestamp: string;
  sessionId: string;
  userAgent: string;
  platform: string;
  screenWidth: number;
  screenHeight: number;
  language: string;
  referrer: string;
  timezone: string;
  isReturningVisitor: boolean;
}

/**
 * 세션 ID 생성 또는 조회
 */
function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return 'server-side';

  try {
    const STORAGE_KEY = 'ddal-kkak-session-id';
    let sessionId = localStorage.getItem(STORAGE_KEY);

    if (!sessionId) {
      // 새 세션 ID 생성 (UUID v4 형식)
      sessionId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
      localStorage.setItem(STORAGE_KEY, sessionId);
    }

    return sessionId;
  } catch (error) {
    console.error('Failed to get/create session ID:', error);
    return 'unknown';
  }
}

/**
 * 재방문 여부 확인
 */
function checkReturningVisitor(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const VISIT_KEY = 'ddal-kkak-first-visit';
    const hasVisited = localStorage.getItem(VISIT_KEY);

    if (!hasVisited) {
      localStorage.setItem(VISIT_KEY, new Date().toISOString());
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * 접속 정보 수집
 */
export function collectVisitInfo(): VisitLog {
  const timestamp = new Date().toISOString();
  const sessionId = getOrCreateSessionId();
  const isReturningVisitor = checkReturningVisitor();

  // 기본값 (서버 사이드 또는 정보 없을 때)
  let visitLog: VisitLog = {
    timestamp,
    sessionId,
    userAgent: 'unknown',
    platform: Platform.OS,
    screenWidth: 0,
    screenHeight: 0,
    language: 'unknown',
    referrer: 'direct',
    timezone: 'unknown',
    isReturningVisitor,
  };

  // 브라우저 환경에서만 추가 정보 수집
  if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
    visitLog = {
      ...visitLog,
      userAgent: navigator.userAgent || 'unknown',
      screenWidth: window.screen?.width || 0,
      screenHeight: window.screen?.height || 0,
      language: navigator.language || 'unknown',
      referrer: document.referrer || 'direct',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown',
    };
  }

  return visitLog;
}

/**
 * 브라우저/OS 정보 파싱
 */
export function parseUserAgent(userAgent: string): {
  browser: string;
  os: string;
  device: string;
} {
  const ua = userAgent.toLowerCase();

  // 브라우저 감지
  let browser = 'Unknown';
  if (ua.includes('chrome') && !ua.includes('edg')) browser = 'Chrome';
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
  else if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('edg')) browser = 'Edge';
  else if (ua.includes('opera') || ua.includes('opr')) browser = 'Opera';

  // OS 감지
  let os = 'Unknown';
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';

  // 디바이스 타입
  let device = 'Desktop';
  if (ua.includes('mobile')) device = 'Mobile';
  else if (ua.includes('tablet') || ua.includes('ipad')) device = 'Tablet';

  return { browser, os, device };
}

/**
 * 콘솔에 접속 로그 출력
 */
export function logVisitToConsole(visitLog: VisitLog) {
  const { browser, os, device } = parseUserAgent(visitLog.userAgent);

  console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #4f46e5');
  console.log('%c📊 딸깍 - 사용자 접속 로그', 'color: #4f46e5; font-size: 16px; font-weight: bold');
  console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #4f46e5');
  console.log('');
  console.log('%c⏰ 접속 시간', 'color: #059669; font-weight: bold');
  console.log(`   ${new Date(visitLog.timestamp).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: visitLog.timezone,
  })} (${visitLog.timezone})`);
  console.log('');
  console.log('%c🆔 세션 정보', 'color: #059669; font-weight: bold');
  console.log(`   세션 ID: ${visitLog.sessionId}`);
  console.log(`   방문 유형: ${visitLog.isReturningVisitor ? '재방문 🔄' : '첫 방문 ✨'}`);
  console.log('');
  console.log('%c💻 디바이스 정보', 'color: #059669; font-weight: bold');
  console.log(`   브라우저: ${browser}`);
  console.log(`   운영체제: ${os}`);
  console.log(`   디바이스: ${device}`);
  console.log(`   화면 크기: ${visitLog.screenWidth} x ${visitLog.screenHeight}`);
  console.log('');
  console.log('%c🌐 환경 정보', 'color: #059669; font-weight: bold');
  console.log(`   언어: ${visitLog.language}`);
  console.log(`   플랫폼: ${visitLog.platform}`);
  console.log(`   유입 경로: ${visitLog.referrer === 'direct' ? '직접 방문' : visitLog.referrer}`);
  console.log('');
  console.log('%c🔍 User Agent', 'color: #6b7280; font-size: 10px');
  console.log(`   ${visitLog.userAgent}`);
  console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #4f46e5');
}

/**
 * 파일에 로그 저장 (개발 환경 전용)
 */
export function saveVisitLogToFile(visitLog: VisitLog) {
  if (typeof window === 'undefined') return;

  try {
    const LOG_KEY = 'ddal-kkak-visit-logs';
    const existingLogs = localStorage.getItem(LOG_KEY);
    const logs = existingLogs ? JSON.parse(existingLogs) : [];

    // 최근 100개만 유지
    logs.push(visitLog);
    if (logs.length > 100) {
      logs.shift();
    }

    localStorage.setItem(LOG_KEY, JSON.stringify(logs));
    console.log(`✅ 접속 로그 저장 완료 (총 ${logs.length}개)`);
  } catch (error) {
    console.error('Failed to save visit log:', error);
  }
}

/**
 * 저장된 로그 조회
 */
export function getVisitLogs(): VisitLog[] {
  if (typeof window === 'undefined') return [];

  try {
    const LOG_KEY = 'ddal-kkak-visit-logs';
    const existingLogs = localStorage.getItem(LOG_KEY);
    return existingLogs ? JSON.parse(existingLogs) : [];
  } catch (error) {
    console.error('Failed to get visit logs:', error);
    return [];
  }
}

/**
 * 로그 내보내기 (CSV)
 */
export function exportLogsToCSV() {
  const logs = getVisitLogs();
  if (logs.length === 0) {
    console.warn('저장된 로그가 없습니다.');
    return;
  }

  const headers = ['접속시간', '세션ID', '브라우저', 'OS', '디바이스', '화면크기', '언어', '유입경로', '재방문'];
  const rows = logs.map(log => {
    const { browser, os, device } = parseUserAgent(log.userAgent);
    return [
      new Date(log.timestamp).toLocaleString('ko-KR'),
      log.sessionId,
      browser,
      os,
      device,
      `${log.screenWidth}x${log.screenHeight}`,
      log.language,
      log.referrer,
      log.isReturningVisitor ? '재방문' : '첫방문',
    ];
  });

  const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `ddal-kkak-logs-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();

  console.log(`📥 ${logs.length}개의 로그를 CSV 파일로 내보냈습니다.`);
}

/**
 * 백엔드로 로그 전송 (옵션)
 */
export async function sendVisitLogToServer(visitLog: VisitLog) {
  try {
    const { analyticsApi } = await import('../api/client');

    const response = await analyticsApi.sendVisitLog(visitLog);

    if (response.success) {
      console.log('✅ 접속 로그가 서버에 전송되었습니다:', response.data);
    } else {
      console.warn('⚠️ 접속 로그 전송 실패:', response.message);
    }
  } catch (error: any) {
    // 404 에러는 백엔드에 엔드포인트가 없는 경우이므로 무시
    if (error?.response?.status === 404) {
      console.log('📡 접속 로그 서버 전송 기능은 백엔드 엔드포인트 구현 후 활성화됩니다.');
      console.log('   백엔드에 POST /api/v1/analytics/visit 추가 필요');
    } else {
      console.error('Failed to send visit log to server:', error);
    }
  }
}

/**
 * 접속 로그 초기화 (앱 시작 시 자동 호출)
 */
export function initializeVisitTracking(sendToServer: boolean = true) {
  const visitLog = collectVisitInfo();

  // 콘솔에 출력
  logVisitToConsole(visitLog);

  // 로컬 스토리지에 저장
  saveVisitLogToFile(visitLog);

  // 백엔드로 전송 (옵션)
  if (sendToServer) {
    sendVisitLogToServer(visitLog);
  }
}

// 전역 함수로 노출 (브라우저 콘솔에서 접근 가능)
if (typeof window !== 'undefined') {
  (window as any).exportVisitLogs = exportLogsToCSV;
  (window as any).getVisitLogs = getVisitLogs;
}
