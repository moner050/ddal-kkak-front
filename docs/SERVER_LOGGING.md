# 서버 접속 로그 구현 가이드

백엔드 서버의 콘솔 및 로그 파일에 접속 정보를 기록하는 방법입니다.

## Spring Boot 구현

### 1. Logging Filter (추천)

모든 HTTP 요청을 가로채서 로그를 남기는 필터를 구현합니다.

```java
package com.example.config;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Slf4j
@Component
public class AccessLoggingFilter implements Filter {

    private static final DateTimeFormatter DATE_FORMATTER =
        DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest httpRequest = (HttpServletRequest) request;

        // 접속 정보 수집
        String timestamp = LocalDateTime.now().format(DATE_FORMATTER);
        String ipAddress = getClientIp(httpRequest);
        String method = httpRequest.getMethod();
        String uri = httpRequest.getRequestURI();
        String userAgent = httpRequest.getHeader("User-Agent");
        String referer = httpRequest.getHeader("Referer");
        String acceptLanguage = httpRequest.getHeader("Accept-Language");

        // 브라우저 및 OS 파싱
        String browser = parseBrowser(userAgent);
        String os = parseOS(userAgent);

        // 콘솔 로그 출력
        log.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        log.info("📊 사용자 접속 로그");
        log.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        log.info("⏰ 접속 시간: {}", timestamp);
        log.info("🌐 IP 주소: {}", ipAddress);
        log.info("📍 요청: {} {}", method, uri);
        log.info("💻 브라우저: {}", browser);
        log.info("💻 OS: {}", os);
        log.info("🔗 Referer: {}", referer != null ? referer : "직접 방문");
        log.info("🌍 언어: {}", acceptLanguage != null ? acceptLanguage : "N/A");
        log.info("🔍 User-Agent: {}", userAgent);
        log.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

        // 다음 필터로 전달
        chain.doFilter(request, response);
    }

    /**
     * 실제 클라이언트 IP 주소 추출 (프록시 고려)
     */
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

        // X-Forwarded-For에 여러 IP가 있을 경우 첫 번째 IP 사용
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }

        return ip;
    }

    /**
     * User-Agent에서 브라우저 파싱
     */
    private String parseBrowser(String userAgent) {
        if (userAgent == null) return "Unknown";

        String ua = userAgent.toLowerCase();
        if (ua.contains("edg/")) return "Edge";
        if (ua.contains("chrome/") && !ua.contains("edg")) return "Chrome";
        if (ua.contains("safari/") && !ua.contains("chrome")) return "Safari";
        if (ua.contains("firefox/")) return "Firefox";
        if (ua.contains("opera/") || ua.contains("opr/")) return "Opera";

        return "Other";
    }

    /**
     * User-Agent에서 OS 파싱
     */
    private String parseOS(String userAgent) {
        if (userAgent == null) return "Unknown";

        String ua = userAgent.toLowerCase();
        if (ua.contains("windows")) return "Windows";
        if (ua.contains("mac os x") || ua.contains("macintosh")) return "macOS";
        if (ua.contains("linux")) return "Linux";
        if (ua.contains("android")) return "Android";
        if (ua.contains("iphone") || ua.contains("ipad")) return "iOS";

        return "Other";
    }
}
```

### 2. Logback 설정 (로그 파일 저장)

`src/main/resources/logback-spring.xml` 파일을 생성하거나 수정:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <!-- 콘솔 출력 -->
    <appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
        <encoder>
            <pattern>%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n</pattern>
            <charset>UTF-8</charset>
        </encoder>
    </appender>

    <!-- 접속 로그 파일 -->
    <appender name="ACCESS_LOG" class="ch.qos.logback.core.rolling.RollingFileAppender">
        <file>logs/access.log</file>
        <encoder>
            <pattern>%d{yyyy-MM-dd HH:mm:ss} - %msg%n</pattern>
            <charset>UTF-8</charset>
        </encoder>
        <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
            <!-- 일별 로그 파일 생성 -->
            <fileNamePattern>logs/access.%d{yyyy-MM-dd}.log</fileNamePattern>
            <!-- 30일 보관 -->
            <maxHistory>30</maxHistory>
        </rollingPolicy>
    </appender>

    <!-- AccessLoggingFilter의 로그를 ACCESS_LOG로 전달 -->
    <logger name="com.example.config.AccessLoggingFilter" level="INFO" additivity="false">
        <appender-ref ref="CONSOLE" />
        <appender-ref ref="ACCESS_LOG" />
    </logger>

    <root level="INFO">
        <appender-ref ref="CONSOLE" />
    </root>
</configuration>
```

### 3. application.yml 설정

```yaml
logging:
  level:
    com.example.config.AccessLoggingFilter: INFO
  file:
    name: logs/access.log
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} - %msg%n"
    file: "%d{yyyy-MM-dd HH:mm:ss} - %msg%n"
```

## 출력 예시

### 콘솔 출력
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 사용자 접속 로그
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏰ 접속 시간: 2025-01-27 15:30:45
🌐 IP 주소: 123.456.789.012
📍 요청: GET /
💻 브라우저: Chrome
💻 OS: Windows
🔗 Referer: https://google.com
🌍 언어: ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7
🔍 User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 로그 파일 (`logs/access.log`)
```
2025-01-27 15:30:45 - ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2025-01-27 15:30:45 - 📊 사용자 접속 로그
2025-01-27 15:30:45 - ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2025-01-27 15:30:45 - ⏰ 접속 시간: 2025-01-27 15:30:45
2025-01-27 15:30:45 - 🌐 IP 주소: 123.456.789.012
2025-01-27 15:30:45 - 📍 요청: GET /
2025-01-27 15:30:45 - 💻 브라우저: Chrome
2025-01-27 15:30:45 - 💻 OS: Windows
2025-01-27 15:30:45 - 🔗 Referer: https://google.com
2025-01-27 15:30:45 - 🌍 언어: ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7
2025-01-27 15:30:45 - 🔍 User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)...
2025-01-27 15:30:45 - ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## 간단한 버전 (한 줄 로그)

더 간단하게 한 줄로 로그를 남기고 싶다면:

```java
@Slf4j
@Component
public class SimpleAccessLoggingFilter implements Filter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest httpRequest = (HttpServletRequest) request;

        String ip = getClientIp(httpRequest);
        String method = httpRequest.getMethod();
        String uri = httpRequest.getRequestURI();
        String userAgent = httpRequest.getHeader("User-Agent");

        // 한 줄 로그
        log.info("📊 접속 | IP: {} | {} {} | UA: {}",
            ip, method, uri, userAgent);

        chain.doFilter(request, response);
    }

    // getClientIp 메서드는 동일
}
```

출력:
```
2025-01-27 15:30:45 - 📊 접속 | IP: 123.456.789.012 | GET / | UA: Mozilla/5.0 (Windows NT 10.0; Win64; x64)...
```

## 특정 요청만 로깅

API 요청만 로그하거나 특정 경로를 제외하려면:

```java
@Override
public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
        throws IOException, ServletException {

    HttpServletRequest httpRequest = (HttpServletRequest) request;
    String uri = httpRequest.getRequestURI();

    // 정적 리소스는 로그에서 제외
    if (uri.startsWith("/static/") ||
        uri.startsWith("/css/") ||
        uri.startsWith("/js/") ||
        uri.startsWith("/images/") ||
        uri.endsWith(".ico")) {
        chain.doFilter(request, response);
        return;
    }

    // 로그 기록
    // ...

    chain.doFilter(request, response);
}
```

## 데이터베이스에 저장

로그를 DB에도 저장하고 싶다면:

```java
@Slf4j
@Component
@RequiredArgsConstructor
public class AccessLoggingFilter implements Filter {

    private final AccessLogRepository accessLogRepository;

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest httpRequest = (HttpServletRequest) request;

        // 접속 정보 수집
        String ip = getClientIp(httpRequest);
        String method = httpRequest.getMethod();
        String uri = httpRequest.getRequestURI();
        String userAgent = httpRequest.getHeader("User-Agent");
        String referer = httpRequest.getHeader("Referer");

        // 콘솔 로그
        log.info("📊 접속 | IP: {} | {} {}", ip, method, uri);

        // DB 저장 (비동기로 처리하여 성능 영향 최소화)
        CompletableFuture.runAsync(() -> {
            try {
                AccessLog accessLog = AccessLog.builder()
                    .ipAddress(ip)
                    .method(method)
                    .uri(uri)
                    .userAgent(userAgent)
                    .referer(referer)
                    .timestamp(LocalDateTime.now())
                    .build();

                accessLogRepository.save(accessLog);
            } catch (Exception e) {
                log.error("Failed to save access log", e);
            }
        });

        chain.doFilter(request, response);
    }
}
```

## 로그 파일 위치

기본적으로 로그 파일은 다음 위치에 생성됩니다:
- **개발 환경**: `프로젝트/logs/access.log`
- **배포 환경**: `/var/log/your-app/access.log` (설정에 따라)

## 로그 분석

### 실시간 모니터링 (Linux/Mac)
```bash
# 실시간 로그 확인
tail -f logs/access.log

# IP 주소별 접속 횟수
cat logs/access.log | grep "IP:" | awk '{print $6}' | sort | uniq -c | sort -nr

# 브라우저별 접속 횟수
cat logs/access.log | grep "브라우저:" | awk '{print $4}' | sort | uniq -c

# 시간대별 접속 분포
cat logs/access.log | grep "접속 시간:" | awk '{print $4}' | cut -d: -f1 | sort | uniq -c
```

## 주의사항

1. **성능**: 모든 요청마다 로그를 남기면 I/O 부하가 발생할 수 있습니다.
   - 비동기 로깅 사용
   - 정적 리소스는 로깅 제외
   - 로그 레벨 적절히 설정

2. **개인정보**: IP 주소는 개인정보에 해당할 수 있습니다.
   - 로그 보관 기간 설정 (30일 권장)
   - 로그 파일 접근 권한 제한
   - IP 마스킹 고려 (예: 123.456.789.*** )

3. **디스크 용량**: 로그 파일이 계속 쌓이므로 로테이션 설정 필수

4. **보안**: 민감한 정보(비밀번호, 토큰 등)는 로그에 남기지 않기
