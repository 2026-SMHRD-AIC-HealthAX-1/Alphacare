package com.Feely.dto;

// 카카오 로그인/회원가입 처리 결과 응답
// status: LOGIN(로그인 완료), NEED_SIGNUP(추가정보 입력 필요), ERROR(실패)
public record KakaoLoginResponse(
        String status,
        String kakaoId,
        String nickname,
        boolean loginFlag,
        Integer mileage,
        String message) {
}
