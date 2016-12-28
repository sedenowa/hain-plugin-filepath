'use strict'

module.exports = (pluginContext) => {
	const shell = pluginContext.shell;
	const clipboard = pluginContext.clipboard;
	//to access filesystem
	const fs = require('fs');
	const path = require('path');
	
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

	//search available path (considering unnecessary space)
	function searchAvailablePathConsideringUnnecessarySpace(
		availableFullPathes, availableCurrentPath , splittedRemainingPath
	){
		searchAvailablePathConsideringUnnecessarySpaceWithDistance(
			availableCurrentPath , splittedRemainingPath , availableFullPathes, [] , 0
		);
	}

	function searchAvailablePathConsideringUnnecessarySpaceWithDistance(
		availableCurrentPath , splittedRemainingPath , availableFullPathes, 
		 alreadyCheckedPathes , currentDistance
	){
		//check if splittedRemainingPath is empty
		if(splittedRemainingPath.length == 0){
			//check if availableCurrentPath is empty
			if(availableCurrentPath == ""){
				//exit
				return;
			}else{
				//check if availableCurrentPath is already added to availableFullPathes
				if(availableFullPathes.indexOf([availableCurrentPath , currentDistance]) == -1){
					//add availableCurrentPath to availableFullPathes
					availableFullPathes.push([availableCurrentPath , currentDistance]);
				}
			}
		}else{
			//store path to check next.
			var checkingPath = splittedRemainingPath[0];
			//check if checkingPath contain space
			var positionOfSpaces = checkPositionOfSpaces(checkingPath);
			if(positionOfSpaces.length > 0){
				for(var index = 0 , len = positionOfSpaces.length ; index < len ; index++){
					//remove one of the spaces from checkingPath.
					var firstHalfOfCheckingPathRemovedSpace = checkingPath;
					var latterHalfOfCheckingPathRemovedSpace = checkingPath;
					var checkingPathRemovedSpace = 
						firstHalfOfCheckingPathRemovedSpace.slice(0,positionOfSpaces[index]) + 
						latterHalfOfCheckingPathRemovedSpace.slice(positionOfSpaces[index]+1);
					//copy splittedRemainingPath
					var nextSplittedRemainingPath = splittedRemainingPath.slice();
					//check if checkingPathRemovedSpace is empty
					if(checkingPathRemovedSpace == ""){
						nextSplittedRemainingPath.shift();
					}else{
						nextSplittedRemainingPath[0] = checkingPathRemovedSpace;
					}
					//increment distance 
					var nextDistance = currentDistance + 1;
					var nextAvailableCurrentPath = availableCurrentPath;

					//set the full path to check
					var checkingFullPath = "";
					if(availableCurrentPath == ""){
						checkingFullPath = checkingPath;
					}else{
						checkingFullPath = availableCurrentPath + "\\" + checkingPath;
					}
					//check the path if it is checked at first
					var alreadyCheckedFlag = false;
					if(alreadyCheckedPathes.indexOf(checkingFullPath) >= 0){
						alreadyCheckedFlag = true;
					}

					if(alreadyCheckedFlag == true){
						//exit
						return;
					}else{
						//when the path is checked at first
						//call this function recursively
						searchAvailablePathConsideringUnnecessarySpaceWithDistance(
							nextAvailableCurrentPath , nextSplittedRemainingPath ,
							availableFullPathes, alreadyCheckedPathes , nextDistance
						);
					}
				}
			}
			//set the full path to check
			var checkingFullPath = "";
			if(availableCurrentPath == ""){
				checkingFullPath = checkingPath;
			}else{
				checkingFullPath = availableCurrentPath + "\\" + checkingPath;
			}
			//check the path if it is checked at first
			var alreadyCheckedFlag = false;
			if(alreadyCheckedPathes.indexOf(checkingFullPath) >= 0){
				alreadyCheckedFlag = true;
			}

			if(alreadyCheckedFlag == true){
				//exit
				return;
			}else{
				//when the path is checked at first
				//add to pathes which are already checked
				alreadyCheckedPathes.push(checkingFullPath);
				//check the existence of the full path 
				switch(checkFileOrFolder(checkingFullPath)){
					case -1:
					case 3:
						//do nothing
						return;
						break;
					case 1://Available File
					case 2://Available Folder
						//copy splittedRemainingPath
						var shiftedSplittedRemainingPath = splittedRemainingPath.slice();
						shiftedSplittedRemainingPath.shift();
						var nextAvailableCurrentPath = checkingFullPath;
						var nextDistance = currentDistance;
						//call this function recursively
						searchAvailablePathConsideringUnnecessarySpaceWithDistance(
							nextAvailableCurrentPath , shiftedSplittedRemainingPath ,
							availableFullPathes, alreadyCheckedPathes , nextDistance
						);
						break;
					default:
						//do nothing
						return;
						break;
				}
			}
		}
	}

	function search (query, res) {
		//format query.
		//remove spaces attached on head and bottom.
		var trimmedQuery = query.trim();

		//remove unavailable characters ( * / ? " < > | ).
		var queryRemovedUnavailableCharacters = 
			removeCharacters(trimmedQuery,['*','/','?',"\"","<",">","|","\t"]);

		//normalize
		var normalizedQuery = queryRemovedUnavailableCharacters;
		if(normalizedQuery == "."){
			normalizedQuery = "";
		}
		
		//check if the path is file server.
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
		searchAvailablePathConsideringUnnecessarySpace(availableFullPathes,"",splittedQuery);
		
		//sort available path candidates by distance between them and query.
		var sortedAvailableFullPathes = availableFullPathes.slice();
		sortedAvailableFullPathes.sort(
			function(a,b){
				return ( (a[1] - b[1]) );
			}
		);

		if(sortedAvailableFullPathes.length == 0){
			if(normalizedQuery.length > 0){
				var descriptionMessage = "Not File/Folder. Cannot open.";
				//add to res.
				res.add(
					{
						id: normalizedQuery,
						payload: 'open',
						title: normalizedQuery,
						desc: descriptionMessage
					}
				);
			}else{
				res.add(
					{
						id: normalizedQuery,
						payload: 'pending',
						title: normalizedQuery,
						desc: "Please input file or folder path."
					}
				);
			}
		}else{
			for(var index = 0 , len = sortedAvailableFullPathes.length ; index < len ; index++){
				//Check state of formatted path (File or Folder or not).
				//and set Description Message according to the state.
				var descriptionMessage = "";
				var availableFullPath = sortedAvailableFullPathes[index][0].slice();
				var distance = sortedAvailableFullPathes[index][1];
				switch(checkFileOrFolder(availableFullPath)){
					case -1://invalid
					case 3://invalid
						descriptionMessage = "Not File/Folder. Cannot open."
						break;
					case 1://file
						//extract file name
						//(todo) extract BBB from "C:\AAA\BBB\" <- when unnecessary "\" exists.
						var filename = availableFullPath.slice().split("\\").pop();
						descriptionMessage = "Open this File : \"" + filename + 
							"\" ( Distance = " + distance + " )";
						break;
					case 2://folder
						//extract folder name
						//(todo) extract BBB from "C:\AAA\BBB\" <- when unnecessary "\" exists.
						var foldername = availableFullPath.slice().split("\\").pop();	
						descriptionMessage = "Open this Folder : \"" + foldername + 
							"\" ( Distance = " + distance + " )";
						break;
				}
				//add to res.
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

	function execute (id, payload) {
		//open file or folder.
		if (payload !== 'open') {
			return
		}
		shell.openItem(`${id}`);
	}

	return { search, execute };
}
