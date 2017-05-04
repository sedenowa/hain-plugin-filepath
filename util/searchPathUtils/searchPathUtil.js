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
function innerRecursiveListUp(candidateList, differenceList, string, difference){
	if(candidateList.indexOf(string) < 0){
		candidateList.push(string);
		differenceList.push(difference);
	}
	var positionOfSpaces = checkPositionOfSpaces(string);
	for(var index = 0, len = positionOfSpaces.length; index < len; index++){
		var stringRemovedOneSpace = commonUtil.removeCharacterWithPosition(string, positionOfSpaces[index]);
		innerRecursiveListUp(candidateList, differenceList, stringRemovedOneSpace, difference + 1);
	}
}

// param : "A A A"
// return: [["A A A","AA A","A AA","AAA"], [0, 1, 1, 2]]
function listupSearchCandidatesAndDifferences(string){
	var searchCandidateList = [], differenceList = [];
	innerRecursiveListUp(searchCandidateList, differenceList, string, 0);
	return [searchCandidateList, differenceList];
}

//inner function
// param : "A A A\B BB\C  C"
// return: [[["A A A","AA A","A AA","AAA"],
//           ["B BB","BBB"],
//           ["C  C","C C","CC"]],
//          [[0, 1, 1, 2],
//           [0, 1],
//           [0, 1, 2]]]
function listupSearchCandidatesAndDifferencesAllLayer(path){
	var candidateListsOfAllLayer = [], differenceListsOfAllLayer = [];
	var separatedPath = commonSearchUtil.separatePath(path, true);

	for(var index = 0, len = separatedPath.length; index < len; index++){
		var candidateAndDistanceLists = listupSearchCandidatesAndDifferences(separatedPath[index]);
		var candidateList = candidateAndDistanceLists[0];
		candidateListsOfAllLayer.push(candidateList);
		var differenceList = candidateAndDistanceLists[1];
		differenceListsOfAllLayer.push(differenceList);
	}
	return [candidateListsOfAllLayer, differenceListsOfAllLayer];
}

//wrapper function for recursive search
//add to res in this function
function outerRecursiveSearch(path, searchCandidatesListsOfAllLayer, differencesListsOfAllLayer, res){
	//inner function for recursive search
	//add to res in this function
	function innerRecursiveSearch(
		difference, currentPath, searchCandidatesListsOfRemainingLayer, differencesListsOfRemainingLayer, state
	){
		//main process
		var lengthOfRemainingLayer = searchCandidatesListsOfRemainingLayer.length;
		if(lengthOfRemainingLayer > 0){
			//candidates
			var targetSearchCandidatesList = searchCandidatesListsOfRemainingLayer[0];
			let shiftedSearchCandidatesLists = searchCandidatesListsOfRemainingLayer.slice();
			shiftedSearchCandidatesLists.shift();

			//differences
			var differencesList = differencesListsOfRemainingLayer[0];
			let shiftedDifferencesLists = differencesListsOfRemainingLayer.slice();
			shiftedDifferencesLists.shift();


			for(var index = 0, lengthOfTargetList = targetSearchCandidatesList.length; index < lengthOfTargetList; index++){
				//set target path to check
				let checkingAbsolutePath = "";
				if(currentPath != ""){
					checkingAbsolutePath = currentPath + "\\";
				}
				let fileOrFolderName = targetSearchCandidatesList[index];
				checkingAbsolutePath += fileOrFolderName;

				//set difference of checking path
				let innerDifference = difference;
				innerDifference += differencesList[index];

				//check existence of checking path
				fs.stat(checkingAbsolutePath, function(err, stats){
					if(err){
						//console.log("err");
						progressManager.addProgressByRemainingList(shiftedSearchCandidatesLists);
						//execute complement of path
					}else{
						if(stats.isFile() == true){
							innerRecursiveSearch(
								innerDifference, checkingAbsolutePath, shiftedSearchCandidatesLists,
								shiftedDifferencesLists, "file"
							);
						}else if(stats.isDirectory() == true){
							var folderType = commonSearchUtil.identifyFolderType(fileOrFolderName);
							innerRecursiveSearch(
								innerDifference, checkingAbsolutePath, shiftedSearchCandidatesLists,
								shiftedDifferencesLists, folderType
							);
						}
					}
					//check progress
					checkProgress(commonOriginalPath, commonRes);
				});
			}
		}else{// lengthOfRemainingLayer == 0
			//check if currentPath is already checked
			if(commonSearchedPathes.indexOf(currentPath) < 0){
				//add result of search
				commonSearchedPathes.push(currentPath);
				commonSearchedDifferences.push(difference);

				//add progress
				progressManager.addProgressByNum(1);
				progressManager.addFoundPathNum();

				//add found path
				searchSortManager.add(currentPath, state, difference);
			}
		}
	}

	//main process
	var commonSearchedPathes = [];
	var commonSearchedDifferences = [];
	var commonOriginalPath = path;
	var commonRes = res;

	//start recursive search
	innerRecursiveSearch(0, "", searchCandidatesListsOfAllLayer, differencesListsOfAllLayer, "");
}
// param : "A A A\B BB\C  C"
// return ["AAA\BBB\CC","AAA\B BB\C C"] <- available pathes removed unnecessary spaces
var searchAvailablePathAsync = function(path, res){
	//listup all layer
	var candidatesAndDistancesListsOfAllLayer = listupSearchCandidatesAndDifferencesAllLayer(path);
	//var searchCandidatesListOfAllLayer = listupSearchCandidatesAndDifferencesAllLayer(path);
	var searchCandidatesListOfAllLayer = candidatesAndDistancesListsOfAllLayer[0];
	var distancesListOfAllLayer = candidatesAndDistancesListsOfAllLayer[1];

	//reset max pattern of progress
	progressManager.reset();
	//set max pattern of progress
	progressManager.setPatternMax(searchCandidatesListOfAllLayer);
	//reset flag to execute complement
	resetIsComplementOfPathStarted();

	//reset sort manager
	searchSortManager.reset();

	//search
	if(path.length > 0) {
		//search
		//innerRecursiveSearch(path, foundPathes, 0, foundDifferences, "", searchCandidatesListOfAllLayer, distancesListOfAllLayer, "", res);
		outerRecursiveSearch(path, searchCandidatesListOfAllLayer, distancesListOfAllLayer, res);
	}else{
		//check progress
		checkProgress(path, res);
	}
}

var isComplementOfPathStarted = false;
function resetIsComplementOfPathStarted(){
	isComplementOfPathStarted = false;
}

//add to res
function addOpenCommand(targetPath, difference, state, res){
	//add to res.
	//Check state of formatted path (File or Folder or not).
	//and set Description Message according to the state.
	var addToResFlag = false;
	var innerIcon = "";
	var innerGroup = "";
	var innerRedirect = "";
	var descriptionMessage = "";
	switch(state){
		case "file"://file
			addToResFlag = true;
			//extract file name
			var filename = targetPath.slice().split(path.sep).pop();
			descriptionMessage = "Open this File : \"" + filename + "\"";
			innerIcon = "#fa fa-file-o";
			innerGroup = "Available Pathes : File";
			innerRedirect = commonUtil.commandHeader + " " + targetPath;
			break;
		case "folder"://folder
			addToResFlag = true;
			//extract folder name
			var foldername = targetPath.slice().split(path.sep).pop();
			descriptionMessage = "Open this Folder : \"" + foldername + "\"";
			innerIcon = "#fa fa-folder-open-o";
			innerGroup = "Available Pathes : Folder";
			innerRedirect = commonUtil.commandHeader + " " + targetPath + "\\";
			break;
		case "drive"://drive
			addToResFlag = true;
			//extract folder name
			var foldername = targetPath.slice().split(path.sep).pop();
			descriptionMessage = "Open this Drive : \"" + foldername + "\"";
			innerIcon = "#fa fa-hdd-o";
			innerGroup = "Available Pathes : Drive";
			innerRedirect = commonUtil.commandHeader + " " + targetPath + "\\";
			break;
		case "server"://server
			addToResFlag = true;
			//extract folder name
			var foldername = targetPath.slice().split(path.sep).pop();
			descriptionMessage = "Open this File Server : \"" + foldername + "\"";
			innerIcon = "#fa fa-server";
			innerGroup = "Available Pathes : File Server";
			innerRedirect = commonUtil.commandHeader + " " + targetPath + "\\";
			break;
		default:
			break;
	}

	if(difference == 1){
		descriptionMessage = descriptionMessage + " ( 1 white space is removed. )";
	}else if(difference > 1){
		descriptionMessage = descriptionMessage + " ( " + difference + " white spaces are removed. )";
	}

	//add to res.
	if(addToResFlag == true){
		res.add(
			{
				id: targetPath,
				payload: 'open',
				title: targetPath,
				icon: innerIcon,
				desc: descriptionMessage,
				redirect: innerRedirect,
				group: innerGroup
			}
		);
	}
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
			addOpenCommand(path, difference, state, res);
		}
	}
}

function addSortedFoundPathes(res){
	var sortedFoundPathes = searchSortManager.getSortedFoundPathes();
	//add file servers
	addFoundPathesOfEachState(res, "server", sortedFoundPathes);
	//add drives
	addFoundPathesOfEachState(res, "drive", sortedFoundPathes);
	//add folders
	addFoundPathesOfEachState(res, "folder", sortedFoundPathes);
	//add files
	addFoundPathesOfEachState(res, "file", sortedFoundPathes);
}

//execute complement of path
function executeComplementOfPath(formattedQuery, res){
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