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
	
	const commandHeader = "/fp";
	
	function initAvailableDrives(){
		var innnerAvailableDrives = [];
		const ASCIICodeOfA = 65 , ASCIICodeOfZ = 90;
		for (var ASCIICode = ASCIICodeOfA; ASCIICode <= ASCIICodeOfZ ; ASCIICode++){
			var checkingDrive = String.fromCharCode(ASCIICode) + ":";
			innnerAvailableDrives.push(
				{
					driveName:checkingDrive,
					isAvailable:false,
					failureOfAccess:0
				}
			);
		}
		return innnerAvailableDrives;
	}
	var availableDrives = initAvailableDrives();
	//init availableDrives
	const failureThreshold = 10;
	
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

	//remove all specified characters from string
	//return string (removed characters).
	//arguments are not modified.
	function removeCharacters(targetString,removingCharacterArray){
		var copyOfTargetString = targetString;
		for(var index = 0 ; index < removingCharacterArray.length ; index++){
			var removingCharacter = removingCharacterArray[index];
			switch(removingCharacter){
				case "*":
				case "?":
				case "|":
					//add '\' to characters which need '\' 
					removingCharacter = "\\" + removingCharacter;
				default:
					//do nothing.
					break;
			}
			copyOfTargetString = 
				copyOfTargetString.replace(
					new RegExp(removingCharacter,"g")
					,""
				);
		}
		return copyOfTargetString;
	}
	
	//check the position of space(' ' or '　').
	//return array of positions.
	function checkPositionOfSpaces(targetString){
		var positionOfSpaces = [];
		for(var index = 0 , len = targetString.length ; index < len; index++){
			if((targetString[index] == ' ') || (targetString[index] == '　' )){
				positionOfSpaces.push(index);
			}
		}
		return positionOfSpaces;
	}

	function searchAvailablePathConsideringUnnecessarySpace(
		availableFullPathes, availableCurrentPath , splittedRemainingPath
	){
		searchAvailablePathConsideringUnnecessarySpaceWithDistance(
			availableFullPathes, availableCurrentPath , splittedRemainingPath , 0 , []
		);
	}

	function searchAvailablePathConsideringUnnecessarySpaceWithDistance(
		availableFullPathes, availableCurrentPath , splittedRemainingPath , 
		 currentDistance , alreadyCheckedPathes
	){
		if(splittedRemainingPath.length > 0){
			var targetPath = splittedRemainingPath[0];
			var checkingPath = "";
			if(availableCurrentPath == ""){
				checkingPath = targetPath;
			}else{
				checkingPath = availableCurrentPath + "\\" + targetPath;
			}
			//check the path if it is checked at first
			var alreadyCheckedFlag = false;
			for(var index = 0 , len = alreadyCheckedPathes.length ; index < len ; index++){
				if(alreadyCheckedPathes[index] == checkingPath){
					alreadyCheckedFlag = true;
				}
			}
			//check only when the path is checked at first
			if(alreadyCheckedFlag == false){
				alreadyCheckedPathes.push(checkingPath);
				switch(checkFileOrFolder(checkingPath)){
					case -1:
					case 0:
						//do nothing
						break;
					case 1://Available File
					case 2://Available Folder
						var shiftedSplittedRemainingPath = splittedRemainingPath.slice();
						shiftedSplittedRemainingPath.shift();
						var nextAvailableCurrentPath = checkingPath;
						var nextDistance = currentDistance;
						searchAvailablePathConsideringUnnecessarySpaceWithDistance(
							availableFullPathes, nextAvailableCurrentPath,
							shiftedSplittedRemainingPath, nextDistance , alreadyCheckedPathes
						);
						break;
					default:
						//do nothing
						break;
				}
			}else{
				//do nothing
			}

			//count the number of ' ' and '　'.
			var positionOfSpaces = checkPositionOfSpaces(targetPath);
			var numberOfSpaces = positionOfSpaces.length;
			if(numberOfSpaces > 0){
				//remove one of spaces and check the path. 
				for(var index = 0; index < numberOfSpaces; index++){
					var nextSplittedRemainingPath = splittedRemainingPath;
					var firstHalfOfTargetPathRemovedSpace = targetPath;
					var latterHalfOfTargetPathRemovedSpace = targetPath;
					var targetPathRemovedSpace = 
						firstHalfOfTargetPathRemovedSpace.slice(0,positionOfSpaces[index]) + 
						latterHalfOfTargetPathRemovedSpace.slice(positionOfSpaces[index]+1);
					nextSplittedRemainingPath[0] = targetPathRemovedSpace;
					var nextDistance = currentDistance + 1;
					var nextAvailableCurrentPath = availableCurrentPath;

					//check the path if it is checked at first
					var alreadyCheckedFlag = false;
					for(var index = 0 , len = alreadyCheckedPathes.length ; index < len ; index++){
						if(alreadyCheckedPathes[index] == checkingPath){
							alreadyCheckedFlag = true;
						}
					}
					//check only when the path is checked at first
					var alreadyCheckedFlag = false;
					for(var index = 0 , len = alreadyCheckedPathes.length ; index < len ; index++){
						if(alreadyCheckedPathes[index] == nextAvailableCurrentPath + "\\" + targetPathRemovedSpace){
							alreadyCheckedFlag = true;
						}
					}
					if(alreadyCheckedFlag == false){
						searchAvailablePathConsideringUnnecessarySpaceWithDistance(
							availableFullPathes, nextAvailableCurrentPath,
							nextSplittedRemainingPath, nextDistance , alreadyCheckedPathes
						);
					}
				}
			}
		}else{
			//check if the availableCurrentPath is already added.
			var alreadyExistFlag = false;
			for(var index = 0, len = availableFullPathes.length; index < len ; index++){
				if(availableFullPathes[index][0] == availableCurrentPath){
					alreadyExistFlag = true;
				}
			}
			if(alreadyExistFlag == false){
				availableFullPathes.push([availableCurrentPath , currentDistance]);
			}
		}
	}
	
	//format query as below.
	//remove spaces attached on head and bottom.
	//normalize
	function formatQuery(query){
		//remove spaces attached on head and bottom.
		var trimmedQuery = query.trim();

		//remove unavailable characters.
		var queryRemovedUnavailableCharacters = 
			removeCharacters(trimmedQuery,['*','/','?',"\"","<",">","|","\t"]);

		//normalize
		var normalizedQuery = path.normalize(queryRemovedUnavailableCharacters);
		if(normalizedQuery == "."){
			normalizedQuery = "";
		}
		
		//return result
		return normalizedQuery;
	}
	
	//search available drives.
	function searchAvailableDrivesAsync(){
		//{
		//	driveName:checkingDrive + "\\",
		//	isAvailable:false,
		//	failureOfAccess:0
		//}
		for (var index = 0, len = availableDrives.length ; index < len ; index++){
			let checkingDriveObj = availableDrives[index];
			fs.stat(checkingDriveObj.driveName, function(err,stats){
				if(err){
					if(checkingDriveObj.isAvailable == true){
						checkingDriveObj.failureOfAccess++;
						if(checkingDriveObj.failureOfAccess > failureThreshold){
							checkingDriveObj.isAvailable = false;
							checkingDriveObj.failureOfAccess = 0;
						}
					}
					return;
				}else{
					if(stats.isDirectory() == true){
						if(checkingDriveObj.isAvailable == true){
							checkingDriveObj.failureOfAccess = 0;
						}else{
							checkingDriveObj.isAvailable = true;
						}
					}
				}
			});
		}
	}
	
	function refreshAvailableDrives(){
		searchAvailableDrivesAsync();
	}
	
	function startup(){
		//Search Available Drives.
		searchAvailableDrivesAsync();
	}
	
	function search (query, res) {
		//format query.
		var normalizedQuery = formatQuery(query);

		//check if the path is file server.
		//if the path is file server, remove "\\" attached on head.
		var isFileServer = false;
		if(normalizedQuery.indexOf("\\\\") == 0){
			isFileServer = true;
			normalizedQuery.substring(("\\\\").length);
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
		//remove empty element in splittedQuery.
		var splittedQueryRemovedUnnecessaryElement = splittedQuery.filter(function(e){return e !== "";});
		
		//search available file/folder name. (considering unnecessary space)
		var availableFullPathes = [];
		searchAvailablePathConsideringUnnecessarySpace(availableFullPathes,"",splittedQueryRemovedUnnecessaryElement.slice());
		
		//sort available path candidates by distance between them and query.
		var sortedAvailableFullPathes = availableFullPathes.slice();
		sortedAvailableFullPathes.sort(
			function(a,b){
				//compare the distance
				return ( (a[1] - b[1]) );
			}
		);

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
				refreshAvailableDrives();
				app.setQuery(id);
				break;
			case 'pending':
			default:
				return;
		}
	}

	return { startup, search, execute };
}
