import { Secret, TOTP } from "otpauth";
import QRCode from "qrcode";

// Render an otpauth URI as an inline SVG string with theme-friendly colors:
// dark pixels use `currentColor` (so the QR inherits text color), light
// pixels are transparent (so the surrounding container's bg shows through).
export async function renderThemedQrSvg(uri: string): Promise<string> {
  const svg = await QRCode.toString(uri, {
    type: "svg",
    margin: 1,
    color: { dark: "#000000", light: "#0000" },
  });
  return svg.replace(/fill="#000000"/g, 'fill="currentColor"');
}

const ISSUER = "Aloha Admin";

export function generateTotpSecret(): string {
  return new Secret({ size: 20 }).base32;
}

export function buildTotpUri(email: string, secretBase32: string): string {
  const totp = new TOTP({
    issuer: ISSUER,
    label: email,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: Secret.fromBase32(secretBase32),
  });
  return totp.toString();
}

// In dev, `000000` is always accepted so the maintainer doesn't have to
// set up a real authenticator app. Production verifies normally.
export const DEV_TOTP_CODE = "000000";
export const isDevBypassEnabled = () => process.env.NODE_ENV !== "production";

// Accepts a 6-digit code; allows ±1 window (30s) for clock drift.
export function verifyTotp(secretBase32: string, code: string): boolean {
  const clean = code.replace(/\s+/g, "");
  if (!/^\d{6}$/.test(clean)) return false;
  if (isDevBypassEnabled() && clean === DEV_TOTP_CODE) return true;
  const totp = new TOTP({
    issuer: ISSUER,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: Secret.fromBase32(secretBase32),
  });
  const delta = totp.validate({ token: clean, window: 1 });
  return delta !== null;
}
