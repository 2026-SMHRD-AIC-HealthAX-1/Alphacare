package com.Feely.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;

// 카카오 OAuth: 인가코드로 액세스 토큰을 받고, 그 토큰으로 사용자 정보(카카오ID, 닉네임)를 조회함
@Service
public class KakaoAuthService {

    @Value("${kakao.rest-api-key}")
    private String restApiKey;

    @Value("${kakao.redirect-uri}")
    private String redirectUri;

    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public record KakaoUserInfo(String kakaoId, String nickname) {
    }

    // 인가코드 -> 액세스 토큰 -> 사용자 정보 순서로 조회. 실패하면 null
    public KakaoUserInfo getUserInfo(String code) {
        String accessToken = requestAccessToken(code);
        if (accessToken == null) {
            return null;
        }
        return requestUserInfo(accessToken);
    }

    private String requestAccessToken(String code) {
        try {
            String form = "grant_type=authorization_code"
                    + "&client_id=" + urlEncode(restApiKey)
                    + "&redirect_uri=" + urlEncode(redirectUri)
                    + "&code=" + urlEncode(code);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://kauth.kakao.com/oauth/token"))
                    .header("Content-Type", "application/x-www-form-urlencoded;charset=utf-8")
                    .POST(HttpRequest.BodyPublishers.ofString(form))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                System.out.println("카카오 토큰 발급 실패 = " + response.body());
                return null;
            }

            JsonNode json = objectMapper.readTree(response.body());
            return json.get("access_token").asText();
        } catch (Exception e) {
            System.out.println("카카오 토큰 요청 오류 = " + e.getMessage());
            return null;
        }
    }

    private KakaoUserInfo requestUserInfo(String accessToken) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://kapi.kakao.com/v2/user/me"))
                    .header("Authorization", "Bearer " + accessToken)
                    .header("Content-Type", "application/x-www-form-urlencoded;charset=utf-8")
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                System.out.println("카카오 사용자 정보 조회 실패 = " + response.body());
                return null;
            }

            JsonNode json = objectMapper.readTree(response.body());
            System.out.println("[확인] 카카오 사용자 정보 응답 = " + response.body());
            String kakaoId = json.get("id").asText();

            // properties.nickname(구버전) 또는 kakao_account.profile.nickname(신규 앱은 이쪽만 내려줄 수 있음) 순서로 조회
            String nickname = null;
            JsonNode properties = json.get("properties");
            if (properties != null && properties.has("nickname")) {
                nickname = properties.get("nickname").asText();
            }
            if (nickname == null) {
                JsonNode kakaoAccount = json.get("kakao_account");
                if (kakaoAccount != null) {
                    JsonNode profile = kakaoAccount.get("profile");
                    if (profile != null && profile.has("nickname")) {
                        nickname = profile.get("nickname").asText();
                    }
                }
            }

            return new KakaoUserInfo(kakaoId, nickname);
        } catch (Exception e) {
            System.out.println("카카오 사용자 정보 요청 오류 = " + e.getMessage());
            return null;
        }
    }

    private String urlEncode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
