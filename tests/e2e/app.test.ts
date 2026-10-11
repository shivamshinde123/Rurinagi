import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { _electron as electron, ElectronApplication, Page } from 'playwright';

const root = process.cwd();
const electronPath = join(root, 'node_modules', 'electron', 'dist', 'electron.exe');
const mainPath = join(root, '.vite', 'build', 'main.cjs');

test('packaged Electron app completes every V2 workflow', { timeout: 180_000 }, async () => {
  const profile = mkdtempSync(join(tmpdir(), 'rurinagi-e2e-'));
  const exported = join(profile, 'rurinagi-export.json');
  const backup = join(profile, 'rurinagi-backup.sqlite');
  let app: ElectronApplication | undefined;
  const errors: string[] = [];

  try {
    ({ app } = await launch(profile, errors));
    let page = await app.firstWindow();
    await ready(page);

    for (const screen of ['Today', 'Tasks', 'Focus', 'History', 'Settings']) {
      await page.getByRole('button', { name: screen, exact: true }).click();
      await page.getByRole('heading', { name: screen === 'Focus' ? 'Choose one task.' : screen }).waitFor();
    }

    await page.getByRole('button', { name: 'Tasks', exact: true }).click();
    await page.getByRole('button', { name: 'Add task', exact: true }).click();
    await page.getByLabel('Task title').fill('Release verification task');
    assert.equal(await page.getByRole('button', { name: 'Add task', exact: true }).evaluate((button) => button.classList.contains('create-action')), true);
    assert.equal(await page.getByRole('button', { name: 'Start focus' }).evaluate((button) => button.classList.contains('focus-action')), true);
    await page.getByLabel('Notes').fill('Exercise the complete daily loop');
    await page.getByLabel('Sessions').fill('3');
    await page.locator('.inspector label.field').filter({ hasText: 'Priority' }).locator('select').selectOption('high');
    await page.locator('.inspector label.field').filter({ hasText: 'Status' }).locator('select').selectOption('waiting');
    await page.getByLabel('Priority for today').check();
    await page.getByRole('button', { name: 'Move up' }).click();

    await page.getByLabel('Search tasks').fill('Release verification');
    assert.equal(await page.getByText('Release verification task', { exact: true }).count(), 1);
    assert.equal(await page.getByLabel('Task title').inputValue(), 'Release verification task');
    await page.getByLabel('Search tasks').fill('no matching task');
    await page.getByRole('heading', { name: 'Nothing needs your attention.' }).waitFor();
    await page.getByLabel('Search tasks').fill('');

    await page.getByRole('button', { name: 'New project' }).click();
    await page.getByLabel('Project name').fill('Release');
    await page.getByRole('button', { name: 'Create project' }).click();
    await page.getByText('Project created', { exact: true }).waitFor();
    const taskProject = page.locator('.inspector label.field').filter({ hasText: 'Project' }).locator('select');
    await taskProject.selectOption({ label: 'Release' });
    assert.equal(await taskProject.inputValue(), await projectValue(page, 'Release'));
    assert.equal(await taskProject.evaluate((select) => getComputedStyle(select).appearance), 'none');
    assert.notEqual(await taskProject.evaluate((select) => getComputedStyle(select).backgroundImage), 'none');

    await page.getByRole('button', { name: 'Add task', exact: true }).click();
    await page.getByLabel('Task title').fill('Delete verification task');
    page.once('dialog', (dialog) => void dialog.accept());
    await page.getByRole('button', { name: 'Delete', exact: true }).click();
    await page.getByText('Task deleted', { exact: true }).waitFor();
    assert.equal(await page.getByText('Delete verification task', { exact: true }).count(), 0);
    await page.getByText('Release verification task', { exact: true }).first().click();

    const today = await page.evaluate(() => {
      const now = new Date();
      const offset = now.getTimezoneOffset() * 60_000;
      return new Date(now.getTime() - offset).toISOString().slice(0, 10);
    });
    const capturePromise = app.waitForEvent('window');
    await page.getByRole('button', { name: 'Quick capture' }).first().click();
    const capture = await capturePromise;
    await capture.getByPlaceholder('Write a task, idea, or next step').fill('Captured release task');
    await capture.getByLabel('Project').selectOption({ label: 'Release' });
    await capture.getByLabel('Planned date').fill(today);
    await capture.getByLabel('Estimated sessions').selectOption('2');
    await capture.getByRole('button', { name: 'Save task' }).click();

    await page.getByRole('button', { name: 'Today', exact: true }).click();
    await page.getByText('Captured release task', { exact: true }).waitFor();
    const projectLabel = page.locator('.project-label').first();
    const [dotBox, nameBox] = await Promise.all([projectLabel.locator('.project-dot').boundingBox(), projectLabel.locator('span').last().boundingBox()]);
    assert.ok(dotBox && nameBox && nameBox.x - (dotBox.x + dotBox.width) >= 4, 'project dot has readable spacing from its name');
    await page.getByLabel('Quick note').fill('Exported note');
    await page.getByRole('button', { name: /^Captured release task/ }).click();
    await page.getByRole('button', { name: 'Pause' }).click();
    await page.getByRole('button', { name: 'Resume' }).click();
    await page.getByPlaceholder('What are you working through?').fill('Partial release notes');
    await page.getByRole('button', { name: 'End session' }).click();
    await page.getByRole('dialog').waitFor();
    await page.getByRole('button', { name: 'Continue focusing' }).click();
    assert.equal(await page.getByRole('dialog').count(), 0);
    await page.getByRole('button', { name: 'End session' }).click();
    await page.getByRole('button', { name: 'Save session' }).click();
    await page.getByText('Session complete', { exact: true }).waitFor();

    await page.getByRole('button', { name: 'History', exact: true }).click();
    await page.getByLabel('Filter by session status').selectOption('partial');
    await page.getByRole('button', { name: /Captured release task/ }).click();
    await page.getByLabel('Session note').fill('Edited history note');
    await page.locator('.session-detail label.field').filter({ hasText: 'Task' }).locator('select').selectOption({ label: 'Release verification task' });
    await page.getByLabel('Filter by project').selectOption({ label: 'Release' });
    assert.equal(await page.getByRole('button', { name: /Release verification task/ }).count(), 1);

    await page.getByRole('button', { name: 'Tasks', exact: true }).click();
    await page.getByText('Release verification task', { exact: true }).first().click();
    await page.getByRole('button', { name: 'Start focus' }).click();
    await expireTimer(page);
    await page.getByText('Session complete', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Start break' }).click();
    await page.getByRole('button', { name: 'Pause' }).click();
    await page.getByRole('button', { name: 'Resume' }).click();
    await page.getByRole('button', { name: 'Skip break' }).click();
    await page.getByRole('heading', { name: 'Choose one task.' }).waitFor();

    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    await page.getByRole('spinbutton', { name: /^Focus duration/ }).fill('1');
    await page.getByRole('spinbutton', { name: /^Short break/ }).fill('2');
    await page.getByRole('spinbutton', { name: /^Long break/ }).fill('4');
    await page.getByRole('spinbutton', { name: /^Sessions before long break/ }).fill('2');
    await page.getByLabel('Start breaks automatically').check();
    await page.getByLabel('Desktop notifications').uncheck();
    await page.getByLabel('Completion sound').check();
    await page.getByLabel('Theme').selectOption('light');
    assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()), '#315f4d');
    await page.getByLabel('Theme').selectOption('dark');
    await page.getByLabel('Reduce motion').check();
    await page.getByLabel('Compact density').check();
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
    assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()), '#79b598');
    assert.equal(await page.locator('html').getAttribute('data-motion'), 'reduced');
    assert.equal(await page.locator('html').getAttribute('data-density'), 'compact');
    await page.getByLabel('Start with Windows').check();
    await page.getByLabel('Start with Windows').uncheck();
    await page.getByLabel('Confirm before discarding a session').uncheck();
    assert.equal(await app.evaluate(({ globalShortcut }) => globalShortcut.isRegistered('CommandOrControl+Shift+Space')), true);
    assert.equal(await page.getByLabel('Quick capture shortcut').inputValue(), 'Ctrl + Shift + Space');
    await page.getByLabel('Quick capture shortcut').fill('Ctrl + Shift + F9');
    await page.getByLabel('Quick capture shortcut').press('Tab');
    assert.equal(await app.evaluate(({ globalShortcut }) => globalShortcut.isRegistered('CommandOrControl+Shift+F9')), true);
    assert.equal((await page.evaluate(() => window.rurinagi.loadState())).settings.quickCaptureShortcut, 'CommandOrControl+Shift+F9');

    await app.evaluate(({ dialog }, paths) => {
      (dialog as unknown as { showSaveDialog: (options: { title?: string }) => Promise<{ canceled: boolean; filePath: string }> }).showSaveDialog = async (options) => ({
        canceled: false,
        filePath: options.title?.startsWith('Export') ? paths.exported : paths.backup,
      });
      (dialog as unknown as { showOpenDialog: () => Promise<{ canceled: boolean; filePaths: string[] }> }).showOpenDialog = async () => ({ canceled: false, filePaths: [paths.exported] });
    }, { exported, backup });
    await page.getByRole('button', { name: 'Export data' }).click();
    await page.getByText('Export complete', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Back up database' }).click();
    await page.getByText('Backup complete', { exact: true }).waitFor();
    assert.equal(existsSync(exported), true);
    assert.equal(existsSync(backup), true);

    await page.getByRole('button', { name: 'Today', exact: true }).click();
    await page.getByLabel('Quick note').fill('Changed after export');
    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    await page.getByRole('button', { name: 'Import data' }).click();
    await page.getByText('Import complete', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Today', exact: true }).click();
    assert.equal(await page.getByLabel('Quick note').inputValue(), 'Exported note');

    await page.getByRole('button', { name: 'Tasks', exact: true }).click();
    await page.getByText('Release verification task', { exact: true }).first().click();
    await page.getByRole('button', { name: 'Start focus' }).click();
    await quit(app);
    app = undefined;

    ({ app, page } = await launch(profile, errors));
    await ready(page);
    await page.getByRole('button', { name: 'Focus', exact: true }).click();
    await page.getByRole('button', { name: 'Pause' }).waitFor();
    await page.getByRole('button', { name: 'End session' }).click();
    await page.getByText('Session complete', { exact: true }).waitFor();

    await page.getByRole('button', { name: 'History', exact: true }).click();
    await page.getByLabel('Filter by session status').selectOption('partial');
    await page.getByRole('button', { name: /Release verification task/ }).first().click();
    page.once('dialog', (dialog) => void dialog.accept());
    await page.getByRole('button', { name: 'Delete record' }).click();

    await page.getByRole('button', { name: 'Tasks', exact: true }).click();
    await page.getByText('Release verification task', { exact: true }).first().click();
    page.once('dialog', (dialog) => void dialog.accept());
    await page.getByRole('button', { name: 'Archive', exact: true }).click();
    await page.getByRole('heading', { name: 'Select a task' }).waitFor();

    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    page.once('dialog', (dialog) => void dialog.accept());
    await page.getByRole('button', { name: 'Clear all data' }).click();
    await page.getByText('All local data cleared', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Tasks', exact: true }).click();
    await page.getByRole('heading', { name: 'Nothing needs your attention.' }).waitFor();

    await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().find((window) => window.getTitle() === 'Rurinagi')?.close());
    await page.waitForTimeout(150);
    assert.equal(await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().find((window) => window.getTitle() === 'Rurinagi')?.isVisible()), false);
    await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().find((window) => window.getTitle() === 'Rurinagi')?.show());
    await page.getByRole('button', { name: 'Today', exact: true }).waitFor();

    assert.deepEqual(errors, []);
  } finally {
    if (app) await quit(app);
    rmSync(profile, { recursive: true, force: true });
  }
});

async function quit(app: ElectronApplication): Promise<void> {
  await app.evaluate(({ app: electronApp }) => electronApp.quit()).catch(() => undefined);
  await app.close().catch(() => undefined);
}

async function launch(profile: string, errors: string[]): Promise<{ app: ElectronApplication; page: Page }> {
  const env = Object.fromEntries(Object.entries(process.env).filter(([key, value]) => key !== 'ELECTRON_RUN_AS_NODE' && value !== undefined)) as Record<string, string>;
  const app = await electron.launch({ executablePath: electronPath, args: [mainPath, `--user-data-dir=${profile}`], env });
  const page = await app.firstWindow();
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(`console: ${message.text()}`); });
  return { app, page };
}

async function ready(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Today', exact: true }).waitFor();
}

async function projectValue(page: Page, label: string): Promise<string> {
  return page.locator('.inspector label.field').filter({ hasText: 'Project' }).locator('option', { hasText: label }).getAttribute('value').then((value) => value ?? '');
}

async function expireTimer(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const state = await window.rurinagi.loadState();
    state.timer.endsAt = new Date(Date.now() - 1_000).toISOString();
    await window.rurinagi.saveState(state);
  });
}
