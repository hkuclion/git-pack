const {BrowserWindow, ipcMain, dialog} = require('electron');
const path = require('path');
const url = require('url');
const {gitlog} = require('gitlog2');
const {spawn} = require('child_process');

const windowStateKeeper = require('electron-window-state');
const fs = require("fs");

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
ipcMain.on('getGitPathSync', function (event) {
	if (process.argv.length >= 3) {
		if (fs.existsSync(path.join(process.argv[2], '.git'))) {
			event.returnValue = process.argv[2];
		}
	}
	event.returnValue = undefined;
})

let runCmd = function (cmd, param, options, success_codes = [0]) {
	return new Promise((resolve, reject) => {
		let spawned = spawn(cmd, param, options);
		let output = '';
		let error = '';
		spawned.stdout.on('data', (data) => {
			output += data;
		});
		spawned.stderr.on('data', (data) => {
			error += data;
		});
		spawned.on('close', (code) => {
			if (success_codes.findIndex(success_code => success_code === code) !== -1) {
				resolve(output);
			} else reject(new Error(error));
		});
	})
};


ipcMain.handle('runCmd', function (event, ...args){
	return runCmd(...args);
})
ipcMain.handle('gitlog', function (event, ...args){
	return gitlog(...args);
})
