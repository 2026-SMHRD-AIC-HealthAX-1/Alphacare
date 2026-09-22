package com.Feely.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.Feely.common.MusicResponse;
import com.Feely.dto.MusicDto;
import com.Feely.entity.MusicEntity;
import com.Feely.service.MusicService;

@RestController
@RequestMapping("/api/music")
public class MusicController {

    private final MusicService musicService;

    public MusicController(MusicService musicService) {
        this.musicService = musicService;
    }

    @GetMapping("/recommend")
    public ResponseEntity<List<MusicEntity>> getMusic(@RequestParam("genre") String genre) {
        return ResponseEntity.ok(musicService.getMusic(genre));
    }

    @GetMapping("/setRecommend")
    public ResponseEntity<MusicDto> setRecommend(
            @RequestParam("title") String title,
            @RequestParam("singer") String singer,
            @RequestParam("genre") String genre) {
        try {
            boolean result = musicService.setRecommend(title, singer, genre);
            return ResponseEntity.ok(MusicDto.result(result, MusicResponse.Message.MUSIC_SAVE_SUCCESS));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(MusicDto.result(false, e.getMessage()));
        }
    }

    @GetMapping("/updateRecommend")
    public ResponseEntity<MusicDto> updateRecommend(
            @RequestParam("music_no") Long musicNo,
            @RequestParam("title") String title,
            @RequestParam("singer") String singer,
            @RequestParam("genre") String genre) {
        try {
            boolean result = musicService.updateRecommend(musicNo, title, singer, genre);
            return ResponseEntity.ok(MusicDto.result(result, MusicResponse.Message.MUSIC_UPDATE_SUCCESS));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(MusicDto.result(false, e.getMessage()));
        }
    }
}
