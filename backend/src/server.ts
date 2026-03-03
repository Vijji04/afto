import { createApp } from "./app";
import { pool } from "./services/postgres";
import { esClient } from "./services/elastic";
import { config } from "./config";

const app = createApp({ pool, esClient });

app.listen(config.server.port, () => {
  console.log(`Server running on port ${config.server.port}`);
});
