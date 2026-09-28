package com.Feely.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

// 주간 감정 요약 조회/저장 공용 DTO
public record WeeklySummaryDto(
        @JsonProperty("weekStart") String weekStart,
        @JsonProperty("summary") String summary,
        @JsonProperty("counselCount") int counselCount
) {
}
