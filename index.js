const { Command } = require("commander");
const fs = require("fs");
const fsPromises = require("fs/promises");
const http = require("http");
const path = require("path");

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
          res.writeHead(404);
          res.end("Not Found");
        } else {
          throw err;
        }
      }
    } else if (req.method === "PUT" || req.method === "DELETE") {
      res.writeHead(501);
      res.end("Not Implemented Yet");
    } else {
      res.writeHead(405);
      res.end("Method Not Allowed");
    }
  } catch (err) {
    res.writeHead(500);
    res.end("Internal Server Error");
  }
});

server.listen(parseInt(options.port), options.host, () => {
  console.log(`Server running at http://${options.host}:${options.port}/`);
});