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
    }

    public enum ErrorCode {
        COUNSEL_SAVE_SUCCESS("COUNSEL_200"),
        COUNSEL_SAVE_FAIL("COUNSEL_001"),
        COUNSEL_RETRIEVE_SUCCESS("COUNSEL_200"),
        COUNSEL_RETRIEVE_FAIL("COUNSEL_002");

        private final String code;

        ErrorCode(String code) {
            this.code = code;
        }

        public String getCode() {
            return code;
        }
    }

}
