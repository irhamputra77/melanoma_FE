export const EMAIL_MAX_LENGTH = 254;

export function normalizeEmail(value) {
    return String(value || "").trim().toLowerCase();
}

export function getEmailValidationError(value, options = {}) {
    const { required = true } = options;
    const email = normalizeEmail(value);

    if (!email) {
        return required ? "Email wajib diisi." : "";
    }

    if (email.length > EMAIL_MAX_LENGTH) {
        return "Email maksimal 254 karakter.";
    }

    if (/\s/.test(email)) {
        return "Email tidak boleh mengandung spasi.";
    }

    if (/[<>]/.test(email)) {
        return "Email mengandung karakter tidak valid.";
    }

    const atCount = (email.match(/@/g) || []).length;
    if (atCount !== 1) {
        return "Format email harus memiliki satu simbol @.";
    }

    const [username, domain] = email.split("@");
    if (!username) {
        return "Username email wajib diisi.";
    }

    if (!domain) {
        return "Domain email wajib diisi.";
    }

    if (username.length > 64) {
        return "Username email maksimal 64 karakter.";
    }

    if (username.startsWith(".") || username.endsWith(".") || username.includes("..")) {
        return "Format username email tidak valid.";
    }

    if (!/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+$/i.test(username)) {
        return "Email mengandung karakter tidak valid.";
    }

    if (!domain.includes(".")) {
        return "Domain email harus memiliki top-level domain.";
    }

    const labels = domain.split(".");
    if (labels.some((label) => !label || label.startsWith("-") || label.endsWith("-"))) {
        return "Format domain email tidak valid.";
    }

    if (!labels.every((label) => /^[a-z0-9-]+$/i.test(label))) {
        return "Domain email mengandung karakter tidak valid.";
    }

    const tld = labels[labels.length - 1];
    if (!/^[a-z]{2,63}$/i.test(tld)) {
        return "Top-level domain email tidak valid.";
    }

    return "";
}

export function isValidEmail(value, options) {
    return !getEmailValidationError(value, options);
}
