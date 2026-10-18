// Display helpers for candidate fields. The API values stay unchanged;
// these only decide how they look on screen.

// "Emily Chen" → "EC"
export function getInitials(fullName: string): string {
  return fullName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// "2024-10-12T09:30:00.000Z" → "Oct 12, 2024"; null if the date can't be read
export function formatDate(iso: string): string | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null; // would show "Invalid Date"
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// "2026-10-16T16:15:00.000Z" → "Oct 16, 2026, 4:15 PM"; null if the date can't be read
export function formatDateTime(iso: string): string | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// 1 → "1 year", 6 → "6 years"
export function formatYears(years: number): string {
  return `${years} ${years === 1 ? "year" : "years"}`;
}

// Text worth showing, or null when it's missing or only spaces
export function textOrNull(value: string | null): string | null {
  const text = value?.trim();
  return text ? text : null;
}

// A link that is safe to open: an http(s) URL, or null.
// Blank values, broken URLs, and other schemes (e.g. "javascript:") give null,
// so they show as "Not provided" instead of a dead or unsafe link.
export function webUrlOrNull(value: string | null): string | null {
  const text = textOrNull(value);
  if (!text) return null;
  try {
    const url = new URL(text);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.href
      : null;
  } catch {
    return null; // not a URL at all
  }
}

// "https://www.linkedin.com/in/emilychen/" → "linkedin.com/in/emilychen"
export function displayUrl(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
}

// "https://example.com/files/emily_chen_cv.pdf" → "emily_chen_cv.pdf"
export function fileNameFromUrl(url: string): string {
  const last = url.split("?")[0].split("/").filter(Boolean).pop();
  return last ? decodeURIComponent(last) : url;
}
