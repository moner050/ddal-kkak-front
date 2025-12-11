import React from 'react';
import { classNames } from '../../utils/format';
import { INVESTMENT_STRATEGIES } from '../../constants/investmentStrategies';

interface InvestmentStrategySelectorProps {
  undervaluedStrategies: string[];
  toggleStrategy: (strategy: string) => void;
}

/**
 * 투자 전략 필터 기준 통합 함수
 * 여러 전략의 필터 기준을 병합하여 가장 엄격한 조건만 유지
 */
function mergeCriteria(criteria: string[]): string[] {
  // 기준 유형별로 그룹화
  const criteriaByType: Record<string, { value: number; original: string; operator: string }[]> = {};

  criteria.forEach((criterion) => {
    // 기준 파싱
    const match = criterion.match(/^([^:]+):\s*(.+)$/);
    if (!match) {
      // 파싱 불가능한 기준은 그대로 추가
      if (!criteriaByType['기타']) criteriaByType['기타'] = [];
      criteriaByType['기타'].push({ value: 0, original: criterion, operator: '' });
      return;
    }

    const type = match[1].trim();
    const valueStr = match[2].trim();

    // 숫자와 연산자 추출
    const numMatch = valueStr.match(/([\d.]+)\s*([억만]?\s*달러|달러|%)?/);
    if (!numMatch) {
      if (!criteriaByType['기타']) criteriaByType['기타'] = [];
      criteriaByType['기타'].push({ value: 0, original: criterion, operator: '' });
      return;
    }

    let value = parseFloat(numMatch[1]);
    const unit = numMatch[2] || '';

    // 단위 변환
    if (unit.includes('억')) {
      value *= 100000000;
    } else if (unit.includes('만')) {
      value *= 10000;
    }

    // 연산자 결정
    let operator = '';
    if (valueStr.includes('>') || valueStr.includes('이상')) {
      operator = '>=';
    } else if (valueStr.includes('<') || valueStr.includes('이하') || valueStr.includes('미만')) {
      operator = '<=';
    }

    if (!criteriaByType[type]) criteriaByType[type] = [];
    criteriaByType[type].push({ value, original: criterion, operator });
  });

  // 각 유형별로 가장 엄격한 기준만 선택
  const merged: string[] = [];

  Object.entries(criteriaByType).forEach(([type, values]) => {
    if (type === '기타') {
      // 기타 항목은 중복 제거하여 모두 추가
      const unique = Array.from(new Set(values.map(v => v.original)));
      merged.push(...unique);
      return;
    }

    // >= 연산자: 가장 큰 값 선택
    const greaterThanValues = values.filter(v => v.operator === '>=');
    if (greaterThanValues.length > 0) {
      const max = greaterThanValues.reduce((prev, curr) =>
        curr.value > prev.value ? curr : prev
      );
      merged.push(max.original);
    }

    // <= 연산자: 가장 작은 값 선택
    const lessThanValues = values.filter(v => v.operator === '<=');
    if (lessThanValues.length > 0) {
      const min = lessThanValues.reduce((prev, curr) =>
        curr.value < prev.value ? curr : prev
      );
      merged.push(min.original);
    }

    // 연산자가 없는 경우
    const noOperatorValues = values.filter(v => !v.operator);
    if (noOperatorValues.length > 0) {
      // 중복 제거하여 추가
      const unique = Array.from(new Set(noOperatorValues.map(v => v.original)));
      merged.push(...unique);
    }
  });

  return merged;
}

/**
 * InvestmentStrategySelector - 투자 전략 선택 패널
 * 다중 선택 가능한 투자 전략 선택 UI
 */
export default function InvestmentStrategySelector({
  undervaluedStrategies,
  toggleStrategy
}: InvestmentStrategySelectorProps) {
  return (
    <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 space-y-4">
      <div>
        <div className="text-xs sm:text-sm text-gray-600 mb-1 font-semibold">📋 투자 전략 선택 (다중 선택 가능)</div>
        <div className="text-[10px] sm:text-xs text-gray-500 mb-3">전략을 클릭하여 선택/해제할 수 있습니다. 아무것도 선택하지 않으면 모든 종목이 표시됩니다.</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(INVESTMENT_STRATEGIES).map(([key, strategy]) => {
            const isSelected = undervaluedStrategies.includes(key as any);
            return (
              <button
                key={key}
                onClick={() => toggleStrategy(key as any)}
                className={classNames(
                  "text-left p-4 rounded-lg border-2 transition-all",
                  isSelected
                    ? "bg-indigo-50 border-indigo-600 shadow-md"
                    : "bg-white border-gray-200 hover:border-indigo-300 hover:bg-gray-50"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className={classNames(
                    "text-sm font-bold mb-1",
                    isSelected ? "text-indigo-700" : "text-gray-900"
                  )}>
                    {strategy.name}
                  </div>
                  {isSelected && (
                    <div className="flex-shrink-0 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-600">{strategy.description}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 선택된 전략의 필터 기준 표시 (통합) */}
      {undervaluedStrategies.length > 0 && (
        <div className="space-y-3">
          {(() => {
            // 모든 선택된 전략의 기준을 수집
            const allCriteria: string[] = [];
            undervaluedStrategies.forEach((strategyKey) => {
              allCriteria.push(...INVESTMENT_STRATEGIES[strategyKey].criteria);
            });

            // 기준 통합 로직
            const mergedCriteria = mergeCriteria(allCriteria);

            return (
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                <div className="text-xs font-bold text-blue-900 mb-2">
                  📌 통합 필터 기준 ({undervaluedStrategies.length}개 전략 선택)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {mergedCriteria.map((criterion, idx) => (
                    <div key={idx} className="text-xs text-blue-800 flex items-start gap-1">
                      <span>•</span>
                      <span>{criterion}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}
      {undervaluedStrategies.length === 0 && (
        <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 text-center">
          <div className="text-xs text-gray-600">전략을 선택하지 않았습니다. 모든 종목이 표시됩니다.</div>
        </div>
      )}
    </div>
  );
}
