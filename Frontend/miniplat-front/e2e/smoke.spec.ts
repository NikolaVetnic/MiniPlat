import { expect, test, type Page } from "@playwright/test";

import { LECTURER } from "../playwright.config";

/**
 * Four paths through the whole stack. They do not exercise logic - that is covered layer
 * by layer by the unit and integration tests - but that the layers are actually joined up:
 * that the bundle being built talks to the API that is running, that a token issued by
 * OpenIddict is accepted on the next call, and that something saved is there after a
 * reload.
 */

/** From initialData.yml. Pedagogija is taught by USRa; Književnost is not running. */
const PEDAGOGIJA = "Pedagogija";
const FIRST_TOPIC = "Prvo predavanje";
const GROUP_OSS_I_WINTER = "OSS • I godina • Zimski semestar";

const signIn = async (page: Page) => {
  await page.goto("/login");

  await page.getByPlaceholder("Korisničko ime (email)").fill(LECTURER.username);
  await page.getByPlaceholder("Lozinka").fill(LECTURER.password);
  await page.getByRole("button", { name: "Prijava" }).click();

  await expect(page.getByText("Ulogovani ste kao")).toBeVisible();
};

const openPedagogija = async (page: Page) => {
  await page.getByRole("heading", { name: GROUP_OSS_I_WINTER }).click();
  await page.getByRole("link", { name: new RegExp(PEDAGOGIJA) }).click();

  await expect(page.getByRole("heading", { level: 1, name: PEDAGOGIJA })).toBeVisible();
};

test("a visitor sees the catalogue", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveURL(/\/home$/);
  await expect(page.getByText("Poštovani studenti")).toBeVisible();

  // The subjects come from the API, which reads them from the database - the whole way down.
  await page.getByRole("heading", { name: GROUP_OSS_I_WINTER }).click();
  await expect(page.getByRole("link", { name: new RegExp(PEDAGOGIJA) })).toBeVisible();

  // Književnost is not running and does not belong in the public catalogue.
  await expect(page.getByRole("link", { name: /Književnost/ })).toHaveCount(0);
});

test("a visitor opens a subject and sees the topics, but no buttons", async ({ page }) => {
  await page.goto("/home");
  await openPedagogija(page);

  await expect(page.getByText(FIRST_TOPIC)).toBeVisible();
  await expect(page.getByRole("button", { name: "Ažuriraj" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Dodaj temu" })).toHaveCount(0);
});

test("a lecturer signs in", async ({ page }) => {
  await signIn(page);

  await expect(page).toHaveURL(new RegExp(`/${LECTURER.username}/home$`));
  await expect(page.getByText("Poštovani profesori")).toBeVisible();

  // The catalogue is now limited to the subjects USRa is responsible for.
  await expect(page.getByRole("heading", { name: GROUP_OSS_I_WINTER })).toBeVisible();
  await expect(page.getByText("Poštovani studenti")).toHaveCount(0);
});

test("a lecturer edits a topic, and the change stays", async ({ page }) => {
  const newTitle = `Prvo predavanje (edited ${Date.now()})`;

  await signIn(page);
  await openPedagogija(page);

  await page.getByRole("button", { name: "Ažuriraj" }).first().click();

  await page.getByRole("textbox").first().fill(newTitle);

  // The page shows the change at once and saves in the background. Without waiting for the
  // response itself, the reload below would abort the request while it was still in
  // flight, and the test would report a product that loses data when it is the test
  // pulling the floor away.
  const saved = page.waitForResponse(
    (response) =>
      response.request().method() === "PUT" &&
      response.url().includes("/api/Subjects/")
  );

  await page.getByRole("button", { name: "Sačuvaj izmene" }).click();

  expect((await saved).status()).toBe(200);

  await expect(page.getByText(newTitle)).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);

  // What counts: that the new title comes back from the database after a fresh load.
  await page.reload();

  await expect(page.getByText(newTitle)).toBeVisible();
  await expect(page.getByText(FIRST_TOPIC, { exact: true })).toHaveCount(0);
});
