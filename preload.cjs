const { contextBridge, ipcRenderer } = require('electron');

// Expose safe APIs to the renderer process
contextBridge.exposeInMainWorld('electron', {
  app: {
    version: process.env.npm_package_version
  },
  // TTS bridge: lets the renderer drive the host speech-dispatcher
  // through the main process (Web Speech API often has no voices in
  // the Flatpak sandbox).
  tts: {
    speak: (text, lang, rate) => ipcRenderer.invoke('tts-speak', { text, lang, rate }),
    cancel: () => ipcRenderer.send('tts-cancel'),
    test: () => ipcRenderer.invoke('tts-test'),
  },
});
