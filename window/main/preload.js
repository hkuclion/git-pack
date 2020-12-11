const electron = require('electron');
const { contextBridge, ipcRenderer } = electron;
const { gitlog } = require('gitlog2');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

ipcRenderer.on('console.log',(ev,...args)=>{
	console.log(...args);
});

contextBridge.exposeInMainWorld('selectFolder', function(options){
	let default_options = {};

	return ipcRenderer.sendSync('showOpenDialogSync', Object.assign({}, default_options, options))
});

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

let loadBranches = function(path){
	return new Promise((resolve, reject) => {
		runCmd('git',['branch','--list'],{
			cwd: path,
		}).then(output=>{
			let branches = output.split('\n').filter(line=>line.length).map(line=>{
				let matches = line.match(/^(\*)?\s+(.+)$/);
				return {
					selected: !!matches[1],
					label: matches[2],
				}
			});
			resolve(branches);
		}).catch(reject);
	});
}

contextBridge.exposeInMainWorld('loadBranches', loadBranches);

let loadCommits = function(path,branch){
	return new Promise((resolve, reject) => {
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
		gitlog(options, function(error, commits) {
			// Commits is an array of commits in the repo
			if(error) reject(error);
			else resolve(commits);
		});
	})

}

contextBridge.exposeInMainWorld('loadCommits', loadCommits);

let listGitCommitsFiles = function (path, info, filter = 'd') {
	return new Promise((resolve, reject) => {
		runCmd('git', ['diff', info.source_commit, info.target_commit, '--name-only', `--diff-filter=${filter}`], {
			cwd:path,
		}).then(output => {
			let files = output.split('\n').filter(line => line.length);
			if (!files.length) {
				return reject('No File To Pack');
			}
			resolve(files);
		});
	});
};

contextBridge.exposeInMainWorld('listGitCommitsFiles', listGitCommitsFiles);

let packGitCommits = function(path,info){
	return new Promise(async (resolve, reject) => {
		listGitCommitsFiles(path,info).then(files=>{
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
}

contextBridge.exposeInMainWorld('packGitCommits', packGitCommits);

let pwd = null;

ipcRenderer.invoke('get-git').then(response=> contextBridge.exposeInMainWorld('pwd', response))