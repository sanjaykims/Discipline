import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0f0f14",
        borderRadius: "120px",
      }}
    >
      {/* Outer glow ring */}
      <div
        style={{
          position: "absolute",
          width: "360px",
          height: "360px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)",
          display: "flex",
        }}
      />
      {/* Chain links — two interlocked ovals */}
      <svg
        width="280"
        height="280"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="a" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
          <linearGradient id="b" x1="100" y1="0" x2="0" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
        </defs>
        {/* Top-left link */}
        <rect x="8" y="22" width="52" height="30" rx="15" fill="none" stroke="url(#a)" strokeWidth="9"/>
        {/* Bottom-right link — crosses the first */}
        <rect x="40" y="48" width="52" height="30" rx="15" fill="none" stroke="url(#b)" strokeWidth="9"/>
        {/* Cover the overlap so links look interlinked */}
        <rect x="40" y="31" width="20" height="18" fill="#0f0f14"/>
        {/* Small dot accent at top */}
        <circle cx="50" cy="14" r="5" fill="#818cf8" opacity="0.6"/>
        {/* Small dot accent at bottom */}
        <circle cx="50" cy="86" r="5" fill="#a78bfa" opacity="0.6"/>
      </svg>
    </div>,
    { ...size }
  );
}
