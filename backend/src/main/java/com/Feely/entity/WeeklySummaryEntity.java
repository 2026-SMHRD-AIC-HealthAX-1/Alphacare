package com.Feely.entity;

import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.NonNull;

// 회원별 주간(월요일 시작) 감정 요약 저장 - 같은 주에 상담 개수가 그대로면 재생성하지 않고 이 값을 그대로 씀
@Data
@AllArgsConstructor
@NoArgsConstructor

@Entity
@Table (
    name = "WEEKLY_SUMMARY",
    uniqueConstraints = @UniqueConstraint(columnNames = { "MEMBER_NO", "WEEK_START" })
)
public class WeeklySummaryEntity {

    @Id
    @GeneratedValue (strategy = GenerationType.IDENTITY)
    @Column (name = "SUMMARY_NO")
    private Long summaryNo;

    @ManyToOne
    @NonNull
    @JoinColumn (
        name = "MEMBER_NO",
        referencedColumnName = "MEMBER_NO",
        nullable = false
    )
    private MemberEntity member;

    @NonNull
    @Column (name = "WEEK_START", nullable = false)
    private LocalDate weekStart;

    @NonNull
    @Column (
        name = "SUMMARY",
        nullable = false,
        columnDefinition = "MEDIUMTEXT"
    )
    private String summary;

    // 요약을 생성했을 당시의 그 주 상담 개수 (이후 상담이 늘어났는지 판단하는 기준)
    @Column (name = "COUNSEL_COUNT", nullable = false)
    private int counselCount;

}
