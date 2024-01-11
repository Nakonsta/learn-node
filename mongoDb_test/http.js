import "dotenv/config";
import https from "https";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const keysFolder = path.resolve(__dirname, process.env.KEYS_FOLDER);
const options = {
  key: fs.readFileSync(path.join(keysFolder, "key.pem")),
  cert: fs.readFileSync(path.join(keysFolder, "key.pem")),
};

const PORT = 9000;

https
  .createServer(options, (req, res) => {
    res.writeHead(200);
    res.end("Hello world\n");
  })
  .listen(PORT, () => {
    console.log(`  Listening on http://localhost:${PORT}`);
  });
