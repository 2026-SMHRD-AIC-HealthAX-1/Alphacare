package com.Feely.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.Feely.entity.MileageProductEntity;

import jakarta.persistence.LockModeType;

@Repository
public interface MileageProductRepository extends JpaRepository<MileageProductEntity, Long> {

    // 상품 교환 시 재고 경쟁상태(동시 요청으로 재고가 음수가 되는 것) 방지용 - 트랜잭션 종료까지 해당 행을 잠금
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from MileageProductEntity p where p.prodNo = :prodNo")
    Optional<MileageProductEntity> findByIdForUpdate(@Param("prodNo") Long prodNo);

}
