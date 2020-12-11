const {BrowserWindow, ipcMain, dialog} = require('electron');
const path = require('path');
const url = require('url');

const windowStateKeeper = require('electron-window-state');

let windowState = windowStateKeeper({
	defaultWidth:1280,
	defaultHeight:720,
	file:'window_'+ path.basename(__dirname)+'.json'
});

module.exports = function(){
	let window = new BrowserWindow({
		x:windowState.x,
		y:windowState.y,
		width:windowState.width,
		height:windowState.height,
		show:false,
		webPreferences:{
			preload: path.join(__dirname, 'preload.js'),
		}
	});

	windowState.manage(window);
	require('./menu')(window);

	window.loadURL(url.format({
		pathname:path.join(__dirname,'view','index.html'),
		protocol:'file:',
		slashes:true
	}));

	//window.on('ready-to-show', () => {
	window.webContents.on('did-finish-load', () => {
		window.show();
		window.focus();
	});

	return window;
};

ipcMain.on('showOpenDialogSync',(event, options)=>{
	event.returnValue = dialog.showOpenDialogSync(options);
})



