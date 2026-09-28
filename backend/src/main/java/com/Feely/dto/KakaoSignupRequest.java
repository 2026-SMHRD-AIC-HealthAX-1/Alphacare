package com.Feely.dto;

// 카카오 최초 가입 시 추가 정보(전화번호) 입력 요청
public record KakaoSignupRequest(
        String kakaoId,
        String nickname,
        String phone) {
}
