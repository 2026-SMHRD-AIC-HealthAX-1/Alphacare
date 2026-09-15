package com.Feely.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.Feely.entity.CounselEntity;

@Repository 
public interface CounselRepository extends JpaRepository<CounselEntity, Long> {

}
