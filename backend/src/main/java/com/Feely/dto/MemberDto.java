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
        @JsonProperty("joinFlag") Boolean joinFlag,
        @JsonProperty("isDuplicate") Boolean isDuplicate,
        @JsonProperty("loginFlag") Boolean loginFlag,
        @JsonProperty("member_no") Long memberNo,
        @JsonProperty("message") String message) {

    // 회원가입 결과 응답 생성
    public static MemberDto signupResult(boolean joinFlag, String message) {
        return new MemberDto(null, null, null, null, null, joinFlag, false, false, null, message);
    }

    // 아이디 중복 확인 응답 생성
    public static MemberDto duplicateResult(boolean isDuplicate) {
        return new MemberDto(null, null, null, null, null, false, isDuplicate, false, null, null);
    }

    // 아이디 찾기 응답 생성
    public static MemberDto FindIdResult(String id, String message) {
        return new MemberDto(id, null, null, null, null, false, false, false, null, message);
    }

    // 비밀번호 찾기 응답 생성
    public static MemberDto findPasswordResult(boolean success, String temporaryPassword, String message) {
        return new MemberDto(null, temporaryPassword, null, null, null, false, false, false, null, message);
    }

    // 회원정보 수정 결과 응답 생성
    public static MemberDto updateResult(boolean success, String message) {
        return new MemberDto(null, null, null, null, null, false, false, false, null, message);
    }

    // 로그인 결과 응답 생성
    public static MemberDto loginResult(boolean loginFlag, Long memberNo) {
        return new MemberDto(null, null, null, null, null, false, false, loginFlag, memberNo, null);
    }

    // 로그아웃 결과 응답 생성
    public static MemberDto logoutResult(boolean success, String message) {
        return new MemberDto(null, null, null, null, null, false, false, false, null, message);
    }
}
