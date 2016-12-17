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
			availableFullPathes, availableCurrentPath , splittedRemainingPath , 0
		);
	}

	function searchAvailablePathConsideringUnnecessarySpaceWithDistance(
		availableFullPathes, availableCurrentPath , splittedRemainingPath , currentDistance
	){
		if(splittedRemainingPath.length > 0){
			var targetPath = splittedRemainingPath[0];
			var checkingPath = "";
			if(availableCurrentPath == ""){
				checkingPath = targetPath;
			}else{
				checkingPath = availableCurrentPath + "\\" + targetPath;
			}
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
						shiftedSplittedRemainingPath, nextDistance
					);
					break;
				default:
					//do nothing
					break;
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
					searchAvailablePathConsideringUnnecessarySpaceWithDistance(
						availableFullPathes, nextAvailableCurrentPath,
						nextSplittedRemainingPath, nextDistance
					);
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
				console.log("Added : " + availableCurrentPath + " - Distance : " + currentDistance);
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
		
		//search available file/folder name. (considering needless space)
		var availableFullPathes = [];
		searchAvailablePathConsideringUnnecessarySpace(availableFullPathes,"",splittedQuery);
		
		//Check state of formatted path (File or Folder or not).
		//and set Description Message according to the state.
		var descriptionMessage = "";
		switch(checkFileOrFolder(queryRemovedUnavailableCharacters)){
			case -1://invalid
			case 0://invalid
				descriptionMessage = "Not File/Folder. Cannot open."
				break;
			case 1://file
				descriptionMessage = "Open this File."
				break;
			case 2://folder
				descriptionMessage = "Open this Folder."
				break;
		}
		
		//add to res.
		res.add(
			{
				id: queryRemovedUnavailableCharacters,
				payload: 'open',
				title: queryRemovedUnavailableCharacters,
				desc: descriptionMessage
			}
		);
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
