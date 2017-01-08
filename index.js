'use strict'

module.exports = (pluginContext) => {
	//to access context of app
	const app = pluginContext.app;
	//to open File/Folder
	const shell = pluginContext.shell;
	//to access filesystem
	const fs = require('fs');
	//to format filepath
	const path = require('path');
	
	//Utils
	var commonSearchUtil = require("./util/commonSearchUtil");
	var formatStringUtil = require("./util/formatStringUtil");
	var searchPathUtil = require("./util/searchPathUtil");
	var searchDriveUtil = require("./util/searchDriveUtil");
	var complementPathUtil = require("./util/complementPathUtil");
	
	//check if the file or folder exists
	//return 1:File 2:Folder -1,0:Invalid path
	function checkFileOrFolder(path) {
		try {
			var stat = fs.statSync(path);
			if(stat.isFile() == true){
				return 1;//file
			}else if(stat.isDirectory() == true){
				return 2;//folder
			}else{//unreachable
				return 0;//invalid
			}
		} catch(err) {
			if(err.code === 'ENOENT'){
				return -1;//invalid
			}
		}
	}

	function checkFileServer(query){
		//check if the path is file server.
		//if the path is file server, remove "\\" attached on head.
		var isFileServer = false;
		if(query.indexOf("\\\\") == 0 && 
		   query[("\\\\").length] != '\\' && 
		   query[("\\\\").length] != undefined){
			isFileServer = true;
		}
		return isFileServer;
	}
	
	function startup(){
		//Search Available Drives.
		searchDriveUtil.searchAvailableDrivesAsync();
	}
	
	function search (query, res) {
		//format query.
		var formattedQuery = formatStringUtil.formatString(query);
		
		//search available path considering unnecessary spaces.
		searchPathUtil.addOpenCommand(formattedQuery, res);
		
		//search available path to complement
		complementPathUtil.searchCandidates(formattedQuery, searchDriveUtil.getAvailableDrives(), res);

		//refresh command to the end of list
		searchDriveUtil.addRefreshCommand(query,res);
	}

	function execute (id, payload) {
		//open file or folder.
		switch (payload){
			case 'open':
				//open file/folder
				shell.openItem(`${id}`);
				break;
			case 'complement':
				//complement path (set id to query)
				app.setQuery(id);
				break;
			case 'refresh':
				//search available drives again.
				searchDriveUtil.searchAvailableDrivesAsync();
				app.setQuery(id);
				break;
			case 'pending':
			default:
				return;
		}
	}

	return { startup, search, execute };
}
