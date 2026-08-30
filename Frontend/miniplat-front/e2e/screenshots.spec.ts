import { expect, test, type Page } from "@playwright/test";

import { LECTURER } from "../playwright.config";

/**
 * Produces the screenshots the README shows. Not a test of anything - it asserts only
 * enough to be sure it is photographing a loaded page rather than a spinner - so it is
 * kept out of the smoke run by testIgnore in playwright.config.ts and driven by
 * `npm run screenshots` instead.
 *
 * The stack it shoots is the same one the smoke paths use: the built bundle, the API and
 * a throwaway Postgres, all started by the run. Seed content is Serbian because
 * initialData.yml is; the interface is switched to English so the chrome reads as the
 * README does.
 */

const OUT = "../../docs/screenshots";

/** From initialData.yml. USRa teaches Pedagogija. */
const PEDAGOGIJA = "Pedagogija";

/** `${level}-${semester}` keys, matching Sidebar's grouping. Opening them up front avoids
 * photographing a tree the reader would have to imagine expanded. */
const SIDEBAR_GROUPS = JSON.stringify({
  "1-1": true,
  "1-2": true,
  "1-3": true,
  "2-1": true,
});

test.use({ viewport: { width: 1440, height: 900 } });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(
    ([groups]) => {
      localStorage.setItem("language", "en");
      localStorage.setItem("sidebarExpandedGroups", groups);
    },
    [SIDEBAR_GROUPS]
  );
});

const openPedagogija = async (page: Page) => {
  await page.getByRole("link", { name: new RegExp(PEDAGOGIJA) }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: PEDAGOGIJA })
  ).toBeVisible();

  // The heading renders before the card behind it has its data, and a figure of a spinner
  // is not a figure of the page.
  await expect(page.getByText("Subject code:")).toBeVisible();
};

const signIn = async (page: Page) => {
  await page.goto("/login");

  await page.getByPlaceholder("Username (email)").fill(LECTURER.username);
  await page.getByPlaceholder("Password").fill(LECTURER.password);
  await page.getByRole("button", { name: "Log in" }).click();

  await expect(page.getByText("You are logged in as")).toBeVisible();
};

test("the catalogue a visitor lands on", async ({ page }) => {
  await page.goto("/home");

  await expect(page.getByText("Dear students")).toBeVisible();
  await expect(page.getByRole("link", { name: new RegExp(PEDAGOGIJA) })).toBeVisible();

  await page.screenshot({ path: `${OUT}/home-visitor.png` });
});

test("a subject as a visitor sees it", async ({ page }) => {
  await page.goto("/home");
  await openPedagogija(page);

  await page.screenshot({ path: `${OUT}/subject-visitor.png` });
});

test("the sign-in page", async ({ page }) => {
  await page.goto("/login");

  await expect(page.getByPlaceholder("Username (email)")).toBeVisible();

  // The form sits at the top of an otherwise empty page; the full viewport would be mostly
  // background.
  await page.screenshot({
    path: `${OUT}/login.png`,
    clip: { x: 0, y: 0, width: 1440, height: 500 },
  });
});

test("a subject as its lecturer sees it", async ({ page }) => {
  await signIn(page);
  await openPedagogija(page);

  // The buttons a visitor does not get are the point of this one.
  await expect(page.getByRole("button", { name: "Add topic" })).toBeVisible();

  await page.screenshot({ path: `${OUT}/subject-lecturer.png` });
});
