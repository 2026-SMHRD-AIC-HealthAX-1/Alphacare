package com.Feely.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.Feely.entity.MusicEntity;

public record MusicDto(
        @JsonProperty("music_no") Long musicNo,
        @JsonProperty("title") String title,
        @JsonProperty("singer") String singer,
        @JsonProperty("genre") String genre,
        @JsonProperty("musicFlag") Boolean musicFlag,
        @JsonProperty("message") String message
) {
    public static MusicDto result(boolean musicFlag, String message) {
        return new MusicDto(null, null, null, null, musicFlag, message);
    }

    // 추천 목록 조회용 - MusicEntity 하나를 그대로 MusicDto로 변환 (musicFlag/message는 목록 조회엔 안 씀)
    public static MusicDto from(MusicEntity entity) {
        return new MusicDto(entity.getMusicNo(), entity.getTitle(), entity.getSinger(), entity.getGenre(), null, null);
    }

    public static MusicDto result(Long musicNo, String title, String singer, String genre, boolean musicFlag, String message) {
        return new MusicDto(musicNo, title, singer, genre, musicFlag, message);
    }
}
