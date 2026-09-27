package com.Feely.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.NonNull;

// 마일리지 적립/사용 내역 (적립: 오늘 첫 상담, 사용: 상품 교환) - 두 이벤트를 한 테이블에 기록해서 시간순으로 함께 조회
@Data
@AllArgsConstructor
@NoArgsConstructor

@Entity
@Table(name = "MILEAGE_HISTORY")
public class MileageHistoryEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "HISTORY_NO")
    private Long historyNo;

    @ManyToOne
    @NonNull
    @JoinColumn(
        name = "MEMBER_NO",
        referencedColumnName = "MEMBER_NO",
        nullable = false
    )
    private MemberEntity member;

    // EARN(적립) / USE(사용)
    @NonNull
    @Column(name = "TYPE", nullable = false, length = 10)
    private String type;

    // 적립은 양수, 사용은 음수
    @NonNull
    @Column(name = "AMOUNT", nullable = false)
    private int amount;

    // 적립: "오늘 첫 상담" / 사용: 교환한 상품명
    @NonNull
    @Column(name = "REASON", nullable = false, length = 255)
    private String reason;

    @NonNull
    @Column(name = "CREATED_AT", nullable = false)
    private LocalDateTime createdAt;

}
