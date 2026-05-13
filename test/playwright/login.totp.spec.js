const { createHmac } = require("node:crypto");
const { expect, test } = require("@playwright/test");

function base32Decode(encoded) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const sanitized = encoded.replace(/=+$/, "").toUpperCase().replace(/\s/g, "");
  const output = [];
  let bits = 0;
  let value = 0;

  for (let index = 0; index < sanitized.length; index += 1) {
    const alphabetIndex = alphabet.indexOf(sanitized[index]);

    if (alphabetIndex === -1) {
      continue;
    }

    value = (value << 5) | alphabetIndex;
    bits += 5;

    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  return Buffer.from(output);
}

function counterToBytes(counter) {
  const bytes = Buffer.alloc(8);
  const high = Math.floor(counter / 0x100000000);

  bytes.writeUInt32BE(high, 0);
  bytes.writeUInt32BE(counter >>> 0, 4);

  return bytes;
}

function generateTOTP(base32Secret, timeStep = 30, digits = 6) {
  const counter = Math.floor(Date.now() / 1000 / timeStep);
  const keyBytes = base32Decode(base32Secret);
  const hmac = createHmac("sha1", keyBytes).update(counterToBytes(counter)).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const truncated =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  return String(truncated % 10 ** digits).padStart(digits, "0");
}

test.describe("authenticated login flow", () => {
  test("logs in with TOTP and lands on the account page", async ({ page }) => {
    const missingVariables = ["IDP_URL", "USERNAME", "PASSWORD", "TOTP_SECRET"].filter(
      (name) => !process.env[name]
    );

    test.skip(
      missingVariables.length > 0,
      `Missing required environment variables: ${missingVariables.join(", ")}`
    );

    await page.goto(process.env.IDP_URL);

    // Login
    await expect(page.locator("#username")).toBeVisible();
    await page.locator("#username").fill(process.env.USERNAME);
    await expect(page.locator("#password")).toBeVisible();
    await page.locator("#password").fill(process.env.PASSWORD);
    await page.locator("form#login button[type=submit]").click();

    // TOTP
    await expect(page.locator("#code")).toBeVisible();
    await page.locator("#code").fill(generateTOTP(process.env.TOTP_SECRET));
    await page.locator("form#totp button[type=submit]").click();

    // Account page
    await expect(page).toHaveURL(/\/account$/);
    await expect(page.locator("#personal-details-title")).toBeVisible();
  });
});
