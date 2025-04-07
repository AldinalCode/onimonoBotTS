import axios from "axios";

export async function safelinku(
  urlDownload: string
): Promise<string | undefined> {
  const url = "https://safelinku.com/api/v1/links"; // Ganti dengan URL API yang sesuai
  const headers = {
    Authorization: `Bearer ${process.env.SAFELINKU_TOKEN}`, // Ganti dengan token Anda
    "Content-Type": "application/json",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
    Accept: "application/json",
  };
  const body = {
    url: urlDownload,
  };

  try {
    const response = await axios.post(url, body, { headers });
    // console.log("Response:", responsm

    if (response.status === 201 && response.data && response.data.url) {
      const data = response.data;
      const shortLink = data.url; // Ganti dengan field yang sesuai dari respons API
      return shortLink;
    }
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}
