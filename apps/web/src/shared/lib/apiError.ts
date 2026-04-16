import { isAxiosError } from "axios";

function detailToString(detail: unknown): string | null {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    const parts = detail.map((item) => {
      if (item && typeof item === "object" && "msg" in item) {
        return String((item as { msg: unknown }).msg);
      }
      return String(item);
    });
    return parts.join("; ") || null;
  }
  if (detail && typeof detail === "object" && "msg" in detail) {
    const msg = (detail as { msg: unknown }).msg;
    if (typeof msg === "string") return msg;
  }
  return null;
}

/** Parses FastAPI `detail` (string, validation array, or object with `msg`) and Axios messages. */
export function extractApiErrorMessage(error: unknown, fallback: string): string {
  if (!isAxiosError(error)) return fallback;
  const data = error.response?.data;
  if (data && typeof data === "object" && "detail" in data) {
    const parsed = detailToString((data as { detail: unknown }).detail);
    if (parsed) return parsed;
  }
  if (error.message) return error.message;
  return fallback;
}
