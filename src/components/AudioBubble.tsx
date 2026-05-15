interface AudioBubbleProps {
  durationSec: number;
  transcript?: string;
}

export function AudioBubble({ durationSec, transcript }: AudioBubbleProps) {
  const bars = Array.from({ length: 18 });
  return (
    <div className="ml-auto max-w-[85%] rounded-2xl bg-secondary px-4 py-3 text-secondary-foreground shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-7 items-center gap-[3px]">
          {bars.map((_, i) => (
            <span
              key={i}
              className="w-[3px] rounded-full bg-secondary-foreground/70"
              style={{ height: `${30 + Math.abs(Math.sin(i * 1.3)) * 70}%` }}
            />
          ))}
        </div>
        <span className="text-sm tabular-nums opacity-75">0:{String(durationSec).padStart(2, "0")}</span>
      </div>
      {transcript && (
        <p className="mt-2 text-xs italic text-secondary-foreground/70">"{transcript}"</p>
      )}
    </div>
  );
}