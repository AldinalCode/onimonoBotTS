import axios from "axios";

export async function safelinku(
  urlDownload: string
): Promise<string | undefined> {
  const url = "https://safelinku.com/api/v1/links";
  const headers = {
    Authorization: `Bearer ${process.env.SAFELINKU_TOKEN}`,
    "Content-Type": "application/json",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
    Accept: "application/json",
  };
  const body = {
    url: urlDownload,
  };

  console.log("URL:", url);
  console.log("Headers:", headers);
  console.log("Body:", body);

  try {
    const response = await axios.post(url, body, { headers });
    console.log("Response Status:", response.status);
    console.log("Response Data:", response.data);

    if (response.status === 201 && response.data && response.data.url) {
      const data = response.data;
      const shortLink = data.url;
      return shortLink;
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(
        "Axios Error:",
        error.response?.status,
        error.response?.data
      );
    } else {
      console.error("Error fetching data:", error);
    }
  }
}
