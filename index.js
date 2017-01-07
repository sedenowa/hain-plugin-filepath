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
	var searchPathUtil = require("./util/searchPathUtil");
	var formatStringUtil = require("./util/formatStringUtil");
	var searchDriveUtil = require("./util/searchDriveUtil");
	
	const commandHeader = "/fp";
	
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
		var sortedAvailableFullPathes = 
			searchPathUtil.searchAvailablePath(formatStringUtil.formatString(query));
		
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
				var addToResFlag = false;
				switch(checkFileOrFolder(availableFullPath)){
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

		
		//format query.
		var normalizedQuery = formatStringUtil.formatString(query);

		//check if the path is file server.
		//if the path is file server, remove "\\" attached on head.
		var isFileServer = checkFileServer(normalizedQuery);
		if(isFileServer == true){
			normalizedQuery = normalizedQuery.substring(("\\\\").length);
		}
		
		//split by separator('\' or '/').
		var splittedQuery = normalizedQuery.split(path.sep);
		
		//if isFileServer is true, combine 1st and 2nd element.
		if(isFileServer == true){
			if(splittedQuery.length >= 2){
				splittedQuery[1] = "\\\\" + splittedQuery[0] + "\\" + splittedQuery[1];
				splittedQuery.shift();
			}else if (splittedQuery.length == 1){
				splittedQuery[0] = "\\\\" + splittedQuery[0];
			}
		}
		
		//search available path to complement
		var foundCandidates = [];
		//check if the current path is empty
		var searchingSplittedQueryBase = splittedQuery.slice();
		var lengthOfsearchingSplittedQueryBase = searchingSplittedQueryBase.length
		var currentDirectory;
		var searchKeyword;
		if(lengthOfsearchingSplittedQueryBase == 0){
			currentDirectory = "";
			searchKeyword = "";
		}else if(lengthOfsearchingSplittedQueryBase == 1){
			currentDirectory = "";
			searchKeyword = searchingSplittedQueryBase[0];
		}else{// length >= 2
			currentDirectory = "";
			for(index = 0 ; index < lengthOfsearchingSplittedQueryBase - 1 ; index++){
				currentDirectory = currentDirectory + searchingSplittedQueryBase[index] + "\\";
			}
			//currentDirectory.pop();
			searchKeyword = searchingSplittedQueryBase[lengthOfsearchingSplittedQueryBase - 1];
		}
		
		//check the existence of currentDirectory.
		if(currentDirectory == "" || checkFileOrFolder(currentDirectory) == 2){
			//find candidates
			if(currentDirectory == ""){
				var availableDrives = searchDriveUtil.getAvailableDrives();
				for (var index = 0, len = availableDrives.length ; index < len ; index++){
					if(availableDrives[index].isAvailable == true){
						foundCandidates.push(
							{
								path:availableDrives[index].driveName,
								state:"drive"
							}
						);
					}
				}
			}else{// when checkFileOrFolder(currentDirectory) == 2
				//(todo) make async (use fs.readdir)
				var foundList = fs.readdirSync(currentDirectory);
				//foundCandidates = fs.readdirSync(currentDirectory);
				for(var index = 0, len = foundList.length ; index < len ; index++){
					switch(checkFileOrFolder(currentDirectory + foundList[index])){
						case 1://file
							foundCandidates.push(
								{
									path:foundList[index],
									state:"file"
								}
							);
							break;
						case 2://folder
							foundCandidates.push(
								{
									path:foundList[index],
									state:"folder"
								}
							);
							break;
						default:
							//do nothing
							break;
					}
				}
			}
			
			//filter with searchKeyword and add to res
			for(var index = 0, len = foundCandidates.length ; index < len ; index++){
				//check if candidates contains searchKeyword on head
				//if(foundCandidates[index].path.toLocaleLowerCase().indexOf(searchKeyword.toLocaleLowerCase()) == 0 && foundCandidates[index].path != searchKeyword){
				if(foundCandidates[index].path.toLocaleLowerCase().indexOf(searchKeyword.toLocaleLowerCase()) == 0){
					//add to res.
					var descriptionMessage = 
						"Set this path : \"" + foundCandidates[index].path + "\"";
					//var redirect;
					var innerId,innerTitle,innerRedirect;
					switch(foundCandidates[index].state){
						case "drive":
							innerTitle = "";
							innerId = 
								commandHeader + " " + 
								currentDirectory + foundCandidates[index].path + "\\";
							innerRedirect = innerId;
							break;
						case "file":
							innerTitle = ".\\";
							innerId = 
								commandHeader + " " + 
								currentDirectory + foundCandidates[index].path;
							innerRedirect = innerId;
							break;
						case "folder":
							innerTitle = ".\\";
							innerId = 
								commandHeader + " " + 
								currentDirectory + foundCandidates[index].path + "\\";
							innerRedirect = innerId;
							break;
					}
					innerTitle = innerTitle + 
						"<b>" + foundCandidates[index].path.substring(0,searchKeyword.length) + "</b>" + 
						foundCandidates[index].path.substring(searchKeyword.length);
					res.add(
						{
							//id: checkingDrive,
							id: innerId,
							payload: 'complement',
							title: innerTitle,
							desc: descriptionMessage,
							redirect:innerRedirect
						}
					);
				}
			}
		}
		
		//refresh command to the end of list
		res.add(
			{
				id: commandHeader + query,
				payload: 'refresh',
				title: "Refresh",
				desc: "Search Available Drives Again."
			}
		);
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
