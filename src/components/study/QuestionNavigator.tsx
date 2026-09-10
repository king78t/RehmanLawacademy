import type { OptionKey } from "@/lib/study-types";

export function QuestionNavigator({
  total,
  current,
  answered,
  onSelect,
  compact = false,
}: {
  total: number;
  current: number;
  answered: Record<string, OptionKey>;
  onSelect: (index: number) => void;
  compact?: boolean;
}) {
  return (
    <div className={`flex flex-wrap gap-2 ${compact ? "max-h-48 overflow-y-auto pr-1" : ""}`} role="group" aria-label="Question navigation">
      {Array.from({ length: total }, (_, index) => (
        <button
          type="button"
          key={index}
          className={`question-nav-dot ${current === index ? "current" : ""} ${answered[String(index)] ? "answered" : ""}`}
          aria-label={`Go to question ${index + 1}${answered[String(index)] ? ", answered" : ", not answered"}`}
          aria-current={current === index ? "step" : undefined}
          onClick={() => onSelect(index)}
        >
          {index + 1}
        </button>
      ))}
    </div>
  );
}
