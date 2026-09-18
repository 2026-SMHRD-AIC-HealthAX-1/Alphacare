package com.Feely.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

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
    public ResponseEntity<Map<String, Boolean>> setRecommend(
            @RequestParam("title") String title,
            @RequestParam("singer") String singer,
            @RequestParam("genre") String genre) {
        return ResponseEntity.ok(musicFlag(musicService.setRecommend(title, singer, genre)));
    }

    @GetMapping("/updateRecommend")
    public ResponseEntity<Map<String, Boolean>> updateRecommend(
            @RequestParam("music_no") Long musicNo,
            @RequestParam("title") String title,
            @RequestParam("singer") String singer,
            @RequestParam("genre") String genre) {
        return ResponseEntity.ok(musicFlag(musicService.updateRecommend(musicNo, title, singer, genre)));
    }

    private Map<String, Boolean> musicFlag(boolean result) {
        Map<String, Boolean> response = new HashMap<>();
        response.put("musicFlag", result);
        return response;
    }
}