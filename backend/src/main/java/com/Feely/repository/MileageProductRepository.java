package com.Feely.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.Feely.entity.CounselEntity;

// 사용시, @Autowired 로 연결
@Repository 
public interface MileageProductRepository extends JpaRepository<CounselEntity, Long>{

}
