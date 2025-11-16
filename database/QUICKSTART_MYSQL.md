# 🚀 DDalKKak 빠른 시작 가이드 (MySQL 8.0 + 서버 직접 실행)

## 환경

- **DB:** MySQL 8.0.43 (서버 직접 실행)
- **Backend:** Spring Boot (서버 직접 실행)
- **Frontend:** React Native Web Expo (서버 직접 실행)
- **배포:** Docker 없이 서버에서 직접 실행

---

## ⚡ 5분 빠른 시작

### 1단계: 환경 변수 설정 (1분)

```bash
cd database
cp .env.mysql.example .env
nano .env  # MySQL 비밀번호 수정
```

**필수 수정:**
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=ddal_kkak
DB_USER=root
DB_PASSWORD=YOUR_ACTUAL_PASSWORD
```

### 2단계: MySQL 스키마 생성 (2분)

```bash
# MySQL 접속
mysql -u root -p

# 데이터베이스 생성
CREATE DATABASE ddal_kkak DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;

# 스키마 적용
mysql -u root -p ddal_kkak < database/schema/undervalued_stocks_mysql.sql
```

### 3단계: Python 패키지 설치 (1분)

```bash
cd database/python
pip install yfinance pandas numpy pymysql sqlalchemy python-dotenv
```

### 4단계: 데이터 수집 테스트 (30분~1시간)

```bash
# 기존 Python 스크립트 준비 (기존 스크립트를 database/python/ 에 복사)
# - build_details_cache_fully_optimized.py
# - improved_stock_screener.py

# MySQL 연동 스크립트로 데이터 수집
python data_collector_with_db.py

# 스크리닝
python stock_screener_with_db.py --profile all
```

### 5단계: Spring Boot 설정 (5분)

```bash
# Java 파일 복사
cp -r database/spring-boot-mysql/* /your-spring-boot-project/src/main/java/com/ddalkkak/backend/

# application.properties 복사
cp database/spring-boot-mysql/application.properties /your-spring-boot-project/src/main/resources/

# application.properties 수정
nano /your-spring-boot-project/src/main/resources/application.properties
# MySQL 비밀번호 수정
```

**pom.xml 의존성 추가:**
```xml
<!-- MySQL Connector -->
<dependency>
    <groupId>com.mysql</groupId>
    <artifactId>mysql-connector-j</artifactId>
    <scope>runtime</scope>
</dependency>
```

### 6단계: Spring Boot 실행 (1분)

```bash
cd /your-spring-boot-project
./mvnw spring-boot:run

# 또는 Gradle
./gradlew bootRun
```

### 7단계: API 테스트 (1분)

```bash
# 헬스 체크
curl http://localhost:8080/api/undervalued-stocks/health

# 저평가 우량주 Top 10
curl http://localhost:8080/api/undervalued-stocks/profile/undervalued-quality?limit=10 | jq
```

---

## 📊 데이터 확인

### MySQL에서 확인

```sql
mysql -u root -p ddal_kkak

-- 데이터 개수 확인
SELECT data_date, COUNT(*)
FROM undervalued_stocks
GROUP BY data_date
ORDER BY data_date DESC;

-- 저평가 우량주 Top 5
SELECT ticker, name, total_score, discount
FROM undervalued_stocks
WHERE JSON_CONTAINS(passed_profiles, '"undervalued_quality"') = 1
  AND data_date = (SELECT MAX(data_date) FROM undervalued_stocks)
ORDER BY total_score DESC
LIMIT 5;
```

---

## 🔄 Cron 자동 실행 설정

```bash
cd database/scripts
chmod +x *.sh
./setup_cron.sh
```

**매일 오전 7시에 자동으로 데이터 수집이 실행됩니다.**

---

## 🎨 프론트엔드 통합 (React Native Web)

### API 클라이언트

```typescript
// src/api/undervaluedStocksApi.ts
import axios from 'axios';

const API_BASE_URL = 'http://YOUR_SERVER_IP:8080/api/undervalued-stocks';

export const undervaluedStocksApi = {
  getUndervaluedQualityStocks: async (limit = 50) => {
    const { data } = await axios.get(`${API_BASE_URL}/profile/undervalued-quality`, {
      params: { limit }
    });
    return data;
  }
};
```

### 사용 예시

```typescript
// Mock 데이터 제거
// const mockData = [...];

// API 호출로 변경
const realData = await undervaluedStocksApi.getUndervaluedQualityStocks(50);
```

---

## 🐛 자주 발생하는 오류

### 1. MySQL 연결 오류

```bash
# MySQL 서비스 확인
sudo systemctl status mysql
sudo systemctl restart mysql
```

### 2. Python pymysql 오류

```bash
pip install --upgrade pymysql cryptography
```

### 3. Spring Boot MySQL 드라이버 오류

**pom.xml 확인:**
```xml
<dependency>
    <groupId>com.mysql</groupId>
    <artifactId>mysql-connector-j</artifactId>
    <version>8.0.33</version>
</dependency>
```

### 4. JSON 타입 오류

**MySQL 8.0 이상인지 확인:**
```bash
mysql --version
# mysql  Ver 8.0.43 for Linux ...
```

---

## 📁 주요 파일 위치

```
database/
├── schema/undervalued_stocks_mysql.sql     ← MySQL 스키마
├── python/db_config_mysql.py               ← Python MySQL 연결
├── spring-boot-mysql/                      ← Spring Boot 코드
│   ├── entity/UndervaluedStock.java
│   ├── repository/...Repository.java
│   ├── service/...Service.java
│   ├── controller/...Controller.java
│   └── application.properties              ← MySQL 설정
├── scripts/run_data_collection.sh          ← 수집 스크립트
└── .env                                    ← 환경 변수 (비밀번호)
```

---

## ✅ 체크리스트

- [ ] MySQL 8.0.43 설치 및 실행 확인
- [ ] `ddal_kkak` 데이터베이스 생성
- [ ] 스키마 적용 (`undervalued_stocks` 테이블 확인)
- [ ] Python 패키지 설치 (pymysql, sqlalchemy 등)
- [ ] `.env` 파일 생성 및 비밀번호 설정
- [ ] Python 데이터 수집 테스트 성공
- [ ] MySQL에서 데이터 확인
- [ ] Spring Boot 의존성 추가 (mysql-connector-j)
- [ ] `application.properties` MySQL 설정
- [ ] Spring Boot 실행 및 API 테스트
- [ ] Cron 설정 (매일 오전 7시 자동 실행)
- [ ] 프론트엔드 API 클라이언트 구현

---

## 🎯 다음 단계

1. **프론트엔드 통합**: Mock 데이터 → 실제 API 호출
2. **모니터링**: 로그 확인 및 에러 처리
3. **최적화**: 인덱스 추가, 캐싱 설정
4. **보안**: Spring Security, HTTPS 설정

---

## 📞 지원

- **전체 가이드**: `README_MYSQL.md`
- **MySQL 스키마**: `schema/undervalued_stocks_mysql.sql`
- **예제 환경변수**: `.env.mysql.example`

문제가 있으면 MySQL 로그와 Spring Boot 로그를 확인하세요!

```bash
# MySQL 에러 로그
sudo tail -f /var/log/mysql/error.log

# Spring Boot 로그
tail -f /path/to/spring-boot/logs/application.log

# Python 수집 로그
tail -f database/logs/data_collection_*.log
```

---

**모든 준비 완료!** 이제 매일 오전 7시마다 자동으로 최신 주식 데이터가 수집됩니다 🎉
