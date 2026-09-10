package com.Feely.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class TestController {

    @GetMapping("/test")
    public ResponseEntity<String> testConnection() {
        System.out.println("========== [메인페이지 통신 테스트 요청 수신] ==========");
        return ResponseEntity.ok("통신 성공");
      }
}