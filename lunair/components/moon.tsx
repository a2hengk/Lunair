/** Sichel als Marken-Glyphe. Rein dekorativ. */
export function Moon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        d="M15.5 3.2a9 9 0 1 0 5.3 13.6A7.5 7.5 0 0 1 15.5 3.2Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function Wordmark({ size = "md" }: { size?: "md" | "lg" }) {
  const text = size === "lg" ? "text-5xl" : "text-2xl";
  const moon = size === "lg" ? "size-7" : "size-4";
  return (
    <span className={`inline-flex items-start gap-1 font-display ${text} leading-none tracking-tight`}>
      lunair
      <Moon className={`${moon} -mt-1 text-moon`} />
    </span>
  );
}
