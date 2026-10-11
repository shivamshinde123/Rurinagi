import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { _electron as electron, ElectronApplication, Page } from 'playwright';

const root = process.cwd();
const electronPath = join(root, 'node_modules', 'electron', 'dist', 'electron.exe');
const mainPath = join(root, '.vite', 'build', 'main.cjs');
const packagedExe = join(root, 'out', 'Rurinagi-win32-x64', 'Rurinagi.exe');

test('packaged Electron app completes every V3 workflow', { timeout: 180_000 }, async () => {
  mkdirSync(join(root, 'output', 'playwright'), { recursive: true });
  const profile = mkdtempSync(join(tmpdir(), 'rurinagi-e2e-'));
  const exported = join(profile, 'rurinagi-export.json');
  const backup = join(profile, 'rurinagi-backup.sqlite');
  let app: ElectronApplication | undefined;
  const errors: string[] = [];

  try {
    ({ app } = await launch(profile, errors));
    let page = await app.firstWindow();
    await page.getByRole('heading', { name: 'A calmer place for meaningful work.' }).waitFor();
    await page.getByRole('button', { name: 'Privacy Policy' }).waitFor();
    await page.getByRole('button', { name: 'Terms of Service' }).waitFor();
    await page.screenshot({ path: join(root, 'output', 'playwright', 'first-run-setup.png'), fullPage: true });
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.screenshot({ path: join(root, 'output', 'playwright', 'first-run-preferences.png'), fullPage: true });
    assert.equal(await page.getByLabel('Desktop notifications').isChecked(), false);
    assert.equal(await page.getByLabel('Start with Windows').isChecked(), false);
    await page.getByLabel('Desktop notifications').check();
    await page.getByRole('button', { name: 'Finish setup' }).click();
    await ready(page);
    assert.equal((await page.evaluate(() => window.rurinagi.loadState())).settings.notifications, true);

    for (const screen of ['Today', 'Tasks', 'Focus', 'History', 'Insights', 'Settings']) {
      await page.getByRole('button', { name: screen, exact: true }).click();
      await page.getByRole('heading', { name: screen === 'Focus' ? 'Choose one task.' : screen }).waitFor();
    }

    await page.getByRole('button', { name: 'Tasks', exact: true }).click();
    assert.equal(await page.locator('.inspector').count(), 0);
    assert.equal(await page.locator('.page-header').getByRole('button', { name: 'Add task', exact: true }).evaluate((button) => button.classList.contains('create-action')), true);
    await page.locator('.page-header').getByRole('button', { name: 'Add task', exact: true }).click();
    assert.equal(await page.getByRole('dialog').getByRole('button', { name: 'Create task' }).isDisabled(), true);
    await page.getByLabel('Task name').fill('Release verification task');
    await page.getByRole('dialog').getByRole('button', { name: 'Create task' }).click();
    await page.getByText('Task created', { exact: true }).waitFor();
    assert.equal(await page.getByRole('button', { name: 'Start focus' }).evaluate((button) => button.classList.contains('focus-action')), true);
    assert.equal(await page.locator('.primary-task-actions').getByRole('button', { name: 'Update task', exact: true }).count(), 1);
    await page.getByLabel('Notes').fill('Exercise the complete daily loop');
    await page.getByLabel('Sessions').fill('3');
    await chooseOption(page, 'Priority', 'High');
    await chooseOption(page, 'Status', 'Waiting');
    assert.equal(await page.locator('input[type="date"]').count(), 0);
    await page.getByRole('button', { name: 'Planned date', exact: true }).click();
    await page.getByRole('dialog', { name: 'Planned date calendar' }).waitFor();
    await page.keyboard.press('Escape');
    await page.getByRole('dialog', { name: 'Planned date calendar' }).waitFor({ state: 'detached' });
    await page.getByLabel('Priority for today').check();
    await page.getByRole('button', { name: 'Move up' }).click();

    await page.getByLabel('Search tasks').fill('Release verification');
    assert.equal(await page.getByText('Release verification task', { exact: true }).count(), 1);
    assert.equal(await page.getByLabel('Task title').inputValue(), 'Release verification task');
    await page.getByLabel('Search tasks').fill('no matching task');
    await page.getByRole('heading', { name: 'Nothing needs your attention.' }).waitFor();
    await page.getByLabel('Search tasks').fill('');

    await page.getByRole('button', { name: 'Manage projects' }).click();
    await page.getByLabel('New project name').fill('Release');
    await page.getByRole('button', { name: 'Create project' }).click();
    await page.getByText('Project created', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Project', exact: true }).click();
    await page.getByRole('listbox', { name: 'Project' }).waitFor();
    await page.getByRole('option', { name: 'Release', exact: true }).click();
    assert.equal((await page.getByRole('button', { name: 'Project', exact: true }).textContent())?.trim(), 'Release');
    assert.equal(await page.locator('select').count(), 0);
    await page.getByRole('button', { name: 'Update task', exact: true }).click();
    await page.getByText('Task updated', { exact: true }).waitFor();
    assert.equal(await page.locator('.inspector').count(), 0);
    assert.equal(await page.getByText('Release verification task', { exact: true }).first().locator('..').getByText('High priority', { exact: true }).count(), 1);

    await page.locator('.page-header').getByRole('button', { name: 'Add task', exact: true }).click();
    await page.getByLabel('Task name').fill('Delete verification task');
    await page.getByRole('dialog').getByRole('button', { name: 'Create task' }).click();
    await page.getByRole('button', { name: 'Delete', exact: true }).click();
    await page.getByRole('dialog').press('Escape');
    assert.equal(await page.getByRole('dialog').count(), 0);
    assert.equal(await page.getByText('Delete verification task', { exact: true }).count(), 1);
    await page.getByRole('button', { name: 'Delete', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Delete task', exact: true }).click();
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
    await chooseOption(capture, 'Project', 'Release');
    assert.equal(await capture.locator('input[type="date"]').count(), 0);
    await capture.getByRole('button', { name: 'Planned date', exact: true }).click();
    await capture.getByRole('gridcell', { name: `Choose ${today}`, exact: true }).click();
    await chooseOption(capture, 'Estimated sessions', '2 sessions');
    await capture.getByRole('button', { name: 'Save task' }).click();

    await page.getByRole('button', { name: 'Today', exact: true }).click();
    await page.getByText('Captured release task', { exact: true }).waitFor();
    assert.equal(await page.getByText('Captured release task', { exact: true }).first().locator('..').getByText('Normal priority', { exact: true }).count(), 1);
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
    await chooseOption(page, 'Filter by session status', 'Partial');
    await page.getByRole('button', { name: /Captured release task/ }).click();
    await page.getByLabel('Session note').fill('Edited history note');
    await chooseOption(page, 'Task', 'Release verification task');
    await chooseOption(page, 'Filter by project', 'Release');
    assert.equal(await page.getByRole('button', { name: /Release verification task/ }).count(), 1);

    await page.getByRole('button', { name: 'Insights', exact: true }).click();
    await page.getByRole('heading', { name: 'Focus skyline' }).waitFor();
    assert.equal(await page.locator('.skyline-day').count(), 7);
    assert.equal((await page.locator('.insights-summary .metric').filter({ hasText: 'Sessions' }).locator('strong').textContent())?.trim(), '1');
    await page.getByText('Release', { exact: true }).waitFor();
    await page.getByText('Calculated on this device. Nothing is uploaded.', { exact: true }).waitFor();
    await page.screenshot({ path: join(root, 'output', 'playwright', 'v3-insights.png'), fullPage: true });

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
    await chooseOption(page, 'Theme', 'Light');
    assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()), '#315f4d');
    await chooseOption(page, 'Theme', 'Dark');
    await page.getByLabel('Reduce motion').check();
    await page.getByLabel('Compact density').check();
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
    assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()), '#79b598');
    assert.equal(await page.locator('html').getAttribute('data-motion'), 'reduced');
    assert.equal(await page.locator('html').getAttribute('data-density'), 'compact');
    await page.getByLabel('Start with Windows').check();
    await page.getByLabel('Start with Windows').uncheck();
    await page.getByLabel('Confirm before discarding a session').uncheck();
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
    assert.equal(await page.getByRole('heading', { name: 'A calmer place for meaningful work.' }).count(), 0);
    await page.getByRole('button', { name: 'Focus', exact: true }).click();
    await page.getByRole('button', { name: 'Pause' }).waitFor();
    await page.getByRole('button', { name: 'End session' }).click();
    await page.getByText('Session complete', { exact: true }).waitFor();

    await page.getByRole('button', { name: 'History', exact: true }).click();
    await chooseOption(page, 'Filter by session status', 'Partial');
    await page.getByRole('button', { name: /Release verification task/ }).first().click();
    await page.getByRole('button', { name: 'Delete record' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Delete record', exact: true }).click();

    await page.getByRole('button', { name: 'Tasks', exact: true }).click();
    await page.getByText('Release verification task', { exact: true }).first().click();
    await page.getByRole('button', { name: 'Archive', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Archive task', exact: true }).click();
    assert.equal(await page.locator('.inspector').count(), 0);

    await page.getByRole('button', { name: 'Manage projects' }).click();
    const releaseProjectId = await page.evaluate(() => window.rurinagi.loadState().then((state) => state.projects.find((project) => project.name === 'Release')?.id));
    assert.ok(releaseProjectId);
    await page.getByRole('button', { name: 'Delete Release project' }).click();
    await page.getByText('This project and 2 tasks will be permanently deleted. Focus history will be kept. This cannot be undone.', { exact: true }).waitFor();
    await page.getByRole('dialog').getByRole('button', { name: 'Delete project', exact: true }).click();
    await page.getByText('Project and tasks deleted', { exact: true }).waitFor();
    const afterProjectDelete = await page.evaluate(() => window.rurinagi.loadState());
    assert.equal(afterProjectDelete.projects.some((project) => project.id === releaseProjectId), false);
    assert.equal(afterProjectDelete.tasks.some((task) => task.projectId === releaseProjectId), false);
    assert.equal(afterProjectDelete.sessions.some((session) => session.projectId === releaseProjectId), true);
    await page.getByRole('button', { name: 'History', exact: true }).click();
    await page.getByText('Deleted project', { exact: true }).first().waitFor();

    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    await page.getByRole('button', { name: 'Clear all data' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Clear all data', exact: true }).click();
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
    await removeDirectory(profile);
  }
});

test('packaged Windows executable reopens the existing Rurinagi window', { timeout: 60_000 }, async () => {
  const profile = mkdtempSync(join(tmpdir(), 'rurinagi-packaged-e2e-'));
  let primaryProcess: ReturnType<typeof spawn> | undefined;
  let secondProcess: ReturnType<typeof spawn> | undefined;

  try {
    assert.equal(existsSync(packagedExe), true, 'packaged Rurinagi executable exists');
    primaryProcess = spawn(packagedExe, [`--user-data-dir=${profile}`], { env: electronEnvironment(), stdio: 'ignore' });
    assert.ok(primaryProcess.pid);
    await waitForProcessTitle(primaryProcess.pid, 'Rurinagi');
    assert.equal(execFileSync('powershell.exe', ['-NoProfile', '-Command', `(Get-Process -Id ${primaryProcess.pid} -ErrorAction Stop).CloseMainWindow()`], { encoding: 'utf8' }).trim(), 'True');
    await waitForProcessTitle(primaryProcess.pid, '');

    secondProcess = spawn(packagedExe, [`--user-data-dir=${profile}`], { env: electronEnvironment(), stdio: 'ignore' });
    const secondExit = waitForExit(secondProcess);
    await waitForProcessTitle(primaryProcess.pid, 'Rurinagi');
    assert.equal(await secondExit, 0);
  } finally {
    if (secondProcess && secondProcess.exitCode === null) secondProcess.kill();
    if (primaryProcess?.pid && primaryProcess.exitCode === null) {
      try { execFileSync('taskkill.exe', ['/PID', String(primaryProcess.pid), '/T', '/F'], { stdio: 'ignore' }); } catch { /* process already exited */ }
    }
    await removeDirectory(profile);
  }
});

async function quit(app: ElectronApplication): Promise<void> {
  await app.evaluate(({ app: electronApp }) => { setTimeout(() => electronApp.exit(0), 0); }).catch(() => undefined);
  await app.close().catch(() => undefined);
}

async function launch(profile: string, errors: string[]): Promise<{ app: ElectronApplication; page: Page }> {
  const app = await electron.launch({ executablePath: electronPath, args: [mainPath, `--user-data-dir=${profile}`], env: electronEnvironment() });
  const page = await app.firstWindow();
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(`console: ${message.text()}`); });
  return { app, page };
}

function electronEnvironment(): Record<string, string> {
  return Object.fromEntries(Object.entries(process.env).filter(([key, value]) => key !== 'ELECTRON_RUN_AS_NODE' && value !== undefined)) as Record<string, string>;
}

async function waitForProcessTitle(processId: number, expected: string): Promise<void> {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const title = execFileSync('powershell.exe', ['-NoProfile', '-Command', `(Get-Process -Id ${processId} -ErrorAction Stop).MainWindowTitle`], { encoding: 'utf8' }).trim();
      if (title === expected) return;
    } catch { /* process may still be starting */ }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert.fail(`Rurinagi window title did not become ${JSON.stringify(expected)}`);
}

function waitForExit(process: ReturnType<typeof spawn>): Promise<number | null> {
  return new Promise((resolve, reject) => {
    if (process.exitCode !== null) { resolve(process.exitCode); return; }
    const timer = setTimeout(() => reject(new Error('Second Rurinagi process did not exit')), 5_000);
    process.once('error', (error) => { clearTimeout(timer); reject(error); });
    process.once('exit', (code) => { clearTimeout(timer); resolve(code); });
  });
}

async function removeDirectory(path: string): Promise<void> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      rmSync(path, { recursive: true, force: true });
      return;
    } catch (error) {
      if (!['EBUSY', 'EPERM'].includes((error as NodeJS.ErrnoException).code ?? '')) throw error;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  rmSync(path, { recursive: true, force: true });
}

async function ready(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Today', exact: true }).waitFor();
}

async function chooseOption(page: Page, label: string, option: string): Promise<void> {
  await page.getByRole('button', { name: label, exact: true }).click();
  await page.getByRole('option', { name: option, exact: true }).click();
}

async function expireTimer(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const state = await window.rurinagi.loadState();
    state.timer.endsAt = new Date(Date.now() - 1_000).toISOString();
    await window.rurinagi.saveState(state);
  });
}
