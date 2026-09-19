"use client";

export type MuscleKey =
  | "chest" | "back" | "shoulders" | "biceps" | "triceps"
  | "forearms" | "abs" | "quads" | "hamstrings" | "glutes" | "calves";

const NEUTRAL_STROKE = "#374151";
const NEUTRAL_RGB: [number, number, number] = [31, 41, 55]; // #1f2937
const ACCENT_RGB: [number, number, number] = [16, 185, 129]; // #10b981

/**
 * Blends neutral gray -> accent green as `t` goes 0 -> 1, so the color itself
 * fades smoothly with how long ago a muscle was worked, instead of snapping
 * between a few fixed buckets.
 */
export function mixColor(t: number) {
  const clamped = Math.max(0, Math.min(1, t));
  const [r, g, b] = NEUTRAL_RGB.map((n, i) => Math.round(n + (ACCENT_RGB[i] - n) * clamped));
  return `rgb(${r},${g},${b})`;
}

interface Props {
  intensity: Record<MuscleKey, number>;
}

function Region({
  intensity, shapes,
}: { intensity: number; shapes: React.ReactNode }) {
  return (
    <g fill={mixColor(intensity)} stroke={NEUTRAL_STROKE} strokeWidth={1.5}>
      {shapes}
    </g>
  );
}

export function MuscleDiagram({ intensity }: Props) {
  return (
    <div className="flex gap-4 justify-center">
      <FrontBody intensity={intensity} />
      <BackBody intensity={intensity} />
    </div>
  );
}

function FrontBody({ intensity }: Props) {
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 400" className="w-full max-w-[160px]">
        {/* Head, neck, torso outline, shins, feet — neutral background */}
        <g fill={mixColor(0)} stroke={NEUTRAL_STROKE} strokeWidth={1.5}>
          <circle cx="100" cy="30" r="22" />
          <rect x="88" y="50" width="24" height="16" rx="4" />
          <path d="M60,64 L140,64 L148,112 L138,232 L62,232 L52,112 Z" />
          <rect x="68" y="330" width="26" height="58" rx="12" />
          <rect x="106" y="330" width="26" height="58" rx="12" />
          <ellipse cx="81" cy="392" rx="15" ry="7" />
          <ellipse cx="119" cy="392" rx="15" ry="7" />
        </g>

        {/* Shoulders */}
        <Region intensity={intensity.shoulders} shapes={<>
          <circle cx="53" cy="74" r="18" />
          <circle cx="147" cy="74" r="18" />
        </>} />

        {/* Chest */}
        <Region intensity={intensity.chest} shapes={<>
          <ellipse cx="81" cy="101" rx="25" ry="29" />
          <ellipse cx="119" cy="101" rx="25" ry="29" />
        </>} />

        {/* Abs */}
        <Region intensity={intensity.abs} shapes={<rect x="78" y="136" width="44" height="72" rx="8" />} />

        {/* Biceps */}
        <Region intensity={intensity.biceps} shapes={<>
          <rect x="29" y="88" width="22" height="62" rx="11" />
          <rect x="149" y="88" width="22" height="62" rx="11" />
        </>} />

        {/* Forearms */}
        <Region intensity={intensity.forearms} shapes={<>
          <rect x="25" y="150" width="20" height="60" rx="10" />
          <rect x="155" y="150" width="20" height="60" rx="10" />
        </>} />

        {/* Quads */}
        <Region intensity={intensity.quads} shapes={<>
          <rect x="64" y="232" width="34" height="96" rx="15" />
          <rect x="102" y="232" width="34" height="96" rx="15" />
        </>} />
      </svg>
      <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wide">Front</p>
    </div>
  );
}

function BackBody({ intensity }: Props) {
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 400" className="w-full max-w-[160px]">
        <g fill={mixColor(0)} stroke={NEUTRAL_STROKE} strokeWidth={1.5}>
          <circle cx="100" cy="30" r="22" />
          <rect x="88" y="50" width="24" height="16" rx="4" />
          <ellipse cx="81" cy="392" rx="15" ry="7" />
          <ellipse cx="119" cy="392" rx="15" ry="7" />
        </g>

        {/* Back (traps + lats combined) */}
        <Region intensity={intensity.back} shapes={<path d="M62,64 L138,64 L146,112 L136,178 L64,178 L54,112 Z" />} />

        {/* Shoulders (rear delts) */}
        <Region intensity={intensity.shoulders} shapes={<>
          <circle cx="53" cy="74" r="18" />
          <circle cx="147" cy="74" r="18" />
        </>} />

        {/* Triceps */}
        <Region intensity={intensity.triceps} shapes={<>
          <rect x="29" y="88" width="22" height="62" rx="11" />
          <rect x="149" y="88" width="22" height="62" rx="11" />
        </>} />

        {/* Forearms (mirrors front state) */}
        <Region intensity={intensity.forearms} shapes={<>
          <rect x="25" y="150" width="20" height="60" rx="10" />
          <rect x="155" y="150" width="20" height="60" rx="10" />
        </>} />

        {/* Glutes */}
        <Region intensity={intensity.glutes} shapes={<rect x="66" y="180" width="68" height="52" rx="18" />} />

        {/* Hamstrings */}
        <Region intensity={intensity.hamstrings} shapes={<>
          <rect x="64" y="234" width="34" height="94" rx="15" />
          <rect x="102" y="234" width="34" height="94" rx="15" />
        </>} />

        {/* Calves */}
        <Region intensity={intensity.calves} shapes={<>
          <rect x="68" y="330" width="26" height="58" rx="12" />
          <rect x="106" y="330" width="26" height="58" rx="12" />
        </>} />
      </svg>
      <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wide">Back</p>
    </div>
  );
}

export const MUSCLE_GROUPS: { key: MuscleKey; label: string }[] = [
  { key: "chest", label: "Chest" },
  { key: "back", label: "Back" },
  { key: "shoulders", label: "Shoulders" },
  { key: "biceps", label: "Biceps" },
  { key: "triceps", label: "Triceps" },
  { key: "forearms", label: "Forearms" },
  { key: "abs", label: "Abs" },
  { key: "quads", label: "Quads" },
  { key: "hamstrings", label: "Hamstrings" },
  { key: "glutes", label: "Glutes" },
  { key: "calves", label: "Calves" },
];
