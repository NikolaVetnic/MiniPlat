import { expect, test } from "@playwright/test";

import { LECTURER } from "../playwright.config";

/**
 * Fire stier gjennom hele stakken. De prøver ikke logikk - den er dekket lag for lag av
 * enhets- og integrasjonstestene - men at lagene faktisk er koblet sammen: at pakken som
 * bygges snakker med API-et som kjører, at et token utstedt av OpenIddict blir godtatt på
 * neste kall, og at noe som lagres er der etter en ny lasting.
 */

/** Fra initialData.yml. Pedagogija undervises av USRa; Književnost er ikke aktivt. */
const PEDAGOGIJA = "Pedagogija";
const FØRSTE_TEMA = "Prvo predavanje";
const GRUPPE_OSS_I_ZIMSKI = "OSS • I godina • Zimski semestar";

const loggInn = async (page: import("@playwright/test").Page) => {
  await page.goto("/login");

  await page.getByPlaceholder("Korisničko ime (email)").fill(LECTURER.username);
  await page.getByPlaceholder("Lozinka").fill(LECTURER.password);
  await page.getByRole("button", { name: "Prijava" }).click();

  await expect(page.getByText(`Ulogovani ste kao`)).toBeVisible();
};

const åpnePedagogija = async (page: import("@playwright/test").Page) => {
  await page.getByRole("heading", { name: GRUPPE_OSS_I_ZIMSKI }).click();
  await page.getByRole("link", { name: new RegExp(PEDAGOGIJA) }).click();

  await expect(page.getByRole("heading", { level: 1, name: PEDAGOGIJA })).toBeVisible();
};

test("en besøkende ser katalogen", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveURL(/\/home$/);
  await expect(page.getByText("Poštovani studenti")).toBeVisible();

  // Emnene kommer fra API-et, som leser dem fra databasen - hele veien ned.
  await page.getByRole("heading", { name: GRUPPE_OSS_I_ZIMSKI }).click();
  await expect(page.getByRole("link", { name: new RegExp(PEDAGOGIJA) })).toBeVisible();

  // Književnost er ikke aktivt og hører ikke hjemme i den offentlige katalogen.
  await expect(page.getByRole("link", { name: /Književnost/ })).toHaveCount(0);
});

test("en besøkende åpner et fag og ser temaene, men ingen knapper", async ({ page }) => {
  await page.goto("/home");
  await åpnePedagogija(page);

  await expect(page.getByText(FØRSTE_TEMA)).toBeVisible();
  await expect(page.getByRole("button", { name: "Ažuriraj" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Dodaj temu" })).toHaveCount(0);
});

test("en foreleser logger inn", async ({ page }) => {
  await loggInn(page);

  await expect(page).toHaveURL(new RegExp(`/${LECTURER.username}/home$`));
  await expect(page.getByText("Poštovani profesori")).toBeVisible();

  // Katalogen er nå begrenset til emnene USRa har ansvar for.
  await expect(page.getByRole("heading", { name: GRUPPE_OSS_I_ZIMSKI })).toBeVisible();
  await expect(page.getByText("Poštovani studenti")).toHaveCount(0);
});

test("en foreleser redigerer et tema, og endringen blir stående", async ({ page }) => {
  const nyTittel = `Prvo predavanje (redigert ${Date.now()})`;

  await loggInn(page);
  await åpnePedagogija(page);

  await page.getByRole("button", { name: "Ažuriraj" }).first().click();

  await page.getByRole("textbox").first().fill(nyTittel);

  // Siden viser endringen med én gang og lagrer i bakgrunnen. Uten å vente på selve svaret
  // ville reload lenger nede avbrutt forespørselen mens den var underveis, og testen ville
  // meldt om et produkt som mister data når det er testen som river gulvet vekk.
  const lagret = page.waitForResponse(
    (response) =>
      response.request().method() === "PUT" &&
      response.url().includes("/api/Subjects/")
  );

  await page.getByRole("button", { name: "Sačuvaj izmene" }).click();

  expect((await lagret).status()).toBe(200);

  await expect(page.getByText(nyTittel)).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);

  // Det som teller: at den nye tittelen kommer tilbake fra databasen etter en ny lasting.
  await page.reload();

  await expect(page.getByText(nyTittel)).toBeVisible();
  await expect(page.getByText(FØRSTE_TEMA, { exact: true })).toHaveCount(0);
});
