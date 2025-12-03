import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  // 选择目录
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  
  // NFO 文件操作
  readNFOFile: (filePath) => ipcRenderer.invoke('read-nfo-file', filePath),
  writeNFOFile: (filePath, content) => ipcRenderer.invoke('write-nfo-file', filePath, content),
  
  // 图片文件操作
  readImageFile: (filePath) => ipcRenderer.invoke('read-image-file', filePath),
  saveImageFile: (sourcePath, targetPath, width, height) => 
    ipcRenderer.invoke('save-image-file', sourcePath, targetPath, width, height),
  selectImageFile: () => ipcRenderer.invoke('select-image-file'),
  
  // 目录操作
  listDirectoryFiles: (dirPath) => ipcRenderer.invoke('list-directory-files', dirPath),
  scanDirectoryTree: (rootPath) => ipcRenderer.invoke('scan-directory-tree', rootPath),
  checkFileExists: (filePath) => ipcRenderer.invoke('check-file-exists', filePath),
  
  // 路径操作
  joinPath: (...paths) => ipcRenderer.invoke('join-path', ...paths),
  getBasename: (filePath) => ipcRenderer.invoke('get-basename', filePath)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
