export function toAssetUrl(path) {
    if (!path) return "";
    if (/^(data:|blob:)/i.test(path)) return path;

    const origin = getApiAssetOrigin();

    if (/^https?:\/\//i.test(path)) {
        try {
            const url = new URL(path);
            if (origin && isLocalAssetHost(url.hostname)) {
                return `${origin}${url.pathname}${url.search}${url.hash}`;
            }
        } catch {
            return path;
        }

        return path;
    }

    if (!origin) return `${path.startsWith("/") ? path : `/${path}`}`;

    return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}

export function getAssetUrlCandidates(path) {
    if (/^(data:|blob:)/i.test(path || "")) return [path];

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

function getApiAssetOrigin() {
    const baseUrl = import.meta.env.VITE_ASSET_BASE_URL || import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "";
    return baseUrl.replace(/\/api\/?.*$/i, "").replace(/\/$/, "");
}

function isLocalAssetHost(hostname) {
    return ["localhost", "127.0.0.1", "0.0.0.0", "::1"].includes(hostname);
}
