package com.ddalkkak.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * 저평가 우량주 DTO (API 응답용)
 * Frontend에서 사용하는 형식에 맞게 변환
 */
@Data
@Builder
public class UndervaluedStockDto {

    // ============================================================
    // 기본 정보
    // ============================================================

    private String ticker;
    private String name;
    private String sector;
    private String industry;

    // ============================================================
    // 가격 및 거래량
    // ============================================================

    private BigDecimal price;

    @JsonProperty("marketCap")
    private BigDecimal marketCap;

    @JsonProperty("dollarVolume")
    private BigDecimal dollarVolume;

    // ============================================================
    // 밸류에이션 지표
    // ============================================================

    @JsonProperty("pe")
    private BigDecimal peRatio;

    @JsonProperty("peg")
    private BigDecimal pegRatio;

    @JsonProperty("pb")
    private BigDecimal pbRatio;

    @JsonProperty("ps")
    private BigDecimal psRatio;

    @JsonProperty("evEbitda")
    private BigDecimal evEbitda;

    @JsonProperty("fcfYield")
    private BigDecimal fcfYield;

    @JsonProperty("divYield")
    private BigDecimal divYield;

    @JsonProperty("payoutRatio")
    private BigDecimal payoutRatio;

    // ============================================================
    // 수익성 지표
    // ============================================================

    private BigDecimal roe;
    private BigDecimal roa;

    @JsonProperty("opMargin")
    private BigDecimal opMarginTtm;

    @JsonProperty("operatingMargins")
    private BigDecimal operatingMargins;

    @JsonProperty("grossMargins")
    private BigDecimal grossMargins;

    @JsonProperty("netMargins")
    private BigDecimal netMargins;

    // ============================================================
    // 성장성 지표
    // ============================================================

    @JsonProperty("revGrowth")
    private BigDecimal revYoy;

    @JsonProperty("epsGrowth3Y")
    private BigDecimal epsGrowth3y;

    @JsonProperty("revenueGrowth3Y")
    private BigDecimal revenueGrowth3y;

    @JsonProperty("ebitdaGrowth3Y")
    private BigDecimal ebitdaGrowth3y;

    // ============================================================
    // 기술적 지표
    // ============================================================

    @JsonProperty("sma20")
    private BigDecimal sma20;

    @JsonProperty("sma50")
    private BigDecimal sma50;

    @JsonProperty("sma200")
    private BigDecimal sma200;

    @JsonProperty("rsi")
    private BigDecimal rsi14;

    private BigDecimal macd;

    @JsonProperty("macdSignal")
    private BigDecimal macdSignal;

    @JsonProperty("macdHistogram")
    private BigDecimal macdHistogram;

    @JsonProperty("bbPosition")
    private BigDecimal bbPosition;

    @JsonProperty("atr")
    private BigDecimal atr14;

    // ============================================================
    // 모멘텀 지표
    // ============================================================

    @JsonProperty("ret5d")
    private BigDecimal ret5;

    @JsonProperty("ret20d")
    private BigDecimal ret20;

    @JsonProperty("ret63d")
    private BigDecimal ret63;

    @JsonProperty("momentum12m")
    private BigDecimal momentum12m;

    @JsonProperty("volatility")
    private BigDecimal volatility21d;

    @JsonProperty("high52wRatio")
    private BigDecimal high52wRatio;

    @JsonProperty("low52wRatio")
    private BigDecimal low52wRatio;

    private BigDecimal rvol;

    // ============================================================
    // 리스크 지표
    // ============================================================

    private BigDecimal beta;

    @JsonProperty("shortPercent")
    private BigDecimal shortPercent;

    @JsonProperty("insiderOwnership")
    private BigDecimal insiderOwnership;

    @JsonProperty("institutionOwnership")
    private BigDecimal institutionOwnership;

    // ============================================================
    // 적정가치 및 할인율
    // ============================================================

    @JsonProperty("fairValue")
    private BigDecimal fairValue;

    private BigDecimal discount;

    // ============================================================
    // 종합 점수
    // ============================================================

    @JsonProperty("growthScore")
    private BigDecimal growthScore;

    @JsonProperty("qualityScore")
    private BigDecimal qualityScore;

    @JsonProperty("valueScore")
    private BigDecimal valueScore;

    @JsonProperty("momentumScore")
    private BigDecimal momentumScore;

    @JsonProperty("totalScore")
    private BigDecimal totalScore;

    // ============================================================
    // 스크리닝 프로필
    // ============================================================

    @JsonProperty("passedProfiles")
    private List<String> passedProfiles;

    // ============================================================
    // 메타데이터
    // ============================================================

    @JsonProperty("dataDate")
    private LocalDate dataDate;
}
