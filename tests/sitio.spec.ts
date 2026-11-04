import { test, expect } from "@playwright/test";

test("la portada muestra el titular y enlaza al caso de estudio", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Ingeniera de Sistemas");
  await page
    .getByRole("link", { name: /Evalúa/ })
    .first()
    .click();
  await expect(page).toHaveURL(/\/casos\/evalua\/$/);
  await expect(page.locator(".chapter")).toHaveCount(8);
});

test("el modo oscuro se activa con el interruptor y se recuerda", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).not.toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "Modo oscuro" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("el globo usa la ubicación de prueba y calcula la distancia", async ({ page }) => {
  await page.goto("/?lugar=-23.55,-46.63");
  await page.locator("#sobre-mi").scrollIntoViewIfNeeded();
  await expect(page.locator(".globe-caption")).toContainText("en modo de prueba", { timeout: 15_000 });
});

test("el caso de estudio no produce errores en consola", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto("/casos/evalua/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Evalúa");
  expect(errors).toEqual([]);
});

test("una ruta inexistente muestra la página 404", async ({ page }) => {
  const res = await page.goto("/no-existe/");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("no existe");
});

for (const width of [360, 390]) {
  test(`sin desbordamiento horizontal en móvil (${width}px)`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    for (const url of ["/", "/casos/evalua/"]) {
      await page.goto(url);
      await page.waitForLoadState("networkidle");
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `${url} a ${width}px`).toBeLessThanOrEqual(0);
    }
  });
}
