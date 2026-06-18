import { expect, test } from "@playwright/test";
import {
  buyerNotifiesSellerViaMessage,
  createSellerListingForNotify,
  expectMessageNotificationInDropdown,
  expectSellerUnreadNotifications,
  loginSellerAndOpenNotifications,
  markFirstDropdownNotificationRead,
  openNotificationsDropdown,
} from "./helpers/notifications";

test.describe("notifications", () => {
  test("seller sees message notification in bell dropdown and marks read", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    const stamp = Date.now();
    const listingId = await createSellerListingForNotify(page, stamp);
    await buyerNotifiesSellerViaMessage(page, listingId, stamp);
    await loginSellerAndOpenNotifications(page);

    await expectSellerUnreadNotifications(page);

    await openNotificationsDropdown(page);
    await expectMessageNotificationInDropdown(page);

    const markReadButtons = page.getByTestId("notification-mark-read");
    const unreadInDropdown = await markReadButtons.count();
    expect(unreadInDropdown).toBeGreaterThan(0);

    await markFirstDropdownNotificationRead(page);
    await expect(markReadButtons).toHaveCount(unreadInDropdown - 1);
  });

  test("notifications page lists message and mark read works", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    const stamp = Date.now();
    const listingId = await createSellerListingForNotify(page, stamp);
    await buyerNotifiesSellerViaMessage(page, listingId, stamp);
    await loginSellerAndOpenNotifications(page);

    await page.goto("/notifications");
    await expect(
      page.getByRole("heading", { name: "Notificaciones", exact: true }),
    ).toBeVisible({ timeout: 15_000 });

    const item = page
      .getByTestId("notification-item")
      .filter({ hasText: "Nuevo mensaje recibido" })
      .first();
    await expect(item).toBeVisible({ timeout: 15_000 });

    const unreadBefore = await page
      .getByTestId("notifications-unread-count")
      .innerText()
      .catch(() => null);

    await item.getByTestId("notification-mark-read").click();
    await expect(item.getByTestId("notification-mark-read")).toHaveCount(0);

    if (unreadBefore === "1") {
      await expect(page.getByTestId("notifications-unread-count")).toHaveCount(0);
    }
  });
});
