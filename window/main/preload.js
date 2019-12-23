const electron = require('electron');
const { dialog, process } = electron.remote;
const { gitlog } = electron.remote.require('gitlog2');
const { spawn } = electron.remote.require('child_process');
const fs = electron.remote.require('fs');
const path = electron.remote.require('path');

electron.ipcRenderer.on('console.log',(ev,...args)=>{
	console.log(...args);
});

window.selectFolder = function(options){
	let default_options = {};

	return dialog.showOpenDialogSync(Object.assign({},default_options,options));
};


let runCmd = function(cmd,param,options,success_codes = [0]){
	return new Promise((resolve, reject) => {
		let spawned = spawn(cmd,param,options);
		let output = '';
		let error = '';
		spawned.stdout.on('data', (data) => {
			output += data;
		});
		spawned.stderr.on('data', (data) => {
			error += data;
		});
		spawned.on('close', (code) => {
			if(success_codes.findIndex(success_code => success_code === code) !== -1){
				resolve(output);
			}
			else reject(new Error(error));
		});
	})
};

window.loadBranches = function(path){
	return new Promise((resolve, reject) => {
		runCmd('git',['branch','--list'],{
			cwd: path,
		}).then(output=>{
			let branches = output.split('\n').filter(line=>line.length).map(line=>{
				let matches = line.match(/^(\*)?\s+([\w\-]+)$/);
				return {
					selected: !!matches[1],
					label: matches[2],
				}
			});
			resolve(branches);
		}).catch(reject);
	});
};

window.loadCommits = function(path,branch){
	return new Promise((resolve, reject) => {
		const options ={
			repo: path,
			number: 50,
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
				maxBuffer: 1000 * 1024
			}
		};
		gitlog(options, function(error, commits) {
			// Commits is an array of commits in the repo
			if(error) reject(error);
			else resolve(commits);
		});
	})

};

window.packGitCommits = function(path,info){
	return new Promise((resolve, reject) => {
		runCmd('git',['diff',info.source_commit, info.target_commit,'--name-only','--diff-filter=d'],{
			cwd: path,
		}).then(output=>{
			let files = output.split('\n').filter(line=>line.length);
			if(!files.length){
				return reject('No File To Pack');
			}

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
			runCmd('git',params,{
				cwd: path,
			}).then(()=>{
				resolve(files);
			}).catch(reject);
		}).catch(reject);
	});
};

window.pwd = null;
if(process.argv.length >= 3){
	if(fs.existsSync(path.join(process.argv[2],'.git'))){
		window.pwd = process.argv[2];
	}
}

