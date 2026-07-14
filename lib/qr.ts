import QRCode from "qrcode";

export function qrPayload(participantId: string, qrToken: string) {
  return `YC2026:${participantId}:${qrToken}`;
}

export function parseQrPayload(payload: string) {
  const [prefix, participantId, qrToken] = payload.trim().split(":");
  if (prefix !== "YC2026" || !participantId || !qrToken) return null;
  return { participantId, qrToken };
}

export async function qrDataUrl(participantId: string, qrToken: string, width = 512) {
  return QRCode.toDataURL(qrPayload(participantId, qrToken), {
    errorCorrectionLevel: "H",
    margin: 2,
    width,
    color: { dark: "#14152b", light: "#ffffff" }
  });
}
