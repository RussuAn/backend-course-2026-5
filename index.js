const { Command } = require("commander");
const fs = require("fs");
const fsPromises = require("fs/promises");
const http = require("http");
const path = require("path");
const superagent = require("superagent");

const program = new Command();

program.configureOutput({
  outputError: (str, write) => {
    if (str.includes("required option") || str.includes("argument missing")) {
      write("Please, specify all required parameters (-h, -p, -c)\n");
      process.exit(1);
    } else {
      write(str);
    }
  }
});

program
  .requiredOption("-h, --host <host>", "адреса сервера")
  .requiredOption("-p, --port <port>", "порт сервера")
  .requiredOption("-c, --cache <path>", "шлях до директорії, яка міститиме кешовані файли");

program.parse(process.argv);
const options = program.opts();

if (!fs.existsSync(options.cache)) {
  fs.mkdirSync(options.cache, { recursive: true });
  console.log(`Cache directory created at: ${options.cache}`);
}

const server = http.createServer(async (req, res) => {
  const code = req.url.slice(1);
  const filePath = path.join(options.cache, `${code}.jpg`);

  try {
    if (req.method === "GET") {
      try {
        const data = await fsPromises.readFile(filePath);
        res.writeHead(200, { "Content-Type": "image/jpeg" });
        res.end(data);
      } catch (err) {
        if (err.code === "ENOENT") {
          try {
            const result = await superagent.get(`https://http.cat/${code}`).buffer(true);
            const imageBuffer = result.body;

            await fsPromises.writeFile(filePath, imageBuffer);

            res.writeHead(200, { "Content-Type": "image/jpeg" });
            res.end(imageBuffer);
          } catch (externalErr) {
            res.writeHead(404);
            res.end("Not Found");
          }
        } else {
          throw err;
        }
      }
    } else if (req.method === "PUT") {
      let body = [];
      req.on("data", (chunk) => {
        body.push(chunk);
      }).on("end", async () => {
        try {
          const buffer = Buffer.concat(body);
          await fsPromises.writeFile(filePath, buffer);
          res.writeHead(201);
          res.end("Created");
        } catch (err) {
          res.writeHead(500);
          res.end("Error saving file");
        }
      });
      return;
    } else if (req.method === "DELETE") {
      try {
        await fsPromises.unlink(filePath);
        res.writeHead(200);
        res.end("OK");
      } catch (err) {
        if (err.code === "ENOENT") {
          res.writeHead(404);
          res.end("Not Found");
        } else {
          res.writeHead(500);
          res.end("Error deleting file");
        }}
    } else {
      res.writeHead(405);
      res.end("Method not allowed");
    }
  } catch (err) {
    res.writeHead(500);
    res.end("Internal Server Error");
  }
});

server.listen(parseInt(options.port), options.host, () => {
  console.log(`Server running at http://${options.host}:${options.port}/`);
});