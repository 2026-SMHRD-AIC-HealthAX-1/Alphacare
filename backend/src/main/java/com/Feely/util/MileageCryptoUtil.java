package com.Feely.util;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

public final class MileageCryptoUtil {

    private static final String SECRET_KEY = "FEELY_MILEAGE_KEY_2026";

    private MileageCryptoUtil() {
    }

    public static String encrypt(int mileage) {
        if (mileage < 0) {
            mileage = 0;
        }

        String raw = String.valueOf(mileage);
        byte[] input = raw.getBytes(StandardCharsets.UTF_8);
        byte[] keyBytes = SECRET_KEY.getBytes(StandardCharsets.UTF_8);
        byte[] output = new byte[input.length];

        for (int i = 0; i < input.length; i++) {
            output[i] = (byte) (input[i] ^ keyBytes[i % keyBytes.length]);
        }

        return Base64.getEncoder().encodeToString(output);
    }

    public static int decrypt(String encryptedMileage) {
        if (encryptedMileage == null || encryptedMileage.isBlank()) {
            return 0;
        }

        try {
            byte[] decoded = Base64.getDecoder().decode(encryptedMileage);
            byte[] keyBytes = SECRET_KEY.getBytes(StandardCharsets.UTF_8);
            byte[] output = new byte[decoded.length];

            for (int i = 0; i < decoded.length; i++) {
                output[i] = (byte) (decoded[i] ^ keyBytes[i % keyBytes.length]);
            }

            String value = new String(output, StandardCharsets.UTF_8);
            return Integer.parseInt(value);
        } catch (Exception e) {
            return 0;
        }
    }
}
