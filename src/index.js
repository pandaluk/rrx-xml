const { ipcRenderer } = require('electron')

let saveFolder = '';


document.getElementById('dirs').addEventListener('click', (e) => {
	e.preventDefault();
	e.stopPropagation();
	ipcRenderer.send('folderSelectionDialog', '')
});

ipcRenderer.on('folderSelectionDialog-reply', (event, arg) => {
	saveFolder = arg;
})

ipcRenderer.on('dropXMLFile-reply', (event, args) => {
	if (args[0] == 'success') fileListSuccess += args[1] + "\n"
	if (args[0] == 'error') fileListError += args[1] + "\n"
})

document.addEventListener('drop', async (event) => {
	event.preventDefault();
	event.stopPropagation();

	let fileListSuccess = '';
	let fileListError = '';
	let saveFolderFinal = '';

	for (let index = 0; index < event.dataTransfer.files.length; index++) {
		const file = event.dataTransfer.files[index];
		if (file.type != "text/xml") {
			alert("Arquivo não é xml")
			return
		}

		let retorno = await ipcRenderer.sendSync('dropXMLFile', [file.path, saveFolder])

		if (retorno[0] == 'success') {
			fileListSuccess = fileListSuccess.concat(retorno[1], "\n")
		}
		if (retorno[0] == 'error') {
			fileListError = fileListError.concat(retorno[1], "\n")
		}
		saveFolderFinal = retorno[2][0]


		if (index == event.dataTransfer.files.length - 1) {
			await ipcRenderer.send('dropXMLFile-return', [fileListSuccess, fileListError, saveFolderFinal])
		}
	}
});

document.addEventListener('dragover', (e) => {
	e.preventDefault();
	e.stopPropagation();
});

document.addEventListener('dragenter', (event) => {
});

document.addEventListener('dragleave', (event) => {
}); 
