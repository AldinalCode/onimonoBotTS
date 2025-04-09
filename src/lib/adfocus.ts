import axios from "axios";

export async function adfocus(url: string): Promise<string | undefined> {
  const urlFull = `http://adfoc.us/api/?key=${process.env.ADFOC_US_TOKEN}&url=${url}`;

  console.log("URL:", urlFull);

  try {
    const response = await axios.post(urlFull);

    // jika response data 0
    if (response.data === 0) {
      return undefined;
    } else {
      return response.data;
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
