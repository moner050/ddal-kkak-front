package com.ddalkkak.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;

/**
 * 저평가 우량주 엔티티 (MySQL 8.0)
 * Python 스크립트에서 수집한 미국 주식 데이터
 */
@Entity
@Table(
    name = "undervalued_stocks",
    uniqueConstraints = {
        @UniqueConstraint(name = "unique_ticker_date", columnNames = {"ticker", "data_date"})
    },
    indexes = {
        @Index(name = "idx_ticker", columnList = "ticker"),
        @Index(name = "idx_data_date", columnList = "data_date"),
        @Index(name = "idx_sector", columnList = "sector"),
        @Index(name = "idx_total_score", columnList = "total_score DESC"),
        @Index(name = "idx_market_cap", columnList = "market_cap DESC")
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UndervaluedStock {

    private static final ObjectMapper objectMapper = new ObjectMapper();

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ticker", nullable = false, length = 20)
    private String ticker;

    // ============================================================
    // 기본 정보
    // ============================================================

    @Column(name = "name", length = 255)
    private String name;

    @Column(name = "sector", length = 100)
    private String sector;

    @Column(name = "industry", length = 100)
    private String industry;

    // ============================================================
    // 가격 및 거래량
    // ============================================================

    @Column(name = "price", precision = 12, scale = 2)
    private BigDecimal price;

    @Column(name = "market_cap", precision = 18, scale = 2)
    private BigDecimal marketCap;

    @Column(name = "dollar_volume", precision = 18, scale = 2)
    private BigDecimal dollarVolume;

    // ============================================================
    // 밸류에이션 지표
    // ============================================================

    @Column(name = "pe_ratio", precision = 10, scale = 2)
    private BigDecimal peRatio;

    @Column(name = "peg_ratio", precision = 10, scale = 2)
    private BigDecimal pegRatio;

    @Column(name = "pb_ratio", precision = 10, scale = 2)
    private BigDecimal pbRatio;

    @Column(name = "ps_ratio", precision = 10, scale = 2)
    private BigDecimal psRatio;

    @Column(name = "ev_ebitda", precision = 10, scale = 2)
    private BigDecimal evEbitda;

    @Column(name = "fcf_yield", precision = 8, scale = 4)
    private BigDecimal fcfYield;

    @Column(name = "div_yield", precision = 8, scale = 4)
    private BigDecimal divYield;

    @Column(name = "payout_ratio", precision = 8, scale = 4)
    private BigDecimal payoutRatio;

    // ============================================================
    // 수익성 지표
    // ============================================================

    @Column(name = "roe", precision = 8, scale = 4)
    private BigDecimal roe;

    @Column(name = "roa", precision = 8, scale = 4)
    private BigDecimal roa;

    @Column(name = "op_margin_ttm", precision = 8, scale = 4)
    private BigDecimal opMarginTtm;

    @Column(name = "operating_margins", precision = 8, scale = 4)
    private BigDecimal operatingMargins;

    @Column(name = "gross_margins", precision = 8, scale = 4)
    private BigDecimal grossMargins;

    @Column(name = "net_margins", precision = 8, scale = 4)
    private BigDecimal netMargins;

    // ============================================================
    // 성장성 지표
    // ============================================================

    @Column(name = "rev_yoy", precision = 8, scale = 4)
    private BigDecimal revYoy;

    @Column(name = "eps_growth_3y", precision = 8, scale = 4)
    private BigDecimal epsGrowth3y;

    @Column(name = "revenue_growth_3y", precision = 8, scale = 4)
    private BigDecimal revenueGrowth3y;

    @Column(name = "ebitda_growth_3y", precision = 8, scale = 4)
    private BigDecimal ebitdaGrowth3y;

    // ============================================================
    // 기술적 지표
    // ============================================================

    @Column(name = "sma_20", precision = 12, scale = 2)
    private BigDecimal sma20;

    @Column(name = "sma_50", precision = 12, scale = 2)
    private BigDecimal sma50;

    @Column(name = "sma_200", precision = 12, scale = 2)
    private BigDecimal sma200;

    @Column(name = "rsi_14", precision = 6, scale = 2)
    private BigDecimal rsi14;

    @Column(name = "macd", precision = 12, scale = 4)
    private BigDecimal macd;

    @Column(name = "macd_signal", precision = 12, scale = 4)
    private BigDecimal macdSignal;

    @Column(name = "macd_histogram", precision = 12, scale = 4)
    private BigDecimal macdHistogram;

    @Column(name = "bb_position", precision = 6, scale = 4)
    private BigDecimal bbPosition;

    @Column(name = "atr_14", precision = 12, scale = 4)
    private BigDecimal atr14;

    // ============================================================
    // 모멘텀 지표
    // ============================================================

    @Column(name = "ret_5", precision = 8, scale = 4)
    private BigDecimal ret5;

    @Column(name = "ret_20", precision = 8, scale = 4)
    private BigDecimal ret20;

    @Column(name = "ret_63", precision = 8, scale = 4)
    private BigDecimal ret63;

    @Column(name = "momentum_12m", precision = 8, scale = 4)
    private BigDecimal momentum12m;

    @Column(name = "volatility_21d", precision = 8, scale = 4)
    private BigDecimal volatility21d;

    @Column(name = "high_52w_ratio", precision = 6, scale = 4)
    private BigDecimal high52wRatio;

    @Column(name = "low_52w_ratio", precision = 6, scale = 4)
    private BigDecimal low52wRatio;

    @Column(name = "rvol", precision = 6, scale = 2)
    private BigDecimal rvol;

    // ============================================================
    // 리스크 지표
    // ============================================================

    @Column(name = "beta", precision = 6, scale = 3)
    private BigDecimal beta;

    @Column(name = "short_percent", precision = 6, scale = 4)
    private BigDecimal shortPercent;

    @Column(name = "insider_ownership", precision = 6, scale = 4)
    private BigDecimal insiderOwnership;

    @Column(name = "institution_ownership", precision = 6, scale = 4)
    private BigDecimal institutionOwnership;

    // ============================================================
    // 적정가치 및 할인율
    // ============================================================

    @Column(name = "fair_value", precision = 12, scale = 2)
    private BigDecimal fairValue;

    @Column(name = "discount", precision = 8, scale = 4)
    private BigDecimal discount;

    // ============================================================
    // 종합 점수
    // ============================================================

    @Column(name = "growth_score", precision = 6, scale = 2)
    private BigDecimal growthScore;

    @Column(name = "quality_score", precision = 6, scale = 2)
    private BigDecimal qualityScore;

    @Column(name = "value_score", precision = 6, scale = 2)
    private BigDecimal valueScore;

    @Column(name = "momentum_score", precision = 6, scale = 2)
    private BigDecimal momentumScore;

    @Column(name = "total_score", precision = 6, scale = 2)
    private BigDecimal totalScore;

    // ============================================================
    // 스크리닝 프로필 (JSON으로 저장)
    // MySQL은 ARRAY 타입이 없으므로 JSON 컬럼 사용
    // ============================================================

    @Column(name = "passed_profiles", columnDefinition = "JSON")
    private String passedProfilesJson;

    // JSON ↔ List<String> 변환 메서드
    @Transient
    private List<String> passedProfiles;

    @PostLoad
    public void afterLoad() {
        if (passedProfilesJson != null && !passedProfilesJson.isEmpty()) {
            try {
                this.passedProfiles = objectMapper.readValue(
                    passedProfilesJson,
                    new TypeReference<List<String>>() {}
                );
            } catch (JsonProcessingException e) {
                this.passedProfiles = new ArrayList<>();
            }
        } else {
            this.passedProfiles = new ArrayList<>();
        }
    }

    @PrePersist
    @PreUpdate
    public void beforeSave() {
        if (passedProfiles != null) {
            try {
                this.passedProfilesJson = objectMapper.writeValueAsString(passedProfiles);
            } catch (JsonProcessingException e) {
                this.passedProfilesJson = "[]";
            }
        } else {
            this.passedProfilesJson = "[]";
        }

        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        updatedAt = LocalDateTime.now();
    }

    // ============================================================
    // 메타데이터
    // ============================================================

    @Column(name = "data_date", nullable = false)
    private LocalDate dataDate;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
