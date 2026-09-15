package com.Feely.entity;

import jakarta.annotation.Nonnull;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data 
@AllArgsConstructor 
@NoArgsConstructor 

@Entity 
public class MileageProductEntity {

    @Id 
    @GeneratedValue (strategy = GenerationType.IDENTITY)
    // DB에서 직접 1000번부터 생성되게 바꿔주기
    private Long prodNo;

    @Nonnull 
    private String prodName;
    
    @Nonnull 
    private int prodInventory;
    
    @Nonnull 
    private int prodPrice;

}
