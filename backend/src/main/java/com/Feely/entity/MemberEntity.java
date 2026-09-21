package com.Feely.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.NonNull;

@Data 
@AllArgsConstructor 
@NoArgsConstructor 

@Entity
@Table(
    name = "MEMBER",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = "ID"),
        @UniqueConstraint(columnNames = "PHONE")
        }
) // Unique Key 정의
public class MemberEntity {

    @Id 
    @GeneratedValue (strategy = GenerationType.IDENTITY)
    @Column (
        name = "MEMBER_NO"
    )
    // DB에서 직접 1000번부터 생성되게 바꿔주기
    private Long memberNo;

    @NonNull
    @Column (
        name = "ID",
        length = 100,
        nullable = false
    )
    private String id;
    
    @NonNull 
    @Column (
        name = "PW",
        length = 300,
        nullable = false
    )
    private String pw;
    
    @NonNull 
    @Column (
        name = "NAME",
        length = 50,
        nullable = false
    )
    private String name;
    
    @NonNull 
    @Column (
        name = "PHONE",
        length = 100,
        nullable = false
    )
    private String phone;

    @Column (
        name = "SNS",
        length = 500
    )
    private String sns;
    
    @NonNull
    @Column (
        name = "ROLE",
        length = 10,
        nullable = false,
        columnDefinition = "VARCHAR(10) DEFAULT 'USER'"
    )
    private String role = "USER";
    
    @PrePersist
    public void prePersist() {
        if (this.role == null || this.role.isBlank()) {
            this.role = "USER";
        }
    }

    @Column (
        name = "MILEAGE"
    )
    private int mileage;

}
