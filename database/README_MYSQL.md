# DDalKKak 저평가 우량주 데이터베이스 통합 (MySQL 8.0 버전)

Python 데이터 수집 스크립트를 MySQL 8.0 데이터베이스와 통합하고, Spring Boot REST API로 React Native Web (Expo) 프론트엔드에 제공하는 완전한 솔루션입니다.

## 🎯 환경 사양

- **데이터베이스:** MySQL 8.0.43 (서버 직접 실행)
- **백엔드:** Java Spring Boot (서버 직접 실행)
- **프론트엔드:** React Native Web (Expo, 서버 직접 실행)
- **배포 방식:** Docker 없이 서버에서 직접 실행

---

## 📋 목차

- [아키텍처 개요](#아키텍처-개요)
- [디렉토리 구조](#디렉토리-구조)
- [설치 및 설정](#설치-및-설정)
- [MySQL 데이터베이스 설정](#mysql-데이터베이스-설정)
- [Python 데이터 수집](#python-데이터-수집)
- [Spring Boot 백엔드](#spring-boot-백엔드)
- [스케줄링 설정](#스케줄링-설정)
- [API 엔드포인트](#api-엔드포인트)
- [React Native Web 통합](#react-native-web-통합)
- [트러블슈팅](#트러블슈팅)

---

## 🏗️ 아키텍처 개요

```
┌─────────────────────────────────────────────────────────────┐
│                    데이터 수집 & 처리                          │
├─────────────────────────────────────────────────────────────┤
│  Python 스크립트 (매일 오전 7시 실행)                         │
│  ┌──────────────────────────────────────────────────┐        │
│  │ 1. data_collector_with_db.py                     │        │
│  │    - yfinance에서 미국 주식 데이터 수집         │        │
│  │    - 50-60개 필드 계산                           │        │
│  │    - MySQL에 직접 삽입 (pymysql)                 │        │
│  └──────────────────────────────────────────────────┘        │
│               ↓                                               │
│  ┌──────────────────────────────────────────────────┐        │
│  │ 2. stock_screener_with_db.py                     │        │
│  │    - 6개 스크리닝 프로필 적용                    │        │
│  │    - 적정가치 계산                               │        │
│  │    - 종합 점수 계산                              │        │
│  │    - MySQL 업데이트                              │        │
│  └──────────────────────────────────────────────────┘        │
│                                                               │
└───────────────────────────┬─────────────────────────────────┘
                            ↓
                   ┌────────────────┐
                   │   MySQL 8.0.43  │
                   │  (서버 직접 실행) │
                   └────────┬────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              Spring Boot REST API (서버 직접 실행)            │
├─────────────────────────────────────────────────────────────┤
│  Entity → Repository → Service → Controller                  │
│  - JSON 타입으로 프로필 저장/조회                            │
│  - MySQL 8.0 전용 쿼리 사용                                  │
└───────────────────────────┬─────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│        React Native Web (Expo, 서버 직접 실행)               │
├─────────────────────────────────────────────────────────────┤
│  - 저평가 우량주 목록 표시                                   │
│  - 모바일/웹 크로스 플랫폼 지원                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 디렉토리 구조

```
database/
├── schema/
│   └── undervalued_stocks_mysql.sql    # MySQL 8.0 스키마
│
├── python/
│   ├── db_config_mysql.py              # MySQL 연결 모듈 (pymysql)
│   ├── data_collector_with_db.py       # 데이터 수집 → MySQL
│   └── stock_screener_with_db.py       # 스크리닝 → MySQL
│
├── spring-boot-mysql/
│   ├── entity/
│   │   └── UndervaluedStock.java       # JPA Entity (JSON 타입)
│   ├── repository/
│   │   └── UndervaluedStockRepository.java  # MySQL JSON 쿼리
│   ├── dto/
│   │   └── UndervaluedStockDto.java
│   ├── service/
│   │   └── UndervaluedStockService.java
│   ├── controller/
│   │   └── UndervaluedStockController.java
│   └── application.properties          # MySQL 설정
│
├── scripts/
│   ├── run_data_collection.sh          # 데이터 수집 실행
│   └── setup_cron.sh                   # Cron 설정
│
├── .env.mysql.example                  # MySQL 환경 변수 템플릿
└── README_MYSQL.md                     # 이 파일
```

---

## 🚀 설치 및 설정

### 1. 사전 요구사항

- **Python 3.8+**
- **MySQL 8.0.43** (서버에 직접 설치됨)
- **Java 17+** (Spring Boot)
- **Node.js 18+** (React Native Web Expo)

### 2. 환경 변수 설정

```bash
cd database
cp .env.mysql.example .env
nano .env  # MySQL 정보 수정
```

**주요 설정:**
```
DB_HOST=localhost
DB_PORT=3306
DB_NAME=ddal_kkak
DB_USER=root
DB_PASSWORD=your_password
```

### 3. Python 패키지 설치

```bash
cd python
pip install -r requirements_mysql.txt
```

**requirements_mysql.txt:**
```
yfinance>=0.2.28
pandas>=1.5.0
numpy>=1.23.0
pymysql>=1.1.0
sqlalchemy>=2.0.0
python-dotenv>=0.21.0
cryptography>=41.0.0
```

---

## 🗄️ MySQL 데이터베이스 설정

### 1. MySQL 8.0 설치 확인

```bash
mysql --version
# mysql  Ver 8.0.43 for Linux on x86_64 (MySQL Community Server - GPL)
```

### 2. 데이터베이스 생성

```bash
mysql -u root -p

CREATE DATABASE ddal_kkak DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON ddal_kkak.* TO 'root'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3. 스키마 생성

```bash
mysql -u root -p ddal_kkak < database/schema/undervalued_stocks_mysql.sql
```

### 4. 테이블 확인

```bash
mysql -u root -p ddal_kkak

SHOW TABLES;
# +------------------------+
# | Tables_in_ddal_kkak    |
# +------------------------+
# | data_collection_logs   |
# | screening_profiles     |
# | undervalued_stocks     |
# +------------------------+

DESCRIBE undervalued_stocks;
```

---

## 🐍 Python 데이터 수집

### 수동 실행 (테스트)

```bash
cd database/python

# 1단계: 데이터 수집
python data_collector_with_db.py

# 2단계: 스크리닝 및 점수 계산
python stock_screener_with_db.py --profile all
```

### MySQL 연결 확인

```python
# test_mysql_connection.py
from db_config_mysql import DatabaseManager

db = DatabaseManager()
print("✅ MySQL 연결 성공!")

latest_date = db.get_latest_data_date()
print(f"최신 데이터 날짜: {latest_date}")
```

### MySQL JSON 데이터 확인

```sql
-- 최신 데이터 확인
SELECT data_date, COUNT(*)
FROM undervalued_stocks
GROUP BY data_date
ORDER BY data_date DESC;

-- 저평가 우량주 Top 10 (JSON 검색)
SELECT ticker, name, total_score, discount, passed_profiles
FROM undervalued_stocks
WHERE data_date = (SELECT MAX(data_date) FROM undervalued_stocks)
  AND JSON_CONTAINS(passed_profiles, '"undervalued_quality"') = 1
ORDER BY total_score DESC
LIMIT 10;

-- JSON 배열 길이
SELECT ticker, JSON_LENGTH(passed_profiles) as profile_count
FROM undervalued_stocks
WHERE data_date = (SELECT MAX(data_date) FROM undervalued_stocks)
LIMIT 10;
```

---

## 🌱 Spring Boot 백엔드

### 1. 파일 복사

```bash
# Spring Boot 프로젝트로 Java 파일들 복사
cp -r database/spring-boot-mysql/* /path/to/your/spring-boot-project/src/main/java/com/ddalkkak/backend/
```

### 2. Dependencies 추가 (pom.xml)

```xml
<dependencies>
    <!-- Spring Boot Starter Web -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>

    <!-- Spring Boot Starter Data JPA -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>

    <!-- MySQL Connector -->
    <dependency>
        <groupId>com.mysql</groupId>
        <artifactId>mysql-connector-j</artifactId>
        <scope>runtime</scope>
    </dependency>

    <!-- Lombok -->
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <optional>true</optional>
    </dependency>

    <!-- Jackson for JSON -->
    <dependency>
        <groupId>com.fasterxml.jackson.core</groupId>
        <artifactId>jackson-databind</artifactId>
    </dependency>
</dependencies>
```

### 3. application.properties 설정

```bash
cp database/spring-boot-mysql/application.properties /path/to/your/spring-boot-project/src/main/resources/
```

**주요 설정 수정:**
```properties
# MySQL 연결
spring.datasource.url=jdbc:mysql://localhost:3306/ddal_kkak?useSSL=false&serverTimezone=Asia/Seoul
spring.datasource.username=root
spring.datasource.password=your_password

# Hibernate Dialect (MySQL 8.0)
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQL8Dialect
```

### 4. Spring Boot 직접 실행

```bash
cd /path/to/your/spring-boot-project

# Maven
./mvnw clean install
./mvnw spring-boot:run

# Gradle
./gradlew clean build
./gradlew bootRun
```

### 5. API 테스트

```bash
# 헬스 체크
curl http://localhost:8080/api/undervalued-stocks/health

# Top 10 종목 조회
curl http://localhost:8080/api/undervalued-stocks/top?limit=10

# 저평가 우량주 조회
curl http://localhost:8080/api/undervalued-stocks/profile/undervalued-quality?limit=50
```

---

## ⏰ 스케줄링 설정 (서버 직접 실행)

### Cron 설정 (Linux/Mac)

```bash
cd database/scripts

# 실행 권한 부여
chmod +x run_data_collection.sh
chmod +x setup_cron.sh

# Cron 설정 (매일 오전 7시 실행)
./setup_cron.sh
```

**수동 cron 편집:**
```bash
crontab -e

# 매일 오전 7시에 실행
0 7 * * * /home/user/database/scripts/run_data_collection.sh >> /home/user/database/logs/cron.log 2>&1
```

**Cron 확인:**
```bash
crontab -l  # 등록된 cron 확인
tail -f /home/user/database/logs/cron.log  # 로그 확인
```

---

## 📡 API 엔드포인트

### 기본 조회

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/undervalued-stocks/latest-date` | 최신 데이터 날짜 |
| GET | `/api/undervalued-stocks/top?limit=100` | Top N 종목 |
| GET | `/api/undervalued-stocks/{ticker}` | 특정 티커 조회 |

### 프로필 기반 조회

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/undervalued-stocks/profile/undervalued-quality?limit=50` | 저평가 우량주 |
| GET | `/api/undervalued-stocks/profile/{profileName}` | 특정 프로필 종목 |

**프로필 목록:**
- `undervalued_quality`: 저평가 우량주
- `value_basic`: 가치주 (기본)
- `value_strict`: 가치주 (엄격)
- `growth_quality`: 성장 우량주
- `momentum`: 모멘텀
- `swing`: 스윙

---

## 📱 React Native Web (Expo) 통합

### 1. API 클라이언트 생성

```typescript
// src/api/undervaluedStocksApi.ts
import axios from 'axios';

// 서버 직접 실행 환경의 백엔드 URL
const API_BASE_URL = 'http://your-server-ip:8080/api/undervalued-stocks';

export const undervaluedStocksApi = {
  // 저평가 우량주 조회
  getUndervaluedQualityStocks: async (limit: number = 50) => {
    const response = await axios.get(`${API_BASE_URL}/profile/undervalued-quality`, {
      params: { limit }
    });
    return response.data;
  },

  // 특정 티커 조회
  getStockByTicker: async (ticker: string) => {
    const response = await axios.get(`${API_BASE_URL}/${ticker}`);
    return response.data;
  },

  // 통계
  getStats: async () => {
    const response = await axios.get(`${API_BASE_URL}/stats`);
    return response.data;
  }
};
```

### 2. React Native 컴포넌트 예시

```typescript
// src/screens/UndervaluedStocksScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { undervaluedStocksApi } from '../api/undervaluedStocksApi';

export default function UndervaluedStocksScreen() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStocks = async () => {
      try {
        const data = await undervaluedStocksApi.getUndervaluedQualityStocks(50);
        setStocks(data);
      } catch (error) {
        console.error('Failed to fetch stocks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStocks();
  }, []);

  if (loading) return <Text>Loading...</Text>;

  return (
    <View style={styles.container}>
      <FlatList
        data={stocks}
        keyExtractor={(item) => item.ticker}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.ticker}>{item.ticker}</Text>
            <Text style={styles.name}>{item.name}</Text>
            <Text>Price: ${item.price}</Text>
            <Text>Total Score: {item.totalScore}</Text>
            <Text>Discount: {(item.discount * 100).toFixed(2)}%</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  card: { padding: 12, marginBottom: 8, backgroundColor: '#f0f0f0', borderRadius: 8 },
  ticker: { fontSize: 18, fontWeight: 'bold' },
  name: { fontSize: 14, color: '#666' }
});
```

### 3. Expo 실행

```bash
# 프론트엔드 디렉토리에서
npx expo start

# 웹에서 실행
npx expo start --web

# 안드로이드
npx expo start --android

# iOS
npx expo start --ios
```

---

## 🐛 트러블슈팅

### MySQL 연결 오류

**문제:** `pymysql.err.OperationalError: (2003, "Can't connect to MySQL server")`

```bash
# MySQL 서비스 확인
sudo systemctl status mysql

# MySQL 재시작
sudo systemctl restart mysql

# 방화벽 확인
sudo ufw allow 3306
```

### MySQL 8.0 인증 오류

**문제:** `Authentication plugin 'caching_sha2_password' cannot be loaded`

```sql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_password';
FLUSH PRIVILEGES;
```

### Spring Boot JSON 매핑 오류

**문제:** `passed_profiles` 필드가 제대로 매핑되지 않음

- Entity 클래스에서 `@PostLoad`, `@PrePersist`, `@PreUpdate` 확인
- Jackson ObjectMapper가 제대로 설정되었는지 확인

### Cron이 실행되지 않음

```bash
# Cron 서비스 확인
sudo systemctl status cron

# Cron 로그 확인
grep CRON /var/log/syslog

# 스크립트 실행 권한 확인
chmod +x /path/to/run_data_collection.sh
```

---

## 📊 모니터링

### 로그 확인

```bash
# Python 수집 로그
tail -f database/logs/data_collection_*.log

# Cron 로그
tail -f database/logs/cron.log

# Spring Boot 로그
tail -f /path/to/spring-boot/logs/application.log
```

### MySQL 성능 모니터링

```sql
-- 테이블 크기
SELECT
    table_name,
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb
FROM information_schema.TABLES
WHERE table_schema = 'ddal_kkak';

-- 느린 쿼리 확인
SHOW VARIABLES LIKE 'slow_query_log';
SET GLOBAL slow_query_log = 'ON';
```

---

## 🔒 보안 고려사항

1. **MySQL 비밀번호**: `.env` 파일을 `.gitignore`에 추가
2. **방화벽 설정**: MySQL 포트(3306)는 로컬호스트만 허용
3. **API 인증**: Spring Security 추가 권장
4. **CORS 설정**: 프로덕션에서는 특정 도메인만 허용

---

## 📝 주요 차이점 (PostgreSQL vs MySQL)

| 항목 | PostgreSQL | MySQL 8.0 |
|------|-----------|-----------|
| ARRAY 타입 | text[] | JSON (문자열 배열) |
| ARRAY 검색 | ANY(array) | JSON_CONTAINS() |
| 자동증가 | SERIAL | AUTO_INCREMENT |
| 문자 인코딩 | UTF8 | utf8mb4 |
| Python 드라이버 | psycopg2 | pymysql |
| Hibernate Dialect | PostgreSQLDialect | MySQL8Dialect |

---

## ✨ 요약

✅ **MySQL 8.0.43** 서버 직접 실행
✅ **Python → MySQL** 직접 연동 (pymysql)
✅ **Spring Boot → MySQL** JPA + JSON 타입
✅ **React Native Web (Expo)** API 통합
✅ **Cron 스케줄링** 매일 자동 실행

모든 컴포넌트가 **서버에서 직접 실행**되므로 Docker가 필요 없습니다!

---

## 📧 문의

문제가 있거나 질문이 있으시면 이슈를 등록해주세요.
