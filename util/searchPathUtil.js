//to access filesystem
const fs = require('fs');
//to format filepath
const path = require('path');

//load private Utils
var commonUtil = require("./common/commonUtil");
var commonSearchUtil = require("./common/commonSearchUtil");

//to manage progress
var progressManager = require('./common/progressManager');

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
			var innerGroup = "";
			var innerRedirect = "";
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
					innerGroup = "Available Pathes : File";
					innerRedirect = commonUtil.commandHeader + " " + availableFullPath;
					break;
				case 2://folder
					//extract folder name
					//(todo) extract BBB from "C:\AAA\BBB\" <- when unnecessary "\" exists.
					var foldername = availableFullPath.slice().split(path.sep).pop();	
					descriptionMessage = "Open this Folder : \"" + foldername + 
						"\" ( Distance = " + distance + " )";
					innerIcon = "#fa fa-folder-open-o";
					addToResFlag = true;
					innerGroup = "Available Pathes : Folder";
					innerRedirect = commonUtil.commandHeader + " " + availableFullPath + "\\";
					break;
				case 3://file server
					//extract folder name
					var foldername = availableFullPath.slice().split(path.sep).pop();	
					descriptionMessage = "Open this File Server : \"" + foldername + 
						"\" ( Distance = " + distance + " )";
					//innerIcon = "#fa fa-folder-open-o";
					innerIcon = "#fa fa-server";
					addToResFlag = true;
					innerGroup = "Available Pathes : File Server";
					innerRedirect = commonUtil.commandHeader + " " + availableFullPath + "\\";
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
						redirect: innerRedirect,
						group: innerGroup
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
							progressManager.addProgressByRemainingList(copy);
							//execute complement of path
							if(progressManager.isSearchCompleted() == true){
								executeComplementOfPath(res);
							}
						}else if(stats.isFile() || stats.isDirectory()){
							innerSearch(foundPathes, target ,copy, res);
						}else{
							//do nothing
							//add progress
							//progressManager.addProgressByRemainingList(copy);
							//if(progressManager.isSearchCompleted() == true){
							//	executeComplementOfPath();
							//}
						}
					});
				}
			}else{
				if(foundPathes.indexOf(currentPath) < 0){
					foundPathes.push(currentPath);
					//callback(currentPath, res);
					innerAddOpenCommand(currentPath, res);
					//add progress
					progressManager.addProgressByNum(1);
					//execute complement of path
					if(progressManager.isSearchCompleted() == true){
						executeComplementOfPath(res);
					}
				}
			}
		})(foundPathes, currentPath, listRemainingLayer, res);
	}
	
	//main process
	return (function(path, res){
		if(path.length > 0){
			var foundPathes = [];
			//listup all layer
			var listAllLayer = listupAllLayerSearchCandidates(path);
			//reset max pattern of progress
			progressManager.resetProgress();
			//set max pattern of progress
			progressManager.setPatternMax(listAllLayer);
			//search
			innerSearch(foundPathes, "", listAllLayer, res);
			//return
			return foundPathes;
		}
	})(path, res);
}

//execute complement of path
function executeComplementOfPath(res){
	//TODO:execute complement of path
	/*
	res.add(
		{
			id: "",
			payload: "pending",
			title: "start complement",
			desc: "aaa"
		}
	);
	*/
}
