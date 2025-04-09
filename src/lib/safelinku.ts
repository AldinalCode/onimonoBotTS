import puppeteer from "puppeteer";

export async function safelinku(
  urlDownload: string
): Promise<string | undefined> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();

  try {
    await page.goto("https://safelinku.com/api/v1/links", {
      waitUntil: "networkidle2",
    });

    await page.setRequestInterception(true);
    page.on("request", (request) => {
      if (request.url() === "https://safelinku.com/api/v1/links") {
        console.log("Intercepting request to:", request.url());
        request.continue({
          method: "POST",
          postData: JSON.stringify({ url: urlDownload }),
          headers: {
            Authorization: `Bearer ${process.env.SAFELINKU_TOKEN}`,
            "Content-Type": "application/json",
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
          },
        });
      } else {
        request.continue();
      }
    });

    const response = await page.waitForResponse(
      (response) =>
        response.url() === "https://safelinku.com/api/v1/links" &&
        response.status() === 200,
      { timeout: 10000 }
    );
    const data = await response.json();
    console.log("Response data:", data);

    await browser.close();
    return data.url;
  } catch (error) {
    console.error("Error with Puppeteer:", error);
    await browser.close();
    return undefined;
  }
}
