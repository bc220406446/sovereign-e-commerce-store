/** Creates a stable, readable SKU when an admin leaves SKU blank. */
export function generateSku(name: string, id?: string): string {
  const initials = name.trim().split(/\s+/).map((word) => word[0]).join("")
    .replace(/[^a-z0-9]/gi, "").toUpperCase().slice(0, 4).padEnd(3, "X");
  const raw = id || `${name}-${Date.now()}`;
  let hash = 0;
  for (let index = 0; index < raw.length; index += 1) hash = (hash * 31 + raw.charCodeAt(index)) >>> 0;
  const suffix = hash.toString(36).slice(-4).toUpperCase();
  return `SV-${initials}-${suffix}`;
}
