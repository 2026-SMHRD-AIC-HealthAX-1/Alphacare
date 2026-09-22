package com.Feely.common;

// 상담 관련 응답 메시지와 에러 코드 정의
public final class CounselResponse {

    private CounselResponse() {
    }

    public static final class Message {

        // 상담 관련 메시지 정의
        public static final String COUNSEL_SAVE_SUCCESS = "상담 기록이 성공적으로 저장되었습니다.";
        public static final String COUNSEL_SAVE_FAIL = "상담 기록 저장에 실패했습니다.";
        public static final String COUNSEL_RETRIEVE_SUCCESS = "상담 기록이 성공적으로 조회되었습니다.";
        public static final String COUNSEL_RETRIEVE_FAIL = "상담 기록 조회에 실패했습니다.";
        public static final String COUNSEL_NOT_FOUND_IMAGE = "상담 기록에 이미지가 존재하지 않습니다.";
        public static final String COUNSEL_INVALID_IMAGE = "유효하지 않은 이미지 데이터입니다.";
        public static final String COUNESL_SESSION_NOT_FOUND = "세션에 회원 정보가 존재하지 않습니다.";
        public static final String COUNSEL_EMOTION_SCORE_MISSING = "감정 점수 중 일부가 누락되었습니다.";
        public static final String COUNSEL_IMAGE_CONVER_FAILED = "이미지 변환에 실패했습니다.";
    }

    public enum ErrorCode {
        COUNSEL_SAVE_SUCCESS("COUNSEL_200"),
        COUNSEL_SAVE_FAIL("COUNSEL_001"),
        COUNSEL_RETRIEVE_SUCCESS("COUNSEL_200"),
        COUNSEL_RETRIEVE_FAIL("COUNSEL_002"),
        COUNSEL_NOT_FOUND_IMAGE("COUNSEL_003"),
        COUNSEL_INVALID_IMAGE("COUNSEL_004"),
        COUNSEL_SESSION_NOT_FOUND("COUNSEL_005"),
        COUNSEL_EMOTION_SCORE_MISSING("COUNSEL_006"),
        COUNSEL_IMAGE_CONVER_FAILED("COUNSEL_007");

        private final String code;

        ErrorCode(String code) {
            this.code = code;
        }

        public String getCode() {
            return code;
        }
    }

}
