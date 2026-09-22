package com.Feely.dto;

import java.time.LocalDateTime;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonFormat;

import lombok.Data;

@Data 
public class CounselRequestDTO {

    private Long counselId;
    private Long userId;

    @JsonFormat (
        pattern = "yyyy-MM-dd HH:mm:ss"
    )
    private LocalDateTime counselDate;

    private Integer sessionTurn;
    private String summary;
    private String emotionCategory;

    // 감정 카테고리별 평균 점수 ( key : e01 ~ e06 , value : 0.0 ~ 100.0 )
    // e01: 중립, e02: 기쁨, e03: 슬픔, e04: 분노, e05: 당황, e06: 불안
    private Map<String, Double> emotionScores;
    
    
    private String status;

}
