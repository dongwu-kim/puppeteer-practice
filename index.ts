import * as puppeteer from "puppeteer";
import dotEnv from "dotenv";
import path from "path";

(() => {
  const result = dotEnv.config({ path: path.join(__dirname, "/", ".env") });
  if (result.parsed == undefined)
    // .env 파일 parsing 성공 여부 확인
    throw new Error("Cannot loaded environment variables file.");
})();

const { TEST_URL } = process.env;

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: {
      width: 1200,
      height: 800,
    },
  });
  const page = await browser.newPage();
  await page.goto(TEST_URL ?? "");
  await page.waitForXPath(
    '//*[@id="header"]/div[1]/div/div[2]/form/fieldset/div/div/div[2]/input'
  );
  const [searchInputNode] = await page.$x(
    '//*[@id="header"]/div[1]/div/div[2]/form/fieldset/div/div/div[2]/input'
  );

  await searchInputNode.focus();
  await searchInputNode.type("도자기 공예");
  await searchInputNode.press("Enter");

  await page.waitForXPath(
    '//*[@id="mainContainer"]/div/div[1]/div[3]/div/div[1]/div/a'
  );
  const moreButtonNode = await page.$x(
    '//*[@id="mainContainer"]/div/div[1]/div[3]/div/div[1]/div/a'
  );

  await page.goto(
    (await (await moreButtonNode[0].getProperty("href")).jsonValue()) as string
  );

  const [sectionPagenation] = await page.$x(
    '//*[@id="mainContainer"]/div/div[1]/div[3]/div/div[3]/div/div/div'
  );
})();
