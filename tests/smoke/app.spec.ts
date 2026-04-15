import { expect, Page, test } from "@playwright/test";

const homeTitlePattern = /교실 자리 바꾸기 도우미|Classroom Seat Shuffle Hub/;
const manageTitlePattern = /교사용 관리 페이지|Teacher Admin Page/;
const seatPlansPattern = /자리표|Seat plans/;
const randomPickerPattern = /학생 랜덤 뽑기|Random student picker/;
const timerPattern = /타이머|Timer/;
const classesPattern = /학급|Classes/;
const studentsPattern = /학생|Students/;
const englishButtonPattern = /^English$/;
const addClassButtonPattern = /^학급 등록$|^Add class$/;
const saveButtonPattern = /^저장$|^Save$/;
const addStudentButtonPattern = /^학생 등록$|^Add student$/;
const createSeatPlanButtonPattern = /^자리표 만들기$|^Create seat plan$/;
const deleteButtonPattern = /^삭제$|^Delete$/;
const cancelButtonPattern = /^취소$|^Cancel$/;
const seatPlanPlaceholderPattern = /예: 4월 자리|Example: April seats/;

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

  await page.getByRole("button", { name: addClassButtonPattern }).click();
  const classDialog = page.locator('[role="dialog"]');
  await expect(classDialog).toBeVisible();
  await page.locator("#class-name-manage").fill("Class A");
  await classDialog.getByRole("button", { name: saveButtonPattern }).click();

  await page.locator("#student-name-manage").fill("Kim");
  await page.getByRole("button", { name: addStudentButtonPattern }).click();
  await expect(page.getByText("Kim")).toBeVisible();

  await page.getByPlaceholder(seatPlanPlaceholderPattern).fill("April plan");
  await page.getByRole("button", { name: createSeatPlanButtonPattern }).click();

  await page.getByRole("button", { name: /Kim/ }).first().click();
  await expect(page.getByTestId("seat-selection-announcement")).toContainText(/Selected|선택/);

  const deleteStudentButton = page.getByRole("button", { name: deleteButtonPattern }).first();
  await deleteStudentButton.click();

  const confirmDialog = page.locator('[role="dialog"]');
  const cancelButton = confirmDialog.getByRole("button", { name: cancelButtonPattern });
  const confirmDeleteButton = confirmDialog.getByRole("button", { name: deleteButtonPattern });

  await expect(confirmDialog).toBeVisible();
  await expect(cancelButton).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(confirmDeleteButton).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(cancelButton).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(confirmDialog).toHaveCount(0);
  await expect(deleteStudentButton).toBeFocused();

  await deleteStudentButton.click();
  await expect(confirmDialog).toBeVisible();
  await confirmDeleteButton.click();
  await expect(page.getByRole("button", { name: deleteButtonPattern })).toHaveCount(0);
  await expect(page.locator("#student-name-manage")).toBeFocused();
  assertNoClientErrors();
});
