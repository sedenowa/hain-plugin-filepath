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
	var commonUtil = require("./util/commonUtil");
	var commonSearchUtil = require("./util/commonSearchUtil");
	var formatStringUtil = require("./util/formatStringUtil");
	var searchPathUtil = require("./util/searchPathUtil");
	var searchDriveUtil = require("./util/searchDriveUtil");
	var complementPathUtil = require("./util/complementPathUtil");
	
	//const commandHeader = "/fp";
	const commandHeader = commonUtil.commandHeader;
	
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
		//
		var formattedQuery = formatStringUtil.formatString(query);
		
		var sortedAvailableFullPathes = 
			searchPathUtil.searchAvailablePath(formattedQuery);
		
		//add to result (when no available path is found)
		if(sortedAvailableFullPathes.length == 0){
			//do nothing
		}else{//add to result (when no available path is found)
			for(var index = 0 , len = sortedAvailableFullPathes.length ; index < len ; index++){
				//Check state of formatted path (File or Folder or not).
				//and set Description Message according to the state.
				var descriptionMessage = "";
				var availableFullPath = sortedAvailableFullPathes[index][0].slice();
				var distance = sortedAvailableFullPathes[index][1];
				var status = sortedAvailableFullPathes[index][2];
				var addToResFlag = false;
				//switch(checkFileOrFolder(availableFullPath)){
				switch(status){
					case -1://invalid
					case 0://invalid
						//descriptionMessage = "Not File/Folder. Cannot open."
						break;
					case 1://file
						//extract file name
						//(todo) extract BBB from "C:\AAA\BBB\" <- when unnecessary "\" exists.
						var filename = availableFullPath.slice().split("\\").pop();
						descriptionMessage = "Open this File : \"" + filename + 
							"\" ( Distance = " + distance + " )";
						addToResFlag = true;
						break;
					case 2://folder
						//extract folder name
						//(todo) extract BBB from "C:\AAA\BBB\" <- when unnecessary "\" exists.
						var foldername = availableFullPath.slice().split("\\").pop();	
						descriptionMessage = "Open this Folder : \"" + foldername + 
							"\" ( Distance = " + distance + " )";
						addToResFlag = true;
						break;
					default:
						break;
				}
				//add to res.
				if(addToResFlag == true){
					res.add(
						{
							id: availableFullPath,
							payload: 'open',
							title: availableFullPath,
							desc: descriptionMessage
						}
					);
				}
			}
		}

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
