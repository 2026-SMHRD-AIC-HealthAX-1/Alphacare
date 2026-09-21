package com.Feely.common;

public final class MusicResponse {

    private MusicResponse() {
    }

    public static final class Message {
        public static final String GENRE_REQUIRED = "장르를 입력해주세요.";
        public static final String REQUIRED_MUSIC_INFO = "음악 제목, 가수, 장르를 입력해주세요.";
        public static final String DUPLICATE_MUSIC = "이미 등록된 음악입니다.";
        public static final String SET_SUCCESS = "음악 추천이 등록되었습니다.";
        public static final String MUSIC_NOT_FOUND = "수정할 음악을 찾을 수 없습니다.";
        public static final String UPDATE_SUCCESS = "음악 추천이 수정되었습니다.";
        public static final String MUSIC_PROCESS_ERROR = "음악 처리 중 오류가 발생했습니다.";
    }
}
