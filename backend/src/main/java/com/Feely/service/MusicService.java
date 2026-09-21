package com.Feely.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.Feely.common.MusicResponse;
import com.Feely.dto.MusicDto;
import com.Feely.entity.MusicEntity;
import com.Feely.repository.MusicRepository;

@Service
public class MusicService {

    private final MusicRepository musicRepository;

    public MusicService(MusicRepository musicRepository) {
        this.musicRepository = musicRepository;
    }

    public MusicDto getMusic(String genre) {
        if (isBlank(genre)) {
            return MusicDto.musicResult(List.of(), MusicResponse.Message.GENRE_REQUIRED);
        }

        try {
            return MusicDto.musicResult(
                    musicRepository.findByGenre(genre.trim()),
                    null);
        } catch (RuntimeException e) {
            return MusicDto.musicResult(List.of(), MusicResponse.Message.MUSIC_PROCESS_ERROR);
        }
    }

    public MusicDto setRecommend(String title, String singer, String genre) {
        if (isBlank(title) || isBlank(singer) || isBlank(genre)) {
            return MusicDto.flagResult(false, MusicResponse.Message.REQUIRED_MUSIC_INFO);
        }

        if (musicRepository.findByTitleAndSinger(title.trim(), singer.trim()).isPresent()) {
            return MusicDto.flagResult(false, MusicResponse.Message.DUPLICATE_MUSIC);
        }

        try {
            MusicEntity music = new MusicEntity();
            music.setTitle(title.trim());
            music.setSinger(singer.trim());
            music.setGenre(genre.trim());
            musicRepository.save(music);
            return MusicDto.flagResult(true, MusicResponse.Message.SET_SUCCESS);
        } catch (RuntimeException e) {
            return MusicDto.flagResult(false, MusicResponse.Message.MUSIC_PROCESS_ERROR);
        }
    }

    public MusicDto updateRecommend(Long musicNo, String title, String singer, String genre) {
        if (isBlank(title) || isBlank(singer) || isBlank(genre)) {
            return MusicDto.flagResult(false, MusicResponse.Message.REQUIRED_MUSIC_INFO);
        }

        try {
            MusicEntity music = musicRepository
                    .findByTitleAndSinger(title.trim(), singer.trim())
                    .orElse(null);

            if (music == null) {
                return MusicDto.flagResult(false, MusicResponse.Message.MUSIC_NOT_FOUND);
            }

            music.setGenre(genre.trim());
            musicRepository.save(music);
            return MusicDto.flagResult(true, MusicResponse.Message.UPDATE_SUCCESS);
        } catch (RuntimeException e) {
            return MusicDto.flagResult(false, MusicResponse.Message.MUSIC_PROCESS_ERROR);
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}