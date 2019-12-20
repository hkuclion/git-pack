const {app, Menu, MenuItem,dialog} = require('electron');
const WindowManager=require('../../utility/WindowManager');
let SerialCall = null;
const ElectronConfig = require('electron-json-config');

let mainMenu = new Menu();
let menuItem_View = new MenuItem({
	label:'视图',
	type:'submenu',
	submenu:[
		{
			label:'刷新',
			accelerator:'F5',
			click:function (item, focusedWindow) {
				if (focusedWindow) focusedWindow.reload();
			}
		},
		{
			label:'重启程序',
			accelerator:'SHIFT+F5',
			click:function (item, focusedWindow) {
				app.relaunch();
				app.exit();
			}
		},
		{
			label:'全屏',
			accelerator:(() => process.platform === 'darwin' ? 'Ctrl+Command+F' : 'F11')(),
			click:function (item, focusedWindow) {
				if (focusedWindow) focusedWindow.setFullScreen(!focusedWindow.isFullScreen())
			}
		},
		{
			label:'开发者工具',
			accelerator:(() => process.platform === 'darwin' ? 'Alt+Command+I' : 'F12')(),
			click:function (item, focusedWindow) {
				if (focusedWindow) focusedWindow.toggleDevTools()
			}
		}
	],
});

mainMenu.append(menuItem_View);

module.exports = function(window){
	SerialCall = function (type, ...data) {
		window.webContents.send(type, ...data);
	};
	window.setMenu(mainMenu);
};