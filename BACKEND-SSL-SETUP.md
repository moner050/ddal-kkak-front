# Spring Boot 백엔드 HTTPS 설정 가이드

Spring Boot 내장 Tomcat에 SSL 인증서를 적용하는 방법입니다.

## 🎯 두 가지 방법

### 방법 1: Spring Boot에 직접 SSL 적용 (간단함)
- 장점: Nginx 없이 바로 적용
- 단점: 인증서 갱신이 수동, 포트 443 사용 시 root 권한 필요

### 방법 2: Nginx 리버스 프록시 추가 (권장)
- 장점: 인증서 자동 갱신, 설정 간편, 로드 밸런싱 가능
- 단점: Nginx 설치 필요

---

## 🚀 방법 1: Spring Boot에 직접 SSL 적용

### 1단계: Let's Encrypt 인증서 발급

```bash
# 백엔드 서버에 SSH 접속

# 1. Certbot 설치
sudo yum install -y certbot  # CentOS/RHEL
# 또는
sudo apt install -y certbot  # Ubuntu/Debian

# 2. Spring Boot 서버 중지 (포트 80 사용을 위해)
# Spring Boot가 8080 포트를 사용 중이라면 중지할 필요 없음

# 3. Standalone 모드로 인증서 발급
sudo certbot certonly --standalone -d finance-mhb-api.kro.kr

# 4. 이메일 입력 및 약관 동의
# - 이메일: your-email@example.com
# - 약관 동의: Y
# - 뉴스레터: N (선택)
```

발급된 인증서 위치:
```
/etc/letsencrypt/live/finance-mhb-api.kro.kr/
├── fullchain.pem    # 인증서 + 체인
├── privkey.pem      # 개인키
├── cert.pem         # 인증서만
└── chain.pem        # 체인만
```

### 2단계: PEM을 PKCS12 형식으로 변환

Spring Boot는 PKCS12 또는 JKS 형식을 사용합니다.

```bash
# 1. PKCS12 변환 (비밀번호 입력 필요)
sudo openssl pkcs12 -export \
  -in /etc/letsencrypt/live/finance-mhb-api.kro.kr/fullchain.pem \
  -inkey /etc/letsencrypt/live/finance-mhb-api.kro.kr/privkey.pem \
  -out /etc/letsencrypt/live/finance-mhb-api.kro.kr/keystore.p12 \
  -name tomcat \
  -CAfile /etc/letsencrypt/live/finance-mhb-api.kro.kr/chain.pem \
  -caname root

# 비밀번호 입력: changeit (또는 원하는 비밀번호)
# 비밀번호 기억해두세요!

# 2. 파일 권한 설정
sudo chmod 644 /etc/letsencrypt/live/finance-mhb-api.kro.kr/keystore.p12

# 3. Spring Boot 프로젝트로 복사 (선택사항)
# 또는 application.properties에서 절대 경로 사용
sudo cp /etc/letsencrypt/live/finance-mhb-api.kro.kr/keystore.p12 /path/to/your/spring-boot-app/src/main/resources/
```

### 3단계: Spring Boot 설정 (application.properties)

**src/main/resources/application.properties**에 추가:

```properties
# ==========================================
# HTTPS 설정
# ==========================================

# SSL 활성화
server.ssl.enabled=true

# HTTPS 포트 (443 또는 8443)
server.port=443
# 또는 비-root 사용자인 경우:
# server.port=8443

# 키스토어 경로
server.ssl.key-store=/etc/letsencrypt/live/finance-mhb-api.kro.kr/keystore.p12
# 또는 classpath 사용:
# server.ssl.key-store=classpath:keystore.p12

# 키스토어 타입
server.ssl.key-store-type=PKCS12

# 키스토어 비밀번호
server.ssl.key-store-password=changeit

# 키 별칭
server.ssl.key-alias=tomcat

# TLS 버전
server.ssl.protocol=TLS
server.ssl.enabled-protocols=TLSv1.2,TLSv1.3

# Cipher Suites (보안 강화)
server.ssl.ciphers=TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256,TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384
```

또는 **application.yml**:

```yaml
server:
  port: 443
  ssl:
    enabled: true
    key-store: /etc/letsencrypt/live/finance-mhb-api.kro.kr/keystore.p12
    key-store-type: PKCS12
    key-store-password: changeit
    key-alias: tomcat
    protocol: TLS
    enabled-protocols:
      - TLSv1.2
      - TLSv1.3
```

### 4단계: HTTP → HTTPS 리다이렉트 (선택사항)

HTTP 요청을 자동으로 HTTPS로 리다이렉트하려면:

**SecurityConfig.java**:

```java
import org.apache.catalina.connector.Connector;
import org.springframework.boot.web.embedded.tomcat.TomcatServletWebServerFactory;
import org.springframework.boot.web.servlet.server.ServletWebServerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class TomcatConfig {

    @Bean
    public ServletWebServerFactory servletContainer() {
        TomcatServletWebServerFactory tomcat = new TomcatServletWebServerFactory();
        tomcat.addAdditionalTomcatConnectors(createHttpConnector());
        return tomcat;
    }

    private Connector createHttpConnector() {
        Connector connector = new Connector(TomcatServletWebServerFactory.DEFAULT_PROTOCOL);
        connector.setScheme("http");
        connector.setPort(80);
        connector.setSecure(false);
        connector.setRedirectPort(443);
        return connector;
    }
}
```

또는 더 간단한 방법:

**application.properties**에 추가:

```properties
# HTTP 커넥터 추가
server.http.port=80
```

### 5단계: 포트 443 권한 설정

일반 사용자로 포트 443을 사용하려면:

```bash
# 옵션 1: authbind 사용 (권장)
sudo yum install authbind  # CentOS/RHEL
sudo apt install authbind  # Ubuntu/Debian

sudo touch /etc/authbind/byport/443
sudo chmod 500 /etc/authbind/byport/443
sudo chown your-user /etc/authbind/byport/443

# Spring Boot 실행 시:
authbind --deep java -jar your-app.jar

# 옵션 2: setcap 사용
sudo setcap CAP_NET_BIND_SERVICE=+eip /path/to/java

# 옵션 3: sudo로 실행 (비권장)
sudo java -jar your-app.jar

# 옵션 4: 8443 포트 사용 후 iptables 리다이렉트
sudo iptables -t nat -A PREROUTING -p tcp --dport 443 -j REDIRECT --to-port 8443
```

### 6단계: 방화벽 설정

```bash
# HTTPS 포트 열기
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --reload

# 또는 iptables
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
sudo service iptables save
```

### 7단계: Spring Boot 재시작

```bash
# 애플리케이션 재시작
sudo systemctl restart your-spring-boot-service
# 또는
java -jar your-app.jar

# 테스트
curl -I https://finance-mhb-api.kro.kr/api/undervalued-stocks/health
```

### 8단계: 인증서 자동 갱신 설정

Let's Encrypt 인증서는 90일마다 갱신이 필요합니다.

**갱신 스크립트 생성**: `/etc/letsencrypt/renewal-hooks/post/renew-spring-boot.sh`

```bash
#!/bin/bash

# 인증서 갱신 후 자동으로 PKCS12 변환 및 Spring Boot 재시작

DOMAIN="finance-mhb-api.kro.kr"
CERT_PATH="/etc/letsencrypt/live/$DOMAIN"
KEYSTORE_PASSWORD="changeit"

# PKCS12 변환
openssl pkcs12 -export \
  -in "$CERT_PATH/fullchain.pem" \
  -inkey "$CERT_PATH/privkey.pem" \
  -out "$CERT_PATH/keystore.p12" \
  -name tomcat \
  -CAfile "$CERT_PATH/chain.pem" \
  -caname root \
  -password pass:$KEYSTORE_PASSWORD

# 권한 설정
chmod 644 "$CERT_PATH/keystore.p12"

# Spring Boot 재시작
systemctl restart your-spring-boot-service
# 또는
# pkill -f your-app.jar && nohup java -jar /path/to/your-app.jar > /dev/null 2>&1 &

echo "SSL certificate renewed and Spring Boot restarted"
```

```bash
# 스크립트 실행 권한
sudo chmod +x /etc/letsencrypt/renewal-hooks/post/renew-spring-boot.sh

# 갱신 테스트 (dry-run)
sudo certbot renew --dry-run

# Cron 등록 (매일 자동 갱신 시도)
sudo crontab -e
# 추가:
0 3 * * * certbot renew --quiet
```

---

## 🎯 방법 2: Nginx 리버스 프록시 추가 (권장)

이 방법이 훨씬 간단하고 관리가 쉽습니다!

### 장점
- ✅ 인증서 자동 갱신
- ✅ 설정 간편
- ✅ Spring Boot는 HTTP만 사용
- ✅ 로드 밸런싱 가능
- ✅ 포트 443 권한 문제 없음

### 1단계: Nginx 설치

```bash
sudo yum install -y nginx  # CentOS/RHEL
# 또는
sudo apt install -y nginx  # Ubuntu/Debian

sudo systemctl enable nginx
sudo systemctl start nginx
```

### 2단계: Nginx 설정

**/etc/nginx/conf.d/backend-api.conf**:

```nginx
# Upstream 정의
upstream spring_boot_backend {
    server 127.0.0.1:9876;  # Spring Boot 포트
}

# HTTP → HTTPS 리다이렉트
server {
    listen 80;
    listen [::]:80;
    server_name finance-mhb-api.kro.kr;

    # Let's Encrypt 인증서 갱신용
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # HTTPS로 리다이렉트
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS 서버
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name finance-mhb-api.kro.kr;

    # SSL 인증서 (Certbot이 자동으로 설정)
    ssl_certificate /etc/letsencrypt/live/finance-mhb-api.kro.kr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/finance-mhb-api.kro.kr/privkey.pem;

    # SSL 설정
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;

    # 로그
    access_log /var/log/nginx/backend-api-access.log;
    error_log /var/log/nginx/backend-api-error.log;

    # 타임아웃
    proxy_connect_timeout 300s;
    proxy_send_timeout 300s;
    proxy_read_timeout 300s;

    # 모든 요청을 Spring Boot로 프록시
    location / {
        proxy_pass http://spring_boot_backend;
        proxy_http_version 1.1;

        # 헤더
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Port $server_port;
    }
}
```

### 3단계: SSL 인증서 발급

```bash
# Certbot 설치
sudo yum install -y certbot python3-certbot-nginx

# 인증서 발급 (Nginx 설정 자동 업데이트)
sudo certbot --nginx -d finance-mhb-api.kro.kr

# 자동 갱신 설정 (이미 설정되어 있음)
sudo certbot renew --dry-run
```

### 4단계: 테스트

```bash
# Nginx 재시작
sudo systemctl restart nginx

# 테스트
curl -I https://finance-mhb-api.kro.kr/api/undervalued-stocks/health
```

### 5단계: Spring Boot는 HTTP 유지

Spring Boot는 그대로 HTTP 포트 9876에서 실행:

**application.properties**:
```properties
server.port=9876
# SSL 설정 불필요!
```

---

## 📊 방법 비교

| 항목 | 방법 1: Spring Boot 직접 | 방법 2: Nginx 프록시 |
|------|--------------------------|---------------------|
| 난이도 | 중간 | 쉬움 |
| 인증서 갱신 | 수동 스크립트 필요 | 자동 |
| 포트 443 권한 | 필요 | 불필요 |
| 성능 | 좋음 | 매우 좋음 |
| 관리 편의성 | 보통 | 우수 |
| 로드 밸런싱 | 불가 | 가능 |
| 권장 여부 | ⚠️ 작은 프로젝트 | ✅ 권장 |

---

## 🚀 빠른 시작 (방법 2 권장)

```bash
# 1. Nginx 설치
sudo yum install -y nginx certbot python3-certbot-nginx

# 2. Nginx 설정
sudo vi /etc/nginx/conf.d/backend-api.conf
# 위의 Nginx 설정 복사

# 3. SSL 인증서 발급
sudo certbot --nginx -d finance-mhb-api.kro.kr

# 4. Nginx 재시작
sudo systemctl restart nginx

# 5. 테스트
curl -I https://finance-mhb-api.kro.kr/api/undervalued-stocks/health
```

Spring Boot는 그대로 HTTP로 실행하면 됩니다!

---

## ✅ 프론트엔드 설정 업데이트

백엔드가 HTTPS로 변경되었으니 프론트엔드도 업데이트:

```bash
cd /var/www/ddal-kkak-front

# ecosystem.config.js 수정
vi ecosystem.config.js
```

변경:
```javascript
env: {
  NODE_ENV: 'production',
  PORT: 3000,
  EXPO_PUBLIC_API_URL: 'https://finance-mhb-api.kro.kr',  // ✅ HTTPS
},
```

```bash
# 재빌드 및 재시작
npm run build:web
pm2 restart ddal-kkak-front --update-env
```

---

## 🆘 트러블슈팅

### 문제: PKCS12 변환 시 에러

```bash
# 에러: unable to load certificates
sudo ls -la /etc/letsencrypt/live/finance-mhb-api.kro.kr/

# 권한 확인
sudo chmod 644 /etc/letsencrypt/live/finance-mhb-api.kro.kr/*.pem
```

### 문제: Spring Boot가 포트 443에서 시작 안 됨

```
Permission denied (bind failed) on port 443
```

해결:
```bash
# 방법 1: 8443 사용 + iptables
server.port=8443
sudo iptables -t nat -A PREROUTING -p tcp --dport 443 -j REDIRECT --to-port 8443

# 방법 2: authbind 사용
authbind --deep java -jar your-app.jar

# 방법 3: Nginx 사용 (권장)
```

### 문제: 인증서 갱신 실패

```bash
# Spring Boot 중지
sudo systemctl stop your-spring-boot-service

# 갱신
sudo certbot renew

# 재시작
sudo systemctl start your-spring-boot-service
```

---

**권장**: **방법 2 (Nginx 리버스 프록시)**를 사용하세요!
- 훨씬 간단하고 관리가 쉽습니다
- 인증서 자동 갱신
- Spring Boot 코드 변경 불필요

