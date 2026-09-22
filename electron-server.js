const http = require("http");
const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");

const DIST_DIR = path.join(__dirname, "dist");
const PORT = 0; // اختيار منفذ متاح تلقائيًا

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".wasm": "application/wasm",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".map": "application/json",
};

function sendFile(res, filePath) {
  try {
    const stat = fs.statSync(filePath);

    if (!stat.isFile()) {
      res.writeHead(404);
      res.end("Not Found");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    res.writeHead(200, {
      "Content-Type": contentType,
      "Content-Length": stat.size,

      // مهم لـ WASM / بعض ميزات DuckDB
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
      "Cross-Origin-Resource-Policy": "same-origin",

      "Cache-Control": ext === ".wasm" ? "public, max-age=31536000, immutable" : "no-cache",
    });

    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    console.error(err);

    res.writeHead(404);
    res.end("Not Found");
  }
}

const server = http.createServer((req, res) => {
  try {
    let urlPath = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname);

    if (urlPath === "/") {
      urlPath = "/index.html";
    }

    // إزالة /
    const relativePath = urlPath.replace(/^\/+/, "");

    let filePath = path.resolve(DIST_DIR, relativePath);

    // حماية من Path Traversal
    const distResolved = path.resolve(DIST_DIR);

    if (filePath !== distResolved && !filePath.startsWith(distResolved + path.sep)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    // الملف موجود
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      sendFile(res, filePath);
      return;
    }

    // SPA fallback
    filePath = path.join(DIST_DIR, "index.html");

    if (fs.existsSync(filePath)) {
      sendFile(res, filePath);
      return;
    }

    res.writeHead(404);
    res.end("index.html not found");
  } catch (err) {
    console.error(err);

    res.writeHead(400);
    res.end("Bad Request");
  }
});

server.listen(PORT, "127.0.0.1", () => {
  const address = server.address();
  const port = address.port;

  const url = `http://127.0.0.1:${port}`;

  console.log("");
  console.log("======================================");
  console.log("Duck UI started");
  console.log(`URL: ${url}`);
  console.log("======================================");
  console.log("");

  // Windows فقط
  if (process.platform === "win32") {
    execFile(
      "cmd.exe",
      ["/c", "start", "", url],
      {
        windowsHide: true,
      },
      (error) => {
        if (error) {
          console.error("Could not open browser:", error.message);
        }
      }
    );
  }
});
