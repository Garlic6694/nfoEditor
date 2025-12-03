import { join, basename } from 'path'
import icon from '../../resources/icon.png?asset'
import fs from 'fs'
import sharp from 'sharp'
const { app, shell, BrowserWindow, ipcMain, dialog } = require('electron')

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  const isDev = !app.isPackaged
  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
  
  return mainWindow
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.jellyfin.nfo-editor')
  }

  // IPC handlers for file operations
  
  // 选择目录
  ipcMain.handle('select-directory', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    })
    
    if (result.canceled) {
      return null
    }
    
    return result.filePaths[0]
  })
  
  // 读取 NFO 文件
  ipcMain.handle('read-nfo-file', async (event, filePath) => {
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      return { success: true, content }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })
  
  // 写入 NFO 文件
  ipcMain.handle('write-nfo-file', async (event, filePath, content) => {
    try {
      fs.writeFileSync(filePath, content, 'utf-8')
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })
  
  // 选择图片文件
  ipcMain.handle('select-image-file', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'] }
      ]
    })
    
    if (result.canceled) {
      return null
    }
    
    return result.filePaths[0]
  })
  
  // 读取图片文件（返回 base64）
  ipcMain.handle('read-image-file', async (event, filePath) => {
    try {
      const buffer = fs.readFileSync(filePath)
      const base64 = buffer.toString('base64')
      const ext = filePath.split('.').pop().toLowerCase()
      const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg'
      return { success: true, data: `data:${mimeType};base64,${base64}` }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })
  
  // 保存图片文件（支持缩放）
  ipcMain.handle('save-image-file', async (event, sourcePath, targetPath, width, height) => {
    try {
      let pipeline = sharp(sourcePath)
      
      // 如果指定了尺寸，进行缩放
      if (width && height) {
        pipeline = pipeline.resize(parseInt(width), parseInt(height), {
          fit: 'cover',
          position: 'center'
        })
      }
      
      // 转换为 JPEG 格式
      await pipeline
        .jpeg({ quality: 90 })
        .toFile(targetPath)
      
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })
  
  // 列出目录中的文件
  ipcMain.handle('list-directory-files', async (event, dirPath) => {
    try {
      const files = fs.readdirSync(dirPath)
      return { success: true, files }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })
  
  // 检查文件是否存在
  ipcMain.handle('check-file-exists', async (event, filePath) => {
    return fs.existsSync(filePath)
  })
  
  // 路径拼接
  ipcMain.handle('join-path', async (event, ...paths) => {
    return join(...paths)
  })
  
  // 递归扫描目录树
  ipcMain.handle('scan-directory-tree', async (event, rootPath) => {
    try {
      const scan = (dirPath) => {
        const name = basename(dirPath)
        const node = {
          label: name,
          path: dirPath,
          children: []
        }

        try {
          const files = fs.readdirSync(dirPath)
          
          for (const file of files) {
            // 跳过隐藏文件
            if (file.startsWith('.')) continue
            
            const filePath = join(dirPath, file)
            try {
              const stats = fs.statSync(filePath)
              if (stats.isDirectory()) {
                node.children.push(scan(filePath))
              }
            } catch (e) {
              // 忽略无法访问的文件/目录
            }
          }
        } catch (e) {
          // 忽略无法读取的目录
        }
        
        // 按名称排序
        node.children.sort((a, b) => a.label.localeCompare(b.label))
        
        return node
      }

      return { success: true, data: [scan(rootPath)] }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  // 获取文件名
  ipcMain.handle('get-basename', async (event, filePath) => {
    return basename(filePath)
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
