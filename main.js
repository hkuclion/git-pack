const {app} = require('electron');
const WindowManager = require('./utility/WindowManager');

app.on('ready', () => {
	let mainWindow;

	const gotTheLock = app.requestSingleInstanceLock();

	if (!gotTheLock) {
		app.quit()
	} else {
		app.on('second-instance', (event, commandLine, workingDirectory) => {
			if (mainWindow) {
				if (mainWindow.isMinimized()) mainWindow.restore();
				mainWindow.focus();
			}
		});

		//app.on('ready', () => {
			mainWindow = WindowManager.getWindow('main');
		//});
	}
});

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});
