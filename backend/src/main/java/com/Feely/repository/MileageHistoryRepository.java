package com.Feely.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.Feely.entity.MileageHistoryEntity;

@Repository
public interface MileageHistoryRepository extends JpaRepository<MileageHistoryEntity, Long> {

    // 회원의 마일리지 내역을 최신순으로 조회
    List<MileageHistoryEntity> findByMember_MemberNoOrderByCreatedAtDesc(Long memberNo);

}
