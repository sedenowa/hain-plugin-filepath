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
	
	var availableDrives = [];
	//init drive
	
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
					case 3:
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
	//remove spaces attached on head and bottom.
	//normalize
	function formatQuery(query){
		//remove spaces attached on head and bottom.
		var trimmedQuery = query.trim();

		//remove unavailable characters.
		var queryRemovedUnavailableCharacters = 
			removeCharacters(trimmedQuery,['*','/','?',"\"","<",">","|","\t"]);

		//normalize
		var normalizedQuery = queryRemovedUnavailableCharacters;
		if(normalizedQuery == "."){
			normalizedQuery = "";
		}
		
		//return result
		return normalizedQuery;
	}
	
	//search drives.
	function searchAvailableDrives(){
		var innerAvailableDrives = [];
		const ASCIICodeOfA = 65 , ASCIICodeOfZ = 90;
		const ASCIICodeOfD = 65 + 3;
		//for (var ASCIICode = 65; ASCIICode <= ASCIICodeOfZ ; ASCIICode++){
		for (var ASCIICode = 65; ASCIICode <= ASCIICodeOfD ; ASCIICode++){
			var checkingDrive = String.fromCharCode(ASCIICode) + ":";
			switch(checkFileOrFolder(checkingDrive)){
				case -1://invalid
				case 0://invalid
				case 1://file
					break;
				case 2://folder
					innerAvailableDrives.push(String.fromCharCode(ASCIICode) + ":" + "\\");
					break;
				default:
					break;
			}
		}
		return innerAvailableDrives;
	}
	
	function refreshAvailableDrives(){
		availableDrives = searchAvailableDrives();
	}
	
	function startup(){
		//Search Available Drives.
		availableDrives = searchAvailableDrives();
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
		//remove empty element in splittedQuery.
		var splittedQuery = splittedQuery.filter(function(e){return e !== "";});
		
		//if isFileServer is true, combine 1st and 2nd element.
		if(isFileServer == true){
			if(splittedQuery.length >= 2){
				splittedQuery[1] = "\\\\" + splittedQuery[0] + "\\" + splittedQuery[1];
				splittedQuery.shift();
			}else if (splittedQuery.length == 1){
				splittedQuery[0] = "\\\\" + splittedQuery[0];
			}
		}
		
		//search available file/folder name. (considering unnecessary space)
		var availableFullPathes = [];
		searchAvailablePathConsideringUnnecessarySpace(availableFullPathes,"",splittedQuery.slice());
		
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
			//when there is no input.
			if(normalizedQuery.length == 0){
				var descriptionMessage = "Please input file or folder path.";
				res.add(
					{
						id: normalizedQuery,
						payload: 'pending',
						title: normalizedQuery,
						desc: descriptionMessage
					}
				);
			//when there is some input.
			}else{
				var descriptionMessage = "Not File/Folder. Cannot open.";
				//add to res.
				res.add(
					{
						id: normalizedQuery,
						payload: 'open',
						title: normalizedQuery,
						//+ "<b>" + "aaa" + "</b>",
						desc: descriptionMessage
						//,redirect: '/fp ' + 'C:\\'
					}
				);
			}
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
		//find candidates
		//when there is no input
		if(normalizedQuery.length == 0){
			//set available drives.
			foundCandidates = availableDrives.slice();
		}else{
			//check the current path is valid
			if(true){
				//search File/Folder
			}
		}
		for(var index = 0, len = foundCandidates.length ; index < len ; index++){
			//check if candidates 
			if(true){
				//add to res.
				var descriptionMessage = "Set this path : \"" + foundCandidates[index] + "\"";
				res.add(
					{
						//id: checkingDrive,
						id: commandHeader + " " + foundCandidates[index],
						payload: 'complement',
						title: foundCandidates[index],
						desc: descriptionMessage,
						redirect: commandHeader + " " + foundCandidates[index]
					}
				);
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
