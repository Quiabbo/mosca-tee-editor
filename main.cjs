const { app, BrowserWindow, Menu, screen, shell, ipcMain } = require('electron');
const path = require('path');
const net = require('net');
const isDev = process.env.ELECTRON_IS_DEV === '1';

// --- Speech Dispatcher bridge (SSIP over Unix socket) ---
// The renderer's window.speechSynthesis often isn't wired to the host
// speech-dispatcher inside the Flatpak sandbox. We expose an IPC method
// that opens the socket from the Node main process and sends SSIP commands.
let spdConnection = null;
function getSpdSocketPath() {
  const fs = require('fs');
  const uid = (process.getuid && process.getuid()) || 0;
  const candidates = [
    process.env.XDG_RUNTIME_DIR && path.join(process.env.XDG_RUNTIME_DIR, 'speech-dispatcher/speechd.sock'),
    `/run/user/${uid}/speech-dispatcher/speechd.sock`,
    `/run/flatpak/at-spi-bus`, // never matches; placeholder so the array isn't empty
  ].filter(Boolean);
  for (const c of candidates) {
    try { fs.accessSync(c); return c; } catch (_) { /* try next */ }
  }
  return candidates[0]; // fall through with the most likely path
}
function spdConnect() {
  if (spdConnection && !spdConnection.destroyed) return spdConnection;
  const sock = net.createConnection(getSpdSocketPath());
  sock.setEncoding('utf8');
  sock.on('connect', () => {
    sock.write('SET self CLIENT_NAME user:moscatee:speak\r\n');
  });
  sock.on('error', (err) => {
    console.error('speech-dispatcher socket error:', err.message);
    spdConnection = null;
  });
  sock.on('close', () => {
    spdConnection = null;
  });
  spdConnection = sock;
  return sock;
}
ipcMain.handle('tts-speak', async (_event, { text, lang, rate }) => {
  try {
    const sock = spdConnect();
    // SSIP rate range: -100..100 (0 = default). Map web rate (0.5..2) to it.
    const ssipRate = Math.max(-100, Math.min(100, Math.round(((rate || 1) - 1) * 100)));
    await new Promise((resolve) => sock.once('connect', resolve));
    if (lang) sock.write(`SET self LANGUAGE ${lang}\r\n`);
    sock.write(`SET self RATE ${ssipRate}\r\n`);
    sock.write('SPEAK\r\n');
    const safe = String(text).replace(/\r/g, '').split('\n').map(l => l.startsWith('.') ? '.' + l : l).join('\r\n');
    sock.write(safe + '\r\n.\r\n');
    return true;
  } catch (err) {
    console.error('tts-speak failed:', err);
    return false;
  }
});
ipcMain.on('tts-cancel', () => {
  if (spdConnection && !spdConnection.destroyed) {
    spdConnection.write('STOP self\r\n');
    spdConnection.write('CANCEL self\r\n');
  }
});

// Hide the native application menu (File / Edit / View). The Mosca Tee
// renderer already has its own toolbar, so the Electron menu just adds
// a redundant white bar above it.
Menu.setApplicationMenu(null);

let mainWindow;

function createWindow() {
  const { workAreaSize } = screen.getPrimaryDisplay();
  const width = Math.min(1600, workAreaSize.width);
  const height = Math.min(1000, workAreaSize.height);

  mainWindow = new BrowserWindow({
    width,
    height,
    minWidth: 800,
    minHeight: 600,
    center: true,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      sandbox: true
    },
    icon: path.join(__dirname, 'public/icon-512x512.png')
  });

  // Open external (http/https) links in the user's default browser
  // instead of inside the Electron window.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
