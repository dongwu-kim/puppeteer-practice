import * as puppeteer from "puppeteer";
import dotEnv from "dotenv";
import path from "path";

import * as fs from "fs";

const folderPath = __dirname + "/dojagi";

import * as cheerio from "cheerio";

(() => {
  const result = dotEnv.config({ path: path.join(__dirname, "/", ".env") });
  if (result.parsed == undefined)
    // .env 파일 parsing 성공 여부 확인
    throw new Error("Cannot loaded environment variables file.");
})();

const { TEST_URL } = process.env;

interface ListData {
  name: string;
  description: string;
  region: string;
  member: number;
  profile_link: string;
  image_url: string;
  cafe_link: string;
}

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
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

  let listData: ListData[][] = [];
  let paginationOffset = 1;

  while (true) {
    let currentPageList: ListData[] = [];

    const test = await page.waitForXPath(
      '//*[@id="mainContainer"]/div/div[1]/div[3]/div/div[3]/ul'
    );

    const url = page.url();
    const content = await page.content();
    const $ = cheerio.load(content);

    const list = $(
      "#mainContainer > div > div.SectionSearchContent > div.section_search_content > div > div.cafe_list_area > ul > li"
    );

    list.each((_, list) => {
      const name = $(list).find(".cafe_name").text();
      const description = $(list).find(".cafe_introduction").text();
      let region = "";
      let member = 0;
      let profile_link = "";
      const image_url = $(list).find(".thumbnail").attr("src") ?? "";
      const cafe_link = $(list).find(".thumbnail_area").attr("href") ?? "";

      $(list)
        .find(".cafe_info_row")
        ?.each((_, _list) => {
          if ($(_list).find(".info_title").text() === "멤버수") {
            member = Number($(_list).find(".info_data").text());
          }

          if ($(_list).find(".info_title").text() === "지역") {
            region = $(_list).find(".info_data").text();
          }

          const profileContent = $(_list).find(".cafe_profile_link");
          if (profileContent) {
            profile_link = profileContent.attr("href") ?? "";
          }
        });

      currentPageList.push({
        name,
        description,
        region,
        member,
        profile_link,
        image_url,
        cafe_link,
      });
    });

    if (
      listData.length !== 0 &&
      listData[listData.length - 1][0].name === currentPageList[0].name
    ) {
      console.log(listData.length);
      break;
    }

    listData.push(currentPageList);

    paginationOffset += 1;

    await page.goto(`${url.split("&p=")[0]}&p=${paginationOffset}`);
  }

  fs.writeFileSync(
    folderPath + "/crawling.ts",
    `export const dojagiInfo = ${JSON.stringify(listData.flat(), null, 2)};`
  );

  browser.close();
})();
