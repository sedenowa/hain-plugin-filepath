//to access filesystem
const fs = require('fs');
//to format filepath
const path = require('path');

var commonUtil = require("../common/commonUtil");
var commonSearchUtil = require("../common/commonSearchUtil");
var searchDriveUtil = require("./searchDriveUtil");
var searchProgressManager = require("../searchPathUtils/searchProgressManager");
var complementProgressManager = require("./complementProgressManager");
var complementSortManager = require("./complementSortManager");

//param: "C:\AAA\BBB"
//return ["C:\AAA", "BBB"]
function extractKeywords(formattedQuery){
	//search candidates to complement
	var splittedQuery =
		commonSearchUtil.separatePath(formattedQuery,false);

	var currentDirectory;
	var searchKeyword;
	var lengthOfSplittedQuery = splittedQuery.length;
	if(lengthOfSplittedQuery == 0){
		currentDirectory = "";
		searchKeyword = "";
	}else if(lengthOfSplittedQuery == 1){
		currentDirectory = "";
		searchKeyword = splittedQuery[0];
	}else{// length >= 2
		currentDirectory = "";
		for(index = 0 ; index < lengthOfSplittedQuery - 1 ; index++){
			currentDirectory = currentDirectory + splittedQuery[index] + "\\";
		}
		//currentDirectory.pop();
		searchKeyword = splittedQuery[lengthOfSplittedQuery - 1];
	}
	return [currentDirectory, searchKeyword];
}

//ex tags: ["<b>","</b>"]
//param : "ABCDE", ["AB","D"]
function evaluate(originalCandidate, keyword){
	var eval = 0;
	var innerOriginalCandidate = originalCandidate;
	for(var indexOfKeyword = 0, lengthOfKeyword = keyword.length ; indexOfKeyword < lengthOfKeyword ; indexOfKeyword++){
		var foundPos = innerOriginalCandidate.toLocaleLowerCase().indexOf(keyword[indexOfKeyword].toLocaleLowerCase());
		if(foundPos == -1){
			eval = eval - 1;
		}else{
			eval = eval + 1;
			innerOriginalCandidate = innerOriginalCandidate.substring(foundPos + 1);
		}
	}
	return eval;
}
function emphasize(originalCandidate, keyword){
	var tag = ["<b>","</b>"];
	var empFlag = false;
	//var eval = 0;
	var emphasizedCandidate = "";
	var innerOriginalCandidate = originalCandidate;
	for(var indexOfKeyword = 0, lengthOfKeyword = keyword.length ; indexOfKeyword < lengthOfKeyword ; indexOfKeyword++){
		var foundPos = innerOriginalCandidate.toLocaleLowerCase().indexOf(keyword[indexOfKeyword].toLocaleLowerCase());
		if(foundPos == -1){
			//eval = eval - 1;
			if(indexOfKeyword == lengthOfKeyword - 1){
				if(empFlag == true){
					emphasizedCandidate = emphasizedCandidate + tag[1];
				}
				emphasizedCandidate = emphasizedCandidate + innerOriginalCandidate;
			}
		}else{
			//eval = eval + 1;
			if(empFlag == false){
				emphasizedCandidate = emphasizedCandidate + innerOriginalCandidate.substring(0, foundPos);
				emphasizedCandidate = emphasizedCandidate + tag[0];
				emphasizedCandidate = emphasizedCandidate + innerOriginalCandidate[foundPos];
				innerOriginalCandidate = innerOriginalCandidate.substring(foundPos + 1);
				empFlag = true;
			}else{
				if(foundPos > 0){ emphasizedCandidate = emphasizedCandidate + tag[1]; }
				emphasizedCandidate = emphasizedCandidate + innerOriginalCandidate.substring(0, foundPos);
				if(foundPos > 0){ emphasizedCandidate = emphasizedCandidate + tag[0]; }
				emphasizedCandidate = emphasizedCandidate + innerOriginalCandidate[foundPos];
				innerOriginalCandidate = innerOriginalCandidate.substring(foundPos + 1);
			}
			if(empFlag == true && indexOfKeyword == lengthOfKeyword - 1){
				emphasizedCandidate = emphasizedCandidate + tag[1];
				emphasizedCandidate = emphasizedCandidate + innerOriginalCandidate;
			}
		}
	}
	return emphasizedCandidate;
}

function addComplementCandidateToRes
(currentDirectory, state, candidate, searchKeyword, emphasizedCandidate, res){
	if(emphasizedCandidate.length > 0 || searchKeyword.length == 0){
		const commandHeader = commonUtil.commandHeader;

		var descriptionMessage =
			//"Set this path : \"" + foundCandidates[index].path + "\"";
			"Set this path : \"" + candidate + "\"";
		//var redirect;
		var innerId, innerTitle, innerIcon, innerRedirect, innerGroup;
		//switch(foundCandidates[index].state){
		switch(state){
			case "drive":
				innerTitle = "";
				innerId =
					commandHeader + " " +
					currentDirectory + candidate + "\\";
				innerIcon = "#fa fa-hdd-o";
				innerRedirect = innerId;
				innerGroup = "Complement Pathes : Drive";
				break;
			case "file":
				innerTitle = ".\\";
				innerId =
					commandHeader + " " +
					currentDirectory + candidate;
				innerIcon = "#fa fa-file";
				innerRedirect = innerId;
				innerGroup = "Complement Pathes : File";
				break;
			case "folder":
				innerTitle = ".\\";
				innerId =
					commandHeader + " " +
					currentDirectory + candidate + "\\";
				innerIcon = "#fa fa-folder";
				innerRedirect = innerId;
				innerGroup = "Complement Pathes : Folder";
				break;
		}

		if(searchKeyword.length == 0){
			innerTitle = innerTitle + candidate;
		}else{
			innerTitle = innerTitle + emphasizedCandidate;
		}

		//add to res
		res.add(
			{
				id: innerId,
				payload: 'complement',
				title: innerTitle,
				icon: innerIcon,
				desc: descriptionMessage,
				redirect:innerRedirect,
				group: innerGroup
			}
		);
	}
}

function complementDrives(availableDrives, searchKeyword, res){
	//reset
	complementProgressManager.reset();
	complementSortManager.reset();
	//search available path to complement
	var currentDirectory = "";
	var len = availableDrives.length;
	complementProgressManager.setComplementCandidateNum(len);

	//listup available drives
	for (var index = 0; index < len ; index++){
		if(availableDrives[index].isAvailable == true){
			var originalCandidate = availableDrives[index].driveName;
			var eval = evaluate(originalCandidate, searchKeyword);
			if(eval > 0 || searchKeyword.length == 0){
				//add to res
				complementProgressManager.addAddedComplementCandidateNum();
				complementSortManager.add(currentDirectory, originalCandidate, eval, searchKeyword, "drive");
			}
		}
		complementProgressManager.addProgress();
	}
	checkProgress(res, currentDirectory);
}
function filterFileOrFolder(err, list, currentDirectory, searchKeyword, res){
	var len = list.length;
	complementProgressManager.setComplementCandidateNum(len)
	if(err){
		//console.log("err");
		checkProgress(res, currentDirectory);
	}else{
		if(searchKeyword.length == 0){
			for(var index = 0; index < len ; index++) {
				let originalCandidate = list[index];
				//add to res
				fs.stat(currentDirectory + originalCandidate, function(err, stats){
					if(err){
						//console.log("err");
						//do nothing
					}else if(stats.isFile() == true){
						complementProgressManager.addAddedComplementCandidateNum();
						complementSortManager.add(currentDirectory, originalCandidate, 0, searchKeyword, "file");
					}else{
						complementProgressManager.addAddedComplementCandidateNum();
						complementSortManager.add(currentDirectory, originalCandidate, 0, searchKeyword, "folder");
					}
					complementProgressManager.addProgress();
					checkProgress(res, currentDirectory);
				});
			}
		}else{
			for(var index = 0, len = list.length ; index < len ; index++) {
				let originalCandidate = list[index];
				//filter
				let innerSearchKeyword = searchKeyword;

				let eval = evaluate(originalCandidate, innerSearchKeyword);
				if(eval > 0){
					//add to res
					fs.stat(currentDirectory + originalCandidate, function(err, stats) {
						if(err){
							//do nothing
						}else if (stats.isFile() == true) {
							complementProgressManager.addAddedComplementCandidateNum();
							complementSortManager.add(currentDirectory, originalCandidate, eval, searchKeyword, "file");
						} else {
							complementProgressManager.addAddedComplementCandidateNum();
							complementSortManager.add(currentDirectory, originalCandidate, eval, searchKeyword, "folder");
						}
						complementProgressManager.addProgress();
						checkProgress(res, currentDirectory);
					});
				}else{
					complementProgressManager.addProgress();
					checkProgress(res, currentDirectory);
				}
			}
		}
	}
}
function complementFileOrFolder(currentDirectory, searchKeyword, res) {
	//reset
	complementProgressManager.reset();
	complementSortManager.reset();

	//check the status of currentpath async
	fs.stat(currentDirectory, function(err, stats){
		if(err){
			//console.log("err");
		}else if(stats.isDirectory()){
			//when only currentPath is folder
			//exec fs.readdir (get child folder/files)
			fs.readdir(currentDirectory, function(err, list){
				filterFileOrFolder(err, list, currentDirectory, searchKeyword, res);
			});
		}else{
			//console.log("else");
		}
	});
}

var searchCandidates = function(formattedQuery, availableDrives, res){

	var keywords = extractKeywords(formattedQuery);
	var currentDirectory = keywords[0];
	var searchKeyword = keywords[1];
	//search available path to complement
	//check if the current directory is empty or not
	//empty (suggest available drives)
	if(currentDirectory == ""){
		complementDrives(availableDrives, searchKeyword, res);
	}else{//not empty (suggest available child folder/files)
		complementFileOrFolder(currentDirectory, searchKeyword, res);
	}
	//Search Available Drives again.
	searchDriveUtil.searchAvailableDrivesAsync();
}

function addNotFoundCommand(res, currentDirectory){
	res.add(
		{
			id: commonUtil.commandHeader + " " + currentDirectory,
			icon: "#fa fa-undo",
			payload: 'notfound',
			redirect: commonUtil.commandHeader + " " + currentDirectory,
			title: "No file/folder was not found.",
			desc: "Back to parent folder : " + currentDirectory,
			group: "File/Folder Not Found"
		}
	);
}
function addCandidatesOfEachState(res, state, sortedCandidates){
	var len = sortedCandidates.length;
	for (var index = 0; index < len; index++) {
		var candidate = sortedCandidates[index];
		var innerState = candidate.state;
		if(innerState == state){
			var currentDirectory = candidate.currentDirectory;
			var originalCandidate = candidate.originalCandidate;
			var keyword = candidate.keyword;
			addComplementCandidateToRes(
				currentDirectory, innerState, originalCandidate,
				keyword, emphasize(originalCandidate, keyword), res
			);
		}
	}
}
function addSortedCandidates(res){
	var sortedCandidates = complementSortManager.getSortedCandidates();
	//add drives
	addCandidatesOfEachState(res, "drive", sortedCandidates);
	//add folders
	addCandidatesOfEachState(res, "folder", sortedCandidates);
	//add files
	addCandidatesOfEachState(res, "file", sortedCandidates);
}

function checkProgress(res, currentDirectory){
	if(searchProgressManager.isSearchCompleted() == true && complementProgressManager.isComplementCompleted() == true){
		if(searchProgressManager.isPathAdded() == false && complementProgressManager.isComplementAdded() == false){
			addNotFoundCommand(res, currentDirectory);
		}else{
			addSortedCandidates(res);
		}
	}
}

exports.searchCandidates = searchCandidates;