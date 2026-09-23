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

    // 날짜 범위 조회
    long countByMember_MemberNoAndCounselDttmBetween(Long memberNo, LocalDateTime start, LocalDateTime end);

}
