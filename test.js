const { chromium } = require("playwright");
const emailList = require("./emailList.json");
const sitesList = require("./sites.json");
const pom = require("./pageObjects");
const delay = require("delay");

async function test(site, emailAddress) {
  const browser = await chromium.launch({
    headless: true,
  });
  const context = await browser.newContext();

  // Open new page
  const page = await context.newPage();

  // go to sweepstakes page
  await page.goto(site.url, { timeout: 60000, waitUntil: "load" });
  await delay(1000);
  // enter email address in iframe
  const frameElement = await page.waitForSelector(pom.iframe(site.site), {
    timeout: 30000,
  });
  const iframe = await frameElement.contentFrame();
  await iframe.waitForSelector(pom.emailAddress, { timeout: 30000 });
  await iframe.type(pom.emailAddress, emailAddress).catch(() => {
    console.log("email address not entered");
  });
  await delay(1000);
  await iframe.click(pom.beginEntryButton).catch(() => {
    console.log("begin entry button not clicked");
  });
  await delay(1000);

  // check if the user was already entered today
  const frameElement5 = await page.waitForSelector(pom.iframe(site.site), {
    timeout: 30000,
  });
  const iframe5 = await frameElement5.contentFrame();
  const value = await iframe5.evaluate(() =>
    document.querySelector("#xSectionEntry_xModule").getAttribute("style")
  );
  await delay(1000);
  if (value === "opacity: 1;") {
    console.log("This user was already entered today");
  } else {
    // enter to win after not selecting the checkboxes if the user is eligable to enter today
    const frameElement2 = await page.waitForSelector(pom.iframe(site.site), {
      timeout: 30000,
    });
    const iframe2 = await frameElement2.contentFrame();
    await iframe2.click(pom.submitEntryButton).catch((error) => {
      console.log(error);
      console.log("User entry unsuccessfull");
      // process.exit(2);
    });

    await delay(1000);
    const url = page.url();
    const thanksurl = site.url + "/thanks";
    if (url === thanksurl) {
      console.log("user entered successfully");
    } else {
      console.log("user not entered successfully");
    }
  }

  // ---------------------
  await context.close();
  await browser.close();
}

(async () => {
  // loop through sites
  for (let index = 0; index < sitesList.length; index++) {
    const site = sitesList[index];
    console.log(site.site);
    // loop through users
    for (let index = 0; index < emailList.length; index++) {
      const emailAddress = emailList[index];
      console.log(emailAddress);
      await test(site, emailAddress);
    }
  }
})();
