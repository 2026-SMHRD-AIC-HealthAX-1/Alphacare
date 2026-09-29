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
        @JsonProperty("message") String message,
        @JsonProperty("mileage") Integer mileage) {

    // 회원가입 결과 응답 생성
    public static MemberDto signupResult(boolean joinFlag, String message) {
        return new MemberDto(null, null, null, null, null, joinFlag, false, false, message, null);
    }

    // 아이디 중복 확인 응답 생성
    public static MemberDto duplicateResult(boolean isDuplicate) {
        return new MemberDto(null, null, null, null, null, false, isDuplicate, false, null, null);
    }

    // 아이디 찾기 응답 생성
    public static MemberDto FindIdResult(String id, String message) {
        return new MemberDto(id, null, null, null, null, false, false, false, message, null);
    }

    // 비밀번호 찾기 응답 생성
    public static MemberDto findPasswordResult(boolean success, String temporaryPassword, String message) {
        return new MemberDto(null, temporaryPassword, null, null, null, success, false, false, message, null);
    }

    // 회원정보 수정 결과 응답 생성
    public static MemberDto updateResult(boolean success, String message) {
        return new MemberDto(null, null, null, null, null, success, false, false, message, null);
    }

    // 마일리지 조회 응답 생성
    public static MemberDto mileageResult(Integer mileage, String message) {
        return new MemberDto(null, null, null, null, null, false, false, false, message, mileage);
    }

    // 로그인 결과 응답 생성 (성공 시 이름 포함)
    public static MemberDto loginResult(boolean loginFlag, String message, Integer mileage, String name) {
        return new MemberDto(null, null, name, null, null, false, false, loginFlag, message, mileage);
    }

    // 로그아웃 결과 응답 생성
    public static MemberDto logoutResult(boolean success, String message) {
        return new MemberDto(null, null, null, null, null, false, false, false, message, null);
    }
}
