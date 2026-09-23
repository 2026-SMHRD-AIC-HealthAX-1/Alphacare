package com.Feely.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.NonNull;

@Data 
@AllArgsConstructor 
@NoArgsConstructor 

@Entity
@Table ( name = "COUNSEL" )
public class CounselEntity {
    
    @Id
    @GeneratedValue (strategy = GenerationType.IDENTITY)
    @Column (
        name = "COUNSEL_NO"
    )
    // DB에서 직접 1000번부터 생성되게 바꿔주기
    private Long counselNo;


    @ManyToOne
    @NonNull
    @JoinColumn (
        name = "MEMBER_NO",
        referencedColumnName = "MEMBER_NO",
        nullable = false
    )
    private MemberEntity member;


    @NonNull
    @Column (
        name = "COUNSEL_SUM",
        nullable = false,
        columnDefinition = "MEDIUMTEXT"
    )
    private String counselSum;


    @Lob
    @Column (
        name = "START_IMAGE",
        columnDefinition = "mediumblob"
    )
    private byte[] startImage;

    @Lob
    @Column (
        name = "END_IMAGE",
        columnDefinition = "mediumblob"
    )
    private byte[] endImage;


    // 각 감정분류의 점수
    // e01 : 중립
    // e02 : 기쁨
    // e03 : 슬픔
    // e04 : 화남
    // e05 : 우울
    // e06 : 불안

    @NonNull 
    @Column (
        name = "E01_RATE",
        precision = 5,
        scale = 2,
        nullable = false
    )
    private BigDecimal e01Rate;
    
    @NonNull 
    @Column (
        name = "E02_RATE",
        precision = 5,
        scale = 2,
        nullable = false
    )
    private BigDecimal e02Rate;
    
    @NonNull 
    @Column (
        name = "E03_RATE",
        precision = 5,
        scale = 2,
        nullable = false
    )
    private BigDecimal e03Rate;
    
    @NonNull 
    @Column (
        name = "E04_RATE",
        precision = 5,
        scale = 2,
        nullable = false
    )
    private BigDecimal e04Rate;
    
    @NonNull 
    @Column (
        name = "E05_RATE",
        precision = 5,
        scale = 2,
        nullable = false
    )
    private BigDecimal e05Rate;
    
    @NonNull 
    @Column (
        name = "E06_RATE",
        precision = 5,
        scale = 2,
        nullable = false
    )
    private BigDecimal e06Rate;
    

    @NonNull 
    @Column (
        name = "COUNSEL_DTTM",
        nullable = false,
        updatable = false
    )
    private LocalDateTime counselDttm;
    // 상담 시작 시간을 저장하는 컬럼이므로 @CreationTimestamp 쓰지않음
    // 대신 백엔드에 상담 시작 시간을 저장하고, 상담 종료 시 데이터 저장함.
    
}
