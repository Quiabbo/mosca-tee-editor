const { contextBridge } = require('electron');

// Expose safe APIs to the renderer process
contextBridge.exposeInMainWorld('electron', {
  app: {
    version: process.env.npm_package_version
  }
});
