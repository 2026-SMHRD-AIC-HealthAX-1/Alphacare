package com.Feely.service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.Feely.dto.CounselRequestDTO;
import com.Feely.dto.CounselResponseDTO;
import com.Feely.entity.CounselEntity;
import com.Feely.entity.MemberEntity;
import com.Feely.repository.CounselRepository;
import com.Feely.repository.MemberRepository;

@Service 
public class CounselService {
    private final CounselRepository counselRepository;
    private final MemberRepository memberRepository;

    public CounselService(
        CounselRepository counselRepository,
        MemberRepository memberRepository){

        this.counselRepository = counselRepository;
        this.memberRepository = memberRepository;

    }

    // 프론트에서 넘어온 값 Counsel DB에 저장하는 메소드
    public void saveCounsel(CounselRequestDTO dto, Long memberNo){ 

        // userId로 회원 Entity 조회
        MemberEntity member = memberRepository
                .findById(memberNo)
                .orElseThrow(() ->
                        new IllegalArgumentException("회원을 찾을 수 없습니다.")
                );

        // 감정 점수 6개 들어왔는지 검증
        Map<String, Double> emotionScore = dto.getEmotionScore();
        
        String[] requiredKeys = {"e01", "e02", "e03", "e04", "e05", "e06"};
        for (String key : requiredKeys) {
            if (emotionScore == null || emotionScore.get(key) == null) {
                throw new IllegalArgumentException("감정 점수 (" + key + ")가 누락되었습니다.");
            }
        }

        CounselEntity entity = new CounselEntity();
        
        entity.setMember(member);
        
        entity.setCounselDttm(dto.getCounselDate());
        entity.setCounselSum(dto.getSummary());
        entity.setStartImagePath("test");
        entity.setEndImagePath("test");
        entity.setE01Rate(BigDecimal.valueOf(emotionScore.get("e01")));
        entity.setE02Rate(BigDecimal.valueOf(emotionScore.get("e02")));
        entity.setE03Rate(BigDecimal.valueOf(emotionScore.get("e03")));
        entity.setE04Rate(BigDecimal.valueOf(emotionScore.get("e04")));
        entity.setE05Rate(BigDecimal.valueOf(emotionScore.get("e05")));
        entity.setE06Rate(BigDecimal.valueOf(emotionScore.get("e06")));

        counselRepository.save(entity);
    }


    // DB에 저장된 값을 회원번호로 조회하여 프론트엔드로 넘기는 메소드
    public List<CounselResponseDTO> sendCounsel(Long memberNo){

        // 회원 번호로 상담 목록 조회
        List<CounselEntity> counselList =
            counselRepository.findByMember_MemberNo(memberNo);

        // Entity 목록을 ReponseDTO 목록에 넣어주기
        List<CounselResponseDTO> responseList = new ArrayList<>();

        for(CounselEntity counsel : counselList){
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
            response.setStartImgPath(counsel.getStartImagePath());
            response.setEndImgPath(counsel.getEndImagePath());

            responseList.add(response);
        }

        return responseList;
    }

    

}
