import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
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
          borderRadius: "24%",
        }}
      >
        <span
          style={{
            fontSize: 240,
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
