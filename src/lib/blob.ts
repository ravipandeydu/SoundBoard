import { put } from "@vercel/blob";
import { randomUUID } from "crypto";

export async function uploadBlob(file: Blob) {
  const fileName = `${randomUUID()}.webm`;
  const { url } = await put(fileName, file, {
    access: "public", // anyone with the URL can stream
    contentType: "audio/webm",
  });
  return url; // e.g. https://blob.vercel-storage.com/<id>/<uuid>.webm
}
