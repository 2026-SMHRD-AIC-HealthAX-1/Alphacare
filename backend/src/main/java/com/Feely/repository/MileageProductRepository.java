package com.Feely.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.Feely.entity.MileageProductEntity;

@Repository
public interface MileageProductRepository extends JpaRepository<MileageProductEntity, Long> {

}
