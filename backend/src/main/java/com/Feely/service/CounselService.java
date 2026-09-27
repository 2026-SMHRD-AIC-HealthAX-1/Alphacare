package com.Feely.service;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.Feely.common.CounselResponse;
import com.Feely.common.MemberResponse;
import com.Feely.dto.CounselRequestDTO;
import com.Feely.dto.CounselResponseDTO;
import com.Feely.dto.WeeklySummaryDto;
import com.Feely.entity.CounselEntity;
import com.Feely.entity.MemberEntity;
import com.Feely.entity.WeeklySummaryEntity;
import com.Feely.repository.CounselRepository;
import com.Feely.repository.MemberRepository;
import com.Feely.repository.WeeklySummaryRepository;

@Service
public class CounselService {
    private final CounselRepository counselRepository;
    private final MemberRepository memberRepository;
    private final WeeklySummaryRepository weeklySummaryRepository;

    public CounselService(
            CounselRepository counselRepository,
            MemberRepository memberRepository,
            WeeklySummaryRepository weeklySummaryRepository) {

        this.counselRepository = counselRepository;
        this.memberRepository = memberRepository;
        this.weeklySummaryRepository = weeklySummaryRepository;

    }

    // 프론트에서 넘어온 값을 상담DB에 저장하는 메소드 (이미 저장된 상담이면 저장하지 않고 false 반환)
    public boolean saveCounsel(CounselRequestDTO dto,
                            Long memberNo,
                            MultipartFile startImage,
                            MultipartFile endImage) {

        // userId로 회원 Entity 조회
        MemberEntity member = memberRepository
                .findById(memberNo)
                .orElseThrow(() -> new IllegalArgumentException(MemberResponse.Message.MEMBER_INFO_NOT_FOUND));

        // 같은 상담(회원 + 상담시작시각)이 이미 저장돼 있으면 재저장하지 않음
        if (counselRepository.existsByMember_MemberNoAndCounselDttm(memberNo, dto.getCounselDate())) {
            return false;
        }

        // 감정 점수 6개 들어왔는지 검증
        Map<String, Double> emotionScore = dto.getEmotionScores();

        String[] requiredKeys = { "e01", "e02", "e03", "e04", "e05", "e06" };
        for (String key : requiredKeys) {
            if (emotionScore == null || emotionScore.get(key) == null) {
                throw new IllegalArgumentException(CounselResponse.Message.COUNSEL_EMOTION_SCORE_MISSING + " (누락된 키: " + key + ")");
            }
        }

        CounselEntity entity = new CounselEntity();
        
        entity.setMember(member);
        entity.setCounselDttm(dto.getCounselDate());
        entity.setCounselSum(dto.getSummary());
        entity.setE01Rate(BigDecimal.valueOf(emotionScore.get("e01")));
        entity.setE02Rate(BigDecimal.valueOf(emotionScore.get("e02")));
        entity.setE03Rate(BigDecimal.valueOf(emotionScore.get("e03")));
        entity.setE04Rate(BigDecimal.valueOf(emotionScore.get("e04")));
        entity.setE05Rate(BigDecimal.valueOf(emotionScore.get("e05")));
        entity.setE06Rate(BigDecimal.valueOf(emotionScore.get("e06")));

        // 이미지가 있을 때만 저장 (카메라 미사용 상담은 이미지 없음)
        try {
            if (startImage != null && !startImage.isEmpty()) {
                entity.setStartImage(startImage.getBytes());
            }
            if (endImage != null && !endImage.isEmpty()) {
                entity.setEndImage(endImage.getBytes());
            }
        } catch (IOException e) {
            throw new RuntimeException(CounselResponse.Message.COUNSEL_INVALID_IMAGE, e);
        }

        counselRepository.save(entity);
        return true;
    }

    // DB에 저장된 값을 회원번호로 조회하여 프론트엔드로 넘기는 메소드
    public List<CounselResponseDTO> sendCounsel(Long memberNo) {

        // 회원 번호로 상담 목록 조회
        List<CounselEntity> counselList = counselRepository.findByMember_MemberNo(memberNo);

        // Entity 목록을 ReponseDTO 목록에 넣어주기
        List<CounselResponseDTO> responseList = new ArrayList<>();

        for (CounselEntity counsel : counselList) {
            CounselResponseDTO response = new CounselResponseDTO();

            response.setCounselNo(counsel.getCounselNo());
            response.setMemberNo(counsel.getMember().getMemberNo());

            response.setCounselSum(counsel.getCounselSum());

            response.setE01Rate(counsel.getE01Rate());
            response.setE02Rate(counsel.getE02Rate());
            response.setE03Rate(counsel.getE03Rate());
            response.setE04Rate(counsel.getE04Rate());
            response.setE05Rate(counsel.getE05Rate());
            response.setE06Rate(counsel.getE06Rate());

            response.setCounselDttm(counsel.getCounselDttm());
            response.setStartImage(counsel.getStartImage());
            response.setEndImage(counsel.getEndImage());

            responseList.add(response);
        }

        return responseList;
    }

    // 저장된 주간 감정 요약 조회 (상담 개수가 그대로일 때만 반환, 없거나 개수가 달라졌으면 null)
    public WeeklySummaryDto getWeeklySummary(Long memberNo, LocalDate weekStart, int currentCounselCount) {
        return weeklySummaryRepository.findByMember_MemberNoAndWeekStart(memberNo, weekStart)
                .filter(entity -> entity.getCounselCount() == currentCounselCount)
                .map(entity -> new WeeklySummaryDto(weekStart.toString(), entity.getSummary(), entity.getCounselCount()))
                .orElse(null);
    }

    // 주간 감정 요약 저장 (같은 주 기록이 있으면 갱신)
    public void saveWeeklySummary(Long memberNo, LocalDate weekStart, String summary, int counselCount) {
        MemberEntity member = memberRepository
                .findById(memberNo)
                .orElseThrow(() -> new IllegalArgumentException(MemberResponse.Message.MEMBER_INFO_NOT_FOUND));

        WeeklySummaryEntity entity = weeklySummaryRepository
                .findByMember_MemberNoAndWeekStart(memberNo, weekStart)
                .orElseGet(WeeklySummaryEntity::new);

        entity.setMember(member);
        entity.setWeekStart(weekStart);
        entity.setSummary(summary);
        entity.setCounselCount(counselCount);

        weeklySummaryRepository.save(entity);
    }

}
