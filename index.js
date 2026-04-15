const { Command } = require("commander");
const fs = require("fs");
const http = require("http");

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

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Proxy server is running!\n");
});

server.listen(parseInt(options.port), options.host, () => {
  console.log(`Server running at http://${options.host}:${options.port}/`);
});