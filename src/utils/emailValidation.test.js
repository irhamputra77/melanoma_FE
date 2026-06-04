import { describe, expect, it } from "vitest";
import { getEmailValidationError, isValidEmail, normalizeEmail } from "./emailValidation";

describe("email validation", () => {
    it.each([
        "namawebsite.com",
        "nama@",
        "nama@website",
        "@website.com",
        "nama@@website.com",
        "nama@sub@website.com",
        "nama @website.com",
        "",
        "' OR '1'='1",
        "<script>alert('hack')</script>@website.com",
    ])("rejects invalid email: %s", (email) => {
        expect(isValidEmail(email)).toBe(false);
        expect(getEmailValidationError(email)).not.toBe("");
    });

    it.each([
        "nama.depan@website.com",
        "nama+testing@website.com",
        " nama@website.com ",
        "Nama.User@Website.com",
    ])("accepts valid email: %s", (email) => {
        expect(isValidEmail(email)).toBe(true);
    });

    it("rejects email longer than 254 characters", () => {
        const longUsername = "a".repeat(245);
        expect(isValidEmail(`${longUsername}@website.com`)).toBe(false);
    });

    it("normalizes email with trim and lowercase", () => {
        expect(normalizeEmail(" Nama.User@Website.com ")).toBe("nama.user@website.com");
    });
});
