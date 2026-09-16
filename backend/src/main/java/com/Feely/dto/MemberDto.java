package com.Feely.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;

// 회원가입 요청과 회원 관련 응답을 함께 사용하는 DTO
public record MemberDto(
        @JsonProperty("id") @JsonAlias("ID") String id,
        @JsonProperty("pw") @JsonAlias({"PW", "password"}) String password,
        String name,
        @JsonProperty("tel") @JsonAlias("phone") String phone,
        @JsonProperty("kakaoID") @JsonAlias("kakaoId") String kakaoId,
        boolean isDuplicate,
        boolean loginFlag,
        @JsonProperty("member_no") Long memberNo) {

    // 아이디 중복 확인 응답 생성
    public static MemberDto duplicateResult(boolean isDuplicate) {
        return new MemberDto(null, null, null, null, null, isDuplicate, false, null);
    }

    // 로그인 결과 응답 생성
    public static MemberDto loginResult(boolean loginFlag, Long memberNo) {
        return new MemberDto(null, null, null, null, null, false, loginFlag, memberNo);
    }
}
