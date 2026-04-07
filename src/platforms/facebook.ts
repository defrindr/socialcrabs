import path from 'path';
import fs from 'fs';
import type { BrowserManager } from '../browser/manager.js';
import type {
  ActionResult,
  CommentPayload,
  DMPayload,
  FollowPayload,
  IsLoginOptions,
  LikePayload,
} from '../types/index.js';
import { log } from '../utils/logger.js';
import type { RateLimiter } from '../utils/rate-limiter.js';
import { parseFacebookGroupFeedPayload } from '../extractor/facebook/group-feed.js';
import { BasePlatformHandler } from './base.js';

const SELECTORS = {
  loggedInFeed: '[aria-label="Your profile"],[aria-label="Profil Anda"]',
  emailInput: 'input[name="email"]',
  passwordInput: 'input[name="pass"]',
  loginButton: '[role="button"][aria-label="Log in"]',

  captchaImage: 'img[src*="/captcha/tfbimage/"]',
  captchaInput: 'div:has-text("Enter characters") input',
  captchaSubmitButton: '[role="button"]:has-text("Continue")',
};

export class FacebookHandler extends BasePlatformHandler {
  private readonly baseUrl = 'https://www.facebook.com';
  private readonly rawHtmlDir = path.resolve(process.cwd(), 'browser-data/facebook/raw');

  constructor(browserManager: BrowserManager, rateLimiter: RateLimiter) {
    super('facebook', browserManager, rateLimiter);
  }

  async isLoggedIn({ withRedirect = true }: IsLoginOptions): Promise<boolean> {
    try {
      if (withRedirect) {
        await this.navigate(`${this.baseUrl}/`);
      }

      await this.delay();

      const page = await this.getPage();
      const now = Date.now();
      this.ensureRawDir();

      await page.screenshot({
        path: path.join(this.rawHtmlDir, `is-logged-in-${now}.png`),
      });

      const LOGGEDIN_SELECTORS = ['[aria-label="Your profile"]', '[aria-label="Profil Anda"]'];

      for (const selector of LOGGEDIN_SELECTORS) {
        if (
          await page
            .locator(selector)
            .first()
            .isVisible()
            .catch(() => false)
        ) {
          return true;
        }
      }

      log.info('Facebook login check: not logged in');
      return false;
    } catch (error) {
      log.error('Error checking Facebook login status', { error: String(error) });
      return false;
    }
  }

  async login(): Promise<boolean> {
    try {
      await this.navigate(`${this.baseUrl}/login`);
      await this.delay();

      if (await this.isLoggedIn({ withRedirect: false })) {
        log.info('Already logged in to Facebook');
        return true;
      }

      if (!(await this.waitForElement(SELECTORS.emailInput, 15000))) {
        log.error('Facebook login form not found');
        return false;
      }

      log.info('Facebook login form ready. Please login manually in browser.');

      const startTime = Date.now();
      const timeout = 36000000;

      while (Date.now() - startTime < timeout) {
        if (await this.isLoggedIn({ withRedirect: false })) {
          await this.browserManager.saveSession('facebook');
          log.info('Facebook login successful');
          return true;
        }
        await new Promise((resolve) => setTimeout(resolve, 300000));
      }

      log.error('Facebook login timeout');
      return false;
    } catch (error) {
      log.error('Facebook login failed', { error: String(error) });
      return false;
    }
  }

  async loginWithCredentials(username: string, password: string): Promise<boolean> {
    try {
      // When we added login checker, Facebook started blocking headless login attempts with a recaptcha.
      await this.navigate(`${this.baseUrl}/login`);
      await this.delay();

      const page = await this.getPage();
      await page.screenshot({
        path: './sessions/debug-facebook-login-page.png',
      });
      await page.locator(SELECTORS.emailInput).first().fill(username);
      await page.locator(SELECTORS.passwordInput).first().fill(password);
      await page.screenshot({
        path: './sessions/debug-facebook-login-filled.png',
      });

      const BUTTON_SELECTORS = [
        "[aria-label='Log in']",
        "[aria-label='Log In']",
        "[aria-label='Login']",
        "[aria-label='Sign In']",
        "[aria-label='Submit']",
        "button[type='submit']",
        "[role='button'][aria-label*='log in' i]",
      ];

      for (const selector of BUTTON_SELECTORS) {
        if (await this.elementExists(selector)) {
          await this.clickHuman(selector);
          break;
        }
      }
      await this.delay();
      await this.think();
      await this.delay();
      await this.think();

      await page.screenshot({
        path: './sessions/debug-facebook-login-click-login.png',
      });

      // if (await this.isLoggedIn({ withRedirect: false })) {
      //   await this.browserManager.saveSession('facebook');
      //   log.info('Facebook login successful after captcha');
      //   return true;
      // }

      const captcha = await page.locator(SELECTORS.captchaImage);
      const hasCaptcha = await captcha.isVisible().catch((e) => {
        console.log(e);
        return false;
      });

      if (hasCaptcha) {
        await this.think();
        log.warn('Facebook login blocked by captcha. Please solve it manually in the browser.');
        await page.screenshot({
          path: './sessions/debug-facebook-login-captcha.png',
        });

        console.log(
          'Captcha:' +
          (await captcha
            .first()
            .getAttribute('src')
            .catch(() => 'N/A'))
        );

        // input captcha solution and wait for login
        const captchaInput = page.locator(SELECTORS.captchaInput).first();
        const hasCaptchaInput = await captchaInput.isVisible().catch(() => false);
        if (!hasCaptchaInput) {
          console.log(
            'Captcha input not found. Please check the screenshot and solve the captcha manually in the browser.'
          );
          log.error('Captcha input not found on Facebook login page');
          return false;
        }

        // input from terminal
        const readline = await import('readline');
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
        });

        const question = (query: string): Promise<string> => {
          return new Promise((resolve) => rl.question(query, resolve));
        };

        const answer = await question('Enter captcha solution: ');
        await captchaInput.fill(answer.trim());
        rl.close();
        await page.screenshot({
          path: './sessions/debug-facebook-login-after-captcha.png',
        });
        await this.clickHuman(SELECTORS.captchaSubmitButton);
        await this.delay();
        await this.think();

        await page.screenshot({
          path: './sessions/debug-facebook-login-after-captcha-submit.png',
        });

        if (await this.isLoggedIn({ withRedirect: false })) {
          await this.browserManager.saveSession('facebook');
          log.info('Facebook login successful after captcha');
          return true;
        }
      } else {
        console.log(
          'Login failed without captcha. Please check the screenshot and login manually in the browser.'
        );
        log.error('Facebook login failed without captcha');
      }

      await page.screenshot({
        path: './sessions/debug-facebook-login-failed.png',
      });

      return false;
    } catch (error) {
      log.error('Facebook headless login failed', { error: String(error) });
      return false;
    }
  }

  async logout(): Promise<void> {
    await this.browserManager.closeContext('facebook');
  }

  async like(payload: LikePayload): Promise<ActionResult> {
    const startTime = Date.now();
    return this.createErrorResult(
      'like',
      payload.url,
      'Facebook like automation not implemented yet',
      startTime
    );
  }

  async comment(payload: CommentPayload): Promise<ActionResult> {
    const startTime = Date.now();
    return this.createErrorResult(
      'comment',
      payload.url,
      'Facebook comment automation not implemented yet',
      startTime
    );
  }

  async follow(payload: FollowPayload): Promise<ActionResult> {
    const startTime = Date.now();
    return this.createErrorResult(
      'follow',
      payload.username,
      'Facebook follow automation not implemented yet',
      startTime
    );
  }

  async unfollow(payload: FollowPayload): Promise<ActionResult> {
    const startTime = Date.now();
    return this.createErrorResult(
      'unfollow',
      payload.username,
      'Facebook unfollow automation not implemented yet',
      startTime
    );
  }

  async dm(payload: DMPayload): Promise<ActionResult> {
    const startTime = Date.now();
    return this.createErrorResult(
      'dm',
      payload.username,
      'Facebook DM automation not implemented yet',
      startTime
    );
  }

  async getProfile(username: string): Promise<unknown> {
    return { username };
  }

  async crawlGroupPosts(
    groupId: string,
    options: { limit?: number; delayMs?: number } = {}
  ): Promise<Record<string, unknown>[]> {
    const limit = Math.max(1, Math.min(options.limit ?? 10, 200));
    const delayMs = Math.max(500, options.delayMs ?? 1500);
    const nodes: Record<string, unknown>[] = [];

    try {
      const page = await this.getPage();
      this.ensureRawDir();

      const normalizedGroupId = groupId
        .replace(/^https?:\/\/www\.facebook\.com\/groups\//i, '')
        .replace(/^groups\//i, '')
        .replace(/\/.*/, '')
        .trim();

      if (!normalizedGroupId) {
        log.warn('Invalid Facebook group id for crawler', { groupId });
        return nodes;
      }

      await this.navigate(`${this.baseUrl}/`);
      await this.warmUp({ scrollCount: 2 + Math.floor(Math.random() * 2) });

      await page.screenshot({
        path: path.join(this.rawHtmlDir, `group-feed-start-${normalizedGroupId}-${Date.now()}.png`),
      });

      const rawResponses: Array<{
        url: string;
        timestamp: number;
        rawFile: string;
        parsedCount: number;
      }> = [];
      const seenNodeIds = new Set<string>();

      const responseListener = (response: any): void => {
        const url = response.url();
        if (!url.includes('facebook.com/api/graphql/')) return;

        void response
          .text()
          .then((fileContent: string) => {
            const lines = fileContent.split('\n').filter((line) => line.trim() !== '');
            const json = JSON.parse(lines[0]);
            const parsedPosts = parseFacebookGroupFeedPayload(json);
            if (parsedPosts.length === 0) return;

            const now = Date.now();
            const rawFile = path.join(
              this.rawHtmlDir,
              `graphql-response-${normalizedGroupId}-${now}.json`
            );
            fs.writeFileSync(rawFile, JSON.stringify(json, null, 2));

            rawResponses.push({
              url: response.request().url(),
              timestamp: Date.now(),
              rawFile,
              parsedCount: parsedPosts.length,
            });

            for (const node of parsedPosts) {
              if (nodes.length >= limit) break;

              const id =
                typeof node.postId === 'string' && node.postId.trim()
                  ? node.postId
                  : `${Date.now()}-${Math.random()}`;

              if (seenNodeIds.has(id)) continue;
              seenNodeIds.add(id);
              nodes.push(node as unknown as Record<string, unknown>);
            }
          })
          .catch(() => {
            // Ignore non-JSON GraphQL responses
          });
      };

      page.on('response', responseListener);

      const groupUrl = `${this.baseUrl}/groups/${encodeURIComponent(normalizedGroupId)}`;
      await this.navigate(groupUrl);
      await this.think();

      await page.screenshot({
        path: path.join(
          this.rawHtmlDir,
          `group-feed-loaded-${normalizedGroupId}-${Date.now()}.png`
        ),
      });

      let attempts = 0;
      const maxAttempts = Math.ceil(limit / 5) + 5;

      while (nodes.length < limit && attempts < maxAttempts) {
        await page.mouse.wheel(0, 1400);
        await page.waitForTimeout(delayMs);
        attempts++;
      }

      await page.waitForTimeout(1000);
      page.off('response', responseListener);

      await page.screenshot({
        path: path.join(this.rawHtmlDir, `group-feed-end-${normalizedGroupId}-${Date.now()}.png`),
      });

      const now = Date.now();
      const parsedFile = path.join(
        this.rawHtmlDir,
        `group-feed-nodes-${normalizedGroupId}-${now}.json`
      );

      fs.writeFileSync(parsedFile, JSON.stringify(nodes.slice(0, limit), null, 2));

      log.info('Facebook group crawl completed', {
        groupId: normalizedGroupId,
        totalNodes: nodes.length,
        parsedFile,
      });

      return nodes.slice(0, limit);
    } catch (error) {
      log.error('Facebook group crawl failed', { error: String(error), groupId });
      return nodes;
    }
  }

  private ensureRawDir(): void {
    if (!fs.existsSync(this.rawHtmlDir)) {
      fs.mkdirSync(this.rawHtmlDir, { recursive: true });
    }
  }
}
