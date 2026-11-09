import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import CryptoJS from "crypto-js";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function canonicalJsonHash(obj) {
  const str = JSON.stringify(obj, Object.keys(obj).sort());
  return CryptoJS.SHA256(str).toString(CryptoJS.enc.Hex);
}

export function paginate(query, { page = 1, limit = 20 }) {
  const skip = Math.max(0, (page - 1) * limit);
  return query.skip(skip).limit(Math.min(limit, 100));
}

export function sanitizeHtmlBasic(html) {
  if (!html || typeof html !== "string") return "";
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/on\w+="[^"]*"/gi, "");
}
