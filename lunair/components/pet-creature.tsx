import type { PetMood } from "@/lib/pet";

const INK = "#161b33"; // Gesicht immer dunkel – der Körper ist in beiden Themes gelb

function Eyes({ mood }: { mood: PetMood }) {
  const stroke = { stroke: INK, strokeWidth: 3.5, strokeLinecap: "round" as const, fill: "none" };
  switch (mood) {
    case "happy":
      return (
        <>
          <path d="M41 62q6-7 12 0" {...stroke} />
          <path d="M67 62q6-7 12 0" {...stroke} />
        </>
      );
    case "lonely":
      return (
        <>
          {/* Blick nach unten, besorgte Brauen */}
          <path d="M41 55q6-4 11-1" {...stroke} strokeWidth={2.5} />
          <path d="M79 55q-6-4-11-1" {...stroke} strokeWidth={2.5} />
          <circle cx="46" cy="65" r="3.6" fill={INK} />
          <circle cx="74" cy="65" r="3.6" fill={INK} />
        </>
      );
    case "sad":
      return (
        <>
          <path d="M40 58l11-4" {...stroke} strokeWidth={3} />
          <path d="M80 58l-11-4" {...stroke} strokeWidth={3} />
          <circle cx="47" cy="64" r="3.6" fill={INK} />
          <circle cx="73" cy="64" r="3.6" fill={INK} />
          <path d="M76 70q-3 6 0 9q3-3 0-9Z" fill="#7fb6e8" />
        </>
      );
    default:
      return (
        <>
          <circle cx="47" cy="62" r="4" fill={INK} />
          <circle cx="73" cy="62" r="4" fill={INK} />
          <circle cx="48.4" cy="60.6" r="1.3" fill="#fff" />
          <circle cx="74.4" cy="60.6" r="1.3" fill="#fff" />
        </>
      );
  }
}

function Mouth({ mood }: { mood: PetMood }) {
  const stroke = { stroke: INK, strokeWidth: 3.5, strokeLinecap: "round" as const, fill: "none" };
  switch (mood) {
    case "happy":
      return <path d="M51 75q9 9 18 0" {...stroke} />;
    case "hungry":
      return <ellipse cx="60" cy="78" rx="5" ry="6.5" fill={INK} />;
    case "lonely":
      return <path d="M53 80q3.5-3 7 0t7 0" {...stroke} strokeWidth={3} />;
    case "sad":
      return <path d="M52 82q8-7 16 0" {...stroke} />;
    default:
      return <path d="M54 76q6 5 12 0" {...stroke} />;
  }
}

/** Kleines Mondwesen. Gesicht und Farbe hängen an der Stimmung. Rein dekorativ. */
export function PetCreature({ mood, className = "" }: { mood: PetMood; className?: string }) {
  const dim = mood === "sad";
  const cheeks = mood === "happy" || mood === "okay";

  return (
    <svg viewBox="0 0 120 120" aria-hidden="true" className={className}>
      <ellipse cx="60" cy="110" rx="30" ry="4.5" className="fill-line" />
      <g style={{ filter: dim ? "saturate(0.45)" : undefined }}>
        {/* Sichel als Haarlocke, wie im Logo */}
        <path d="M63 14a10 10 0 1 0 8 14a8 8 0 0 1-8-14Z" className="fill-moon" />
        <circle cx="60" cy="66" r="40" className="fill-moon" />
        <circle cx="35" cy="48" r="5" fill={INK} opacity="0.07" />
        <circle cx="86" cy="82" r="7" fill={INK} opacity="0.07" />
        <circle cx="80" cy="42" r="3.5" fill={INK} opacity="0.07" />
        {cheeks && (
          <>
            <ellipse cx="38" cy="73" rx="6" ry="4" fill="#f08a8a" opacity="0.45" />
            <ellipse cx="82" cy="73" rx="6" ry="4" fill="#f08a8a" opacity="0.45" />
          </>
        )}
        <Eyes mood={mood} />
        <Mouth mood={mood} />
      </g>
    </svg>
  );
}
