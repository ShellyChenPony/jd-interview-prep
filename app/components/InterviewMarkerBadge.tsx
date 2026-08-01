'use client';

type Props = {
  id: number;
  accent?: string;
  onClick: () => void;
};

/** Circled number badge — hidden from print/PDF capture. */
export default function InterviewMarkerBadge({ id, accent = '#1d4ed8', onClick }: Props) {
  return (
    <button
      type="button"
      data-html2canvas-ignore="true"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="resume-interview-marker print:hidden absolute -right-1 -top-1 z-10 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-sm hover:scale-110 transition"
      style={{ background: accent }}
      aria-label={`Open interview questions ${id}`}
      title={`Interview Q${id}`}
    >
      {id}
    </button>
  );
}
