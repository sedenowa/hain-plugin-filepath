//to access filesystem
const fs = require('fs');
//to format filepath
const path = require('path');

var commonUtil = require("./commonUtil");
var commonSearchUtil = require("./commonSearchUtil");

/*
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
				case 3://Available File Server
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
function searchAvailablePath(query) {
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
*/

// param : "A A A\B BB\C  C" 
// return ["AAA\BBB\CC","AAA\B BB\C C"] <- available pathes removed unnecessary spaces
exports.searchAvailablePathAsync = function(path, res){
	//inner function
	// param : "A A A\B BB\C  C" 
	// return: [["A A A","AA A","A AA","AAA"],
	//          ["B BB","BBB"],
	//          ["C  C","C C","CC"]]
	function listupAllLayerSearchCandidates(path){
		// param : "A A A"
		// return: ["A A A","AA A","A AA","AAA"]
		function listupSearchCandidates(string){
			//inner function for recursive search
			// param : [], "A A A"
			// return: 
			// process: [] <- ["A A A","AA A","A AA","AAA"]
			function innerListUp(list, string){
				// param : "a bc  "
				// return: [1,4,5]
				function checkPositionOfSpaces(targetString){
					var positionOfSpaces = [];
					for(var index = 0 , len = targetString.length ; index < len; index++){
						if((targetString[index] == ' ') || (targetString[index] == '　' )){
							positionOfSpaces.push(index);
						}
					}
					return positionOfSpaces;
				}

				//main process
				(function(list, string){
					if(list.indexOf(string) < 0){
						list.push(string);
					}
					var positionOfSpaces = checkPositionOfSpaces(string);
					for(var index = 0, len = positionOfSpaces.length; index < len; index++){
						var stringRemovedOneSpace = commonUtil.removeCharacterWithPosition(string, positionOfSpaces[index]);
						innerListUp(list, stringRemovedOneSpace);
					}
				})(list, string);
			}

			//main process
			return (function(string){
				var list = [];
				innerListUp(list, string);
				return list;
			})(string);
		}

		//main process
		return (function(path){
			var listAllLayer = [];
			var separatedPath = commonSearchUtil.separatePath(path, true);
			for(var index = 0, len = separatedPath.length; index < len; index++){
				listAllLayer.push(listupSearchCandidates(separatedPath[index]));
			}
			return listAllLayer;
		})(path);
	}
	
	//import fs library
	const fs = require('fs');
	
	//inner function for recursive search
	//add to res in this function
	function innerSearch(foundPathes, currentPath, listRemainingLayer, res){
		//add to res
		function innerAddOpenCommand(targetPath, res){
			//add to res.
			//Check state of formatted path (File or Folder or not).
			//and set Description Message according to the state.
			var descriptionMessage = "";
			//var availableFullPath = sortedAvailableFullPathes[index][0].slice();
			//var distance = sortedAvailableFullPathes[index][1];
			//var status = sortedAvailableFullPathes[index][2];

			var availableFullPath = targetPath;
			var distance = "X";
			var status = 1;

			var addToResFlag = false;
			var innerIcon = "";
			var group = "";
			switch(status){
				case -1://invalid
				case 0://invalid
					//descriptionMessage = "Not File/Folder. Cannot open."
					break;
				case 1://file
					//extract file name
					//(todo) extract BBB from "C:\AAA\BBB\" <- when unnecessary "\" exists.
					var filename = availableFullPath.slice().split(path.sep).pop();
					descriptionMessage = "Open this File : \"" + filename + 
						"\" ( Distance = " + distance + " )";
					innerIcon = "#fa fa-file-o";
					addToResFlag = true;
					group = "Available Pathes : File";
					break;
				case 2://folder
					//extract folder name
					//(todo) extract BBB from "C:\AAA\BBB\" <- when unnecessary "\" exists.
					var foldername = availableFullPath.slice().split(path.sep).pop();	
					descriptionMessage = "Open this Folder : \"" + foldername + 
						"\" ( Distance = " + distance + " )";
					innerIcon = "#fa fa-folder-open-o";
					addToResFlag = true;
					group = "Available Pathes : Folder";
					break;
				case 3://file server
					//extract folder name
					var foldername = availableFullPath.slice().split(path.sep).pop();	
					descriptionMessage = "Open this File Server : \"" + foldername + 
						"\" ( Distance = " + distance + " )";
					//innerIcon = "#fa fa-folder-open-o";
					innerIcon = "#fa fa-server";
					addToResFlag = true;
					group = "Available Pathes : File Server";
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
						icon: innerIcon,
						desc: descriptionMessage,
						redirect: commonUtil.commandHeader + " " + availableFullPath,
						group: group
					}
				);
			}
		}
		
		//main process
		(function(foundPathes, currentPath, listRemainingLayer, res){
			var len = listRemainingLayer.length;
			if(len > 0){
				var list = listRemainingLayer[0];
				let copy = listRemainingLayer.slice();
				copy.shift();
				for(var index = 0, len2 = list.length; index < len2; index++){
					let target = "";
					if(currentPath != ""){
						target = target + currentPath + "\\";
					}
					target = target + list[index];
					fs.stat(target, function(err, stats){
						if(err){
							//console.log("err");
						}else if(stats.isFile() || stats.isDirectory()){
							innerSearch(foundPathes, target ,copy, res);
						}else{
							//console.log("else");
						}
					});
				}
			}else{
				if(foundPathes.indexOf(currentPath) < 0){
					foundPathes.push(currentPath);
					//callback(currentPath, res);
					innerAddOpenCommand(currentPath, res);
				}
			}
		})(foundPathes, currentPath, listRemainingLayer, res);
	}
	
	
	//main process
	return (function(path, res){
		if(path.length > 0){
			var foundPathes = [];
			var listAllLayer = listupAllLayerSearchCandidates(path);
			innerSearch(foundPathes, "", listAllLayer, res);
			return foundPathes;
		}
	})(path, res);
}


/*
//add open command
exports.addOpenCommand = function(targetPath, res){
//function addOpenCommand(targetPath, res){
	//search available path
	var sortedAvailableFullPathes = searchAvailablePath(targetPath)

	//add to res.
	for(var index = 0 , len = sortedAvailableFullPathes.length ; index < len ; index++){
		//Check state of formatted path (File or Folder or not).
		//and set Description Message according to the state.
		var descriptionMessage = "";
		var availableFullPath = sortedAvailableFullPathes[index][0].slice();
		var distance = sortedAvailableFullPathes[index][1];
		var status = sortedAvailableFullPathes[index][2];
		var addToResFlag = false;
		var innerIcon = "";
		var sortKey = {
			category: 1,//open command
			status: status,
			name: ""
		}
		//switch(checkFileOrFolder(availableFullPath)){
		switch(status){
			case -1://invalid
			case 0://invalid
				//descriptionMessage = "Not File/Folder. Cannot open."
				break;
			case 1://file
				//extract file name
				//(todo) extract BBB from "C:\AAA\BBB\" <- when unnecessary "\" exists.
				var filename = availableFullPath.slice().split(path.sep).pop();
				descriptionMessage = "Open this File : \"" + filename + 
					"\" ( Distance = " + distance + " )";
				innerIcon = "#fa fa-file-o";
				addToResFlag = true;
				sortKey.name = filename;
				break;
			case 2://folder
				//extract folder name
				//(todo) extract BBB from "C:\AAA\BBB\" <- when unnecessary "\" exists.
				var foldername = availableFullPath.slice().split(path.sep).pop();	
				descriptionMessage = "Open this Folder : \"" + foldername + 
					"\" ( Distance = " + distance + " )";
				innerIcon = "#fa fa-folder-open-o";
				addToResFlag = true;
				sortKey.name = foldername;
				break;
			case 3://file server
				//extract folder name
				var foldername = availableFullPath.slice().split(path.sep).pop();	
				descriptionMessage = "Open this File Server : \"" + foldername + 
					"\" ( Distance = " + distance + " )";
				//innerIcon = "#fa fa-folder-open-o";
				innerIcon = "#fa fa-server";
				addToResFlag = true;
				sortKey.name = foldername;
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
					icon: innerIcon,
					desc: descriptionMessage,
					redirect: commonUtil.commandHeader + " " + availableFullPath,
					sortKey: sortKey,
					group: "Available Pathes"
 				}
			);
		}
	}
}
*/