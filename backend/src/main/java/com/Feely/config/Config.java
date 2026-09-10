package com.Feely.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

//config 파일 삭제하시면 안됩니다.
//프론트 백 통신 설정파일
@Configuration
public class Config implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
    	//프론트엔드 백엔드 CORS 허용 설정
        registry.addMapping("/api/**")
                .allowedOrigins("http://localhost:5173", "http://localhost:4000")
                .allowedMethods("GET", "POST", "PUT", "DELETE")
                .allowCredentials(true);
    }
}