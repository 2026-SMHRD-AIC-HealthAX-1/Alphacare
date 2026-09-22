package com.Feely.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonFormat;

import lombok.Data;

@Data 
public class CounselResponseDTO {
    // Front-End 로 넘겨줄 값 
    // : 상담번호, 회원번호, 상담요약, 상담점수, 상담날짜, 시작이미지 경로, 끝이미지 경로

    private Long counselNo;
    private Long memberNo;
    private String counselSum;
    private BigDecimal e01Rate;
    private BigDecimal e02Rate;
    private BigDecimal e03Rate;
    private BigDecimal e04Rate;
    private BigDecimal e05Rate;
    private BigDecimal e06Rate;

    @JsonFormat (
        pattern = "yyyy-MM-dd HH:mm:ss"
    )
    private LocalDateTime counselDttm;
    private String startImage;
    private String endImage;
}
