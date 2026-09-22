package com.Feely.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.Feely.common.MusicResponse;
import com.Feely.entity.MusicEntity;
import com.Feely.repository.MusicRepository;
import java.util.stream.Collectors;

@Service
public class MusicService {

    private final MusicRepository musicRepository;

    public MusicService(MusicRepository musicRepository) {
        this.musicRepository = musicRepository;
    }

    public List<MusicDto> getMusic(String genre) {
    if (isBlank(genre)) {
        return List.of();
    }
    return musicRepository.findByGenre(genre.trim())
            .stream()
            .map(MusicDto::from)
            .collect(Collectors.toList());
    }

    public boolean setRecommend(String title, String singer, String genre) {
        if (isBlank(title)) {
            throw new IllegalArgumentException(MusicResponse.Message.MUSIC_TITLE_REQUIRED);
        }
        if (isBlank(singer)) {
            throw new IllegalArgumentException(MusicResponse.Message.MUSIC_SINGER_REQUIRED);
        }
        if (isBlank(genre)) {
            throw new IllegalArgumentException(MusicResponse.Message.MUSIC_GENRE_REQUIRED);
        }
        if (musicRepository.findByTitleAndSinger(title.trim(), singer.trim()).isPresent()) {
            throw new IllegalArgumentException(MusicResponse.Message.MUSIC_ALREADY_EXISTS);
        }

        try {
            MusicEntity music = new MusicEntity();
            music.setTitle(title.trim());
            music.setSinger(singer.trim());
            music.setGenre(genre.trim());
            musicRepository.save(music);
            return true;
        } catch (RuntimeException e) {
            throw new IllegalStateException(MusicResponse.Message.MUSIC_SAVE_FAIL, e);
        }
    }

    public boolean updateRecommend(Long musicNo, String title, String singer, String genre) {
        if (isBlank(title)) {
            throw new IllegalArgumentException(MusicResponse.Message.MUSIC_TITLE_REQUIRED);
        }
        if (isBlank(singer)) {
            throw new IllegalArgumentException(MusicResponse.Message.MUSIC_SINGER_REQUIRED);
        }
        if (isBlank(genre)) {
            throw new IllegalArgumentException(MusicResponse.Message.MUSIC_GENRE_REQUIRED);
        }

        try {
            MusicEntity music = musicRepository.findById(musicNo)
                    .orElse(null);

            if (music == null) {
                throw new IllegalArgumentException(MusicResponse.Message.MUSIC_ALREADY_EXISTS);
            }

            music.setTitle(title.trim());
            music.setSinger(singer.trim());
            music.setGenre(genre.trim());
            musicRepository.save(music);
            return true;
        } catch (RuntimeException e) {
            if (e instanceof IllegalArgumentException) {
                throw e;
            }
            throw new IllegalStateException(MusicResponse.Message.MUSIC_UPDATE_FAIL, e);
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
