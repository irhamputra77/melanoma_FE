export function toAssetUrl(path) {
    if (!path) return "";
    if (/^https?:\/\//i.test(path)) return path;

    const baseUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "";
    const origin = baseUrl.replace(/\/api\/?.*$/i, "");

    return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}

export function getAssetUrlCandidates(path) {
    const primaryUrl = toAssetUrl(path);
    const candidates = [primaryUrl];

    if (!primaryUrl) return [];

    try {
        const url = new URL(primaryUrl, window.location.origin);
        const withoutApiPrefix = url.pathname.replace(/^\/api(?=\/uploads\/)/i, "");
        const withApiPrefix = url.pathname.startsWith("/uploads/")
            ? `/api${url.pathname}`
            : url.pathname;

        candidates.push(`${url.origin}${withoutApiPrefix}${url.search}`);
        candidates.push(`${url.origin}${withApiPrefix}${url.search}`);
    } catch {
        const normalizedPath = String(path).replace(/\\/g, "/");
        candidates.push(toAssetUrl(normalizedPath.replace(/^\/api(?=\/uploads\/)/i, "")));
        candidates.push(toAssetUrl(normalizedPath.startsWith("/uploads/") ? `/api${normalizedPath}` : normalizedPath));
    }

    return [...new Set(candidates.filter(Boolean))];
}
