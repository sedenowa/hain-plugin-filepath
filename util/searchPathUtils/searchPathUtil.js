//to access filesystem
const fs = require('fs');
//to format filepath
const path = require('path');

//load private Utils
var commonUtil = require("../common/commonUtil");
var commonSearchUtil = require("../common/commonSearchUtil");
var searchDriveUtil = require("../complementPathUtils/searchDriveUtil");
var complementPathUtil = require("../complementPathUtils/complementPathUtil");

//to manage progress
var progressManager = require("./searchProgressManager");
//to manage sorting
var searchSortManager = require("./searchSortManager");


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

//inner function for recursive search
// param : [], "A A A"
// return:
// process: [] <- ["A A A","AA A","A AA","AAA"]
function innerRecursiveListUp(list, string){
	if(list.indexOf(string) < 0){
		list.push(string);
	}
	var positionOfSpaces = checkPositionOfSpaces(string);
	for(var index = 0, len = positionOfSpaces.length; index < len; index++){
		var stringRemovedOneSpace = commonUtil.removeCharacterWithPosition(string, positionOfSpaces[index]);
		innerRecursiveListUp(list, stringRemovedOneSpace);
	}
}

// param : "A A A"
// return: ["A A A","AA A","A AA","AAA"]
function listupSearchCandidates(string){
	var list = [];
	innerRecursiveListUp(list, string);
	return list;
}

//inner function
// param : "A A A\B BB\C  C"
// return: [["A A A","AA A","A AA","AAA"],
//          ["B BB","BBB"],
//          ["C  C","C C","CC"]]
function listupAllLayerSearchCandidates(path){
	var listAllLayer = [];
	var separatedPath = commonSearchUtil.separatePath(path, true);
	for(var index = 0, len = separatedPath.length; index < len; index++){
		listAllLayer.push(listupSearchCandidates(separatedPath[index]));
	}
	return listAllLayer;
}

//add to res
function addOpenCommand(targetPath, res){
	//add to res.
	//Check state of formatted path (File or Folder or not).
	//and set Description Message according to the state.
	var descriptionMessage = "";
	//var availableFullPath = sortedAvailableFullPathes[index][0].slice();
	//var distance = sortedAvailableFullPathes[index][1];
	//var status = sortedAvailableFullPathes[index][2];

	var availableFullPath = targetPath;
	//TODO: calc distance
	var distance = "X";
	//TODO: check status
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

//inner function for recursive search
//add to res in this function
function innerRecursiveSearch(path, searchedPathes, currentPath, listRemainingLayer, res){
	//main process
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
				}else{
					if(stats.isFile() || stats.isDirectory()){
						innerRecursiveSearch(path, searchedPathes, target ,copy, res);
					}
				}
				//check progress
				checkProgress(path, res);
			});
		}
	}else{// len == 0
		if(searchedPathes.indexOf(currentPath) < 0){
			searchedPathes.push(currentPath);
			//callback(currentPath, res);
			//addOpenCommand(currentPath, res);
			//add progress
			progressManager.addProgressByNum(1);
			progressManager.addFoundPathNum();
			//add found path
			searchSortManager.add(currentPath, "file", 0);
		}
		//check progress
		//checkProgress(path, res);
	}
	//check progress
	//checkProgress(path, res);
}

// param : "A A A\B BB\C  C"
// return ["AAA\BBB\CC","AAA\B BB\C C"] <- available pathes removed unnecessary spaces
var searchAvailablePathAsync = function(path, res){
	//initialize foundPathes
	if(path.length > 0) {
		var foundPathes = [];
	}

	//listup all layer
	var listAllLayer = listupAllLayerSearchCandidates(path);

	//reset max pattern of progress
	progressManager.reset();
	//set max pattern of progress
	progressManager.setPatternMax(listAllLayer);
	//reset flag to execute complement
	resetIsComplementOfPathStarted();

	//reset sort manager
	searchSortManager.reset();

	//search
	if(path.length > 0) {
		//search
		innerRecursiveSearch(path, foundPathes, "", listAllLayer, res);
	}else{
		//check progress
		checkProgress(path, res);
	}
}

var isComplementOfPathStarted = false;
function resetIsComplementOfPathStarted(){
	isComplementOfPathStarted = false;
}

function addFoundPathesOfEachState(res, state, sortedFoundPathes){
	var len = sortedFoundPathes.length;
	for (var index = 0; index < len; index++) {
		var foundPath = sortedFoundPathes[index];
		var innerState = foundPath.state;
		if(innerState == state){
			var path = foundPath.path;
			var difference = foundPath.difference;
			//add to res
			addOpenCommand(path, res);
		}
	}
}
function addSortedFoundPathes(res){
	var sortedFoundPathes = searchSortManager.getSortedFoundPathes();
	//add drives
	addFoundPathesOfEachState(res, "drive", sortedFoundPathes);
	//add folders
	addFoundPathesOfEachState(res, "folder", sortedFoundPathes);
	//add files
	addFoundPathesOfEachState(res, "file", sortedFoundPathes);
}

//execute complement of path
function executeComplementOfPath(formattedQuery, res){
	//TODO:execute complement of path
	var availableDrives = searchDriveUtil.getAvailableDrives();
	complementPathUtil.searchCandidates(formattedQuery, availableDrives, res);
}
//check progress of search
//if completed, execute complement process
function checkProgress(path, res){
	if(progressManager.isSearchCompleted() == true){
		//add open command
		addSortedFoundPathes(res);

		if(isComplementOfPathStarted == false){
			executeComplementOfPath(path, res);
			isComplementOfPathStarted = true;
		}
	}
}

exports.searchAvailablePathAsync = searchAvailablePathAsync;
