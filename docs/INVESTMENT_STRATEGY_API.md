# 투자 전략 관리 API 문서

## 개요

투자 전략 설정 및 관리를 위한 백엔드 API 문서입니다. 각 투자 전략의 필터링 조건을 동적으로 관리하고 백테스팅을 수행할 수 있습니다.

---

## 1. 투자 전략 목록 조회

모든 투자 전략과 해당 조건을 조회합니다.

### Request

```http
GET /api/v1/strategies
```

### Response

```json
{
  "success": true,
  "data": {
    "undervalued_quality": {
      "name": "저평가 우량주 (워렌 버핏 스타일)",
      "description": "높은 수익성과 성장성을 갖춘 기업을 합리적인 가격에 매수",
      "enabled": true,
      "criteria": {
        "marketCap": { "min": 2.0, "unit": "B" },
        "price": { "min": 10.0 },
        "dollarVolume": { "min": 5.0, "unit": "M" },
        "PER": { "min": 0, "max": 25 },
        "PEG": { "max": 1.0 },
        "PS": { "max": 50 },
        "PB": { "max": 10 },
        "RevYoY": { "min": 5 },
        "EPS_Growth_3Y": { "min": 5 },
        "OpMarginTTM": { "min": 12 },
        "ROE": { "min": 15 },
        "FCF_Yield": { "min": 3 },
        "shortPercent": { "max": 20 }
      },
      "lastUpdated": "2025-12-10T00:00:00Z"
    },
    "ai_transformation": {
      "name": "AI 전환 기업 (IREN 타입)",
      "description": "AI 인프라로 전환하며 실제 수익을 창출하는 폭발적 성장 기업",
      "enabled": true,
      "criteria": {
        "sectors": ["Information Technology", "Communication Services"],
        "marketCap": { "min": 1.0, "unit": "B" },
        "ROE": { "min": 20 },
        "OpMarginTTM": { "min": 10 },
        "RevYoY": { "min": 200 },
        "PER": { "min": 0, "max": 40 },
        "PS": { "max": 30 },
        "shortPercent": { "max": 30 },
        "beta": { "min": 2.5 }
      },
      "lastUpdated": "2025-12-11T00:00:00Z"
    }
  }
}
```

---

## 2. 특정 투자 전략 조회

### Request

```http
GET /api/v1/strategies/{strategyKey}
```

**Path Parameters:**
- `strategyKey` (string): 전략 키 (예: `undervalued_quality`, `ai_transformation`)

### Response

```json
{
  "success": true,
  "data": {
    "key": "ai_transformation",
    "name": "AI 전환 기업 (IREN 타입)",
    "description": "AI 인프라로 전환하며 실제 수익을 창출하는 폭발적 성장 기업",
    "enabled": true,
    "criteria": {
      "sectors": ["Information Technology", "Communication Services"],
      "marketCap": { "min": 1.0, "unit": "B" },
      "ROE": { "min": 20 },
      "OpMarginTTM": { "min": 10 },
      "RevYoY": { "min": 200 },
      "PER": { "min": 0, "max": 40 },
      "PS": { "max": 30 },
      "shortPercent": { "max": 30 },
      "beta": { "min": 2.5 }
    },
    "lastUpdated": "2025-12-11T00:00:00Z"
  }
}
```

---

## 3. 투자 전략 생성/수정

투자 전략의 조건을 생성하거나 수정합니다.

### Request

```http
PUT /api/v1/strategies/{strategyKey}
Content-Type: application/json
```

**Path Parameters:**
- `strategyKey` (string): 전략 키

**Request Body:**

```json
{
  "name": "AI 전환 기업 (IREN 타입)",
  "description": "AI 인프라로 전환하며 실제 수익을 창출하는 폭발적 성장 기업",
  "enabled": true,
  "criteria": {
    "sectors": ["Information Technology", "Communication Services"],
    "marketCap": { "min": 1.0, "unit": "B" },
    "ROE": { "min": 20 },
    "OpMarginTTM": { "min": 10 },
    "RevYoY": { "min": 200 },
    "PER": { "min": 0, "max": 40 },
    "PS": { "max": 30 },
    "shortPercent": { "max": 30 },
    "beta": { "min": 2.5 }
  }
}
```

### Response

```json
{
  "success": true,
  "message": "Strategy updated successfully",
  "data": {
    "key": "ai_transformation",
    "name": "AI 전환 기업 (IREN 타입)",
    "description": "AI 인프라로 전환하며 실제 수익을 창출하는 폭발적 성장 기업",
    "enabled": true,
    "criteria": { ... },
    "lastUpdated": "2025-12-11T10:30:00Z"
  }
}
```

---

## 4. 투자 전략 활성화/비활성화

### Request

```http
PATCH /api/v1/strategies/{strategyKey}/toggle
Content-Type: application/json
```

**Request Body:**

```json
{
  "enabled": false
}
```

### Response

```json
{
  "success": true,
  "message": "Strategy toggled successfully",
  "data": {
    "key": "ai_transformation",
    "enabled": false
  }
}
```

---

## 5. 투자 전략 삭제

사용자 정의 전략만 삭제 가능합니다. 기본 전략은 비활성화만 가능합니다.

### Request

```http
DELETE /api/v1/strategies/{strategyKey}
```

### Response

```json
{
  "success": true,
  "message": "Strategy deleted successfully"
}
```

---

## 6. 투자 전략 백테스팅

특정 전략에 대한 백테스팅 결과를 조회합니다.

### Request

```http
GET /api/v1/strategies/{strategyKey}/backtest?years=3
```

**Query Parameters:**
- `years` (number, optional): 백테스팅 기간 (기본값: 3년)
- `startDate` (string, optional): 시작 날짜 (YYYY-MM-DD)
- `endDate` (string, optional): 종료 날짜 (YYYY-MM-DD)

### Response

```json
{
  "success": true,
  "data": {
    "strategyKey": "ai_transformation",
    "period": {
      "start": "2022-12-11",
      "end": "2025-12-11",
      "years": 3
    },
    "performance": {
      "averageReturn": 156.8,
      "medianReturn": 142.3,
      "maxReturn": 450.2,
      "minReturn": -15.7,
      "successRate": 0.78,
      "stocksAnalyzed": 23
    },
    "monthlyReturns": [
      { "date": "2022-12", "return": 12.5, "count": 5 },
      { "date": "2023-01", "return": 8.3, "count": 6 }
    ]
  }
}
```

---

## 7. 현재 시장에서 전략 매칭 종목 조회

현재 시장에서 특정 전략에 매칭되는 종목들을 조회합니다.

### Request

```http
GET /api/v1/strategies/{strategyKey}/matches?limit=100&offset=0
```

**Query Parameters:**
- `limit` (number, optional): 결과 제한 (기본값: 100)
- `offset` (number, optional): 페이지네이션 오프셋 (기본값: 0)
- `sortBy` (string, optional): 정렬 기준 (예: `totalScore`, `marketCap`)
- `sortOrder` (string, optional): 정렬 순서 (`asc`, `desc`)

### Response

```json
{
  "success": true,
  "data": {
    "strategyKey": "ai_transformation",
    "totalCount": 5,
    "stocks": [
      {
        "symbol": "IREN",
        "name": "Iris Energy Limited",
        "category": "Information Technology",
        "price": 15.67,
        "marketCap": 1.8,
        "ROE": 28.5,
        "OpMarginTTM": 15.3,
        "RevYoY": 312.5,
        "PER": 22.3,
        "PS": 18.5,
        "beta": 3.2,
        "totalScore": 85.3,
        "matchedCriteria": [
          "marketCap >= 1.0B",
          "ROE > 20",
          "OpMarginTTM > 10",
          "RevYoY > 200",
          "PER: 0 < 22.3 < 40",
          "PS < 30",
          "beta > 2.5",
          "sector: Information Technology"
        ]
      }
    ]
  }
}
```

---

## 8. 전략 비교

여러 전략의 성과를 비교합니다.

### Request

```http
POST /api/v1/strategies/compare
Content-Type: application/json
```

**Request Body:**

```json
{
  "strategies": ["undervalued_quality", "ai_transformation", "growth_quality"],
  "period": {
    "years": 3
  }
}
```

### Response

```json
{
  "success": true,
  "data": {
    "period": {
      "start": "2022-12-11",
      "end": "2025-12-11"
    },
    "comparison": [
      {
        "strategyKey": "undervalued_quality",
        "averageReturn": 42.5,
        "successRate": 0.85,
        "stocksAnalyzed": 156
      },
      {
        "strategyKey": "ai_transformation",
        "averageReturn": 156.8,
        "successRate": 0.78,
        "stocksAnalyzed": 23
      },
      {
        "strategyKey": "growth_quality",
        "averageReturn": 68.3,
        "successRate": 0.82,
        "stocksAnalyzed": 89
      }
    ],
    "winner": "ai_transformation",
    "benchmarkReturn": 35.2
  }
}
```

---

## 에러 응답

모든 API는 에러 발생 시 다음 형식으로 응답합니다:

```json
{
  "success": false,
  "error": "Strategy not found",
  "code": "STRATEGY_NOT_FOUND",
  "message": "The requested strategy 'invalid_key' does not exist"
}
```

### 에러 코드

- `STRATEGY_NOT_FOUND`: 전략을 찾을 수 없음
- `INVALID_CRITERIA`: 유효하지 않은 전략 조건
- `STRATEGY_IMMUTABLE`: 기본 전략은 삭제할 수 없음 (비활성화만 가능)
- `BACKTEST_FAILED`: 백테스팅 실행 실패
- `INVALID_PARAMETERS`: 잘못된 요청 파라미터

---

## 전략 키 목록

| 키 | 이름 | 설명 |
|---|---|---|
| `undervalued_quality` | 저평가 우량주 (워렌 버핏 스타일) | 높은 수익성과 성장성을 갖춘 기업을 합리적인 가격에 매수 |
| `value_basic` | 기본 가치투자 | 저평가된 기업을 발굴하는 기본적인 가치투자 전략 |
| `value_strict` | 엄격한 가치투자 | 더 까다로운 기준으로 우량한 저평가 기업을 선별 |
| `growth_quality` | 성장+품질 (장타 전략) | 높은 성장성과 품질을 갖춘 기업 장기 보유 |
| `momentum` | 모멘텀 트레이딩 (단타) | 강한 상승 추세를 보이는 종목 단기 매매 |
| `swing` | 스윙 트레이딩 (과매도 반등) | 과매도 구간에서 반등 가능성 있는 종목 선별 |
| `ai_transformation` | AI 전환 기업 (IREN 타입) | AI 인프라로 전환하며 실제 수익을 창출하는 폭발적 성장 기업 |

---

## 구현 시 주의사항

1. **성능 최적화**: 백테스팅은 CPU 집약적 작업이므로 캐싱 활용
2. **데이터 일관성**: 전략 변경 시 기존 백테스팅 결과 무효화
3. **권한 관리**: 관리자만 기본 전략 수정 가능
4. **로깅**: 모든 전략 변경 사항 로깅
5. **버전 관리**: 전략 변경 이력 저장

---

## 프론트엔드 연동

### 투자 전략 정의 파일
```typescript
// src/constants/investmentStrategies.ts
export const INVESTMENT_STRATEGIES = {
  ai_transformation: {
    name: "AI 전환 기업 (IREN 타입)",
    description: "AI 인프라로 전환하며 실제 수익을 창출하는 폭발적 성장 기업",
    criteria: [ ... ]
  },
  // ...
};
```

### 필터링 로직
```typescript
// src/utils/stockMetrics.ts
export function matchesInvestmentStrategy(stock: any, strategy: string): boolean {
  // 프론트엔드에서 클라이언트 사이드 필터링
  // 백엔드 API와 동일한 로직 구현
}
```

### API 호출 예시
```typescript
// 백엔드 API로 전략 매칭 종목 조회
const response = await api.get(`/api/v1/strategies/ai_transformation/matches`);
const matchedStocks = response.data.stocks;
```
