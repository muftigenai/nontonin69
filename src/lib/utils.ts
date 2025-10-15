import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getYouTubeVideoId(url: string | null | undefined): string | null {
  if (!url) return null;
  const regex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/ ]{11})/i;
  const match = url.match(regex);
  return match ? match[1] : null;
}

export function getGoogleDriveFileId(url: string | null | undefined): string | null {
  if (!url) return null;
  // Regex untuk mendeteksi tautan berbagi atau tautan file ID
  const regex = /(?:id=|file\/d\/|drive\.google\.com\/open\?id=)([^"&?/ ]+)/i;
  const match = url.match(regex);
  return match ? match[1] : null;
}