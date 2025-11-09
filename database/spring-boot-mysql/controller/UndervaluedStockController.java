package com.ddalkkak.backend.controller;

import com.ddalkkak.backend.dto.UndervaluedStockDto;
import com.ddalkkak.backend.service.UndervaluedStockService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 저평가 우량주 REST API 컨트롤러
 */
@RestController
@RequestMapping("/api/undervalued-stocks")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")  // 프론트엔드 CORS 허용
public class UndervaluedStockController {

    private final UndervaluedStockService service;

    // ============================================================
    // 기본 조회 API
    // ============================================================

    /**
     * GET /api/undervalued-stocks/latest-date
     * 최신 데이터 날짜 조회
     */
    @GetMapping("/latest-date")
    public ResponseEntity<Map<String, LocalDate>> getLatestDataDate() {
        LocalDate latestDate = service.getLatestDataDate();
        Map<String, LocalDate> response = new HashMap<>();
        response.put("latestDate", latestDate);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/undervalued-stocks/top?limit=100
     * 최신 데이터 Top N 조회 (총점 기준)
     */
    @GetMapping("/top")
    public ResponseEntity<List<UndervaluedStockDto>> getTopStocks(
        @RequestParam(defaultValue = "100") int limit
    ) {
        log.info("GET /api/undervalued-stocks/top - limit: {}", limit);
        List<UndervaluedStockDto> stocks = service.getLatestTopStocks(limit);
        return ResponseEntity.ok(stocks);
    }

    /**
     * GET /api/undervalued-stocks/{ticker}
     * 특정 티커 조회 (최신 데이터)
     */
    @GetMapping("/{ticker}")
    public ResponseEntity<UndervaluedStockDto> getStockByTicker(
        @PathVariable String ticker
    ) {
        log.info("GET /api/undervalued-stocks/{}", ticker);
        UndervaluedStockDto stock = service.getStockByTicker(ticker.toUpperCase());
        return ResponseEntity.ok(stock);
    }

    /**
     * GET /api/undervalued-stocks/{ticker}/history?date=2025-11-07
     * 특정 날짜의 특정 티커 조회
     */
    @GetMapping("/{ticker}/history")
    public ResponseEntity<UndervaluedStockDto> getStockByTickerAndDate(
        @PathVariable String ticker,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        log.info("GET /api/undervalued-stocks/{}/history - date: {}", ticker, date);
        UndervaluedStockDto stock = service.getStockByTickerAndDate(ticker.toUpperCase(), date);
        return ResponseEntity.ok(stock);
    }

    // ============================================================
    // 프로필 기반 조회
    // ============================================================

    /**
     * GET /api/undervalued-stocks/profile/undervalued-quality?limit=50
     * 저평가 우량주 프로필 종목 조회
     */
    @GetMapping("/profile/undervalued-quality")
    public ResponseEntity<List<UndervaluedStockDto>> getUndervaluedQualityStocks(
        @RequestParam(defaultValue = "50") int limit
    ) {
        log.info("GET /api/undervalued-stocks/profile/undervalued-quality - limit: {}", limit);
        List<UndervaluedStockDto> stocks = service.getUndervaluedQualityStocks(limit);
        return ResponseEntity.ok(stocks);
    }

    /**
     * GET /api/undervalued-stocks/profile/{profileName}?limit=50
     * 특정 프로필 종목 조회
     *
     * 프로필 목록:
     * - undervalued_quality: 저평가 우량주 (Warren Buffett 스타일)
     * - value_basic: 가치주 (기본)
     * - value_strict: 가치주 (엄격)
     * - growth_quality: 성장 우량주
     * - momentum: 모멘텀 트레이딩
     * - swing: 스윙 트레이딩
     */
    @GetMapping("/profile/{profileName}")
    public ResponseEntity<List<UndervaluedStockDto>> getStocksByProfile(
        @PathVariable String profileName,
        @RequestParam(defaultValue = "50") int limit
    ) {
        log.info("GET /api/undervalued-stocks/profile/{} - limit: {}", profileName, limit);
        List<UndervaluedStockDto> stocks = service.getStocksByProfile(profileName, limit);
        return ResponseEntity.ok(stocks);
    }

    /**
     * GET /api/undervalued-stocks/profile/{profileName}/paging?page=0&size=20&date=2025-11-07
     * 특정 프로필 종목 조회 (페이징)
     */
    @GetMapping("/profile/{profileName}/paging")
    public ResponseEntity<Page<UndervaluedStockDto>> getStocksByProfileWithPaging(
        @PathVariable String profileName,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        log.info("GET /api/undervalued-stocks/profile/{}/paging - page: {}, size: {}, date: {}",
            profileName, page, size, date);
        Page<UndervaluedStockDto> stocksPage = service.getStocksByProfileWithPaging(
            profileName, date, page, size
        );
        return ResponseEntity.ok(stocksPage);
    }

    // ============================================================
    // 섹터 기반 조회
    // ============================================================

    /**
     * GET /api/undervalued-stocks/sectors
     * 섹터 목록 조회
     */
    @GetMapping("/sectors")
    public ResponseEntity<List<String>> getSectors() {
        log.info("GET /api/undervalued-stocks/sectors");
        List<String> sectors = service.getSectors();
        return ResponseEntity.ok(sectors);
    }

    /**
     * GET /api/undervalued-stocks/sector/{sectorName}/top?limit=20
     * 특정 섹터의 Top 종목 조회
     */
    @GetMapping("/sector/{sectorName}/top")
    public ResponseEntity<List<UndervaluedStockDto>> getTopStocksBySector(
        @PathVariable String sectorName,
        @RequestParam(defaultValue = "20") int limit
    ) {
        log.info("GET /api/undervalued-stocks/sector/{}/top - limit: {}", sectorName, limit);
        List<UndervaluedStockDto> stocks = service.getTopStocksBySector(sectorName, limit);
        return ResponseEntity.ok(stocks);
    }

    // ============================================================
    // 필터링 조회
    // ============================================================

    /**
     * GET /api/undervalued-stocks/filter/score?minScore=70&maxScore=100&limit=50
     * 총점 범위로 필터링
     */
    @GetMapping("/filter/score")
    public ResponseEntity<List<UndervaluedStockDto>> getStocksByScoreRange(
        @RequestParam BigDecimal minScore,
        @RequestParam BigDecimal maxScore,
        @RequestParam(defaultValue = "50") int limit
    ) {
        log.info("GET /api/undervalued-stocks/filter/score - min: {}, max: {}, limit: {}",
            minScore, maxScore, limit);
        List<UndervaluedStockDto> stocks = service.getStocksByScoreRange(minScore, maxScore, limit);
        return ResponseEntity.ok(stocks);
    }

    /**
     * GET /api/undervalued-stocks/filter/market-cap?minMarketCap=1000000000&maxMarketCap=100000000000&limit=50
     * 시가총액 범위로 필터링 ($)
     */
    @GetMapping("/filter/market-cap")
    public ResponseEntity<List<UndervaluedStockDto>> getStocksByMarketCapRange(
        @RequestParam BigDecimal minMarketCap,
        @RequestParam BigDecimal maxMarketCap,
        @RequestParam(defaultValue = "50") int limit
    ) {
        log.info("GET /api/undervalued-stocks/filter/market-cap - min: {}, max: {}, limit: {}",
            minMarketCap, maxMarketCap, limit);
        List<UndervaluedStockDto> stocks = service.getStocksByMarketCapRange(
            minMarketCap, maxMarketCap, limit
        );
        return ResponseEntity.ok(stocks);
    }

    /**
     * GET /api/undervalued-stocks/filter/most-undervalued?limit=30
     * 가장 저평가된 종목 조회 (할인율 기준)
     */
    @GetMapping("/filter/most-undervalued")
    public ResponseEntity<List<UndervaluedStockDto>> getMostUndervaluedStocks(
        @RequestParam(defaultValue = "30") int limit
    ) {
        log.info("GET /api/undervalued-stocks/filter/most-undervalued - limit: {}", limit);
        List<UndervaluedStockDto> stocks = service.getMostUndervaluedStocks(limit);
        return ResponseEntity.ok(stocks);
    }

    /**
     * GET /api/undervalued-stocks/search?profile=undervalued_quality&sector=Technology&minScore=70&page=0&size=20
     * 다중 조건 검색 (프로필, 섹터, 최소 점수)
     */
    @GetMapping("/search")
    public ResponseEntity<Page<UndervaluedStockDto>> searchStocks(
        @RequestParam(required = false) String profile,
        @RequestParam(required = false) String sector,
        @RequestParam(required = false) BigDecimal minScore,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        log.info("GET /api/undervalued-stocks/search - profile: {}, sector: {}, minScore: {}, date: {}, page: {}, size: {}",
            profile, sector, minScore, date, page, size);

        Page<UndervaluedStockDto> stocksPage = service.getStocksWithFilters(
            profile, sector, minScore, date, page, size
        );
        return ResponseEntity.ok(stocksPage);
    }

    // ============================================================
    // Top N 조회 (점수별)
    // ============================================================

    /**
     * GET /api/undervalued-stocks/top/growth?limit=20
     * 성장성 Top N
     */
    @GetMapping("/top/growth")
    public ResponseEntity<List<UndervaluedStockDto>> getTopGrowthStocks(
        @RequestParam(defaultValue = "20") int limit
    ) {
        log.info("GET /api/undervalued-stocks/top/growth - limit: {}", limit);
        List<UndervaluedStockDto> stocks = service.getTopGrowthStocks(limit);
        return ResponseEntity.ok(stocks);
    }

    /**
     * GET /api/undervalued-stocks/top/quality?limit=20
     * 우량성 Top N
     */
    @GetMapping("/top/quality")
    public ResponseEntity<List<UndervaluedStockDto>> getTopQualityStocks(
        @RequestParam(defaultValue = "20") int limit
    ) {
        log.info("GET /api/undervalued-stocks/top/quality - limit: {}", limit);
        List<UndervaluedStockDto> stocks = service.getTopQualityStocks(limit);
        return ResponseEntity.ok(stocks);
    }

    /**
     * GET /api/undervalued-stocks/top/value?limit=20
     * 가치 Top N
     */
    @GetMapping("/top/value")
    public ResponseEntity<List<UndervaluedStockDto>> getTopValueStocks(
        @RequestParam(defaultValue = "20") int limit
    ) {
        log.info("GET /api/undervalued-stocks/top/value - limit: {}", limit);
        List<UndervaluedStockDto> stocks = service.getTopValueStocks(limit);
        return ResponseEntity.ok(stocks);
    }

    /**
     * GET /api/undervalued-stocks/top/momentum?limit=20
     * 모멘텀 Top N
     */
    @GetMapping("/top/momentum")
    public ResponseEntity<List<UndervaluedStockDto>> getTopMomentumStocks(
        @RequestParam(defaultValue = "20") int limit
    ) {
        log.info("GET /api/undervalued-stocks/top/momentum - limit: {}", limit);
        List<UndervaluedStockDto> stocks = service.getTopMomentumStocks(limit);
        return ResponseEntity.ok(stocks);
    }

    // ============================================================
    // 통계 API
    // ============================================================

    /**
     * GET /api/undervalued-stocks/stats
     * 전체 통계 조회
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStatistics() {
        log.info("GET /api/undervalued-stocks/stats");

        Map<String, Object> stats = new HashMap<>();
        stats.put("latestDate", service.getLatestDataDate());
        stats.put("totalStocks", service.getTotalStockCount());
        stats.put("averageTotalScore", service.getAverageTotalScore());

        // 각 프로필별 종목 수
        Map<String, Long> profileCounts = new HashMap<>();
        profileCounts.put("undervalued_quality", service.getStockCountByProfile("undervalued_quality"));
        profileCounts.put("value_basic", service.getStockCountByProfile("value_basic"));
        profileCounts.put("value_strict", service.getStockCountByProfile("value_strict"));
        profileCounts.put("growth_quality", service.getStockCountByProfile("growth_quality"));
        profileCounts.put("momentum", service.getStockCountByProfile("momentum"));
        profileCounts.put("swing", service.getStockCountByProfile("swing"));

        stats.put("profileCounts", profileCounts);

        return ResponseEntity.ok(stats);
    }

    /**
     * GET /api/undervalued-stocks/profile/{profileName}/count
     * 특정 프로필 통과 종목 수
     */
    @GetMapping("/profile/{profileName}/count")
    public ResponseEntity<Map<String, Object>> getProfileStockCount(
        @PathVariable String profileName
    ) {
        log.info("GET /api/undervalued-stocks/profile/{}/count", profileName);

        Map<String, Object> response = new HashMap<>();
        response.put("profile", profileName);
        response.put("count", service.getStockCountByProfile(profileName));
        response.put("latestDate", service.getLatestDataDate());

        return ResponseEntity.ok(response);
    }

    // ============================================================
    // 헬스 체크
    // ============================================================

    /**
     * GET /api/undervalued-stocks/health
     * API 헬스 체크
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> healthCheck() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "UndervaluedStockService");
        response.put("timestamp", LocalDate.now().toString());

        try {
            LocalDate latestDate = service.getLatestDataDate();
            response.put("latestDataDate", latestDate.toString());
            response.put("dataStatus", "available");
        } catch (Exception e) {
            response.put("dataStatus", "unavailable");
            response.put("error", e.getMessage());
        }

        return ResponseEntity.ok(response);
    }
}
