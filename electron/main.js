// const { app, BrowserWindow } = require("electron");
// const path = require("path");

// function createWindow() {
//   const win = new BrowserWindow({
//     width: 1400,
//     height: 900,
//     minWidth: 900,
//     minHeight: 600,

//     webPreferences: {
//       nodeIntegration: false,
//       contextIsolation: true,
//       sandbox: true,
//     },
//   });

//   const indexPath = path.join(__dirname, "..", "dist", "index.html");

//   win.loadFile(indexPath);

//   // افتح DevTools أثناء التطوير فقط
//   // win.webContents.openDevTools();
// }

// app.whenReady().then(() => {
//   createWindow();

//   app.on("activate", () => {
//     if (BrowserWindow.getAllWindows().length === 0) {
//       createWindow();
//     }
//   });
// });

// app.on("window-all-closed", () => {
//   if (process.platform !== "darwin") {
//     app.quit();
//   }
// });
const { app, BrowserWindow, protocol, net } = require("electron");
const path = require("path");
const { pathToFileURL } = require("url");

protocol.registerSchemesAsPrivileged([
  {
    scheme: "myapp",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
    },
  },
]);

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,

    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  win.loadURL("myapp://bundle/index.html");
}

app.whenReady().then(() => {
  protocol.handle("myapp", (request) => {
    const url = new URL(request.url);

    let relativePath = decodeURIComponent(url.pathname);

    if (relativePath === "/") {
      relativePath = "/index.html";
    }

    const distPath = path.join(app.getAppPath(), "dist", relativePath);

    return net.fetch(pathToFileURL(distPath).toString());
  });

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
