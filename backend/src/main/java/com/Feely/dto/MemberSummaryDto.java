package com.Feely.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

// 관리자 회원 목록 조회용 요약 정보 (비밀번호 제외)
public record MemberSummaryDto(
        @JsonProperty("memberNo") Long memberNo,
        @JsonProperty("id") String id,
        @JsonProperty("name") String name,
        @JsonProperty("phone") String phone,
        @JsonProperty("role") String role,
        @JsonProperty("mileage") int mileage
) {
}
