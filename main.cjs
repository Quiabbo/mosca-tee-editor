const { app, BrowserWindow, Menu, screen, shell, ipcMain } = require('electron');
const path = require('path');
const net = require('net');
const fs = require('fs');
const { execFile } = require('child_process');
const isDev = process.env.ELECTRON_IS_DEV === '1';

// --- Speech Dispatcher bridge (SSIP over Unix socket) ---
// The renderer's window.speechSynthesis often isn't wired to the host
// speech-dispatcher inside the Flatpak sandbox. We expose an IPC method
// that opens the socket from the Node main process and sends SSIP commands.
// If the SSIP socket is not available, we fall back to the `spd-say` CLI.
let spdConnection = null;
let spdReady = null; // Promise<sock> resolved once handshake completes
let ttsBackend = 'none'; // 'ssip' | 'spd-say' | 'none'

function getSpdSocketPath() {
  const uid = (process.getuid && process.getuid()) || 0;
  const candidates = [
    process.env.SPEECH_DISPATCHER_SOCKET,
    process.env.XDG_RUNTIME_DIR && path.join(process.env.XDG_RUNTIME_DIR, 'speech-dispatcher', 'speechd.sock'),
    `/run/user/${uid}/speech-dispatcher/speechd.sock`,
  ].filter(Boolean);
  for (const c of candidates) {
    try {
      fs.accessSync(c, fs.constants.R_OK | fs.constants.W_OK);
      console.log('[TTS] Found speech-dispatcher socket:', c);
      return c;
    } catch (_) { /* try next */ }
  }
  console.warn('[TTS] No speech-dispatcher socket found. Checked:', candidates);
  return null;
}

function ensureSpd() {
  if (spdReady) return spdReady;

  const socketPath = getSpdSocketPath();
  if (!socketPath) {
    return Promise.reject(new Error('No speech-dispatcher socket found'));
  }

  const sock = net.createConnection(socketPath);
  sock.setEncoding('utf8');
  spdConnection = sock;
  // Drain server responses so the buffer does not stall future commands.
  sock.on('data', () => { /* discard */ });
  spdReady = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      console.error('[TTS] SSIP connection timeout');
      sock.destroy();
      spdConnection = null;
      spdReady = null;
      reject(new Error('SSIP connection timeout'));
    }, 5000);

    sock.once('connect', () => {
      clearTimeout(timeout);
      sock.write('SET self CLIENT_NAME user:moscatee:speak\r\n');
      ttsBackend = 'ssip';
      console.log('[TTS] SSIP connected and handshake sent');
      resolve(sock);
    });
    sock.once('error', (err) => {
      clearTimeout(timeout);
      console.error('[TTS] speech-dispatcher socket error:', err.message);
      spdConnection = null;
      spdReady = null;
      reject(err);
    });
  });
  sock.on('close', () => {
    spdConnection = null;
    spdReady = null;
    if (ttsBackend === 'ssip') ttsBackend = 'none';
  });
  return spdReady;
}

// spd-say CLI fallback
function speakViaSpdSay(text, lang, rate) {
  return new Promise((resolve) => {
    const args = ['-e', '-w']; // -e for stderr, -w for wait
    if (lang) {
      // spd-say uses 2-letter language codes
      args.push('-l', lang.split('-')[0]);
    }
    if (rate) {
      const spdRate = Math.max(-100, Math.min(100, Math.round(((rate || 1) - 1) * 100)));
      args.push('-r', String(spdRate));
    }
    args.push('--', String(text));

    execFile('spd-say', args, { timeout: 30000 }, (err) => {
      if (err) {
        console.error('[TTS] spd-say failed:', err.message);
        resolve(false);
      } else {
        if (ttsBackend === 'none') ttsBackend = 'spd-say';
        resolve(true);
      }
    });
  });
}

// Check if spd-say is available
let spdSayAvailable = null; // null = untested, true/false after test
function checkSpdSay() {
  if (spdSayAvailable !== null) return Promise.resolve(spdSayAvailable);
  return new Promise((resolve) => {
    execFile('spd-say', ['--version'], { timeout: 5000 }, (err) => {
      spdSayAvailable = !err;
      console.log('[TTS] spd-say available:', spdSayAvailable);
      resolve(spdSayAvailable);
    });
  });
}

ipcMain.handle('tts-speak', async (_event, { text, lang, rate }) => {
  // Strategy 1: SSIP socket
  try {
    const sock = await ensureSpd();
    const ssipRate = Math.max(-100, Math.min(100, Math.round(((rate || 1) - 1) * 100)));
    if (lang) sock.write(`SET self LANGUAGE ${lang}\r\n`);
    sock.write(`SET self RATE ${ssipRate}\r\n`);
    sock.write('SPEAK\r\n');
    const safe = String(text).replace(/\r/g, '').split('\n').map(l => l.startsWith('.') ? '.' + l : l).join('\r\n');
    sock.write(safe + '\r\n.\r\n');
    return true;
  } catch (err) {
    console.warn('[TTS] SSIP failed, trying spd-say:', err.message);
  }

  // Strategy 2: spd-say CLI
  try {
    const hasSpdSay = await checkSpdSay();
    if (hasSpdSay) {
      const result = await speakViaSpdSay(text, lang, rate);
      if (result) return true;
    }
  } catch (err) {
    console.warn('[TTS] spd-say failed:', err.message);
  }

  // All native strategies failed — renderer should use Web Speech API
  console.warn('[TTS] All native TTS strategies failed');
  return false;
});

ipcMain.on('tts-cancel', () => {
  if (spdConnection && !spdConnection.destroyed) {
    spdConnection.write('STOP self\r\n');
    spdConnection.write('CANCEL self\r\n');
  }
  // Also try to kill any running spd-say processes
  try { execFile('killall', ['spd-say'], () => {}); } catch (_) {}
});

// Test if TTS is available at all
ipcMain.handle('tts-test', async () => {
  // Test SSIP
  try {
    await ensureSpd();
    console.log('[TTS] Test: SSIP works');
    return { available: true, backend: 'ssip' };
  } catch (_) { /* continue */ }

  // Test spd-say
  const hasSpdSay = await checkSpdSay();
  if (hasSpdSay) {
    console.log('[TTS] Test: spd-say works');
    return { available: true, backend: 'spd-say' };
  }

  console.warn('[TTS] Test: no native backend available');
  return { available: false, backend: 'none' };
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
    mainWindow.loadFile(path.join(__dirname, 'dist-web/index.html'));
  }
  
  // Temporarily enable DevTools in production to debug the white screen
  mainWindow.webContents.openDevTools();

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
