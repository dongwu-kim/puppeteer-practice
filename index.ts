import * as puppeteer from "puppeteer";

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: {
      width: 1200,
      height: 800,
    },
  });
  const page = await browser.newPage();
  await page.goto("https://www.google.com");
  await page.screenshot({ path: "screenshot.png" });
  await browser.close();
})();
