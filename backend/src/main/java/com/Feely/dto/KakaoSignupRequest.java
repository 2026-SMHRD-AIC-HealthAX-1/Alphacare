package com.Feely.dto;

// 카카오 최초 가입 요청 (전화번호는 받지 않음 - 카카오 로그인 전용 계정이라 아이디/비번 찾기가 필요 없음)
public record KakaoSignupRequest(
        String kakaoId,
        String nickname) {
}
