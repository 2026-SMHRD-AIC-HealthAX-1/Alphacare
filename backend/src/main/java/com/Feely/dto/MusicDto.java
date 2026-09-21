package com.Feely.dto;

import java.util.List;

import com.Feely.entity.MusicEntity;

public record MusicDto(List<MusicEntity> musicList, Boolean musicFlag, String message) {

	public MusicDto(List<MusicEntity> musicList) {
		this(musicList, null, null);
	}

	public MusicDto(List<MusicEntity> musicList, Boolean musicFlag) {
		this(musicList, musicFlag, null);
	}

	public static MusicDto musicResult(List<MusicEntity> musicList, String message) {
		return new MusicDto(musicList, null, message);
	}

	public static MusicDto flagResult(boolean musicFlag, String message) {
		return new MusicDto(null, musicFlag, message);
	}
}
