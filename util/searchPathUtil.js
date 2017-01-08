//to access filesystem
const fs = require('fs');
//to format filepath
const path = require('path');

var commonUtil = require("./commonUtil");
var commonSearchUtil = require("./commonSearchUtil");

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
			var status = commonSearchUtil.checkFileOrFolder(availableCurrentPath);
			//check if availableCurrentPath is already added to availableFullPathes
			if(availableFullPathes.indexOf([availableCurrentPath , currentDistance , status]) == -1){
				//add availableCurrentPath to availableFullPathes
				availableFullPathes.push([availableCurrentPath , currentDistance , status]);
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
				var checkingPathRemovedSpace = 
					commonUtil.removeCharacterWithPosition(checkingPath, positionOfSpaces[index]);
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
			switch(commonSearchUtil.checkFileOrFolder(checkingFullPath)){
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
	var splittedPath = commonSearchUtil.separatePath(targetPath,true);
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