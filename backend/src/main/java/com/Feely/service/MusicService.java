package com.Feely.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.Feely.entity.MusicEntity;
import com.Feely.repository.MusicRepository;

@Service
public class MusicService {

    private final MusicRepository musicRepository;

    public MusicService(MusicRepository musicRepository) {
        this.musicRepository = musicRepository;
    }

    public List<MusicEntity> getMusic(String genre) {
        if (isBlank(genre)) {
            return List.of();
        }

        return musicRepository.findByGenre(genre.trim());
    }

    public boolean setRecommend(String title, String singer, String genre) {
        if (isBlank(title) || isBlank(singer) || isBlank(genre)
                || musicRepository.findByTitleAndSinger(title.trim(), singer.trim()).isPresent()) {
            return false;
        }

        try {
            MusicEntity music = new MusicEntity();
            music.setTitle(title.trim());
            music.setSinger(singer.trim());
            music.setGenre(genre.trim());
            musicRepository.save(music);
            return true;
        } catch (RuntimeException e) {
            return false;
        }
    }

    public boolean updateRecommend(Long musicNo, String title, String singer, String genre) {
        if (isBlank(title) || isBlank(singer) || isBlank(genre)) {
            return false;
        }

        try {
            MusicEntity music = musicRepository
                    .findByTitleAndSinger(title.trim(), singer.trim())
                    .orElse(null);

            if (music == null) {
                return false;
            }

            music.setGenre(genre.trim());
            musicRepository.save(music);
            return true;
        } catch (RuntimeException e) {
            return false;
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}