export async function prepareGreenhouseApplication(page, application, profile) {
  const jobUrl = application.formPayload?.jobUrl;
  if (!jobUrl) {
    throw new Error("Missing job URL");
  }

  await page.goto(jobUrl, { waitUntil: "domcontentloaded", timeout: 60000 });

  const firstName = profile.personal?.firstName || "";
  const lastName = profile.personal?.lastName || "";
  const email = profile.email || "";

  const selectors = [
    'input[name="first_name"]',
    'input[id*="first_name"]',
    'input[name="firstName"]',
  ];

  for (const sel of selectors) {
    const el = page.locator(sel).first();
    if (await el.count()) {
      await el.fill(firstName);
      break;
    }
  }

  for (const sel of ['input[name="last_name"]', 'input[name="lastName"]']) {
    const el = page.locator(sel).first();
    if (await el.count()) {
      await el.fill(lastName);
      break;
    }
  }

  for (const sel of ['input[name="email"]', 'input[type="email"]']) {
    const el = page.locator(sel).first();
    if (await el.count()) {
      await el.fill(email);
      break;
    }
  }

  const captcha = page.locator('iframe[src*="captcha"], [class*="captcha"]');
  if (await captcha.count()) {
    return { needs_human: true, reason: "CAPTCHA detected" };
  }

  return { prepared: true };
}

export async function submitGreenhouseApplication(page) {
  const submit = page.locator('button[type="submit"], input[type="submit"]').first();
  if (!(await submit.count())) {
    return { needs_human: true, reason: "Submit button not found — manual review required" };
  }
  return { readyToClick: true, locator: "submit" };
}
