package com.Feely.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.NonNull;

@Data 
@AllArgsConstructor 
@NoArgsConstructor 

@Entity 
public class MusicEntity {

    @Id 
    @GeneratedValue (strategy = GenerationType.IDENTITY)
    // DB에서 직접 1000번부터 생성되게 바꿔주기
    private Long musicNo;

    @NonNull
    private String title;

    @NonNull 
    private String singer;
    
    @NonNull
    private String genre;

}
