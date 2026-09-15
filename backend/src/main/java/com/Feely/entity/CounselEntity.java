package com.Feely.entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

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
public class CounselEntity {
    
    @Id
    @GeneratedValue (strategy = GenerationType.IDENTITY)
    private Long counselNo;

    private String sumPath;
    private String startImagePath;
    private String endImagePath;

    // 각 감정분류의 점수
    // e01 : 중립
    // e02 : 기쁨
    // e03 : 슬픔
    // e04 : 화남
    // e05 : 우울
    // e06 : 불안
    private float e01Rate;
    private float e02Rate;
    private float e03Rate;
    private float e04Rate;
    private float e05Rate;
    private float e06Rate;

    @CreationTimestamp 
    private LocalDateTime counselDttm;
    
}
