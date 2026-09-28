package com.Feely.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

// 관리자 회원 정보 수정 요청 (역할/마일리지만 변경 가능 - 아이디/비밀번호/이름/전화번호는 본인만 수정)
public record MemberUpdateDto(
        @JsonProperty("role") String role,
        @JsonProperty("mileage") Integer mileage
) {
}
