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

// "2024-10-12T09:30:00.000Z" → "Oct 12, 2024"
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// "2026-10-16T16:15:00.000Z" → "Oct 16, 2026, 4:15 PM"
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
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

// "https://www.linkedin.com/in/emilychen/" → "linkedin.com/in/emilychen"
export function displayUrl(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
}

// "https://example.com/files/emily_chen_cv.pdf" → "emily_chen_cv.pdf"
export function fileNameFromUrl(url: string): string {
  const last = url.split("?")[0].split("/").filter(Boolean).pop();
  return last ? decodeURIComponent(last) : url;
}
