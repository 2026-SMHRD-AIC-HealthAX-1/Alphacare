package com.Feely.entity;

import java.time.LocalDate;

import jakarta.annotation.Nonnull;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data 
@AllArgsConstructor 
@NoArgsConstructor 

@Entity 
@Table (
    name = "MILEAGE_PRODUCT"
)
public class MileageProductEntity {

    @Id 
    @GeneratedValue (strategy = GenerationType.IDENTITY)
    @Column (
        name = "PRODUCT_ID"
    )
    // DB에서 직접 1000번부터 생성되게 바꿔주기!
    private Long prodNo;

    @Nonnull 
    @Column (
        name = "PRODUCT_NAME",
        length = 255,
        nullable = false
    )
    private String prodName;
    
    @Nonnull 
    @Column (
        name = "PRODUCT_INVENTORY",
        nullable = false
    )
    private int prodInventory;
    
    @Nonnull 
    @Column (
        name = "PRODUCT_PRICE",
        nullable = false
    )
    private int prodPrice;

    @Nonnull 
    @Column (
        name="PRODUCT_IMAGE",
        columnDefinition = "mediumblob",
        nullable=false
    )
    private byte[] prodImage;

}
