
const { app, BrowserWindow, ipcMain, dialog } = require('electron')

const os = require('os');
const path = require('path');
var fs = require('fs');
var parser = require('xml2json');

function createWindow() {

  const win = new BrowserWindow({
    preload: path.join(__dirname, '/src/index.js'),

    alwaysOnTop: false,
    resizable: false,
    width: 800,
    height: 600,
    nodeIntegration: false,
    enableRemoteModule: false,
    contextIsolation: true,
    sandbox: true,
    webPreferences: {
      nodeIntegration: true
    }
  })
  win.removeMenu()
  win.loadFile('src/index.html')
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})


const desktopDir = path.join(os.homedir(), "Desktop");

const saveFilePath = desktopDir;
ipcMain.on('dropXMLFile', (event, args) => {

  let filePath = args[0]
  let saveFolder = args[1]

  fs.readFile(filePath, function (err, data) {

    let json = JSON.parse(parser.toJson(data, { reversible: true }));
    let itens = json['nfeProc']['NFe']['infNFe']['det']

    if (itens.length > 1) {
      for (const item of itens) {
        let dateSplited = item['prod']['rastro']['dVal'].$t.split('-').slice(0, 2).join('')
        let newLoteValue = item['prod']['rastro']['nLote'].$t.concat(dateSplited)

        item['prod']['rastro']['nLote'].$t = newLoteValue
      }
    } else {
      let dateSplited = itens['prod']['rastro']['dVal'].$t.split('-').slice(0, 2).join('')
      let newLoteValue = itens['prod']['rastro']['nLote'].$t.concat(dateSplited)

      itens['prod']['rastro']['nLote'].$t = newLoteValue
    }



    let stringified = JSON.stringify(json);
    var xml = parser.toXml(stringified);

    fs.writeFile(`${saveFolder == '' ? saveFilePath : saveFolder}/${filePath.split(`\\`).slice(-1).pop()}`, xml, function (err, data) {
      if (err) {
        dialog.showMessageBox(BrowserWindow, {
          title: "Erro",
          message: `Occoreu um erro no seguinte XML, ${filePath.split(`\\`).slice(-1).pop()}`,
          detail: err,
          type: "error",
        })
        event.returnValue = ['error', filePath.split(`\\`).slice(-1).pop(), saveFolder == '' ? saveFilePath : saveFolder]
      } else {
        event.returnValue = ['success', filePath.split(`\\`).slice(-1).pop(), saveFolder == '' ? saveFilePath : saveFolder]
      }
    });
  });
});

ipcMain.on('folderSelectionDialog', (event, arg) => {

  dialog.showOpenDialog({ properties: ['openDirectory'] }).then(result => {
    event.reply('folderSelectionDialog-reply', result.filePaths)
  })

})

ipcMain.on('dropXMLFile-return', (event, args) => {
  console.log("AQUIIIIIIIIIIIIII", args)
  dialog.showMessageBox(null, {
    title: "Mensagem",
    message: "XML(s) atualizado(s) com sucesso!",
    detail: `Os seguintes XML's foram salvos na pasta -> ${args[2]} . \n ${args[0]} \n\n 
      ${args[1].length > 1 ? 'Os seguintes XML(s) tiveram algum erro.' : ''} \n ${args[1]}`,
    type: "info",
  }, null)
})