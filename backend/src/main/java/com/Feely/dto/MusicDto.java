package com.Feely.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

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

    public static MusicDto result(Long musicNo, String title, String singer, String genre, boolean musicFlag, String message) {
        return new MusicDto(musicNo, title, singer, genre, musicFlag, message);
    }
}
