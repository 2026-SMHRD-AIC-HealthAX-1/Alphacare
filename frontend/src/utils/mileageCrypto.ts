// 서버와 같은 XOR + Base64 방식으로 암호화된 마일리지 값을 복호화하는 샘플
const SECRET_KEY = "FEELY_MILEAGE_KEY_2026";

export function decryptMileage(encryptedMileage: string | null | undefined): number {
  if (!encryptedMileage) return 0;

  try {
    const decoded = window.atob(encryptedMileage);
    const keyBytes = new TextEncoder().encode(SECRET_KEY);
    const bytes = new Uint8Array(decoded.length);

    for (let i = 0; i < decoded.length; i++) {
      const code = decoded.charCodeAt(i);
      const key = keyBytes[i % keyBytes.length];
      bytes[i] = code ^ key;
    }

    const text = new TextDecoder().decode(bytes);
    const value = Number(text);
    return Number.isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
}

export function formatMileage(mileage: number): string {
  return `${mileage.toLocaleString()} P`;
}

// 샘플 사용법
export function sampleMileageUsage() {
  const encrypted = ""; // 서버에서 세션에 저장된 memberMileage 값
  const mileage = decryptMileage(encrypted);
  console.log("복호화된 마일리지:", mileage);
  console.log("표시용 텍스트:", formatMileage(mileage));
}
