//to access filesystem
const fs = require('fs');
//to format filepath
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

var networkHeader = "\\\\";
function checkFileServer(query){
	//check if the path is file server.
	//if the path is file server, remove "\\" attached on head.
	var isFileServer = false;
	if(query.indexOf(networkHeader) == 0 &&
		 query[networkHeader.length] != '\\' &&
		 query[networkHeader.length] != undefined){
		isFileServer = true;
	}
	return isFileServer;
}

var separator = "\\";
function separatePath(targetPath){
	//split path
	//check if the path is file server.
	//if the path is file server, remove "\\" attached on head.
	var isFileServer = checkFileServer(targetPath);
	if(isFileServer == true){
		targetPath = targetPath.substring(("\\\\").length);
	}

	//split by separator('\' or '/').
	var splittedPath = targetPath.split(separator);

	//if isFileServer is true, combine 1st and 2nd element.
	if(isFileServer == true){
		if(splittedPath.length >= 2){
			splittedPath[1] = networkHeader + splittedPath[0] + separator + splittedPath[1];
			splittedPath.shift();
		}else if (splittedPath.length == 1){
			splittedPath[0] = networkHeader + splittedPath[0];
		}
	}
	//remove empty element in splittedQuery.
	splittedPath = splittedPath.filter(function(e){return e !== "";});
	return splittedPath;
}

//search available path (considering unnecessary space)

function searchAvailablePathConsideringUnnecessarySpaceWithDistance(
	availableCurrentPath, splittedRemainingPath,
	availableFullPathes, alreadyCheckedPathes,
	currentDistance
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
				case 0:
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

function searchAvailablePathConsideringUnnecessarySpace(targetPath){
	var splittedPath = separatePath(targetPath);
	var availableFullPathes = [];
	searchAvailablePathConsideringUnnecessarySpaceWithDistance(
		"", splittedPath, availableFullPathes,	[],	0
	);
	return availableFullPathes;
}

//search available path
exports.searchAvailablePath = function(query) {
	//search available file/folder name. (considering unnecessary space)
	var availableFullPathes =
	searchAvailablePathConsideringUnnecessarySpace(query);

	//sort available path candidates by distance between them and query.
	var sortedAvailableFullPathes = availableFullPathes.slice();
	if(sortedAvailableFullPathes.length >= 2){
		sortedAvailableFullPathes.sort(
			function(a,b){
				//compare the distance
				return ( (a[1] - b[1]) );
			}
		);
	}
	return sortedAvailableFullPathes;
}