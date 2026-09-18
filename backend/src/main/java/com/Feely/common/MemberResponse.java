package com.Feely.common;

public final class MemberResponse {

    private MemberResponse() {
    }

    public static final class Message {
        public static final String REQUIRED_MEMBER_INFO = "필수 회원정보가 누락되었습니다.";
        public static final String DUPLICATE_ID = "이미 사용중인 아이디입니다.";
        public static final String SIGNUP_SUCCESS = "회원가입이 완료되었습니다.";
        public static final String DUPLICATE_MEMBER_INFO = "이미 등록된 회원정보가 있습니다.";
        public static final String LOGIN_REQUIRED_INPUT = "아이디와 비밀번호를 입력해주세요.";
        public static final String LOGIN_FAIL = "아이디 또는 비밀번호가 일치하지 않습니다.";
        public static final String LOGIN_SUCCESS = "로그인 성공";
        public static final String FIND_ID_REQUIRED_INPUT = "이름과 휴대폰번호를 입력해주세요.";
        public static final String FIND_ID_SUCCESS = "아이디를 찾았습니다.";
        public static final String FIND_PASSWORD_REQUIRED_INPUT = "아이디와 휴대폰번호를 입력해주세요.";
        public static final String MEMBER_NOT_FOUND = "일치하는 회원정보가 없습니다.";
        public static final String TEMP_PASSWORD_SENT = "임시 비밀번호가 발급되었습니다.";
        public static final String NEED_LOGIN = "로그인이 필요합니다.";
        public static final String NEED_MEMBER_NO = "회원번호가 필요합니다.";
        public static final String MEMBER_INFO_NOT_FOUND = "회원정보를 찾을 수 없습니다.";
        public static final String UPDATE_SUCCESS = "회원정보가 수정되었습니다.";
        public static final String LOGOUT_SUCCESS = "로그아웃되었습니다.";
    }

    public enum ErrorCode {
        REQUIRED_MEMBER_INFO("MEMBER_001"),
        DUPLICATE_ID("MEMBER_002"),
        SIGNUP_SUCCESS("MEMBER_200"),
        DUPLICATE_MEMBER_INFO("MEMBER_003"),
        LOGIN_REQUIRED_INPUT("MEMBER_004"),
        LOGIN_FAIL("MEMBER_005"),
        LOGIN_SUCCESS("MEMBER_200"),
        FIND_ID_REQUIRED_INPUT("MEMBER_006"),
        FIND_ID_SUCCESS("MEMBER_200"),
        FIND_PASSWORD_REQUIRED_INPUT("MEMBER_007"),
        MEMBER_NOT_FOUND("MEMBER_008"),
        TEMP_PASSWORD_SENT("MEMBER_200"),
        NEED_LOGIN("MEMBER_009"),
        NEED_MEMBER_NO("MEMBER_010"),
        MEMBER_INFO_NOT_FOUND("MEMBER_011"),
        UPDATE_SUCCESS("MEMBER_200"),
        LOGOUT_SUCCESS("MEMBER_200");

        private final String code;

        ErrorCode(String code) {
            this.code = code;
        }

        public String getCode() {
            return code;
        }
    }
}
