package com.Feely.repository;

import java.time.LocalDate;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.Feely.entity.WeeklySummaryEntity;

@Repository
public interface WeeklySummaryRepository extends JpaRepository<WeeklySummaryEntity, Long> {

    // 회원의 특정 주(월요일 시작일) 요약 조회
    Optional<WeeklySummaryEntity> findByMember_MemberNoAndWeekStart(Long memberNo, LocalDate weekStart);

}
