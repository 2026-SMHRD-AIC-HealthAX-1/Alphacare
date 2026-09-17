package com.Feely.util;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

public final class PasswordUtil {

    private PasswordUtil() {
    }

    public static String sha256(String rawPassword) {
        if (rawPassword == null) {
            return null;
        }

        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawPassword.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : hash) {
                String hexValue = Integer.toHexString(0xff & b);
                if (hexValue.length() == 1) {
                    hex.append('0');
                }
                hex.append(hexValue);
            }
            return hex.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm not available", e);
        }
    }
}
