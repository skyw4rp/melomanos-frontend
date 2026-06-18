import { expect, type Page } from "@playwright/test";
import { loginAsBuyer, loginAsSeller, logoutViaStorage } from "./auth";
import { createListingViaUi } from "./listing";

const ALLOWED_MESSAGE =
  "¿Tiene insert y la funda está VG+ real? Pregunta desde E2E.";

export async function sendListingMessage(
  page: Page,
  listingId: number,
  messageText: string,
): Promise<void> {
  await page.goto(`/listings/${listingId}`);
  await page.getByTestId("listing-message-toggle").click();
  await expect(page.getByTestId("message-form")).toBeVisible();
  await page.getByTestId("message-form-textarea").fill(messageText);
  await page.getByTestId("message-form-submit").click();
  await expect(page.getByTestId("message-form-success")).toContainText(
    /Mensaje enviado/i,
    { timeout: 15_000 },
  );
}

export async function createSellerListingForNotify(
  page: Page,
  stamp: number,
): Promise<number> {
  await loginAsSeller(page);
  return createListingViaUi(page, {
    title: `E2E Notify LP ${stamp}`,
    listingType: "new",
    recordCondition: "NM",
    coverCondition: "NM",
  });
}

export async function buyerNotifiesSellerViaMessage(
  page: Page,
  listingId: number,
  _stamp: number,
): Promise<void> {
  await logoutViaStorage(page);
  await loginAsBuyer(page);
  await sendListingMessage(page, listingId, ALLOWED_MESSAGE);
}

export async function loginSellerAndOpenNotifications(
  page: Page,
): Promise<void> {
  await logoutViaStorage(page);
  await loginAsSeller(page);
}

export async function expectSellerUnreadNotifications(
  page: Page,
): Promise<void> {
  await expect(page.getByTestId("notifications-unread-count")).toBeVisible({
    timeout: 20_000,
  });
}

export async function openNotificationsDropdown(page: Page): Promise<void> {
  await page.getByTestId("notifications-bell").click();
  await expect(page.getByTestId("notifications-dropdown")).toBeVisible();
}

export async function expectMessageNotificationInDropdown(
  page: Page,
): Promise<void> {
  await expect(
    page
      .getByTestId("notification-item")
      .filter({ hasText: "Nuevo mensaje recibido" })
      .first(),
  ).toBeVisible();
}

export async function markFirstDropdownNotificationRead(
  page: Page,
): Promise<void> {
  await page.getByTestId("notification-mark-read").first().click();
}
