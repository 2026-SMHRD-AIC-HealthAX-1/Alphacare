package com.Feely.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;


@RestController
@RequestMapping("/api")
public class TestController {
	
	@PostMapping("/test")
	public ResponseEntity<String> testConnection(@RequestBody Map<String, Object> paramMap) {
	    System.out.println("========== [전송 데이터 로그 출력] ==========");
	    paramMap.forEach((key, value) -> System.out.println(key + " : " + value));
	    System.out.println("===========================================");
	    return ResponseEntity.ok("데이터 수신 성공");
	}
    
    //테스트용 회원가입 로직 -> API로 데이터가 잘 넘어오는지 확인하고, 무슨 데이터가 넘어왔는지 log찍기
    /*
     * 넘어오는 데이터 형식 -> Json 형식
     * {ID=test1, kakaoID=, PW=test123123!, name=test1, tel=01000000000, signDate=2026-09-11}
    */
    @PostMapping("/signUp")
    public ResponseEntity<String> singUp(@RequestBody Map<String, Object> paramMap) {
    	
    	System.out.println(paramMap);
    	
    	return ResponseEntity.ok("데이터 수신 성공");
    }
    
    //테스트용 아이디 중복 확인 로직
    @GetMapping("/userCheck")
    public int userCheck() {
    	return 0;
    }
}