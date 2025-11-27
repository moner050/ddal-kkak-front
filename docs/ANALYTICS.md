# 접속 로그 및 분석 기능

사용자 접속 정보를 수집하고 로그를 남기는 기능입니다.

## 기능 개요

### 자동 수집 정보
- ⏰ **접속 시간**: 타임스탬프, 타임존
- 🆔 **세션 정보**: 고유 세션 ID, 첫 방문/재방문 여부
- 💻 **디바이스 정보**: 브라우저, 운영체제, 디바이스 타입, 화면 크기
- 🌐 **환경 정보**: 언어, 플랫폼, 유입 경로(Referrer)
- 🔍 **User Agent**: 전체 User Agent 문자열

### 로그 저장 방식
1. **브라우저 콘솔**: 보기 좋게 포맷된 로그 출력
2. **로컬 스토리지**: 최근 100개 접속 로그 저장
3. **백엔드 서버**: API를 통해 서버로 전송 (옵션)

## 사용 방법

### 1. 자동 로그 기록
앱 시작 시 자동으로 접속 로그가 기록됩니다. (`app/_layout.tsx`에서 자동 실행)

### 2. 브라우저 콘솔에서 로그 확인
웹 브라우저 개발자 도구(F12)를 열면 다음과 같은 형식으로 접속 로그가 표시됩니다:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 딸깍 - 사용자 접속 로그
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⏰ 접속 시간
   2025-01-27 14:30:45 (Asia/Seoul)

🆔 세션 정보
   세션 ID: 550e8400-e29b-41d4-a716-446655440000
   방문 유형: 첫 방문 ✨

💻 디바이스 정보
   브라우저: Chrome
   운영체제: Windows
   디바이스: Desktop
   화면 크기: 1920 x 1080

🌐 환경 정보
   언어: ko-KR
   플랫폼: web
   유입 경로: https://google.com

🔍 User Agent
   Mozilla/5.0 (Windows NT 10.0; Win64; x64) ...
```

### 3. 저장된 로그 조회
브라우저 콘솔에서 다음 명령어로 저장된 로그를 확인할 수 있습니다:

```javascript
// 저장된 모든 로그 조회
getVisitLogs()

// CSV 파일로 내보내기
exportVisitLogs()
```

### 4. CSV 파일로 내보내기
`exportVisitLogs()` 함수를 실행하면 다음 정보가 포함된 CSV 파일이 다운로드됩니다:
- 접속시간
- 세션ID
- 브라우저
- OS
- 디바이스
- 화면크기
- 언어
- 유입경로
- 재방문 여부

## 백엔드 구현 가이드

### 필요한 엔드포인트

#### POST `/api/v1/analytics/visit`

**Request Body:**
```json
{
  "timestamp": "2025-01-27T14:30:45.123Z",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) ...",
  "platform": "web",
  "screenWidth": 1920,
  "screenHeight": 1080,
  "language": "ko-KR",
  "referrer": "https://google.com",
  "timezone": "Asia/Seoul",
  "isReturningVisitor": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "접속 로그가 저장되었습니다",
  "data": {
    "id": "12345",
    "timestamp": "2025-01-27T14:30:45.123Z"
  }
}
```

### Spring Boot 예시 코드

#### 1. Entity
```java
@Entity
@Table(name = "visit_logs")
public class VisitLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String timestamp;
    private String sessionId;
    private String userAgent;
    private String platform;
    private Integer screenWidth;
    private Integer screenHeight;
    private String language;
    private String referrer;
    private String timezone;
    private Boolean isReturningVisitor;

    // IP 주소는 서버에서 추출
    private String ipAddress;

    @CreatedDate
    private LocalDateTime createdAt;

    // Getters and Setters
}
```

#### 2. DTO
```java
public record VisitLogRequest(
    String timestamp,
    String sessionId,
    String userAgent,
    String platform,
    Integer screenWidth,
    Integer screenHeight,
    String language,
    String referrer,
    String timezone,
    Boolean isReturningVisitor
) {}

public record VisitLogResponse(
    Boolean success,
    String message,
    VisitLogData data
) {
    public record VisitLogData(
        String id,
        String timestamp
    ) {}
}
```

#### 3. Controller
```java
@RestController
@RequestMapping("/api/v1/analytics")
public class AnalyticsController {

    @Autowired
    private VisitLogService visitLogService;

    @PostMapping("/visit")
    public ResponseEntity<VisitLogResponse> logVisit(
            @RequestBody VisitLogRequest request,
            HttpServletRequest httpRequest) {

        // IP 주소 추출
        String ipAddress = getClientIp(httpRequest);

        // 로그 저장
        VisitLog savedLog = visitLogService.saveVisitLog(request, ipAddress);

        return ResponseEntity.ok(new VisitLogResponse(
            true,
            "접속 로그가 저장되었습니다",
            new VisitLogResponse.VisitLogData(
                savedLog.getId().toString(),
                savedLog.getTimestamp()
            )
        ));
    }

    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("HTTP_CLIENT_IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("HTTP_X_FORWARDED_FOR");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        return ip;
    }
}
```

#### 4. Service
```java
@Service
public class VisitLogService {

    @Autowired
    private VisitLogRepository visitLogRepository;

    public VisitLog saveVisitLog(VisitLogRequest request, String ipAddress) {
        VisitLog log = new VisitLog();
        log.setTimestamp(request.timestamp());
        log.setSessionId(request.sessionId());
        log.setUserAgent(request.userAgent());
        log.setPlatform(request.platform());
        log.setScreenWidth(request.screenWidth());
        log.setScreenHeight(request.screenHeight());
        log.setLanguage(request.language());
        log.setReferrer(request.referrer());
        log.setTimezone(request.timezone());
        log.setIsReturningVisitor(request.isReturningVisitor());
        log.setIpAddress(ipAddress);

        return visitLogRepository.save(log);
    }

    // 통계 조회 메서드들 추가 가능
    public Map<String, Object> getVisitStats() {
        // 총 방문자 수, 일별 방문자, 브라우저 비율 등
    }
}
```

## 로그 분석

### 로그 파일 위치
- **브라우저 콘솔**: F12 개발자 도구
- **로컬 스토리지**: `localStorage.getItem('ddal-kkak-visit-logs')`
- **CSV 파일**: `exportVisitLogs()` 실행 시 다운로드

### 분석 가능한 정보
1. **트래픽 분석**: 일별/시간별 방문자 수
2. **디바이스 분석**: 모바일/데스크톱/태블릿 비율
3. **브라우저 분석**: Chrome, Safari, Firefox 등 비율
4. **OS 분석**: Windows, macOS, Linux, iOS, Android 비율
5. **유입 경로**: 직접 방문, 검색 엔진, 소셜 미디어 등
6. **재방문율**: 첫 방문자 vs 재방문자 비율
7. **화면 크기**: 반응형 디자인 최적화 참고

## 개인정보 보호

### 수집하는 정보
- IP 주소는 **백엔드에서만** 수집 (프론트엔드에서는 직접 접근 불가)
- 세션 ID는 브라우저에서 생성된 랜덤 UUID
- 개인 식별 정보는 수집하지 않음

### GDPR/개인정보보호법 준수
- 쿠키 동의 없이 수집 가능한 기술적 정보만 수집
- 로그 보관 기간 설정 권장 (예: 90일)
- 사용자 요청 시 로그 삭제 기능 구현 권장

## 설정

### 서버 전송 비활성화
백엔드로 로그를 전송하지 않으려면:

```typescript
// app/_layout.tsx
initializeVisitTracking(false); // 서버 전송 비활성화
```

### 로컬 저장만 사용
```typescript
import { collectVisitInfo, saveVisitLogToFile, logVisitToConsole } from '../src/utils/analytics';

const visitLog = collectVisitInfo();
logVisitToConsole(visitLog);
saveVisitLogToFile(visitLog);
// sendVisitLogToServer 호출하지 않음
```

## 문제 해결

### 로그가 출력되지 않음
- 브라우저 개발자 도구(F12) 콘솔 탭 확인
- 콘솔 필터가 "모두"로 설정되어 있는지 확인

### 백엔드 전송 실패
- 네트워크 탭에서 API 요청 상태 확인
- 백엔드 엔드포인트가 구현되어 있는지 확인
- CORS 설정 확인

### 세션 ID가 매번 변경됨
- 브라우저 시크릿 모드에서는 매번 새 세션 ID 생성
- localStorage가 비활성화되어 있지 않은지 확인

## 향후 기능 추가 아이디어

1. **실시간 대시보드**: 현재 접속자 수 표시
2. **히트맵**: 사용자 클릭 위치 추적
3. **페이지 체류 시간**: 각 페이지별 머문 시간 측정
4. **이벤트 트래킹**: 버튼 클릭, 스크롤 깊이 등
5. **A/B 테스트**: 다양한 UI 버전 테스트
6. **에러 트래킹**: JavaScript 에러 자동 수집
