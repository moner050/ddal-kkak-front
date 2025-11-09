package com.ddalkkak.backend.repository;

import com.ddalkkak.backend.entity.UndervaluedStock;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * 저평가 우량주 리포지토리 (MySQL 8.0)
 */
@Repository
public interface UndervaluedStockRepository extends JpaRepository<UndervaluedStock, Long> {

    // ============================================================
    // 기본 조회
    // ============================================================

    /**
     * 특정 날짜의 특정 티커 조회
     */
    Optional<UndervaluedStock> findByTickerAndDataDate(String ticker, LocalDate dataDate);

    /**
     * 특정 날짜의 모든 데이터 조회
     */
    List<UndervaluedStock> findByDataDate(LocalDate dataDate);

    /**
     * 특정 날짜의 데이터 페이징 조회
     */
    Page<UndervaluedStock> findByDataDate(LocalDate dataDate, Pageable pageable);

    /**
     * 최신 날짜 조회
     */
    @Query("SELECT MAX(s.dataDate) FROM UndervaluedStock s")
    Optional<LocalDate> findLatestDataDate();

    /**
     * 최신 데이터 조회 (totalScore 내림차순)
     */
    @Query("SELECT s FROM UndervaluedStock s WHERE s.dataDate = " +
           "(SELECT MAX(s2.dataDate) FROM UndervaluedStock s2) " +
           "ORDER BY s.totalScore DESC")
    List<UndervaluedStock> findLatestStocksOrderByTotalScore(Pageable pageable);

    // ============================================================
    // 프로필 기반 조회 (MySQL JSON_CONTAINS 사용)
    // ============================================================

    /**
     * 특정 프로필을 통과한 종목 조회
     * MySQL의 JSON_CONTAINS 함수 사용
     */
    @Query(value = "SELECT * FROM undervalued_stocks s " +
           "WHERE s.data_date = :dataDate " +
           "AND JSON_CONTAINS(s.passed_profiles, :profileJson) = 1 " +
           "ORDER BY s.total_score DESC",
           nativeQuery = true)
    List<UndervaluedStock> findByDataDateAndProfile(
        @Param("dataDate") LocalDate dataDate,
        @Param("profileJson") String profileJson
    );

    /**
     * 최신 데이터에서 특정 프로필을 통과한 종목 조회
     */
    @Query(value = "SELECT * FROM undervalued_stocks s " +
           "WHERE s.data_date = (SELECT MAX(data_date) FROM undervalued_stocks) " +
           "AND JSON_CONTAINS(s.passed_profiles, :profileJson) = 1 " +
           "ORDER BY s.total_score DESC",
           nativeQuery = true)
    List<UndervaluedStock> findLatestByProfile(@Param("profileJson") String profileJson);

    /**
     * 특정 프로필을 통과한 종목 페이징 조회
     */
    @Query(value = "SELECT * FROM undervalued_stocks s " +
           "WHERE s.data_date = :dataDate " +
           "AND JSON_CONTAINS(s.passed_profiles, :profileJson) = 1 " +
           "ORDER BY s.total_score DESC " +
           "LIMIT :limit OFFSET :offset",
           nativeQuery = true)
    List<UndervaluedStock> findByDataDateAndProfilePaged(
        @Param("dataDate") LocalDate dataDate,
        @Param("profileJson") String profileJson,
        @Param("limit") int limit,
        @Param("offset") int offset
    );

    /**
     * 프로필별 종목 수 조회
     */
    @Query(value = "SELECT COUNT(*) FROM undervalued_stocks s " +
           "WHERE s.data_date = :dataDate " +
           "AND JSON_CONTAINS(s.passed_profiles, :profileJson) = 1",
           nativeQuery = true)
    Long countByDataDateAndProfile(
        @Param("dataDate") LocalDate dataDate,
        @Param("profileJson") String profileJson
    );

    // ============================================================
    // 섹터 기반 조회
    // ============================================================

    /**
     * 특정 날짜의 특정 섹터 종목 조회
     */
    List<UndervaluedStock> findByDataDateAndSectorOrderByTotalScoreDesc(
        LocalDate dataDate,
        String sector,
        Pageable pageable
    );

    /**
     * 최신 데이터에서 섹터별 Top 종목 조회
     */
    @Query("SELECT s FROM UndervaluedStock s WHERE s.dataDate = " +
           "(SELECT MAX(s2.dataDate) FROM UndervaluedStock s2) " +
           "AND s.sector = :sector " +
           "ORDER BY s.totalScore DESC")
    List<UndervaluedStock> findLatestBySectorOrderByScore(
        @Param("sector") String sector,
        Pageable pageable
    );

    /**
     * 특정 날짜의 모든 섹터 목록 조회
     */
    @Query("SELECT DISTINCT s.sector FROM UndervaluedStock s WHERE s.dataDate = :dataDate " +
           "AND s.sector IS NOT NULL ORDER BY s.sector")
    List<String> findDistinctSectorsByDataDate(@Param("dataDate") LocalDate dataDate);

    // ============================================================
    // 필터링 조회
    // ============================================================

    /**
     * 총점 범위로 필터링
     */
    @Query("SELECT s FROM UndervaluedStock s WHERE s.dataDate = :dataDate " +
           "AND s.totalScore BETWEEN :minScore AND :maxScore " +
           "ORDER BY s.totalScore DESC")
    List<UndervaluedStock> findByDataDateAndTotalScoreBetween(
        @Param("dataDate") LocalDate dataDate,
        @Param("minScore") BigDecimal minScore,
        @Param("maxScore") BigDecimal maxScore,
        Pageable pageable
    );

    /**
     * 시가총액 범위로 필터링
     */
    @Query("SELECT s FROM UndervaluedStock s WHERE s.dataDate = :dataDate " +
           "AND s.marketCap BETWEEN :minMarketCap AND :maxMarketCap " +
           "ORDER BY s.totalScore DESC")
    List<UndervaluedStock> findByDataDateAndMarketCapBetween(
        @Param("dataDate") LocalDate dataDate,
        @Param("minMarketCap") BigDecimal minMarketCap,
        @Param("maxMarketCap") BigDecimal maxMarketCap,
        Pageable pageable
    );

    /**
     * 할인율 기준 저평가 종목 조회
     */
    @Query("SELECT s FROM UndervaluedStock s WHERE s.dataDate = :dataDate " +
           "AND s.discount < :maxDiscount " +
           "ORDER BY s.discount ASC")
    List<UndervaluedStock> findMostUndervaluedStocks(
        @Param("dataDate") LocalDate dataDate,
        @Param("maxDiscount") BigDecimal maxDiscount,
        Pageable pageable
    );

    /**
     * 다중 조건 필터링 (네이티브 쿼리 사용)
     */
    @Query(value = "SELECT * FROM undervalued_stocks s " +
           "WHERE s.data_date = :dataDate " +
           "AND (:profileJson IS NULL OR JSON_CONTAINS(s.passed_profiles, :profileJson) = 1) " +
           "AND (:sector IS NULL OR s.sector = :sector) " +
           "AND (:minScore IS NULL OR s.total_score >= :minScore) " +
           "ORDER BY s.total_score DESC " +
           "LIMIT :limit OFFSET :offset",
           nativeQuery = true)
    List<UndervaluedStock> findWithFilters(
        @Param("dataDate") LocalDate dataDate,
        @Param("profileJson") String profileJson,
        @Param("sector") String sector,
        @Param("minScore") BigDecimal minScore,
        @Param("limit") int limit,
        @Param("offset") int offset
    );

    /**
     * 다중 조건 필터링 - 카운트
     */
    @Query(value = "SELECT COUNT(*) FROM undervalued_stocks s " +
           "WHERE s.data_date = :dataDate " +
           "AND (:profileJson IS NULL OR JSON_CONTAINS(s.passed_profiles, :profileJson) = 1) " +
           "AND (:sector IS NULL OR s.sector = :sector) " +
           "AND (:minScore IS NULL OR s.total_score >= :minScore)",
           nativeQuery = true)
    Long countWithFilters(
        @Param("dataDate") LocalDate dataDate,
        @Param("profileJson") String profileJson,
        @Param("sector") String sector,
        @Param("minScore") BigDecimal minScore
    );

    // ============================================================
    // 통계 조회
    // ============================================================

    /**
     * 특정 날짜의 전체 종목 수
     */
    Long countByDataDate(LocalDate dataDate);

    /**
     * 섹터별 종목 수
     */
    @Query("SELECT s.sector, COUNT(s) FROM UndervaluedStock s " +
           "WHERE s.dataDate = :dataDate " +
           "GROUP BY s.sector ORDER BY COUNT(s) DESC")
    List<Object[]> countBySectorGroupBy(@Param("dataDate") LocalDate dataDate);

    /**
     * 평균 총점 계산
     */
    @Query("SELECT AVG(s.totalScore) FROM UndervaluedStock s WHERE s.dataDate = :dataDate")
    Optional<BigDecimal> calculateAverageTotalScore(@Param("dataDate") LocalDate dataDate);

    // ============================================================
    // Top N 조회
    // ============================================================

    /**
     * 성장성 점수 Top N
     */
    @Query("SELECT s FROM UndervaluedStock s WHERE s.dataDate = :dataDate " +
           "AND s.growthScore IS NOT NULL " +
           "ORDER BY s.growthScore DESC")
    List<UndervaluedStock> findTopByGrowthScore(
        @Param("dataDate") LocalDate dataDate,
        Pageable pageable
    );

    /**
     * 우량성 점수 Top N
     */
    @Query("SELECT s FROM UndervaluedStock s WHERE s.dataDate = :dataDate " +
           "AND s.qualityScore IS NOT NULL " +
           "ORDER BY s.qualityScore DESC")
    List<UndervaluedStock> findTopByQualityScore(
        @Param("dataDate") LocalDate dataDate,
        Pageable pageable
    );

    /**
     * 가치 점수 Top N
     */
    @Query("SELECT s FROM UndervaluedStock s WHERE s.dataDate = :dataDate " +
           "AND s.valueScore IS NOT NULL " +
           "ORDER BY s.valueScore DESC")
    List<UndervaluedStock> findTopByValueScore(
        @Param("dataDate") LocalDate dataDate,
        Pageable pageable
    );

    /**
     * 모멘텀 점수 Top N
     */
    @Query("SELECT s FROM UndervaluedStock s WHERE s.dataDate = :dataDate " +
           "AND s.momentumScore IS NOT NULL " +
           "ORDER BY s.momentumScore DESC")
    List<UndervaluedStock> findTopByMomentumScore(
        @Param("dataDate") LocalDate dataDate,
        Pageable pageable
    );

    // ============================================================
    // 데이터 관리
    // ============================================================

    /**
     * 특정 날짜의 데이터 삭제
     */
    @Modifying
    void deleteByDataDate(LocalDate dataDate);

    /**
     * 특정 날짜 이전의 데이터 삭제
     */
    @Modifying
    @Query("DELETE FROM UndervaluedStock s WHERE s.dataDate < :cutoffDate")
    void deleteOlderThan(@Param("cutoffDate") LocalDate cutoffDate);
}
