package com.Feely.dto;

import java.time.LocalDateTime;

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
    private Double emotionScore;
    private String status;

}
