package com.ddalkkak.backend.repository;

import com.ddalkkak.backend.entity.UndervaluedStock;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * 저평가 우량주 리포지토리
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
    // 프로필 기반 조회
    // ============================================================

    /**
     * 특정 프로필을 통과한 종목 조회
     * PostgreSQL의 ARRAY 검색 (ANY) 사용
     */
    @Query("SELECT s FROM UndervaluedStock s WHERE s.dataDate = :dataDate " +
           "AND :profile = ANY(s.passedProfiles) " +
           "ORDER BY s.totalScore DESC")
    List<UndervaluedStock> findByDataDateAndProfile(
        @Param("dataDate") LocalDate dataDate,
        @Param("profile") String profile
    );

    /**
     * 최신 데이터에서 특정 프로필을 통과한 종목 조회
     */
    @Query("SELECT s FROM UndervaluedStock s WHERE s.dataDate = " +
           "(SELECT MAX(s2.dataDate) FROM UndervaluedStock s2) " +
           "AND :profile = ANY(s.passedProfiles) " +
           "ORDER BY s.totalScore DESC")
    List<UndervaluedStock> findLatestByProfile(@Param("profile") String profile);

    /**
     * 특정 프로필을 통과한 종목 페이징 조회
     */
    @Query("SELECT s FROM UndervaluedStock s WHERE s.dataDate = :dataDate " +
           "AND :profile = ANY(s.passedProfiles) " +
           "ORDER BY s.totalScore DESC")
    Page<UndervaluedStock> findByDataDateAndProfile(
        @Param("dataDate") LocalDate dataDate,
        @Param("profile") String profile,
        Pageable pageable
    );

    // ============================================================
    // 섹터 기반 조회
    // ============================================================

    /**
     * 특정 날짜의 특정 섹터 종목 조회
     */
    List<UndervaluedStock> findByDataDateAndSector(
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
     * 할인율 기준 저평가 종목 조회 (discount < 0 이면 저평가)
     */
    @Query("SELECT s FROM UndervaluedStock s WHERE s.dataDate = :dataDate " +
           "AND s.discount < :maxDiscount " +
           "ORDER BY s.discount ASC")
    List<UndervaluedStock> findMostUndervaluedStocks(
        @Param("dataDate") LocalDate dataDate,
        @Param("maxDiscount") BigDecimal maxDiscount,
        Pageable pageable
    );

    // ============================================================
    // 복합 조건 조회
    // ============================================================

    /**
     * 다중 조건 필터링 (프로필, 섹터, 점수 범위)
     */
    @Query("SELECT s FROM UndervaluedStock s WHERE s.dataDate = :dataDate " +
           "AND (:profile IS NULL OR :profile = ANY(s.passedProfiles)) " +
           "AND (:sector IS NULL OR s.sector = :sector) " +
           "AND (:minScore IS NULL OR s.totalScore >= :minScore) " +
           "ORDER BY s.totalScore DESC")
    Page<UndervaluedStock> findWithFilters(
        @Param("dataDate") LocalDate dataDate,
        @Param("profile") String profile,
        @Param("sector") String sector,
        @Param("minScore") BigDecimal minScore,
        Pageable pageable
    );

    // ============================================================
    // 통계 조회
    // ============================================================

    /**
     * 특정 날짜의 전체 종목 수
     */
    Long countByDataDate(LocalDate dataDate);

    /**
     * 특정 프로필을 통과한 종목 수
     */
    @Query("SELECT COUNT(s) FROM UndervaluedStock s WHERE s.dataDate = :dataDate " +
           "AND :profile = ANY(s.passedProfiles)")
    Long countByDataDateAndProfile(
        @Param("dataDate") LocalDate dataDate,
        @Param("profile") String profile
    );

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
    void deleteByDataDate(LocalDate dataDate);

    /**
     * 특정 날짜 이전의 데이터 삭제 (정리용)
     */
    @Query("DELETE FROM UndervaluedStock s WHERE s.dataDate < :cutoffDate")
    void deleteOlderThan(@Param("cutoffDate") LocalDate cutoffDate);
}
