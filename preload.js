const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('versions', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron,
  ping: () => ipcRenderer.invoke('ping')
})

contextBridge.exposeInMainWorld('gdevelop485', {
  onSendData: data => ipcRenderer.invoke('onSendData', data),
  onReadData: callback => ipcRenderer.on('receive-data', (e, data) => callback(data)),
  onPortOpen: callback => ipcRenderer.on('port-open', (e, data) => callback(data)),
  onPortClose: callback => ipcRenderer.on('port-close', (e, data) => callback(data)),
  onPortError: callback => ipcRenderer.on('port-error', (e, data) => callback(data)),
  onUpdateHexMapping: newMapping => ipcRenderer.invoke('onUpdateHexMapping', newMapping)
})