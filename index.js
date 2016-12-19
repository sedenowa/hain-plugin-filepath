'use strict'

module.exports = (pluginContext) => {
	const shell = pluginContext.shell;
	const clipboard = pluginContext.clipboard;
	//to access filesystem
	const fs = require('fs');
	
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
	
	//search available path (considering unnecessary space)
	function searchAvailablePathConsideringUnnecessarySpace(
		availableFullPathes, availableCurrentPath , splittedRemainingPath
	){
		
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
	
	function search (query, res) {
		//format query.
		//remove spaces attached on head and bottom.
		var trimmedQuery = query.trim();

		//remove unavailable characters ( * / ? " < > | ).
		var queryRemovedUnavailableCharacters = 
			removeCharacters(trimmedQuery,['*','/','?',"\"","<",">","|","\t"]);

		//split by '\'.
		var splittedQuery = queryRemovedUnavailableCharacters.split('\\');
		
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
			if(queryRemovedUnavailableCharacters.length > 0){
				var descriptionMessage = "Not File/Folder. Cannot open.";
				//add to res.
				res.add(
					{
						id: queryRemovedUnavailableCharacters,
						payload: 'open',
						title: queryRemovedUnavailableCharacters,
						desc: descriptionMessage
					}
				);
			}else{
				res.add(
					{
						id: queryRemovedUnavailableCharacters,
						payload: 'pending',
						title: queryRemovedUnavailableCharacters,
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
