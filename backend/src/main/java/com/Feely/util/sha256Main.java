package com.Feely.util;

public class sha256Main {
    public static void main(String[] args) {
        String rawPassword = "!1111aaaa";
        String hashedPassword = PasswordUtil.sha256(rawPassword);
        System.out.println("Original Password: " + rawPassword);
        System.out.println("Hashed Password: " + hashedPassword);
    }
}
