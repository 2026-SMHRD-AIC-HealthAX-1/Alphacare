package com.Feely.dto;

import java.time.format.DateTimeFormatter;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.Feely.entity.MileageHistoryEntity;

// 마일리지 내역 조회 응답
public record MileageHistoryDto(
        @JsonProperty("type") String type,
        @JsonProperty("amount") int amount,
        @JsonProperty("reason") String reason,
        @JsonProperty("createdAt") String createdAt
) {
    private static final DateTimeFormatter FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public static MileageHistoryDto from(MileageHistoryEntity entity) {
        return new MileageHistoryDto(
                entity.getType(),
                entity.getAmount(),
                entity.getReason(),
                entity.getCreatedAt().format(FORMAT)
        );
    }
}
