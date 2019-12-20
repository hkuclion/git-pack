const {BrowserWindow, app, dialog} = require('electron');
const WindowManager = require('./utility/WindowManager');

global.alert = (message) => {
	if (typeof(message) != 'string') {
		message = JSON.stringify(message);
	}
	dialog.showMessageBox({title:'alert', detail:message});
};
global.remote_console = (...args) => {
	WindowManager.getWindow('main').webContents.send(
		'console.log', ...args
	);
};

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
