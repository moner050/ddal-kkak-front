# DDalKKak 저평가 우량주 데이터베이스 통합

Python 데이터 수집 스크립트를 PostgreSQL 데이터베이스와 통합하고, Spring Boot REST API로 프론트엔드에 제공하는 완전한 솔루션입니다.

## 📋 목차

- [아키텍처 개요](#아키텍처-개요)
- [디렉토리 구조](#디렉토리-구조)
- [설치 및 설정](#설치-및-설정)
- [데이터베이스 설정](#데이터베이스-설정)
- [Python 데이터 수집](#python-데이터-수집)
- [Spring Boot 백엔드](#spring-boot-백엔드)
- [스케줄링 설정](#스케줄링-설정)
- [API 엔드포인트](#api-엔드포인트)
- [프론트엔드 통합](#프론트엔드-통합)
- [트러블슈팅](#트러블슈팅)

---

## 🏗️ 아키텍처 개요

```
┌─────────────────────────────────────────────────────────────┐
│                    데이터 수집 & 처리                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Python 스크립트 (매일 오전 7시 실행)                         │
│  ┌──────────────────────────────────────────────────┐        │
│  │ 1. build_details_cache_fully_optimized.py       │        │
│  │    - yfinance에서 미국 주식 데이터 수집         │        │
│  │    - 50-60개 필드 (가격, 재무, 기술적 지표)      │        │
│  │    - PostgreSQL에 직접 삽입                      │        │
│  └──────────────────────────────────────────────────┘        │
│               ↓                                               │
│  ┌──────────────────────────────────────────────────┐        │
│  │ 2. improved_stock_screener.py                    │        │
│  │    - 6개 스크리닝 프로필 적용                    │        │
│  │    - 적정가치 계산                               │        │
│  │    - 종합 점수 계산 (Growth, Quality, Value...)  │        │
│  │    - DB 업데이트 (scores, passed_profiles)       │        │
│  └──────────────────────────────────────────────────┘        │
│                                                               │
└───────────────────────────┬─────────────────────────────────┘
                            ↓
                   ┌────────────────┐
                   │  PostgreSQL DB  │
                   │  (undervalued_  │
                   │   stocks 테이블) │
                   └────────┬────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   Spring Boot REST API                        │
├─────────────────────────────────────────────────────────────┤
│  Entity → Repository → Service → Controller                  │
│  - GET /api/undervalued-stocks/top                           │
│  - GET /api/undervalued-stocks/profile/{profileName}         │
│  - GET /api/undervalued-stocks/sector/{sector}/top           │
│  - GET /api/undervalued-stocks/search                        │
└───────────────────────────┬─────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    React Frontend                             │
├─────────────────────────────────────────────────────────────┤
│  - 저평가 우량주 목록 표시                                   │
│  - 프로필별 필터링                                           │
│  - 상세 페이지                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 디렉토리 구조

```
database/
├── schema/
│   └── undervalued_stocks.sql          # PostgreSQL 스키마 정의
│
├── python/
│   ├── db_config.py                    # 데이터베이스 연결 모듈
│   ├── data_collector_with_db.py       # 수정된 데이터 수집 스크립트
│   └── stock_screener_with_db.py       # 수정된 스크리닝 스크립트
│
├── spring-boot/
│   ├── entity/
│   │   └── UndervaluedStock.java       # JPA 엔티티
│   ├── repository/
│   │   └── UndervaluedStockRepository.java  # JPA Repository
│   ├── dto/
│   │   └── UndervaluedStockDto.java    # API 응답 DTO
│   ├── service/
│   │   └── UndervaluedStockService.java     # 비즈니스 로직
│   ├── controller/
│   │   └── UndervaluedStockController.java  # REST API
│   └── application.properties          # Spring Boot 설정
│
├── scripts/
│   ├── run_data_collection.sh          # 데이터 수집 실행 스크립트
│   └── setup_cron.sh                   # Cron 설정 스크립트
│
├── k8s/
│   └── cronjob.yaml                    # Kubernetes CronJob 설정
│
├── docker-compose.yml                  # Docker Compose (PostgreSQL + PgAdmin)
├── .env.example                        # 환경 변수 템플릿
└── README.md                           # 이 파일
```

---

## 🚀 설치 및 설정

### 1. 사전 요구사항

- **Python 3.8+**
- **PostgreSQL 12+**
- **Java 17+** (Spring Boot)
- **Docker & Docker Compose** (선택사항)

### 2. 환경 변수 설정

```bash
cd database
cp .env.example .env
nano .env  # 데이터베이스 정보 수정
```

### 3. Python 패키지 설치

```bash
cd python
pip install -r requirements.txt
```

**requirements.txt 예시:**
```
yfinance>=0.2.28
pandas>=1.5.0
numpy>=1.23.0
psycopg2-binary>=2.9.0
sqlalchemy>=2.0.0
python-dotenv>=0.21.0
```

---

## 🗄️ 데이터베이스 설정

### Option 1: Docker Compose 사용 (권장)

```bash
cd database
docker-compose up -d
```

- PostgreSQL: `localhost:5432`
- PgAdmin: `http://localhost:5050` (admin@ddalkkak.com / admin)

### Option 2: 수동 설치

```bash
# PostgreSQL 설치 (Ubuntu/Debian)
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib

# 데이터베이스 생성
sudo -u postgres psql
CREATE DATABASE ddal_kkak;
CREATE USER ddalkkak WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE ddal_kkak TO ddalkkak;
\q
```

### 스키마 생성

```bash
psql -h localhost -p 5432 -U postgres -d ddal_kkak -f schema/undervalued_stocks.sql
```

---

## 🐍 Python 데이터 수집

### 수동 실행 (테스트)

```bash
cd python

# 1단계: 데이터 수집
python data_collector_with_db.py

# 2단계: 스크리닝 및 점수 계산
python stock_screener_with_db.py --profile all --export-excel
```

### 특정 프로필만 실행

```bash
# 저평가 우량주만
python stock_screener_with_db.py --profile undervalued_quality

# 특정 날짜 데이터 처리
python stock_screener_with_db.py --date 2025-11-07 --profile all
```

### 데이터베이스 확인

```bash
psql -h localhost -p 5432 -U postgres -d ddal_kkak

-- 최신 데이터 확인
SELECT data_date, COUNT(*) FROM undervalued_stocks GROUP BY data_date ORDER BY data_date DESC;

-- 저평가 우량주 Top 10
SELECT ticker, name, total_score, discount
FROM undervalued_stocks
WHERE data_date = (SELECT MAX(data_date) FROM undervalued_stocks)
  AND 'undervalued_quality' = ANY(passed_profiles)
ORDER BY total_score DESC
LIMIT 10;
```

---

## 🌱 Spring Boot 백엔드

### 1. 파일 복사

```bash
# Spring Boot 프로젝트로 Java 파일들 복사
cp -r database/spring-boot/* /path/to/your/spring-boot-project/src/main/java/com/ddalkkak/backend/
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

    <!-- PostgreSQL Driver -->
    <dependency>
        <groupId>org.postgresql</groupId>
        <artifactId>postgresql</artifactId>
        <scope>runtime</scope>
    </dependency>

    <!-- Lombok -->
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <optional>true</optional>
    </dependency>
</dependencies>
```

### 3. application.properties 설정

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/ddal_kkak
spring.datasource.username=postgres
spring.datasource.password=postgres
spring.jpa.hibernate.ddl-auto=validate
```

### 4. Spring Boot 실행

```bash
./mvnw spring-boot:run
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

## ⏰ 스케줄링 설정

### Option 1: Cron (Linux/Mac)

```bash
cd database/scripts

# 실행 권한 부여
chmod +x run_data_collection.sh
chmod +x setup_cron.sh

# Cron 설정 (매일 오전 7시 실행)
./setup_cron.sh
```

**수동 cron 설정:**
```bash
crontab -e

# 매일 오전 7시에 실행
0 7 * * * /path/to/database/scripts/run_data_collection.sh >> /path/to/logs/cron.log 2>&1
```

### Option 2: Kubernetes CronJob

```bash
# Secret 수정 (데이터베이스 정보)
kubectl edit secret ddalkkak-db-secret

# CronJob 배포
kubectl apply -f k8s/cronjob.yaml

# 확인
kubectl get cronjobs
kubectl get jobs
kubectl get pods

# 수동 실행 (테스트)
kubectl create job --from=cronjob/ddalkkak-data-collection manual-test-1
```

### Option 3: Docker Compose + Cron

**Dockerfile 예시:**
```dockerfile
FROM python:3.10-slim

WORKDIR /app

# Install dependencies
COPY python/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy scripts
COPY python/ .

# Install cron
RUN apt-get update && apt-get install -y cron

# Add cron job
RUN echo "0 7 * * * cd /app && python data_collector_with_db.py && python stock_screener_with_db.py --profile all" | crontab -

CMD ["cron", "-f"]
```

---

## 📡 API 엔드포인트

### 기본 조회

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/undervalued-stocks/latest-date` | 최신 데이터 날짜 |
| GET | `/api/undervalued-stocks/top?limit=100` | Top N 종목 (총점 기준) |
| GET | `/api/undervalued-stocks/{ticker}` | 특정 티커 조회 |
| GET | `/api/undervalued-stocks/{ticker}/history?date=2025-11-07` | 특정 날짜 데이터 |

### 프로필 기반 조회

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/undervalued-stocks/profile/undervalued-quality?limit=50` | 저평가 우량주 |
| GET | `/api/undervalued-stocks/profile/{profileName}?limit=50` | 특정 프로필 종목 |
| GET | `/api/undervalued-stocks/profile/{profileName}/paging?page=0&size=20` | 페이징 조회 |

**프로필 목록:**
- `undervalued_quality`: 저평가 우량주 (Warren Buffett 스타일)
- `value_basic`: 가치주 (기본)
- `value_strict`: 가치주 (엄격)
- `growth_quality`: 성장 우량주
- `momentum`: 모멘텀 트레이딩
- `swing`: 스윙 트레이딩

### 섹터 기반 조회

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/undervalued-stocks/sectors` | 섹터 목록 |
| GET | `/api/undervalued-stocks/sector/{sectorName}/top?limit=20` | 섹터 Top N |

### 필터링 조회

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/undervalued-stocks/filter/score?minScore=70&maxScore=100` | 점수 범위 필터 |
| GET | `/api/undervalued-stocks/filter/market-cap?minMarketCap=1B&maxMarketCap=100B` | 시가총액 필터 |
| GET | `/api/undervalued-stocks/filter/most-undervalued?limit=30` | 가장 저평가된 종목 |
| GET | `/api/undervalued-stocks/search?profile=...&sector=...&minScore=...` | 다중 조건 검색 |

### 점수별 Top N

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/undervalued-stocks/top/growth?limit=20` | 성장성 Top N |
| GET | `/api/undervalued-stocks/top/quality?limit=20` | 우량성 Top N |
| GET | `/api/undervalued-stocks/top/value?limit=20` | 가치 Top N |
| GET | `/api/undervalued-stocks/top/momentum?limit=20` | 모멘텀 Top N |

### 통계

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/undervalued-stocks/stats` | 전체 통계 |
| GET | `/api/undervalued-stocks/profile/{profileName}/count` | 프로필별 종목 수 |

---

## 🎨 프론트엔드 통합

### 1. API 클라이언트 생성

```typescript
// src/api/undervaluedStocksApi.ts
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api/undervalued-stocks';

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

  // 프로필별 조회
  getStocksByProfile: async (profile: string, limit: number = 50) => {
    const response = await axios.get(`${API_BASE_URL}/profile/${profile}`, {
      params: { limit }
    });
    return response.data;
  },

  // 섹터 목록
  getSectors: async () => {
    const response = await axios.get(`${API_BASE_URL}/sectors`);
    return response.data;
  },

  // 통계
  getStats: async () => {
    const response = await axios.get(`${API_BASE_URL}/stats`);
    return response.data;
  }
};
```

### 2. React 컴포넌트 예시

```typescript
// src/components/UndervaluedStocksList.tsx
import React, { useEffect, useState } from 'react';
import { undervaluedStocksApi } from '../api/undervaluedStocksApi';

export default function UndervaluedStocksList() {
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

  if (loading) return <div>Loading...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {stocks.map((stock) => (
        <div key={stock.ticker} className="border rounded-lg p-4">
          <h3 className="text-xl font-bold">{stock.ticker}</h3>
          <p className="text-gray-600">{stock.name}</p>
          <div className="mt-2">
            <p>Price: ${stock.price}</p>
            <p>Total Score: {stock.totalScore}</p>
            <p>Discount: {(stock.discount * 100).toFixed(2)}%</p>
          </div>
        </div>
      ))}
    </div>
  );
}
```

### 3. Mock 데이터 제거

기존 `mockUndervalued` 데이터를 제거하고 API 호출로 대체:

```typescript
// Before
const mockUndervalued = [...];

// After
import { undervaluedStocksApi } from './api/undervaluedStocksApi';
const realData = await undervaluedStocksApi.getUndervaluedQualityStocks(50);
```

---

## 🐛 트러블슈팅

### Python 스크립트 실행 오류

**문제:** `ModuleNotFoundError: No module named 'psycopg2'`

```bash
pip install psycopg2-binary
# 또는
conda install psycopg2
```

**문제:** `psycopg2.OperationalError: could not connect to server`

- 데이터베이스가 실행 중인지 확인
- 연결 정보가 정확한지 확인 (.env 파일)
- 방화벽/네트워크 설정 확인

### Spring Boot 연결 오류

**문제:** `HikariPool - Connection is not available`

```properties
# application.properties에 추가
spring.datasource.hikari.maximum-pool-size=5
spring.datasource.hikari.connection-timeout=30000
```

**문제:** `PSQLException: The authentication type 10 is not supported`

- PostgreSQL 드라이버 버전 업데이트 필요
- `pom.xml`에서 `postgresql` 버전을 최신으로 변경

### Cron 실행 안됨

```bash
# Cron 서비스 상태 확인
sudo service cron status

# Cron 로그 확인
grep CRON /var/log/syslog

# 스크립트 실행 권한 확인
ls -la /path/to/run_data_collection.sh
chmod +x /path/to/run_data_collection.sh
```

### 데이터 누락

```sql
-- 최근 수집 로그 확인
SELECT * FROM data_collection_logs ORDER BY collection_date DESC LIMIT 10;

-- 날짜별 데이터 개수 확인
SELECT data_date, COUNT(*) FROM undervalued_stocks GROUP BY data_date ORDER BY data_date DESC;
```

---

## 📊 모니터링

### 로그 확인

```bash
# Python 수집 로그
tail -f /path/to/database/logs/data_collection_*.log

# Cron 로그
tail -f /path/to/database/logs/cron.log

# Spring Boot 로그
tail -f /path/to/spring-boot/logs/application.log
```

### 성능 모니터링

```sql
-- 데이터베이스 테이블 크기
SELECT pg_size_pretty(pg_total_relation_size('undervalued_stocks'));

-- 인덱스 사용 통계
SELECT * FROM pg_stat_user_indexes WHERE relname = 'undervalued_stocks';

-- 느린 쿼리 확인
SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;
```

---

## 🔒 보안 고려사항

1. **데이터베이스 비밀번호**: `.env` 파일을 `.gitignore`에 추가
2. **API 인증**: Spring Security 추가 고려
3. **CORS 설정**: 프로덕션에서는 특정 도메인만 허용
4. **SQL Injection**: JPA/Hibernate 사용으로 기본 방어
5. **Rate Limiting**: API 요청 제한 설정

---

## 📝 라이센스

이 프로젝트는 MIT 라이센스 하에 배포됩니다.

---

## 🤝 기여

버그 리포트, 기능 요청, 풀 리퀘스트를 환영합니다!

---

## 📧 문의

문제가 있거나 질문이 있으시면 이슈를 등록해주세요.
