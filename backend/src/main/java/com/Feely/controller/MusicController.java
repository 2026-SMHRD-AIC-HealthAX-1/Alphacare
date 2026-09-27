package com.Feely.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.Feely.common.MusicResponse;
import com.Feely.dto.MusicDto;
import com.Feely.entity.MusicEntity;
import com.Feely.repository.MemberRepository;
import com.Feely.service.MusicService;

import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/music")
public class MusicController {

    private final MusicService musicService;
    private final MemberRepository memberRepository;

    public MusicController(MusicService musicService, MemberRepository memberRepository) {
        this.musicService = musicService;
        this.memberRepository = memberRepository;
    }

    /**
     * 특정 장르에 해당하는 음악 목록을 조회합니다.
     *
     * @param genre 장르
     * @return 음악 목록
     */
    @GetMapping("/recommend")
    public ResponseEntity<List<MusicDto>> getMusic(@RequestParam("genre") String genre) {
        return ResponseEntity.ok(musicService.getMusic(genre));
    }

    /**
     * 전체 추천 음악 목록을 조회합니다 (관리자 화면용).
     */
    @GetMapping("/all")
    public ResponseEntity<List<MusicDto>> getAllMusic() {
        return ResponseEntity.ok(musicService.getAllMusic());
    }

    /**
     * 새로운 음악 추천을 등록합니다.
     *
     * @param title  음악 제목
     * @param singer 음악 가수
     * @param genre  음악 장르
     * @return 등록 결과
     */
    @GetMapping("/setRecommend")
    public ResponseEntity<MusicDto> setRecommend(
            @RequestParam("title") String title,
            @RequestParam("singer") String singer,
            @RequestParam("genre") String genre,
            HttpSession session) {
        if (!isAdmin(session)) {
            return ResponseEntity.status(403).build();
        }
        try {
            boolean result = musicService.setRecommend(title, singer, genre);
            return ResponseEntity.ok(MusicDto.result(result, MusicResponse.Message.MUSIC_SAVE_SUCCESS));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(MusicDto.result(false, e.getMessage()));
        }
    }

    /**
     * 기존 음악 추천을 수정합니다.
     *
     * @param musicNo 음악 번호
     * @param title   음악 제목
     * @param singer  음악 가수
     * @param genre   음악 장르
     * @return 수정 결과
     */
    @GetMapping("/updateRecommend")
    public ResponseEntity<MusicDto> updateRecommend(
            @RequestParam("music_no") Long musicNo,
            @RequestParam("title") String title,
            @RequestParam("singer") String singer,
            @RequestParam("genre") String genre,
            HttpSession session) {
        if (!isAdmin(session)) {
            return ResponseEntity.status(403).build();
        }
        try {
            boolean result = musicService.updateRecommend(musicNo, title, singer, genre);
            return ResponseEntity.ok(MusicDto.result(result, MusicResponse.Message.MUSIC_UPDATE_SUCCESS));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(MusicDto.result(false, e.getMessage()));
        }
    }

    /**
     * 추천 음악을 삭제합니다 (관리자 전용).
     */
    @DeleteMapping("/{musicNo}")
    public ResponseEntity<MusicDto> deleteMusic(@PathVariable Long musicNo, HttpSession session) {
        if (!isAdmin(session)) {
            return ResponseEntity.status(403).build();
        }
        try {
            boolean result = musicService.deleteMusic(musicNo);
            return ResponseEntity.ok(MusicDto.result(result, MusicResponse.Message.MUSIC_DELETE_SUCCESS));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(MusicDto.result(false, e.getMessage()));
        }
    }

    private boolean isAdmin(HttpSession session) {
        return com.Feely.common.AdminGuard.isAdmin(session, memberRepository);
    }
}
