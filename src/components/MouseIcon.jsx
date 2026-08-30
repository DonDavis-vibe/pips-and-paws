// Kleines Maus-Icon im Stil der lucide-Icons (Strich, currentColor).
export default function MouseIcon({ size = 18, className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="7.5" cy="7.5" r="3.3" />
      <circle cx="16.5" cy="7.5" r="3.3" />
      <path d="M12 5.4c-4.1 0-7 3.3-7 8.1 0 3.4 3 5.9 7 5.9s7-2.5 7-5.9c0-4.8-2.9-8.1-7-8.1Z" />
      <path d="M9.7 13h.01M14.3 13h.01" />
      <path d="M12 16.4c-.8 0-1.4.5-1.4 1.2M12 16.4c.8 0 1.4.5 1.4 1.2" />
      <path d="M5.2 14.6c-1.6.2-3 .9-3.9 1.9M18.8 14.6c1.6.2 3 .9 3.9 1.9" opacity="0.6" strokeWidth="1.6" />
    </svg>
  );
}
