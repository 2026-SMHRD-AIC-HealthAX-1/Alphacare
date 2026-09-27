package com.Feely.common;

public final class MusicResponse {

    private MusicResponse() {
    }

    public static final class Message {
        public static final String MUSIC_TITLE_REQUIRED = "음악 제목을 입력해주세요.";
        public static final String MUSIC_SINGER_REQUIRED = "가수를 입력해주세요.";
        public static final String MUSIC_GENRE_REQUIRED = "장르를 입력해주세요.";
        public static final String MUSIC_ALREADY_EXISTS = "이미 등록된 추천 음악입니다.";
        public static final String MUSIC_NOT_FOUND = "추천 음악을 찾을 수 없습니다.";
        public static final String MUSIC_SAVE_SUCCESS = "추천 음악이 등록되었습니다.";
        public static final String MUSIC_UPDATE_SUCCESS = "추천 음악이 수정되었습니다.";
        public static final String MUSIC_DELETE_SUCCESS = "추천 음악이 삭제되었습니다.";
        public static final String MUSIC_SAVE_FAIL = "추천 등록에 실패했습니다.";
        public static final String MUSIC_UPDATE_FAIL = "추천 수정에 실패했습니다.";
    }

    public enum ErrorCode {
        MUSIC_TITLE_REQUIRED("MUSIC_001"),
        MUSIC_SINGER_REQUIRED("MUSIC_002"),
        MUSIC_GENRE_REQUIRED("MUSIC_003"),
        MUSIC_ALREADY_EXISTS("MUSIC_004"),
        MUSIC_NOT_FOUND("MUSIC_404"),
        MUSIC_SAVE_SUCCESS("MUSIC_200"),
        MUSIC_UPDATE_SUCCESS("MUSIC_201"),
        MUSIC_SAVE_FAIL("MUSIC_500"),
        MUSIC_UPDATE_FAIL("MUSIC_501");

        private final String code;

        ErrorCode(String code) {
            this.code = code;
        }

        public String getCode() {
            return code;
        }
    }
}
