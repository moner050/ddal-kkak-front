import React, { useState } from 'react';
import { METRIC_TOOLTIPS, SCORE_CRITERIA, RSI_CRITERIA, BETA_CRITERIA } from '../constants/metricTooltips';
import { INVESTMENT_STRATEGIES } from '../constants/investmentStrategies';

export default function CalculationGuide() {
  const [activeTab, setActiveTab] = useState<'metrics' | 'scores' | 'strategies' | 'fairValue'>('metrics');

  return (
    <div className="bg-gray-50">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">📊 계산 방식 및 투자 전략 가이드</h1>
          <p className="text-lg text-indigo-100">
            Finance Info Shuttle의 모든 계산 방식을 투명하게 공개합니다
          </p>
          <div className="mt-4 text-sm text-indigo-200">
            최종 업데이트: 2025-12-11 | 버전: 2.0
          </div>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto py-4">
            <TabButton
              active={activeTab === 'metrics'}
              onClick={() => setActiveTab('metrics')}
              icon="📈"
              label="기본 지표"
            />
            <TabButton
              active={activeTab === 'scores'}
              onClick={() => setActiveTab('scores')}
              icon="⭐"
              label="점수 계산"
            />
            <TabButton
              active={activeTab === 'fairValue'}
              onClick={() => setActiveTab('fairValue')}
              icon="💰"
              label="적정가치"
            />
            <TabButton
              active={activeTab === 'strategies'}
              onClick={() => setActiveTab('strategies')}
              icon="🎯"
              label="투자 전략"
            />
          </div>
        </div>
      </div>

      {/* 컨텐츠 */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {activeTab === 'metrics' && <MetricsTab />}
        {activeTab === 'scores' && <ScoresTab />}
        {activeTab === 'fairValue' && <FairValueTab />}
        {activeTab === 'strategies' && <StrategiesTab />}
      </div>

      {/* 면책 조항 */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <DisclaimerSection />
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: string; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all ${
        active
          ? 'bg-indigo-600 text-white shadow-md'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function MetricsTab() {
  const metricCategories = {
    '밸류에이션 지표': ['pe', 'peg', 'pb', 'ps', 'evEbitda'],
    '재무 지표': ['roe', 'roa', 'opMargin', 'fcfYield', 'divYield'],
    '성장성 지표': ['revGrowth', 'epsGrowth3Y', 'revenueGrowth3Y', 'ebitdaGrowth3Y'],
    '기술적 지표': ['rsi', 'macd', 'macdSignal', 'macdHistogram', 'bbPosition', 'atr', 'atrPercent'],
    '수익률 지표': ['ret5d', 'ret20d', 'ret63d', 'perfSinceIntro', 'perf100d', 'high52wRatio'],
    '리스크 지표': ['beta', 'shortPercent'],
    '거래 지표': ['rvol', 'dollarVolume', 'volume', 'avgVolume'],
  };

  return (
    <div className="space-y-8">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h3 className="font-bold text-blue-900 mb-2">📌 데이터 소스</h3>
        <p className="text-sm text-blue-800">
          모든 데이터는 <strong>Yahoo Finance API (yfinance)</strong>를 통해 수집됩니다.
          일일 스냅샷 방식으로 미국 시장 종가 후 업데이트됩니다.
        </p>
      </div>

      {Object.entries(metricCategories).map(([category, metrics]) => (
        <div key={category} className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{category}</h2>
          <div className="space-y-4">
            {metrics.map((metric) => (
              <MetricCard key={metric} metricKey={metric as keyof typeof METRIC_TOOLTIPS} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function MetricCard({ metricKey }: { metricKey: keyof typeof METRIC_TOOLTIPS }) {
  const description = METRIC_TOOLTIPS[metricKey];
  const displayName = metricKey.toUpperCase();

  return (
    <div className="border-l-4 border-indigo-500 pl-4 py-2">
      <div className="font-bold text-gray-900 mb-1">{displayName}</div>
      <div className="text-sm text-gray-700">{description}</div>
    </div>
  );
}

function ScoresTab() {
  return (
    <div className="space-y-8">
      {/* 점수 계산 개요 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">⭐ 점수 계산 시스템</h2>
        <p className="text-gray-700 mb-4">
          4가지 핵심 점수를 계산하여 종합 점수를 산출합니다:
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <ScoreCard
            title="성장 점수 (Growth Score)"
            description="매출·EPS 성장률, 단기 수익률 기반"
            weight="25%"
            color="green"
          />
          <ScoreCard
            title="품질 점수 (Quality Score)"
            description="ROE, 영업이익률, FCF Yield 기반"
            weight="30%"
            color="blue"
          />
          <ScoreCard
            title="가치 점수 (Value Score)"
            description="P/E, PEG, P/B (낮을수록 좋음)"
            weight="30%"
            color="purple"
          />
          <ScoreCard
            title="모멘텀 점수 (Momentum Score)"
            description="거래량, 수익률, RSI, MACD 기반"
            weight="15%"
            color="orange"
          />
        </div>
      </div>

      {/* 섹터별 정규화 */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
        <h3 className="text-xl font-bold text-blue-900 mb-4">🎯 섹터별 정규화 (2025-12 개선)</h3>
        <div className="space-y-3 text-gray-800">
          <p className="font-semibold">기술주는 높은 성장률, 유틸리티는 낮은 성장률이 정상입니다.</p>
          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <div className="font-mono text-sm">
              <div className="mb-2">정규화 점수 = <span className="text-blue-600 font-bold">섹터 내 백분위 × 40%</span> + <span className="text-purple-600 font-bold">전체 백분위 × 60%</span></div>
            </div>
          </div>
          <div className="text-sm space-y-2">
            <p>✅ <strong>효과:</strong> 섹터 특성을 반영하여 공정한 평가</p>
            <p>✅ <strong>페널티:</strong> 음수 ROE/성장률(-10% 이하) 시 0점 처리</p>
          </div>
        </div>
      </div>

      {/* 종합 점수 기준 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">📊 종합 점수 (Total Score) 기준</h3>
        <div className="space-y-2">
          {Object.entries(SCORE_CRITERIA.totalScore).map(([key, criteria]) => (
            <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`font-bold text-lg ${getScoreColor(criteria.min)}`}>
                  {criteria.label}
                </div>
                <div className="text-sm text-gray-600">
                  {criteria.min}~{criteria.max}점
                </div>
              </div>
              <div className="text-sm font-semibold text-gray-700">
                {criteria.description}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RSI 기준 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">📈 RSI (14일) 기준</h3>
        <div className="space-y-2">
          {Object.entries(RSI_CRITERIA).map(([key, criteria]) => (
            <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="font-bold text-gray-900">{criteria.label}</div>
                <div className="text-sm text-gray-600">
                  {'min' in criteria && 'max' in criteria
                    ? `${criteria.min}~${criteria.max}`
                    : 'min' in criteria
                    ? `${criteria.min} 이상`
                    : `${'max' in criteria ? criteria.max : ''} 이하`}
                </div>
              </div>
              <div className="text-sm text-gray-700">{criteria.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 베타 기준 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">📊 베타 (Beta) 기준</h3>
        <div className="space-y-2">
          {Object.entries(BETA_CRITERIA).map(([key, criteria]) => (
            <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="font-bold text-gray-900">{criteria.label}</div>
                <div className="text-sm text-gray-600">
                  {'min' in criteria && 'max' in criteria
                    ? `${criteria.min}~${criteria.max}`
                    : 'min' in criteria
                    ? `${criteria.min} 이상`
                    : `${'max' in criteria ? criteria.max : ''} 이하`}
                </div>
              </div>
              <div className="text-sm text-gray-700">{criteria.description}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ScoreCard({ title, description, weight, color }: { title: string; description: string; weight: string; color: string }) {
  const colorClasses = {
    green: 'bg-green-50 border-green-200 text-green-900',
    blue: 'bg-blue-50 border-blue-200 text-blue-900',
    purple: 'bg-purple-50 border-purple-200 text-purple-900',
    orange: 'bg-orange-50 border-orange-200 text-orange-900',
  };

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color as keyof typeof colorClasses]}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold">{title}</h3>
        <span className="text-sm font-semibold px-2 py-1 bg-white rounded">{weight}</span>
      </div>
      <p className="text-sm">{description}</p>
    </div>
  );
}

function FairValueTab() {
  return (
    <div className="space-y-8">
      {/* 적정가치 계산 개요 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">💰 적정가치 및 할인율 계산</h2>
        <p className="text-gray-700 mb-4">
          2가지 방법론을 사용하여 적정가치를 산출하고 중앙값을 사용합니다:
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-bold text-blue-900 mb-2">1️⃣ 섹터 중앙값 P/E 방법</h3>
            <p className="text-sm text-blue-800">같은 섹터의 중앙값 P/E를 적용하여 적정가치 계산</p>
          </div>
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h3 className="font-bold text-purple-900 mb-2">2️⃣ Peter Lynch PEG 방법론</h3>
            <p className="text-sm text-purple-800">PEG = 1일 때 적정 P/E = 성장률 원칙 적용</p>
          </div>
        </div>
      </div>

      {/* Peter Lynch PEG 방법론 */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200 p-6">
        <h3 className="text-xl font-bold text-purple-900 mb-4">🎓 Peter Lynch PEG 방법론 (2025-12 개선)</h3>
        <div className="space-y-4">
          <div className="bg-white rounded-lg p-4 border border-purple-100">
            <div className="font-mono text-sm space-y-2">
              <div>성장률 = PE / PEG</div>
              <div className="text-purple-600 font-bold">적정 PE = 성장률 (PEG=1일 때)</div>
              <div>적정가치 = EPS × 적정 PE</div>
            </div>
          </div>
          <div className="text-sm space-y-2 text-gray-800">
            <p>✅ <strong>원칙:</strong> PEG 비율 = 1이 적정 밸류에이션</p>
            <p>✅ <strong>검증:</strong> 적정가치가 현재가의 0.5배~3배 범위 내여야 함</p>
            <p>✅ <strong>폴백:</strong> 범위 밖이면 DCF로 대체</p>
          </div>
          <div className="bg-purple-100 rounded-lg p-3 text-sm text-purple-900">
            <strong>예시:</strong> 현재가 $80, PE 24, PEG 1.5 → 성장률 16% → 적정 PE 16 → 적정가치 $53.28 (고평가)
          </div>
        </div>
      </div>

      {/* 할인율 계산 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">📊 할인율 (Discount / Upside) 계산</h3>
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="font-mono text-center text-lg mb-2">
            할인율 = (적정가치 - 현재가) / 현재가 × 100
          </div>
          <div className="text-sm text-center text-gray-600">
            양수(+): 저평가 (상승여력) | 음수(-): 고평가 (하락위험)
          </div>
        </div>
        <div className="space-y-2">
          {Object.entries(SCORE_CRITERIA.discount).map(([key, criteria]) => (
            <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`font-bold ${getDiscountColor(key)}`}>{criteria.label}</div>
                <div className="text-sm text-gray-600">
                  {'min' in criteria && 'max' in criteria
                    ? `${criteria.min}% ~ ${criteria.max}%`
                    : 'min' in criteria
                    ? `${criteria.min}% 이상`
                    : `${'max' in criteria ? criteria.max : ''}% 이하`}
                </div>
              </div>
              <div className="text-sm text-gray-700">{criteria.description}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StrategiesTab() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">🎯 투자 전략 (프로파일)</h2>
        <p className="text-gray-700 mb-6">
          7가지 투자 전략을 제공하며, 각 프로파일은 독립적인 필터링 조건을 가집니다.
        </p>
        <div className="space-y-4">
          {Object.entries(INVESTMENT_STRATEGIES).map(([key, strategy]) => (
            <StrategyCard key={key} strategyKey={key} strategy={strategy} />
          ))}
        </div>
      </div>
    </div>
  );
}

function StrategyCard({ strategyKey, strategy }: { strategyKey: string; strategy: any }) {
  const [expanded, setExpanded] = useState(false);

  const getStrategyColor = (key: string) => {
    const colors: Record<string, string> = {
      undervalued_quality: 'blue',
      value_basic: 'green',
      value_strict: 'emerald',
      growth_quality: 'purple',
      momentum: 'orange',
      swing: 'pink',
      ai_transformation: 'red',
    };
    return colors[key] || 'gray';
  };

  const color = getStrategyColor(strategyKey);
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-900',
    green: 'bg-green-50 border-green-200 text-green-900',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    purple: 'bg-purple-50 border-purple-200 text-purple-900',
    orange: 'bg-orange-50 border-orange-200 text-orange-900',
    pink: 'bg-pink-50 border-pink-200 text-pink-900',
    red: 'bg-red-50 border-red-200 text-red-900',
  };

  return (
    <div className={`rounded-lg border p-4 ${colorClasses[color as keyof typeof colorClasses]}`}>
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div>
          <h3 className="font-bold text-lg">{strategy.name}</h3>
          <p className="text-sm mt-1">{strategy.description}</p>
        </div>
        <button className="text-2xl ml-4 flex-shrink-0">
          {expanded ? '▼' : '▶'}
        </button>
      </div>
      {expanded && (
        <div className="mt-4 pt-4 border-t border-gray-300">
          <h4 className="font-semibold mb-2">필수 조건:</h4>
          <ul className="space-y-1 text-sm">
            {strategy.criteria.map((criterion: string, idx: number) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-green-600 font-bold flex-shrink-0">✓</span>
                <span>{criterion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function DisclaimerSection() {
  return (
    <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6">
      <h3 className="text-xl font-bold text-yellow-900 mb-4">⚠️ 주의사항 및 면책조항</h3>
      <div className="space-y-3 text-sm text-yellow-900">
        <div>
          <strong>투자 판단의 한계:</strong>
          <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
            <li>모든 지표는 과거 데이터에 기반하며 미래를 보장하지 않습니다</li>
            <li>뉴스, 이벤트, 경영진 변화 등 정성적 요소는 반영하지 못합니다</li>
            <li>금리, 경기 사이클, 지정학적 리스크는 별도 고려 필요</li>
          </ul>
        </div>
        <div className="pt-3 border-t border-yellow-300">
          <strong className="text-red-700">면책조항:</strong>
          <p className="mt-1">
            본 시스템은 투자 참고 자료일 뿐이며, 투자 권유가 아닙니다.
            모든 투자 결정은 투자자 본인의 책임입니다.
            투자 손실에 대한 책임은 투자자 본인에게 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
}

function getScoreColor(score: number): string {
  if (score >= 90) return 'text-green-600';
  if (score >= 80) return 'text-blue-600';
  if (score >= 70) return 'text-indigo-600';
  if (score >= 60) return 'text-yellow-600';
  if (score >= 50) return 'text-orange-600';
  if (score >= 40) return 'text-red-600';
  return 'text-gray-600';
}

function getDiscountColor(key: string): string {
  if (key.includes('very') && key.includes('Under')) return 'text-green-700';
  if (key.includes('Under')) return 'text-green-600';
  if (key.includes('fair')) return 'text-gray-700';
  if (key.includes('Over')) return 'text-red-600';
  if (key.includes('very') && key.includes('Over')) return 'text-red-700';
  return 'text-gray-600';
}
