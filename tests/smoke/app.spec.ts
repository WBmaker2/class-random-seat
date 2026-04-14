import { expect, test } from "@playwright/test";

const homeTitlePattern = /교실 자리 바꾸기 도우미|Classroom Seat Shuffle Hub/;
const manageTitlePattern = /교사용 관리 페이지|Teacher Admin Page/;
const seatPlansPattern = /자리표|Seat plans/;
const randomPickerPattern = /학생 랜덤 뽑기|Random student picker/;
const timerPattern = /타이머|Timer/;
const classesPattern = /학급|Classes/;
const studentsPattern = /학생|Students/;

test("home page renders its primary sections", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("main")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: homeTitlePattern })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: seatPlansPattern })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: randomPickerPattern })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: timerPattern })).toBeVisible();
});

test("manage page renders its primary sections", async ({ page }) => {
  await page.goto("/manage");

  await expect(page.locator("main")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: manageTitlePattern })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: classesPattern })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: studentsPattern })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: seatPlansPattern })).toBeVisible();
});
