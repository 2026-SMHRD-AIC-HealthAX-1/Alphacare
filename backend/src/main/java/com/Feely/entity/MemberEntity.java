package com.Feely.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
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
uniqueConstraints = @UniqueConstraint(columnNames = {"ID", "PHONE"})
)

public class MemberEntity {

    @Id 
    @GeneratedValue (strategy = GenerationType.IDENTITY)
    // DB에서 직접 1000번부터 생성되게 바꿔주기
    private Long memberNo;

    @NonNull 
    private String id;
    
    @NonNull 
    private String pw;
    
    @NonNull 
    private String name;
    
    @NonNull 
    private String phone;

    private String sns;
    
    @NonNull 
    private String role;
    
    private int point;

}
