package com.Feely.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.Feely.entity.CounselEntity;

// 사용시, @Autowired 로 연결
@Repository
public interface CounselRepository extends JpaRepository<CounselEntity, Long> {

    // 회원 번호 조회 메소드
    List<CounselEntity> findByMember_MemberNo(Long memberNo);

    // 같은 회원/상담시작시각 기록 존재 여부 (중복 저장 방지)
    boolean existsByMember_MemberNoAndCounselDttm(Long memberNo, LocalDateTime counselDttm);

    // 날짜 범위 조회
    long countByMember_MemberNoAndCounselDttmBetween(Long memberNo, LocalDateTime start, LocalDateTime end);

}
