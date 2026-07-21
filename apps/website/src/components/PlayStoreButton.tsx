import { PLAY_STORE_URL } from "../lib/constants";

export function PlayStoreButton({
  label,
  className = ""
}: {
  label: string;
  className?: string;
}) {
  return (
    <a
      href={PLAY_STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${className}`}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-5 w-5 shrink-0 fill-current"
      >
        <path d="M3.6 2.2c-.4.2-.6.6-.6 1.1v17.4c0 .5.2.9.6 1.1l10-9.8-10-9.8Zm11 9.9 2.7 2.7 4.8-2.8c.6-.3.6-1.1 0-1.5l-4.8-2.8-2.7 2.7v1.7Zm-1.4-1.4-9-8.9 11.7 6.9-2.7 2.7v-.7Zm0 2.8 2.7 2.7-11.7 6.9 9-8.9v-.7Z" />
      </svg>
      {label}
    </a>
  );
}
