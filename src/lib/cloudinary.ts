export async function uploadToCloudinary(base64: string): Promise<string> {
  const res = await fetch("/api/cloudnary", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file: base64 }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Upload failed");
  return data.url;
}
