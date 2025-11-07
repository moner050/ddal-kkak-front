package com.ddalkkak.backend.service;

import com.ddalkkak.backend.dto.UndervaluedStockDto;
import com.ddalkkak.backend.entity.UndervaluedStock;
import com.ddalkkak.backend.repository.UndervaluedStockRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 저평가 우량주 서비스
 */
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
@Slf4j
public class UndervaluedStockService {

    private final UndervaluedStockRepository repository;

    // ============================================================
    // Entity → DTO 변환
    // ============================================================

    private UndervaluedStockDto toDto(UndervaluedStock entity) {
        return UndervaluedStockDto.builder()
            .ticker(entity.getTicker())
            .name(entity.getName())
            .sector(entity.getSector())
            .industry(entity.getIndustry())
            .price(entity.getPrice())
            .marketCap(entity.getMarketCap())
            .dollarVolume(entity.getDollarVolume())
            .peRatio(entity.getPeRatio())
            .pegRatio(entity.getPegRatio())
            .pbRatio(entity.getPbRatio())
            .psRatio(entity.getPsRatio())
            .evEbitda(entity.getEvEbitda())
            .fcfYield(entity.getFcfYield())
            .divYield(entity.getDivYield())
            .payoutRatio(entity.getPayoutRatio())
            .roe(entity.getRoe())
            .roa(entity.getRoa())
            .opMarginTtm(entity.getOpMarginTtm())
            .operatingMargins(entity.getOperatingMargins())
            .grossMargins(entity.getGrossMargins())
            .netMargins(entity.getNetMargins())
            .revYoy(entity.getRevYoy())
            .epsGrowth3y(entity.getEpsGrowth3y())
            .revenueGrowth3y(entity.getRevenueGrowth3y())
            .ebitdaGrowth3y(entity.getEbitdaGrowth3y())
            .sma20(entity.getSma20())
            .sma50(entity.getSma50())
            .sma200(entity.getSma200())
            .rsi14(entity.getRsi14())
            .macd(entity.getMacd())
            .macdSignal(entity.getMacdSignal())
            .macdHistogram(entity.getMacdHistogram())
            .bbPosition(entity.getBbPosition())
            .atr14(entity.getAtr14())
            .ret5(entity.getRet5())
            .ret20(entity.getRet20())
            .ret63(entity.getRet63())
            .momentum12m(entity.getMomentum12m())
            .volatility21d(entity.getVolatility21d())
            .high52wRatio(entity.getHigh52wRatio())
            .low52wRatio(entity.getLow52wRatio())
            .rvol(entity.getRvol())
            .beta(entity.getBeta())
            .shortPercent(entity.getShortPercent())
            .insiderOwnership(entity.getInsiderOwnership())
            .institutionOwnership(entity.getInstitutionOwnership())
            .fairValue(entity.getFairValue())
            .discount(entity.getDiscount())
            .growthScore(entity.getGrowthScore())
            .qualityScore(entity.getQualityScore())
            .valueScore(entity.getValueScore())
            .momentumScore(entity.getMomentumScore())
            .totalScore(entity.getTotalScore())
            .passedProfiles(entity.getPassedProfiles())
            .dataDate(entity.getDataDate())
            .build();
    }

    private List<UndervaluedStockDto> toDtoList(List<UndervaluedStock> entities) {
        return entities.stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }

    // ============================================================
    // 기본 조회 API
    // ============================================================

    /**
     * 최신 데이터 날짜 조회
     */
    public LocalDate getLatestDataDate() {
        return repository.findLatestDataDate()
            .orElseThrow(() -> new RuntimeException("데이터가 없습니다"));
    }

    /**
     * 최신 데이터 Top N 조회
     */
    public List<UndervaluedStockDto> getLatestTopStocks(int limit) {
        Pageable pageable = PageRequest.of(0, limit, Sort.by("totalScore").descending());
        List<UndervaluedStock> stocks = repository.findLatestStocksOrderByTotalScore(pageable);
        return toDtoList(stocks);
    }

    /**
     * 특정 티커 조회 (최신 데이터)
     */
    public UndervaluedStockDto getStockByTicker(String ticker) {
        LocalDate latestDate = getLatestDataDate();
        UndervaluedStock stock = repository.findByTickerAndDataDate(ticker, latestDate)
            .orElseThrow(() -> new RuntimeException("종목을 찾을 수 없습니다: " + ticker));
        return toDto(stock);
    }

    /**
     * 특정 날짜의 특정 티커 조회
     */
    public UndervaluedStockDto getStockByTickerAndDate(String ticker, LocalDate date) {
        UndervaluedStock stock = repository.findByTickerAndDataDate(ticker, date)
            .orElseThrow(() -> new RuntimeException("종목을 찾을 수 없습니다: " + ticker));
        return toDto(stock);
    }

    // ============================================================
    // 프로필 기반 조회
    // ============================================================

    /**
     * 저평가 우량주 프로필 종목 조회 (최신 데이터)
     */
    public List<UndervaluedStockDto> getUndervaluedQualityStocks(int limit) {
        return getStocksByProfile("undervalued_quality", limit);
    }

    /**
     * 특정 프로필 종목 조회 (최신 데이터)
     */
    public List<UndervaluedStockDto> getStocksByProfile(String profile, int limit) {
        List<UndervaluedStock> stocks = repository.findLatestByProfile(profile);

        // 제한
        if (limit > 0 && stocks.size() > limit) {
            stocks = stocks.subList(0, limit);
        }

        return toDtoList(stocks);
    }

    /**
     * 특정 날짜의 특정 프로필 종목 조회 (페이징)
     */
    public Page<UndervaluedStockDto> getStocksByProfileWithPaging(
        String profile,
        LocalDate date,
        int page,
        int size
    ) {
        if (date == null) {
            date = getLatestDataDate();
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by("totalScore").descending());
        Page<UndervaluedStock> stocksPage = repository.findByDataDateAndProfile(date, profile, pageable);

        return stocksPage.map(this::toDto);
    }

    // ============================================================
    // 섹터 기반 조회
    // ============================================================

    /**
     * 섹터 목록 조회
     */
    public List<String> getSectors() {
        LocalDate latestDate = getLatestDataDate();
        return repository.findDistinctSectorsByDataDate(latestDate);
    }

    /**
     * 특정 섹터의 Top 종목 조회
     */
    public List<UndervaluedStockDto> getTopStocksBySector(String sector, int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        List<UndervaluedStock> stocks = repository.findLatestBySectorOrderByScore(sector, pageable);
        return toDtoList(stocks);
    }

    // ============================================================
    // 필터링 조회
    // ============================================================

    /**
     * 총점 범위로 필터링
     */
    public List<UndervaluedStockDto> getStocksByScoreRange(
        BigDecimal minScore,
        BigDecimal maxScore,
        int limit
    ) {
        LocalDate latestDate = getLatestDataDate();
        Pageable pageable = PageRequest.of(0, limit);
        List<UndervaluedStock> stocks = repository.findByDataDateAndTotalScoreBetween(
            latestDate, minScore, maxScore, pageable
        );
        return toDtoList(stocks);
    }

    /**
     * 시가총액 범위로 필터링
     */
    public List<UndervaluedStockDto> getStocksByMarketCapRange(
        BigDecimal minMarketCap,
        BigDecimal maxMarketCap,
        int limit
    ) {
        LocalDate latestDate = getLatestDataDate();
        Pageable pageable = PageRequest.of(0, limit);
        List<UndervaluedStock> stocks = repository.findByDataDateAndMarketCapBetween(
            latestDate, minMarketCap, maxMarketCap, pageable
        );
        return toDtoList(stocks);
    }

    /**
     * 가장 저평가된 종목 조회 (할인율 기준)
     */
    public List<UndervaluedStockDto> getMostUndervaluedStocks(int limit) {
        LocalDate latestDate = getLatestDataDate();
        Pageable pageable = PageRequest.of(0, limit);
        // discount < 0 이면 저평가 (예: -0.30 = 30% 저평가)
        List<UndervaluedStock> stocks = repository.findMostUndervaluedStocks(
            latestDate, BigDecimal.ZERO, pageable
        );
        return toDtoList(stocks);
    }

    /**
     * 다중 조건 필터링 (프로필, 섹터, 최소 점수)
     */
    public Page<UndervaluedStockDto> getStocksWithFilters(
        String profile,
        String sector,
        BigDecimal minScore,
        LocalDate date,
        int page,
        int size
    ) {
        if (date == null) {
            date = getLatestDataDate();
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by("totalScore").descending());
        Page<UndervaluedStock> stocksPage = repository.findWithFilters(
            date, profile, sector, minScore, pageable
        );

        return stocksPage.map(this::toDto);
    }

    // ============================================================
    // Top N 조회 (점수별)
    // ============================================================

    /**
     * 성장성 Top N
     */
    public List<UndervaluedStockDto> getTopGrowthStocks(int limit) {
        LocalDate latestDate = getLatestDataDate();
        Pageable pageable = PageRequest.of(0, limit);
        List<UndervaluedStock> stocks = repository.findTopByGrowthScore(latestDate, pageable);
        return toDtoList(stocks);
    }

    /**
     * 우량성 Top N
     */
    public List<UndervaluedStockDto> getTopQualityStocks(int limit) {
        LocalDate latestDate = getLatestDataDate();
        Pageable pageable = PageRequest.of(0, limit);
        List<UndervaluedStock> stocks = repository.findTopByQualityScore(latestDate, pageable);
        return toDtoList(stocks);
    }

    /**
     * 가치 Top N
     */
    public List<UndervaluedStockDto> getTopValueStocks(int limit) {
        LocalDate latestDate = getLatestDataDate();
        Pageable pageable = PageRequest.of(0, limit);
        List<UndervaluedStock> stocks = repository.findTopByValueScore(latestDate, pageable);
        return toDtoList(stocks);
    }

    /**
     * 모멘텀 Top N
     */
    public List<UndervaluedStockDto> getTopMomentumStocks(int limit) {
        LocalDate latestDate = getLatestDataDate();
        Pageable pageable = PageRequest.of(0, limit);
        List<UndervaluedStock> stocks = repository.findTopByMomentumScore(latestDate, pageable);
        return toDtoList(stocks);
    }

    // ============================================================
    // 통계
    // ============================================================

    /**
     * 전체 종목 수
     */
    public Long getTotalStockCount() {
        LocalDate latestDate = getLatestDataDate();
        return repository.countByDataDate(latestDate);
    }

    /**
     * 특정 프로필 통과 종목 수
     */
    public Long getStockCountByProfile(String profile) {
        LocalDate latestDate = getLatestDataDate();
        return repository.countByDataDateAndProfile(latestDate, profile);
    }

    /**
     * 평균 총점
     */
    public BigDecimal getAverageTotalScore() {
        LocalDate latestDate = getLatestDataDate();
        return repository.calculateAverageTotalScore(latestDate)
            .orElse(BigDecimal.ZERO);
    }
}
