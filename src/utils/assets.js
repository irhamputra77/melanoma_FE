export function toAssetUrl(path) {
    if (!path) return "";
    if (/^https?:\/\//i.test(path)) return path;

    const baseUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "";
    const origin = baseUrl.replace(/\/api\/?.*$/i, "");

    return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}
