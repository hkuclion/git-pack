class WindowManager{
	static getWindow(name,...args){
		if(!windows.has(name)){
			let newWindow = require(`../${name}Window/creator.js`)(...args);
			newWindow.on('closed', () => {
				WindowManager.deleteWindow(name);
			});
			windows.set(name, newWindow);
			return newWindow;
		}
		let window = windows.get(name);
		window.focus();
		return window;
	}

	static hasWindow(name){
		return windows.has(name);
	}

	static deleteWindow(name){
		windows.delete(name);
	}
}

let windows = new Map();

module.exports = WindowManager;
