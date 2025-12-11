/**
 * 엑셀 내보내기 유틸리티 함수들
 * DemoHome에서 분리하여 재사용성과 유지보수성 향상
 */

import * as XLSX from "xlsx";
import { INVESTMENT_STRATEGIES } from "../constants/investmentStrategies";
import type { FrontendFiling, FrontendUndervaluedStock } from "../api/types";

/**
 * SEC 공시 데이터를 엑셀로 내보내기
 * @param filings - 공시 데이터 배열
 */
export function exportFilingsToExcel(filings: any[]) {
  if (filings.length === 0) {
    alert("다운로드할 데이터가 없습니다.");
    return;
  }

  // 엑셀에 표시할 데이터 가공
  const excelData = filings.map(filing => ({
    "시장": filing.market,
    "티커": filing.symbol,
    "회사명": filing.company,
    "공시 유형": filing.formType,
    "공시일": filing.date,
    "요약": filing.summary,
    "감정 분석": filing.sentiment === "POS" ? "긍정" : filing.sentiment === "NEG" ? "부정" : "중립",
    "종합 점수": filing.aiScore,
    "신뢰도": `${(filing.confidence * 100).toFixed(1)}%`,
    "섹터": filing.category,
    "산업군": filing.industry || "-"
  }));

  // 워크시트 생성
  const ws = XLSX.utils.json_to_sheet(excelData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "공시분석");

  // 파일 다운로드
  const fileName = `공시분석_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * 종목 상세 정보를 엑셀로 내보내기
 * @param stockDetail - 종목 상세 데이터
 * @param stockInfo - 종목 기본 정보 (선택)
 */
export function exportStockDetailToExcel(stockDetail: any, stockInfo?: any) {
  if (!stockDetail) {
    alert("다운로드할 데이터가 없습니다.");
    return;
  }

  // 기본 정보
  const basicInfo = [
    { "항목": "티커", "값": stockDetail.Ticker },
    { "항목": "회사명", "값": stockDetail.Name },
    { "항목": "섹터", "값": stockDetail.Sector },
    { "항목": "산업군", "값": stockDetail.Industry },
    { "항목": "현재가", "값": `$${stockDetail.Price?.toLocaleString()}` },
    { "항목": "시가총액", "값": `$${stockDetail.MktCap?.toLocaleString()}B` }
  ];

  // 종합 평가
  const scores = [
    { "항목": "Growth Score", "값": stockDetail.GrowthScore },
    { "항목": "Quality Score", "값": stockDetail.QualityScore },
    { "항목": "Value Score", "값": stockDetail.ValueScore },
    { "항목": "Momentum Score", "값": stockDetail.MomentumScore },
    { "항목": "Total Score", "값": stockDetail.TotalScore }
  ];

  // 밸류에이션
  const valuation = [
    { "항목": "Fair Value", "값": stockDetail.FairValue },
    { "항목": "Discount", "값": `${stockDetail.Discount?.toFixed(1)}%` },
    { "항목": "PE", "값": stockDetail.PE?.toFixed(2) },
    { "항목": "PEG", "값": stockDetail.PEG?.toFixed(2) },
    { "항목": "PB", "값": stockDetail.PB?.toFixed(2) },
    { "항목": "PS", "값": stockDetail.PS?.toFixed(2) },
    { "항목": "EV/EBITDA", "값": stockDetail.EV_EBITDA?.toFixed(2) }
  ];

  // 수익성
  const profitability = [
    { "항목": "ROE", "값": `${stockDetail.ROE?.toFixed(1)}%` },
    { "항목": "ROA", "값": `${stockDetail.ROA?.toFixed(1)}%` },
    { "항목": "Op Margin TTM", "값": `${stockDetail.OpMarginTTM?.toFixed(1)}%` },
    { "항목": "Operating Margins", "값": `${stockDetail.OperatingMargins?.toFixed(1)}%` }
  ];

  // 성장성
  const growth = [
    { "항목": "Rev YoY", "값": `${stockDetail.RevYoY?.toFixed(1)}%` },
    { "항목": "Revenue Growth 3Y", "값": `${stockDetail.Revenue_Growth_3Y?.toFixed(1)}%` },
    { "항목": "EPS Growth 3Y", "값": `${stockDetail.EPS_Growth_3Y?.toFixed(1)}%` },
    { "항목": "EBITDA Growth 3Y", "값": `${stockDetail.EBITDA_Growth_3Y?.toFixed(1)}%` }
  ];

  // 워크북 생성
  const wb = XLSX.utils.book_new();

  // 각 시트 추가
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(basicInfo), "기본정보");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(scores), "종합평가");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(valuation), "밸류에이션");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(profitability), "수익성");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(growth), "성장성");

  // 파일 다운로드
  const fileName = `${stockDetail.Ticker}_상세정보_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * 저평가 우량주 목록을 엑셀로 내보내기
 * @param stocks - 종목 데이터 배열
 * @param strategies - 선택된 투자 전략 목록
 */
export function exportUndervaluedToExcel(stocks: any[], strategies: string[]) {
  if (stocks.length === 0) {
    alert("다운로드할 데이터가 없습니다.");
    return;
  }

  const wb = XLSX.utils.book_new();

  // 전략 정보 시트 생성
  const headerData: any[] = [];

  if (strategies.length === 0) {
    // 전략이 선택되지 않은 경우
    headerData.push({ A: `📊 전체 종목` });
    headerData.push({});
    headerData.push({ A: '📋 필터 기준: 전체 종목 (전략 필터 없음)' });
  } else {
    // 선택된 전략들 표시
    headerData.push({ A: `📊 선택된 투자 전략 (${strategies.length}개)` });
    headerData.push({});

    strategies.forEach((strategy, index) => {
      const strategyInfo = INVESTMENT_STRATEGIES[strategy as keyof typeof INVESTMENT_STRATEGIES];
      headerData.push({ A: `${index + 1}. ${strategyInfo.name}` });
      headerData.push({ A: '   필터 기준:' });
      strategyInfo.criteria.forEach(criterion => {
        headerData.push({ A: `   • ${criterion}` });
      });
      headerData.push({});
    });
  }

  // 빈 행 추가
  headerData.push({});

  // 데이터 가공
  const excelData = stocks.map(stock => ({
    "시장": stock.market,
    "티커": stock.symbol,
    "회사명": stock.name,
    "섹터": stock.category,
    "산업군": stock.industry,
    "종합 점수": stock.aiScore,
    "감정 분석": stock.sentiment === "POS" ? "긍정" : stock.sentiment === "NEG" ? "부정" : "중립",
    "소개일": stock.introducedAt,
    "소개 후 수익률": `${stock.perfSinceIntro?.toFixed(1)}%`,
    "100일 수익률": `${stock.perf100d?.toFixed(1)}%`,
    "ROE": `${stock.ROE?.toFixed(1)}%`,
    "PER": stock.PER?.toFixed(2),
    "PEG": stock.PEG?.toFixed(2),
    "PBR": stock.PBR?.toFixed(2),
    "PSR": stock.PSR?.toFixed(2),
    "매출 YoY": `${stock.RevYoY?.toFixed(1)}%`,
    "EPS 성장률 3Y": `${stock.EPS_Growth_3Y?.toFixed(1)}%`,
    "영업이익률 TTM": `${stock.OpMarginTTM?.toFixed(1)}%`,
    "FCF Yield": `${stock.FCF_Yield?.toFixed(1)}%`
  }));

  // 헤더와 데이터 합치기
  const sheetData = [...headerData, ...excelData];

  // 워크시트 생성
  const ws = XLSX.utils.json_to_sheet(sheetData, { skipHeader: true });

  // 컬럼 너비 설정
  ws['!cols'] = [
    { wch: 35 }, // A: 전략명/필터기준/시장
    { wch: 12 }, // B: 티커
    { wch: 25 }, // C: 회사명
    { wch: 15 }, // D: 섹터
    { wch: 20 }, // E: 산업군
    { wch: 10 }, // F: 종합 점수
    { wch: 12 }, // G: 감정 분석
    { wch: 12 }, // H: 소개일
    { wch: 15 }, // I: 소개 후 수익률
    { wch: 15 }, // J: 100일 수익률
    { wch: 10 }, // K: ROE
    { wch: 10 }, // L: PER
    { wch: 10 }, // M: PEG
    { wch: 10 }, // N: PBR
    { wch: 10 }, // O: PSR
    { wch: 12 }, // P: 매출 YoY
    { wch: 15 }, // Q: EPS 성장률 3Y
    { wch: 15 }, // R: 영업이익률 TTM
    { wch: 12 }  // S: FCF Yield
  ];

  // 전략명 결정 (첫 번째 전략 사용 또는 "전체종목")
  const sheetName = strategies.length > 0
    ? INVESTMENT_STRATEGIES[strategies[0] as keyof typeof INVESTMENT_STRATEGIES].name.substring(0, 30)
    : "전체종목";

  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // 파일 이름 결정
  const fileName = strategies.length > 0
    ? `종목추천_${INVESTMENT_STRATEGIES[strategies[0] as keyof typeof INVESTMENT_STRATEGIES].name}_${new Date().toISOString().split('T')[0]}.xlsx`
    : `종목추천_전체종목_${new Date().toISOString().split('T')[0]}.xlsx`;

  // 파일 다운로드
  XLSX.writeFile(wb, fileName);
}
