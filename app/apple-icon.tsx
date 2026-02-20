import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)",
          borderRadius: "22%",
        }}
      >
        <span
          style={{
            fontSize: 88,
            fontWeight: 700,
            color: "#ecfdf5",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          G
        </span>
      </div>
    ),
    { ...size }
  );
}
