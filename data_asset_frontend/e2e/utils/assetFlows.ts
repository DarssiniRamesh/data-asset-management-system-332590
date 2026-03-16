import { expect, type Page } from "@playwright/test";

/**
 * Centralized, reusable UI flows for Asset Configuration.
 *
 * These helpers are deliberately UI-centric (Page operations + assertions) so spec files stay concise and stable.
 */

// PUBLIC_INTERFACE
export async function gotoAssetsList(page: Page): Promise<void> {
  /** Navigate to the Assets list page and assert it is loaded. */
  await page.goto("/app/assets");
  await expect(page.getByRole("heading", { name: /assets/i })).toBeVisible();
}

// PUBLIC_INTERFACE
export async function gotoAssetDetails(page: Page, assetId: string): Promise<void> {
  /** Navigate to a specific Asset Details page and assert it is loaded. */
  await page.goto(`/app/assets/${encodeURIComponent(assetId)}`);
  // The page uses a heading with the asset name; we just assert that *some* heading exists.
  await expect(page.getByRole("heading").first()).toBeVisible();
}

// PUBLIC_INTERFACE
export async function gotoCopyAssetPage(page: Page, assetId: string): Promise<void> {
  /** Navigate to the copy asset page and assert the “New Asset Name” field is present. */
  await page.goto(`/app/assets/${encodeURIComponent(assetId)}/copy`);
  await expect(page.getByLabel(/new asset name/i)).toBeVisible();
}

// PUBLIC_INTERFACE
export async function startCopyAndOpenConfirmation(page: Page, newAssetName: string): Promise<void> {
  /**
   * Fill in the new asset name and click Continue, asserting the BRD “Confirmation!” modal appears.
   *
   * REQ: FR-03 - Confirmation titled "Confirmation!" is shown prior to copy save.
   */
  await page.getByLabel(/new asset name/i).fill(newAssetName);
  await page.getByRole("button", { name: /continue/i }).click();
  await expect(page.getByRole("heading", { name: "Confirmation!" })).toBeVisible({ timeout: 20_000 });
}

// PUBLIC_INTERFACE
export async function assertCopyConfirmationShowsFields(page: Page, fields: { assetName: string; permitEuId: string }): Promise<void> {
  /**
   * Assert confirmation dialog shows visibility of key values.
   *
   * REQ: FR-03 - Confirmation must show Asset Name, Permit EU ID, Status Date.
   *
   * Note: “Status Date” label/value may vary by environment; we assert the label exists.
   * We assert concrete values for Asset Name / Permit EU ID.
   */
  await expect(page.getByText(new RegExp(fields.assetName, "i"))).toBeVisible();
  await expect(page.getByText(new RegExp(fields.permitEuId, "i"))).toBeVisible();
  await expect(page.getByText(/status date/i)).toBeVisible();
}

// PUBLIC_INTERFACE
export async function confirmCopy(page: Page): Promise<void> {
  /**
   * Click the confirm action in the copy confirmation.
   *
   * REQ: FR-03 - Confirmation actions include Save (proceed save + replication).
   */
  await page.getByRole("button", { name: /confirm & copy/i }).click();
}

// PUBLIC_INTERFACE
export async function cancelCopyAndReturnToEdit(page: Page): Promise<void> {
  /**
   * Click the edit action in the copy confirmation and assert we return to the editable copy form.
   *
   * REQ: FR-03 - Confirmation actions include Edit (return, no save).
   */
  await page.getByRole("button", { name: /^edit$/i }).click();
  await expect(page.getByLabel(/new asset name/i)).toBeVisible();
}
