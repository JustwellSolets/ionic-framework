import AxeBuilder from '@axe-core/playwright';
import { expect } from '@playwright/test';
import type { E2EPage } from '@utils/test/playwright';
import { configs, test } from '@utils/test/playwright';

const testAria = async (page: E2EPage, buttonID: string, expectedAriaLabelledBy: string | null) => {
  const didPresent = await page.spyOnEvent('ionActionSheetDidPresent');
  const button = page.locator(`#${buttonID}`);

  await button.click();
  await didPresent.next();

  const actionSheet = page.locator('ion-action-sheet');

  /**
   * expect().toHaveAttribute() can't check for a null value, so grab and check
   * the value manually instead.
   */
  const ariaLabelledBy = await actionSheet.getAttribute('aria-labelledby');

  expect(ariaLabelledBy).toBe(expectedAriaLabelledBy);
};

const testAriaButton = async (
  page: E2EPage,
  buttonID: string,
  expectedAriaLabelledBy: string,
  expectedAriaLabel: string
) => {
  const didPresent = await page.spyOnEvent('ionActionSheetDidPresent');

  const button = page.locator(`#${buttonID}`);
  await button.click();

  await didPresent.next();

  const actionSheetButton = page.locator('ion-action-sheet .action-sheet-button');

  await expect(actionSheetButton).toHaveAttribute('aria-labelledby', expectedAriaLabelledBy);
  await expect(actionSheetButton).toHaveAttribute('aria-label', expectedAriaLabel);
};

configs({ directions: ['ltr'] }).forEach(({ config, title }) => {
  test.describe(title('action-sheet: a11y'), () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`/src/components/action-sheet/test/a11y`, config);
    });
    test('should not have accessibility violations when header is defined', async ({ page }) => {
      const button = page.locator('#bothHeaders');
      const didPresent = await page.spyOnEvent('ionActionSheetDidPresent');

      await button.click();
      await didPresent.next();

      /**
       * action-sheet overlays the entire screen, so
       * Axe will be unable to verify color contrast
       * on elements under the backdrop.
       */
      const results = await new AxeBuilder({ page }).disableRules('color-contrast').analyze();
      expect(results.violations).toEqual([]);
    });

    test('should have aria-labelledby when header is set', async ({ page }) => {
      await testAria(page, 'bothHeaders', 'action-sheet-1-header');
    });

    test('should not have aria-labelledby when header is not set', async ({ page }) => {
      await testAria(page, 'noHeaders', null);
    });

    test('should allow for manually specifying aria attributes', async ({ page }) => {
      await testAria(page, 'customAria', 'Custom title');
    });

    test('should have aria-labelledby and aria-label added to the button when htmlAttributes is set', async ({
      page,
    }) => {
      await testAriaButton(page, 'ariaLabelButton', 'close-label', 'close button');
    });

    test('should have aria-labelledby and aria-label added to the cancel button when htmlAttributes is set', async ({
      page,
    }) => {
      await testAriaButton(page, 'ariaLabelCancelButton', 'cancel-label', 'cancel button');
    });
  });
});
