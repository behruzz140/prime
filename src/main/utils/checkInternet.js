const url = "https://raqamli-bozor.uz/services/platon-core/api";

import axios from "axios";
import ping from "ping";

export const checkInternetConnection = async () => {
  try {
    // await axios.get("https://www.google.com", { timeout: 3000 });
    // https://raqamli-bozor.uz/services/platon-core/api/v1/connection/network
    await axios.get(`${url}/v1/connection/network`);
    return true;
  } catch (error) {
    return false;
  }
};

export const checkInternetConnectionWithFallback = async () => {
  const urls = [
    "https://www.google.com",
    "https://www.cloudflare.com",
    "https://www.microsoft.com",
  ];

  for (const url of urls) {
    try {
      await axios.get(url, { timeout: 1000 });
      return true;
    } catch (error) {
      continue;
    }
  }

  return false;
};
