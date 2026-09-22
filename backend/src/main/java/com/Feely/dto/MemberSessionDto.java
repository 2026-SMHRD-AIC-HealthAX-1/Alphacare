package com.Feely.dto;

public class MemberSessionDto {

    private final Long memberNo;
    private final String id;
    private final String name;
    private final String phone;
    private final String sns;
    private final String role;
    private final int mileage;

    public MemberSessionDto(Long memberNo, String id, String name, String phone, String sns, String role, int mileage) {
        this.memberNo = memberNo;
        this.id = id;
        this.name = name;
        this.phone = phone;
        this.sns = sns;
        this.role = role;
        this.mileage = mileage;
    }

    public Long getMemberNo() {
        return memberNo;
    }

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getPhone() {
        return phone;
    }

    public String getSns() {
        return sns;
    }

    public String getRole() {
        return role;
    }

    public int getMileage() {
        return mileage;
    }
}
