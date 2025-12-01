# 백엔드 데이터 요청서 - 종목 추천 고도화

## 📋 요청 배경
현재 프론트엔드에서 3줄 요약 및 매수/매도 가이드를 표시하고 있으나, 단순 수치 나열로 투자 근거가 부족합니다.
실제 투자 판단에 도움이 되는 정량적/정성적 데이터가 필요합니다.

---

## 1️⃣ 3줄 요약 강화 데이터

### 1.1 추천 사유 (Why Recommend)

#### A. 정량적 분석 데이터
```json
{
  "recommendation": {
    "summary": {
      "reason": {
        // 핵심 강점 (최대 3개)
        "strengths": [
          {
            "category": "profitability" | "growth" | "valuation" | "technical",
            "metric": "ROE",
            "value": 18.5,
            "industryAverage": 12.3,
            "percentile": 85,  // 업계 내 상위 몇%
            "description": "업계 평균(12.3%) 대비 50% 높은 ROE"
          }
        ],

        // 동종 업계 비교
        "peerComparison": {
          "sector": "Technology",
          "industryGroup": "Software - Application",
          "rank": 15,  // 동종업계 내 순위
          "totalPeers": 120,
          "betterThan": 87.5,  // 상위 12.5%
          "keyMetrics": {
            "per": { "value": 15.2, "industryMedian": 22.1 },
            "roe": { "value": 18.5, "industryMedian": 12.3 },
            "revenueGrowth": { "value": 12.3, "industryMedian": 8.5 }
          }
        },

        // AI 분석 근거
        "aiAnalysis": {
          "score": 85,
          "confidence": 0.92,  // 신뢰도 (0-1)
          "mainFactors": [
            { "factor": "Strong revenue growth", "weight": 0.35 },
            { "factor": "Undervalued vs peers", "weight": 0.30 },
            { "factor": "Positive momentum", "weight": 0.25 }
          ]
        }
      }
    }
  }
}
```

#### B. 정성적 분석 데이터
```json
{
  "recommendation": {
    "summary": {
      "reason": {
        // 투자 포인트 (사람이 읽을 수 있는 문장)
        "investmentThesis": "업계 최고 수준의 수익성(ROE 18.5%, 상위 13%)과 저평가된 밸류에이션(PER 15.2, 업계 중앙값 22.1 대비 31% 할인)이 매력적",

        // 비즈니스 강점
        "businessStrengths": [
          "클라우드 전환으로 경상수익 비중 75% 달성",
          "북미 시장점유율 3년 연속 상승 (15% → 23%)",
          "AI 기술 특허 120건 보유"
        ]
      }
    }
  }
}
```

---

### 1.2 예상 호재 (Opportunity / Catalysts)

```json
{
  "recommendation": {
    "summary": {
      "opportunity": {
        // 섹터/산업 트렌드
        "sectorTrend": {
          "sector": "Technology",
          "outlook": "positive" | "neutral" | "negative",
          "growthForecast": 15.2,  // 향후 1년 예상 성장률 (%)
          "description": "AI 인프라 투자 확대로 연평균 15% 성장 전망 (Gartner 2025)"
        },

        // 실제 호재 뉴스/이벤트
        "catalysts": [
          {
            "type": "earnings" | "product" | "partnership" | "market" | "regulatory",
            "title": "신규 클라우드 계약 체결",
            "description": "Fortune 100 기업과 5년간 $500M 규모 계약",
            "date": "2025-01-15",
            "expectedImpact": "high" | "medium" | "low",
            "source": "Company Press Release"
          },
          {
            "type": "earnings",
            "title": "다음 분기 실적 개선 전망",
            "description": "애널리스트 컨센서스 EPS $2.15 (YoY +18%)",
            "date": "2025-02-10",
            "expectedImpact": "high"
          }
        ],

        // 애널리스트 의견
        "analystConsensus": {
          "rating": "Buy",  // Strong Buy / Buy / Hold / Sell
          "numberOfAnalysts": 25,
          "distribution": {
            "strongBuy": 8,
            "buy": 12,
            "hold": 4,
            "sell": 1,
            "strongSell": 0
          },
          "recentUpgrades": 3,  // 최근 1개월 내 상향
          "recentDowngrades": 0
        },

        // 기업 이벤트 캘린더
        "upcomingEvents": [
          {
            "type": "earnings" | "product_launch" | "investor_day",
            "title": "Q1 실적발표",
            "date": "2025-02-10",
            "description": "시장 기대치: EPS $2.15, Revenue $1.2B"
          }
        ]
      }
    }
  }
}
```

---

### 1.3 주의점 (Risks / Cautions)

```json
{
  "recommendation": {
    "summary": {
      "caution": {
        // 리스크 팩터
        "risks": [
          {
            "category": "valuation" | "technical" | "fundamental" | "market" | "regulatory",
            "severity": "high" | "medium" | "low",
            "title": "단기 과열 가능성",
            "description": "RSI 72 (과매수 구간), 최근 3주간 25% 급등",
            "metric": "RSI",
            "value": 72,
            "threshold": 70
          },
          {
            "category": "fundamental",
            "severity": "medium",
            "title": "부채비율 상승 추세",
            "description": "부채비율 65% (전년 대비 +15%p)",
            "metric": "DebtToEquity",
            "value": 0.65,
            "industryAverage": 0.45
          }
        ],

        // 약점 분석
        "weaknesses": [
          {
            "area": "profitability" | "growth" | "efficiency" | "leverage",
            "title": "영업이익률 하락",
            "current": 12.5,
            "previous": 15.2,
            "change": -2.7,
            "description": "인건비 상승으로 영업이익률 2.7%p 감소"
          }
        ],

        // 시장 리스크
        "marketRisks": [
          {
            "type": "volatility" | "correlation" | "liquidity",
            "title": "높은 변동성",
            "metric": "Volatility_21D",
            "value": 45.2,
            "description": "21일 변동성 45%, 시장 평균(18%) 대비 2.5배"
          }
        ]
      }
    }
  }
}
```

---

## 2️⃣ 매수/매도 가이드 강화 데이터

### 2.1 목표주가 (Target Price)

```json
{
  "priceGuidance": {
    "targetPrice": {
      // 애널리스트 컨센서스
      "analystConsensus": {
        "mean": 125.50,
        "median": 124.00,
        "high": 145.00,
        "low": 105.00,
        "numberOfEstimates": 18,
        "lastUpdated": "2025-01-20"
      },

      // AI 목표가 (자체 모델)
      "aiEstimate": {
        "value": 128.30,
        "confidence": 0.88,
        "method": "DCF + Comparable Companies",
        "horizon": "12M",  // 12개월
        "upside": 18.5  // 현재가 대비 상승여력 (%)
      },

      // 밸류에이션 기반 목표가
      "valuationBased": {
        "dcf": {
          "fairValue": 132.00,
          "assumptions": {
            "wacc": 8.5,
            "terminalGrowth": 3.0,
            "revenueGrowth": [12, 10, 8, 7, 5]  // 5년 예측
          }
        },
        "perBand": {
          "fairValue": 122.00,
          "targetPER": 18.0,
          "estimatedEPS": 6.78,
          "historicalPERRange": { "min": 12, "median": 18, "max": 25 }
        },
        "pbrBand": {
          "fairValue": 118.00,
          "targetPBR": 2.8,
          "bps": 42.14
        }
      }
    }
  }
}
```

---

### 2.2 매수 적정가 (Buy Range)

```json
{
  "priceGuidance": {
    "buyRange": {
      // 기술적 지지선
      "technicalSupport": {
        "strong": 98.50,    // 강한 지지선
        "moderate": 103.20,  // 보통 지지선
        "weak": 106.80,     // 약한 지지선
        "method": "Fibonacci + Moving Averages + Volume Profile"
      },

      // 밸류에이션 기반 매수가
      "valuationBuyPoint": {
        "conservative": 95.00,  // 보수적 (PER 15배 기준)
        "moderate": 105.00,     // 적정 (PER 17배 기준)
        "aggressive": 112.00,   // 공격적 (PER 19배 기준)
        "method": "Historical PER Band + Margin of Safety"
      },

      // 분할매수 전략
      "dca_strategy": [
        { "priceLevel": 110.00, "allocation": "30%", "rationale": "현재가 근처 1차 진입" },
        { "priceLevel": 105.00, "allocation": "30%", "rationale": "중간 지지선 2차 매수" },
        { "priceLevel": 98.00, "allocation": "40%", "rationale": "강한 지지선 추가 매수" }
      ],

      // 추천 매수 가격대
      "recommended": {
        "idealBuyPrice": 105.00,  // 이상적 매수가
        "maxBuyPrice": 112.00,    // 최대 매수가 (이 이상은 비추천)
        "reasoning": "기술적 지지선(103.2)과 밸류에이션 적정가(105.0)를 고려한 매수가"
      }
    }
  }
}
```

---

### 2.3 매도 적정가 (Sell Range)

```json
{
  "priceGuidance": {
    "sellRange": {
      // 저항선 (기술적 분석)
      "technicalResistance": {
        "weak": 118.00,
        "moderate": 125.00,
        "strong": 135.00,
        "method": "Historical Highs + Fibonacci Extension"
      },

      // 익절 전략
      "takeProfitLevels": [
        {
          "level": 1,
          "price": 118.00,
          "profitPercent": 8.0,
          "allocation": "30%",
          "rationale": "단기 저항선, 1차 익절"
        },
        {
          "level": 2,
          "price": 125.50,
          "profitPercent": 15.0,
          "allocation": "40%",
          "rationale": "애널리스트 목표가 근접, 2차 익절"
        },
        {
          "level": 3,
          "price": 135.00,
          "profitPercent": 23.0,
          "allocation": "30%",
          "rationale": "강한 저항선, 최종 익절"
        }
      ],

      // 손절가
      "stopLoss": {
        "price": 98.50,
        "lossPercent": -10.0,
        "rationale": "강한 지지선 이탈 시 추가 하락 가능성",
        "type": "trailing" | "fixed"
      }
    }
  }
}
```

---

### 2.4 투자 시나리오 분석

```json
{
  "priceGuidance": {
    "scenarios": {
      // 낙관적 시나리오
      "bullCase": {
        "targetPrice": 145.00,
        "upside": 32.0,
        "probability": 0.25,
        "triggers": [
          "신제품 출시 성공",
          "분기 실적 기대치 20% 상회",
          "주요 계약 체결"
        ],
        "timeline": "6-9개월"
      },

      // 기본 시나리오
      "baseCase": {
        "targetPrice": 125.50,
        "upside": 15.0,
        "probability": 0.50,
        "triggers": [
          "예상대로 실적 발표",
          "섹터 평균 성장률 유지"
        ],
        "timeline": "9-12개월"
      },

      // 비관적 시나리오
      "bearCase": {
        "targetPrice": 95.00,
        "downside": -13.0,
        "probability": 0.25,
        "triggers": [
          "실적 부진",
          "주요 고객 이탈",
          "경쟁 심화"
        ],
        "timeline": "3-6개월"
      }
    }
  }
}
```

---

## 3️⃣ 종목별 상세 분석 리포트

### 3.1 투자 등급 및 신호

```json
{
  "investmentRating": {
    // 종합 등급
    "overall": {
      "rating": "Strong Buy" | "Buy" | "Hold" | "Reduce" | "Sell",
      "score": 85,  // 0-100
      "lastUpdated": "2025-01-20"
    },

    // 세부 등급
    "breakdown": {
      "fundamental": { "rating": "Buy", "score": 82 },
      "technical": { "rating": "Strong Buy", "score": 88 },
      "valuation": { "rating": "Buy", "score": 80 },
      "momentum": { "rating": "Buy", "score": 85 }
    },

    // 매매 신호
    "signals": [
      {
        "type": "technical",
        "signal": "Golden Cross",
        "description": "SMA50이 SMA200을 상향 돌파",
        "date": "2025-01-15",
        "strength": "strong"
      },
      {
        "type": "fundamental",
        "signal": "Earnings Beat",
        "description": "지난 분기 EPS $2.30 (예상치 $2.10)",
        "date": "2024-12-10",
        "strength": "strong"
      }
    ]
  }
}
```

---

## 4️⃣ API 엔드포인트 제안

### 4.1 종목 추천 요약 API
```
GET /api/v1/stocks/{symbol}/recommendation-summary
```

**Response:**
```json
{
  "symbol": "AAPL",
  "lastUpdated": "2025-01-20T10:30:00Z",
  "summary": {
    "reason": { /* 1.1의 데이터 */ },
    "opportunity": { /* 1.2의 데이터 */ },
    "caution": { /* 1.3의 데이터 */ }
  }
}
```

### 4.2 가격 가이드 API
```
GET /api/v1/stocks/{symbol}/price-guidance
```

**Response:**
```json
{
  "symbol": "AAPL",
  "currentPrice": 109.50,
  "lastUpdated": "2025-01-20T10:30:00Z",
  "guidance": {
    "targetPrice": { /* 2.1의 데이터 */ },
    "buyRange": { /* 2.2의 데이터 */ },
    "sellRange": { /* 2.3의 데이터 */ },
    "scenarios": { /* 2.4의 데이터 */ }
  }
}
```

### 4.3 투자 등급 API
```
GET /api/v1/stocks/{symbol}/investment-rating
```

---

## 5️⃣ 데이터 우선순위

### 필수 (P0) - 즉시 필요
1. ✅ 애널리스트 목표주가 컨센서스
2. ✅ 동종업계 비교 데이터 (PER, ROE 등)
3. ✅ AI 분석 근거 및 주요 팩터
4. ✅ 기술적 지지선/저항선
5. ✅ 리스크 팩터 (최소 3개)

### 중요 (P1) - 2주 내
1. 🔶 실제 호재/뉴스 데이터
2. 🔶 밸류에이션 기반 적정가 (DCF, PER Band)
3. 🔶 분할매수/익절 전략
4. 🔶 투자 시나리오 (Bull/Base/Bear Case)

### 추가 (P2) - 향후 고려
1. 🔷 실시간 뉴스 크롤링 및 요약
2. 🔷 애널리스트 리포트 요약
3. 🔷 기업 이벤트 캘린더
4. 🔷 인사이더/기관 매매 동향

---

## 6️⃣ 데이터 소스 제안

### 추천 데이터 제공업체
1. **재무 데이터**: Financial Modeling Prep, Alpha Vantage, Polygon.io
2. **애널리스트 데이터**: Seeking Alpha, TipRanks, MarketBeat
3. **뉴스/이벤트**: NewsAPI, Benzinga, Finnhub
4. **기술적 분석**: TradingView API, Tiingo
5. **대안**: Yahoo Finance API (무료, 제한적)

---

## 7️⃣ 참고 계산식

### 목표주가 계산
```
DCF 기반:
Fair Value = Σ(FCF_t / (1+WACC)^t) + Terminal Value

PER Band 기반:
Target Price = Target PER × Forward EPS

PBR Band 기반:
Target Price = Target PBR × Book Value Per Share
```

### 매수가 계산
```
Conservative Buy = Current Price × 0.85 (15% 할인)
Fair Value Buy = DCF Fair Value × 0.95 (5% 마진)
Technical Buy = Strong Support Level
```

### 손절가 계산
```
Stop Loss = max(
  Current Price × 0.90,  // 10% 손절
  Strong Support Level    // 기술적 지지선
)
```

---

## 📞 문의사항

궁금한 점이나 추가 논의가 필요한 부분이 있으면 프론트엔드 팀으로 연락 주세요.

**작성일**: 2025-01-20
**작성자**: Frontend Team
**버전**: 1.0
