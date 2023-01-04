const electron = require('electron');
const { contextBridge, ipcRenderer } = electron;


ipcRenderer.on('console.log',(ev,...args)=>{
	console.log(...args);
});

contextBridge.exposeInMainWorld('selectFolder', function(options){
	let default_options = {};

	return ipcRenderer.sendSync('showOpenDialogSync', Object.assign({}, default_options, options))
});



let loadBranches = async function(path){
	const output = await ipcRenderer.invoke('runCmd', 'git', ['branch', '--list'], {
		cwd:path,
	})
	
	return output.split('\n').filter(line => line.length).map(line => {
		let matches = line.match(/^(\*)?\s+(.+)$/);
		return {
			selected:!!matches[1],
			label:matches[2],
		}
	});
}

contextBridge.exposeInMainWorld('loadBranches', loadBranches);

let loadCommits = function(path,branch){
	const options ={
		repo: path,
		number: 200,
		branch,
		fields:[
			'hash',
			'subject',
			'authorName',
			'authorDateRel',
			'committerDate',
		],
		nameStatus:false,
		execOptions:{
			maxBuffer: 5 * 1024 * 1024
		}
	};
	ipcRenderer.invoke('gitlog', options).then((...args)=>console.log(...args))
	return ipcRenderer.invoke('gitlog', options);
}

contextBridge.exposeInMainWorld('loadCommits', loadCommits);

let listGitCommitsFiles = async function (path, info, filter = 'd') {
	let output;
	if(info.source_commit === null){
		output = await ipcRenderer.invoke('runCmd', 'git', ['ls-tree', '--name-only', '-r', info.target_commit], {
			cwd:path,
		})
	}
	else{
		output = await ipcRenderer.invoke('runCmd','git', ['diff', info.source_commit, info.target_commit, '--name-only', `--diff-filter=${filter}`], {
			cwd:path,
		})
	}

	let files = output.split('\n').filter(line => line.length);
	if (!files.length) {
		throw new Error('No File To Pack');
	}
	return files
};

contextBridge.exposeInMainWorld('listGitCommitsFiles', listGitCommitsFiles);

let packGitCommits = async function(path,info){
	let files = await listGitCommitsFiles(path, info)
	let params = [];
	params.push('archive');
	params.push(info.target_commit);
	params.push('--format=zip');
	params.push('-o');
	params.push(info.filename);
	if(info.prefix){
		params.push('--prefix='+info.prefix)
	}
	params.push(...files);

	await ipcRenderer.invoke('runCmd','git',params,{
		cwd: path,
	})
	return files;
}

contextBridge.exposeInMainWorld('packGitCommits', packGitCommits);

contextBridge.exposeInMainWorld('pwd', ipcRenderer.sendSync('getGitPathSync'))
