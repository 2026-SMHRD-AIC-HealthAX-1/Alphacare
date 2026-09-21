package com.Feely.entity;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.NonNull;

@Data 
@AllArgsConstructor 
@NoArgsConstructor 

@Entity 
@Table (
    name = "MUSIC"
)
public class MusicEntity {

    @Id 
    @GeneratedValue ( strategy = GenerationType.IDENTITY )
    @Column ( name="MUSIC_NO" )
    @JsonProperty("music_no")
    // DB에서 직접 1000번부터 생성되게 바꿔주기
    private Long musicNo;

    @NonNull
    @Column (
        name = "TITLE",
        length = 300,
        nullable = false
    )
    private String title;

    @NonNull 
    @Column (
        name = "SINGER",
        length = 50,
        nullable = false
    )
    private String singer;
    
    @NonNull
    @Column (
        name = "GENRE",
        length = 50,
        nullable = false
    )
    private String genre;

}
