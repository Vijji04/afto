import axios from "axios";
import { withRetry } from "./retry";

export async function getJSON(url: string): Promise<unknown> {
  return withRetry(
    async () => {
      const response = await axios.get(url);
      return response.data;
    },
    { maxRetries: 3, delayMs: 500 }
  );
}
