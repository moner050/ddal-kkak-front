# 📊 데이터 수집 및 계산 방식 공개 문서

> **투명성 선언**: 딸깍은 모든 데이터 수집 방법과 계산 방식을 투명하게 공개합니다. 사용자 여러분이 정확히 어떤 기준으로 종목을 평가하고 있는지 명확히 이해하실 수 있도록 모든 지표의 계산식과 판단 기준을 공개합니다.

---

## 목차

1. [데이터 출처](#1-데이터-출처)
2. [기본 시장 데이터](#2-기본-시장-데이터)
3. [재무 지표 (Valuation)](#3-재무-지표-valuation)
4. [수익성 지표 (Profitability)](#4-수익성-지표-profitability)
5. [성장성 지표 (Growth)](#5-성장성-지표-growth)
6. [기술적 지표 (Technical)](#6-기술적-지표-technical)
7. [AI 점수 체계](#7-ai-점수-체계)
8. [투자 전략 필터링](#8-투자-전략-필터링)
9. [데이터 업데이트 주기](#9-데이터-업데이트-주기)

---

## 1. 데이터 출처

### 1.1 주요 데이터 소스

| 데이터 종류 | 출처 | 업데이트 주기 |
|------------|------|--------------|
| 주가 데이터 | Yahoo Finance API | 실시간 (거래 시간 중) |
| 재무제표 | SEC EDGAR (10-K, 10-Q) | 분기별 |
| 애널리스트 전망 | Yahoo Finance | 주간 |
| 공시 정보 | SEC EDGAR | 실시간 |
| 기술적 지표 | 자체 계산 (주가 데이터 기반) | 일일 |

### 1.2 데이터 수집 프로세스

```
1. 데이터 수집 (매일 미국 시장 종료 후)
   ↓
2. 데이터 검증 및 정제
   ↓
3. 지표 계산 및 점수화
   ↓
4. AI 모델 평가
   ↓
5. 프론트엔드 배포 (JSON 파일)
```

### 1.3 데이터 품질 관리

- **이상치 제거**: 3-sigma 규칙 적용 (평균 ± 3σ 범위 벗어나는 값 제외)
- **결측값 처리**:
  - 주가: 이전 거래일 종가 사용
  - 재무지표: 직전 분기 데이터 또는 `null` 표시
- **검증**: 2개 이상 출처에서 데이터 크로스체크

---

## 2. 기본 시장 데이터

### 2.1 주가 (Price)

```python
# 출처: Yahoo Finance 'regularMarketPrice'
price = yfinance_ticker.info['regularMarketPrice']

# 검증
assert price > 0, "주가는 양수여야 함"
```

**판단 기준:**
- **우수**: $50 이상 (대형주 특성)
- **보통**: $10 ~ $50 (일반 주식)
- **주의**: $5 ~ $10 (저가주 진입)
- **위험**: $5 미만 (페니스톡)

### 2.2 시가총액 (Market Cap)

```python
# 계산식
market_cap = price × total_shares_outstanding

# 단위: 10억 달러 (Billion)
market_cap_B = market_cap / 1e9

# 출처: Yahoo Finance 'marketCap'
```

**기업 규모 분류:**
- **Large Cap**: $10B 이상 (대형주)
- **Mid Cap**: $2B ~ $10B (중형주)
- **Small Cap**: $300M ~ $2B (소형주)
- **Micro Cap**: $50M ~ $300M (초소형주)
- **Nano Cap**: $50M 미만 (나노 캡)

### 2.3 거래대금 (Dollar Volume)

```python
# 계산식
dollar_volume = average_volume × price

# 20일 평균 거래량 사용
average_volume = sum(volume[-20:]) / 20

# 단위: 백만 달러 (Million)
dollar_volume_M = dollar_volume / 1e6
```

**유동성 평가:**
- **매우 높음**: $50M 이상
- **높음**: $10M ~ $50M
- **보통**: $5M ~ $10M
- **낮음**: $1M ~ $5M
- **매우 낮음**: $1M 미만 (거래 어려움)

---

## 3. 재무 지표 (Valuation)

### 3.1 PER (Price-to-Earnings Ratio)

```python
# 계산식
PER = price / EPS_TTM

# EPS (Trailing Twelve Months)
EPS_TTM = net_income_TTM / shares_outstanding

# 출처: Yahoo Finance 'trailingPE'
```

**판단 기준:**
- **매우 저평가**: PER < 10
- **저평가**: 10 ≤ PER < 15
- **적정**: 15 ≤ PER < 25
- **고평가**: 25 ≤ PER < 40
- **매우 고평가**: PER ≥ 40
- **주의**: PER < 0 (적자 기업)

**섹터별 평균 PER:**
- Technology: ~30
- Healthcare: ~25
- Financials: ~12
- Utilities: ~15

### 3.2 PEG (PER to Growth)

```python
# 계산식
PEG = PER / EPS_growth_rate

# EPS 성장률 (3년 평균)
EPS_growth_rate = ((EPS_current / EPS_3years_ago) ** (1/3) - 1) × 100

# 출처: Yahoo Finance 'pegRatio' 또는 자체 계산
```

**판단 기준:**
- **매우 우수**: PEG < 0.5
- **우수**: 0.5 ≤ PEG < 1.0
- **적정**: 1.0 ≤ PEG < 1.5
- **주의**: 1.5 ≤ PEG < 2.0
- **고평가**: PEG ≥ 2.0

**해석:**
- PEG < 1: 성장 대비 저평가
- PEG = 1: 성장과 밸류에이션 균형
- PEG > 1: 성장 대비 고평가

### 3.3 PBR (Price-to-Book Ratio)

```python
# 계산식
PBR = market_cap / book_value

# Book Value (순자산)
book_value = total_assets - total_liabilities

# 출처: Yahoo Finance 'priceToBook'
```

**판단 기준:**
- **매우 저평가**: PBR < 1.0 (장부가보다 싸게 거래)
- **저평가**: 1.0 ≤ PBR < 2.0
- **적정**: 2.0 ≤ PBR < 4.0
- **고평가**: 4.0 ≤ PBR < 8.0
- **매우 고평가**: PBR ≥ 8.0

### 3.4 P/S (Price-to-Sales Ratio)

```python
# 계산식
PS = market_cap / revenue_TTM

# 출처: Yahoo Finance 'priceToSalesTrailing12Months'
```

**판단 기준:**
- **매우 저평가**: P/S < 1
- **저평가**: 1 ≤ P/S < 3
- **적정**: 3 ≤ P/S < 10
- **고평가**: 10 ≤ P/S < 30
- **버블 위험**: P/S ≥ 30

---

## 4. 수익성 지표 (Profitability)

### 4.1 ROE (Return on Equity)

```python
# 계산식
ROE = (net_income / shareholder_equity) × 100

# 출처: Yahoo Finance 'returnOnEquity'
```

**판단 기준:**
- **매우 우수**: ROE ≥ 20%
- **우수**: 15% ≤ ROE < 20%
- **양호**: 10% ≤ ROE < 15%
- **보통**: 5% ≤ ROE < 10%
- **부진**: ROE < 5%

**벤치마크:**
- 워렌 버핏 기준: ROE > 15% (지속 가능)
- S&P 500 평균: ~15%

### 4.2 ROA (Return on Assets)

```python
# 계산식
ROA = (net_income / total_assets) × 100

# 출처: Yahoo Finance 'returnOnAssets'
```

**판단 기준:**
- **매우 우수**: ROA ≥ 10%
- **우수**: 5% ≤ ROA < 10%
- **보통**: 2% ≤ ROA < 5%
- **부진**: ROA < 2%

### 4.3 영업이익률 (Operating Margin)

```python
# 계산식
operating_margin = (operating_income / revenue) × 100

# 출처: Yahoo Finance 'operatingMargins'
```

**판단 기준:**
- **매우 우수**: ≥ 20%
- **우수**: 15% ~ 20%
- **양호**: 10% ~ 15%
- **보통**: 5% ~ 10%
- **부진**: < 5%

**섹터별 평균:**
- Software: 20-30%
- Healthcare: 15-25%
- Retail: 5-10%
- Energy: 10-15%

### 4.4 FCF Yield (Free Cash Flow Yield)

```python
# 계산식
FCF = operating_cash_flow - capital_expenditure
FCF_yield = (FCF / market_cap) × 100

# 출처: 현금흐름표 (Cash Flow Statement)
```

**판단 기준:**
- **매우 우수**: ≥ 8%
- **우수**: 5% ~ 8%
- **양호**: 3% ~ 5%
- **보통**: 1% ~ 3%
- **부진**: < 1%

**해석:**
- FCF Yield가 높을수록 현금 창출 능력이 우수함
- 배당금 지급 여력과 직결됨

---

## 5. 성장성 지표 (Growth)

### 5.1 매출 성장률 (Revenue Growth YoY)

```python
# 계산식 (전년 대비)
revenue_growth_YoY = ((revenue_current / revenue_1year_ago) - 1) × 100

# 3년 복합 연간 성장률 (CAGR)
revenue_CAGR_3Y = ((revenue_current / revenue_3years_ago) ** (1/3) - 1) × 100
```

**판단 기준:**
- **폭발적 성장**: ≥ 100% (AI 전환 기업 수준)
- **고성장**: 30% ~ 100%
- **성장**: 15% ~ 30%
- **안정 성장**: 5% ~ 15%
- **정체**: 0% ~ 5%
- **역성장**: < 0%

### 5.2 EPS 성장률 (EPS Growth)

```python
# 계산식 (3년 평균)
EPS_growth_3Y = ((EPS_current / EPS_3years_ago) ** (1/3) - 1) × 100

# 출처: Yahoo Finance 'earningsQuarterlyGrowth'
```

**판단 기준:**
- **매우 우수**: ≥ 25%
- **우수**: 15% ~ 25%
- **양호**: 10% ~ 15%
- **보통**: 5% ~ 10%
- **부진**: < 5%

### 5.3 EBITDA 성장률

```python
# EBITDA 계산
EBITDA = operating_income + depreciation + amortization

# 성장률
EBITDA_growth = ((EBITDA_current / EBITDA_1year_ago) - 1) × 100
```

**판단 기준:**
- **매우 우수**: ≥ 20%
- **우수**: 10% ~ 20%
- **보통**: 5% ~ 10%
- **부진**: < 5%

---

## 6. 기술적 지표 (Technical)

### 6.1 RSI (Relative Strength Index)

```python
# 계산식 (14일 기준)
# 1. 상승폭과 하락폭 계산
gains = [max(price[i] - price[i-1], 0) for i in range(1, len(price))]
losses = [max(price[i-1] - price[i], 0) for i in range(1, len(price))]

# 2. 평균 상승/하락폭 (14일)
avg_gain = sum(gains[-14:]) / 14
avg_loss = sum(losses[-14:]) / 14

# 3. RS (Relative Strength)
RS = avg_gain / avg_loss if avg_loss != 0 else 100

# 4. RSI
RSI = 100 - (100 / (1 + RS))
```

**판단 기준:**
- **과매수**: RSI ≥ 70 (조정 가능성)
- **중립 상단**: 60 ≤ RSI < 70
- **중립**: 40 ≤ RSI < 60
- **중립 하단**: 30 ≤ RSI < 40
- **과매도**: RSI ≤ 30 (반등 가능성)

### 6.2 볼린저 밴드 위치

```python
# 계산식 (20일 기준)
# 1. 중심선 (20일 이동평균)
middle_band = SMA_20 = sum(close[-20:]) / 20

# 2. 표준편차
std_dev = sqrt(sum((price - SMA_20)^2 for price in close[-20:]) / 20)

# 3. 상단/하단 밴드
upper_band = SMA_20 + (2 × std_dev)
lower_band = SMA_20 - (2 × std_dev)

# 4. 현재 위치 (%)
bb_position = ((current_price - lower_band) / (upper_band - lower_band)) × 100
```

**판단 기준:**
- **상단 돌파**: > 100% (강한 상승 추세, 과열 가능)
- **상단 근처**: 80% ~ 100%
- **중립**: 20% ~ 80%
- **하단 근처**: 0% ~ 20%
- **하단 돌파**: < 0% (강한 하락 추세, 과매도)

### 6.3 MACD (Moving Average Convergence Divergence)

```python
# 계산식
# 1. 단기 지수이동평균 (12일)
EMA_12 = exponential_moving_average(close, 12)

# 2. 장기 지수이동평균 (26일)
EMA_26 = exponential_moving_average(close, 26)

# 3. MACD 선
MACD_line = EMA_12 - EMA_26

# 4. 시그널 선 (MACD의 9일 EMA)
signal_line = exponential_moving_average(MACD_line, 9)

# 5. 히스토그램
MACD_histogram = MACD_line - signal_line
```

**판단 기준:**
- **강한 매수 신호**: 히스토그램 > 0 and 증가 중
- **약한 매수 신호**: 히스토그램 > 0 but 감소 중
- **중립**: 히스토그램 ≈ 0
- **약한 매도 신호**: 히스토그램 < 0 but 증가 중
- **강한 매도 신호**: 히스토그램 < 0 and 감소 중

### 6.4 수익률 (Returns)

```python
# 단기 수익률
ret_5d = ((close[-1] / close[-5]) - 1) × 100    # 5일
ret_20d = ((close[-1] / close[-20]) - 1) × 100  # 20일 (1개월)
ret_63d = ((close[-1] / close[-63]) - 1) × 100  # 63일 (3개월)
ret_252d = ((close[-1] / close[-252]) - 1) × 100 # 252일 (1년)

# 52주 고가 대비 비율
high_52w_ratio = (current_price / max(close[-252:])) × 100
```

### 6.5 Beta (변동성)

```python
# 계산식 (S&P 500 대비)
# 1. 일일 수익률 계산
stock_returns = [((price[i] / price[i-1]) - 1) for i in range(1, len(price))]
market_returns = [((sp500[i] / sp500[i-1]) - 1) for i in range(1, len(sp500))]

# 2. 공분산과 분산
covariance = cov(stock_returns, market_returns)
market_variance = var(market_returns)

# 3. Beta
beta = covariance / market_variance

# 출처: Yahoo Finance 'beta'
```

**판단 기준:**
- **초고위험**: Beta > 2.5 (시장의 2.5배 변동)
- **고위험**: 2.0 ≤ Beta ≤ 2.5
- **공격적**: 1.5 ≤ Beta < 2.0
- **시장 평균**: 0.8 ≤ Beta < 1.2
- **방어적**: 0.5 ≤ Beta < 0.8
- **초방어적**: Beta < 0.5

---

## 7. AI 점수 체계

### 7.1 종합 점수 (Total Score)

```python
# 가중 평균 계산
total_score = (
    growth_score × 0.30 +      # 성장성 30%
    quality_score × 0.25 +     # 품질 25%
    value_score × 0.25 +       # 가치 25%
    momentum_score × 0.20      # 모멘텀 20%
)

# 0-100점 스케일로 정규화
```

**판단 기준:**
- **S급 (매우 유망)**: 80 ~ 100점
- **A급 (유망)**: 70 ~ 80점
- **B급 (보통)**: 60 ~ 70점
- **C급 (주의)**: 50 ~ 60점
- **D급 (위험)**: 0 ~ 50점

### 7.2 성장 점수 (Growth Score)

```python
# 지표별 점수 (0-100)
revenue_growth_score = normalize(revenue_growth_YoY, 0, 100, 0, 100)
eps_growth_score = normalize(EPS_growth_3Y, 0, 50, 0, 100)
ebitda_growth_score = normalize(EBITDA_growth, 0, 30, 0, 100)
revenue_3y_score = normalize(revenue_CAGR_3Y, 0, 30, 0, 100)

# 가중 평균
growth_score = (
    revenue_growth_score × 0.35 +
    eps_growth_score × 0.30 +
    ebitda_growth_score × 0.20 +
    revenue_3y_score × 0.15
)
```

**핵심 영향 요소:**
- 매출 성장률 (YoY): 35%
- EPS 성장률 (3Y): 30%
- EBITDA 성장률: 20%
- 매출 CAGR (3Y): 15%

### 7.3 품질 점수 (Quality Score)

```python
# 지표별 점수
roe_score = normalize(ROE, 0, 30, 0, 100)
roa_score = normalize(ROA, 0, 15, 0, 100)
op_margin_score = normalize(operating_margin, 0, 25, 0, 100)
fcf_yield_score = normalize(FCF_yield, 0, 10, 0, 100)

# 가중 평균
quality_score = (
    roe_score × 0.30 +
    op_margin_score × 0.30 +
    roa_score × 0.20 +
    fcf_yield_score × 0.20
)
```

**핵심 영향 요소:**
- ROE: 30%
- 영업이익률: 30%
- ROA: 20%
- FCF Yield: 20%

### 7.4 가치 점수 (Value Score)

```python
# 역수 정규화 (낮을수록 좋음)
per_score = normalize(1/PER if PER > 0 else 0, 0, 0.1, 0, 100)
peg_score = normalize(1/PEG if PEG > 0 else 0, 0, 2, 0, 100)
pb_score = normalize(1/PBR, 0, 1, 0, 100)
ps_score = normalize(1/PS, 0, 1, 0, 100)

# 가중 평균
value_score = (
    peg_score × 0.35 +
    per_score × 0.30 +
    pb_score × 0.20 +
    ps_score × 0.15
)
```

**핵심 영향 요소:**
- PEG (성장 대비 가치): 35%
- PER: 30%
- PBR: 20%
- P/S: 15%

### 7.5 모멘텀 점수 (Momentum Score)

```python
# 수익률 점수
ret_5d_score = normalize(ret_5d, -5, 10, 0, 100)
ret_20d_score = normalize(ret_20d, -10, 20, 0, 100)
ret_63d_score = normalize(ret_63d, -15, 30, 0, 100)

# RSI 점수 (40-70이 최적)
rsi_score = 100 - abs(RSI - 55) × 2

# 가중 평균
momentum_score = (
    ret_20d_score × 0.35 +
    ret_63d_score × 0.30 +
    rsi_score × 0.20 +
    ret_5d_score × 0.15
)
```

**핵심 영향 요소:**
- 20일 수익률: 35%
- 63일 수익률: 30%
- RSI: 20%
- 5일 수익률: 15%

---

## 8. 투자 전략 필터링

### 8.1 저평가 우량주 (Undervalued Quality)

```python
def matches_undervalued_quality(stock):
    return (
        stock.market_cap >= 2.0 and          # 20억 달러 이상
        stock.price >= 10 and
        stock.dollar_volume >= 5.0 and       # 500만 달러
        0 < stock.PER < 25 and
        stock.PEG < 1.0 and
        stock.PS < 50 and
        stock.PB < 10 and
        stock.revenue_growth_YoY > 5 and
        stock.EPS_growth_3Y > 5 and
        stock.operating_margin > 12 and
        stock.ROE > 15 and
        stock.FCF_yield > 3 and
        stock.short_percent < 20
    )
```

### 8.2 AI 전환 기업 (AI Transformation)

```python
def matches_ai_transformation(stock):
    # 섹터 제한
    ai_sectors = ["Information Technology", "Communication Services"]

    return (
        stock.category in ai_sectors and
        stock.market_cap >= 1.0 and
        stock.ROE > 20 and
        stock.operating_margin > 10 and
        stock.revenue_growth_YoY > 200 and   # 200% 이상 폭발적 성장
        0 < stock.PER < 40 and
        stock.PS < 30 and
        stock.short_percent < 30 and
        stock.beta > 2.5                     # 초고위험 고성장
    )
```

**핵심 특징:**
- **섹터 한정**: IT, 통신 서비스만
- **극단적 성장**: 매출 200% 이상
- **높은 수익성**: ROE 20%, 영업이익률 10%
- **고위험**: Beta 2.5 이상

---

## 9. 데이터 업데이트 주기

### 9.1 실시간 데이터 (거래 시간 중)

- 주가
- 거래량
- 호가

### 9.2 일일 업데이트 (미국 시장 종료 후)

- 기술적 지표 (RSI, MACD, 볼린저 밴드)
- 수익률
- AI 점수
- 거래대금

**업데이트 시간**:
- **미국 동부 시간**: 18:00 (장 마감 후 2시간)
- **한국 시간**: 익일 08:00

### 9.3 주간 업데이트 (매주 주말)

- 애널리스트 전망
- 목표주가
- 공매도 비율

### 9.4 분기별 업데이트

- 재무제표 (10-K, 10-Q 발표 시)
- ROE, ROA, 영업이익률
- 부채비율
- 장기 성장률

### 9.5 수동 업데이트

- 기업 이벤트 (M&A, 주식분할 등)
- 배당 정책 변경
- 경영진 교체

---

## 10. 데이터 신뢰성 및 한계

### 10.1 데이터 정확성

- **정확도**: 95% 이상 (2개 출처 교차 검증)
- **지연 시간**: 최대 15분 (실시간 데이터)
- **커버리지**: 미국 상장 전 종목 (NYSE, NASDAQ, AMEX)

### 10.2 알려진 한계

1. **과거 데이터 기반**: 미래 성과를 보장하지 않음
2. **분석 한계**: 정성적 요소 (경영진 역량, 브랜드 가치 등) 미반영
3. **시장 예외 상황**: 블랙스완 이벤트 예측 불가
4. **지연 시간**: 실시간 데이터는 최대 15분 지연

### 10.3 면책 조항

> ⚠️ **투자 판단의 책임**: 본 데이터는 정보 제공 목적이며, 투자 권유가 아닙니다. 모든 투자 결정과 그 결과에 대한 책임은 투자자 본인에게 있습니다.

---

## 11. 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|----------|
| 2025-12-11 | 1.2.0 | AI 전환 기업 필터 강화 (섹터 제한, 성장률 200% 상향) |
| 2025-12-10 | 1.1.0 | PEG 기준 강화, 버블 방지 지표 추가 |
| 2025-11-01 | 1.0.0 | 초기 버전 공개 |

---

## 12. 문의 및 피드백

데이터 계산 방식에 대한 문의나 개선 제안은 아래로 연락 주시기 바랍니다:

- **이메일**: data@ddalkkak.com
- **GitHub Issues**: [github.com/ddalkkak/issues](https://github.com/ddalkkak/issues)

---

**마지막 업데이트**: 2025-12-11
**버전**: 1.2.0
