import { expect, Page, test } from "@playwright/test";

const homeTitlePattern = /교실 자리 바꾸기 도우미|Classroom Seat Shuffle Hub/;
const manageTitlePattern = /교사용 관리 페이지|Teacher Admin Page/;
const seatPlansPattern = /자리표|Seat plans/;
const randomPickerPattern = /학생 랜덤 뽑기|Random student picker/;
const timerPattern = /타이머|Timer/;
const classesPattern = /학급|Classes/;
const studentsPattern = /학생|Students/;
const englishButtonPattern = /^English$/;

function captureClientErrors(page: Page) {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  return () => {
    expect(pageErrors, "Unexpected page errors").toEqual([]);
    expect(consoleErrors, "Unexpected console errors").toEqual([]);
  };
}

test("home page renders its primary sections", async ({ page }) => {
  const assertNoClientErrors = captureClientErrors(page);

  await page.goto("/");

  await expect(page.locator("main")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: homeTitlePattern })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: seatPlansPattern })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: randomPickerPattern })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: timerPattern })).toBeVisible();

  await page.getByRole("button", { name: englishButtonPattern }).click();
  await expect(page.getByRole("heading", { level: 1, name: /Classroom Seat Shuffle Hub/ })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: /Seat plans/ })).toBeVisible();
  assertNoClientErrors();
});

test("manage page renders its primary sections", async ({ page }) => {
  const assertNoClientErrors = captureClientErrors(page);

  await page.goto("/manage");

  await expect(page.locator("main")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: manageTitlePattern })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: classesPattern })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: studentsPattern })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: seatPlansPattern })).toBeVisible();

  await page.getByRole("button", { name: englishButtonPattern }).click();
  await expect(page.getByRole("heading", { level: 1, name: /Teacher Admin Page/ })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: /Seat plans/ })).toBeVisible();
  assertNoClientErrors();
});
