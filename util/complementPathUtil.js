//to access filesystem
const fs = require('fs');
//to format filepath
const path = require('path');

var commonUtil = require("./commonUtil");
var commonSearchUtil = require("./commonSearchUtil");

const commandHeader = commonUtil.commandHeader;

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
function emphasize(target, keyword){
	var tag = ["<b>","</b>"];
	var empFlag = false;
	var eval = 0;
	var ret = "";
	var checkingPos = 0;
	var innerTarget = target;
	for(var indexOfKeyword = 0, lengthOfKeyword = keyword.length ; indexOfKeyword < lengthOfKeyword ; indexOfKeyword++){
		var foundPos = innerTarget.toLocaleLowerCase().indexOf(keyword[indexOfKeyword].toLocaleLowerCase());
		if(foundPos == -1){
			eval = eval - 1;
			if(indexOfKeyword == lengthOfKeyword - 1){
				if(empFlag == true){
					ret = ret + tag[1];
				}
				ret = ret + innerTarget;
			}
		}else{
			eval = eval + 1;
			if(empFlag == false){
				ret = ret + innerTarget.substring(0, foundPos);
				ret = ret + tag[0];
				ret = ret + innerTarget[foundPos];
				innerTarget = innerTarget.substring(foundPos + 1);
				empFlag = true;
			}else{
				if(foundPos > 0){ ret = ret + tag[1]; }
				ret = ret + innerTarget.substring(0, foundPos);
				if(foundPos > 0){ ret = ret + tag[0]; }
				ret = ret + innerTarget[foundPos];
				innerTarget = innerTarget.substring(foundPos + 1);
			}
			if(empFlag == true && indexOfKeyword == lengthOfKeyword - 1){
				ret = ret + tag[1];
				ret = ret + innerTarget;
			}
		}
	}
	if(eval > 0){
		return ret;
	}else{
		return "";
	}
}

exports.searchCandidates = function(formattedQuery, availableDrives, res){
	var keywords = extractKeywords(formattedQuery);
	var currentDirectory = keywords[0];
	var searchKeyword = keywords[1];
	//search available path to complement
	var foundCandidates = [];
	
	//check the existence of currentDirectory.
	if(currentDirectory == "" || commonSearchUtil.checkFileOrFolder(currentDirectory) == 2){
		//find candidates
		if(currentDirectory == ""){
			for (var index = 0, len = availableDrives.length ; index < len ; index++){
				if(availableDrives[index].isAvailable == true){
					foundCandidates.push(
						{
							path: availableDrives[index].driveName,
							state: "drive"
						}
					);
				}
			}
		}else{// when checkFileOrFolder(currentDirectory) == 2
			//(todo) make async (use fs.readdir)
			var foundList = fs.readdirSync(currentDirectory);
			//foundCandidates = fs.readdirSync(currentDirectory);
			for(var index = 0, len = foundList.length ; index < len ; index++){
				switch(commonSearchUtil.checkFileOrFolder(currentDirectory + foundList[index])){
					case 1://file
						foundCandidates.push(
							{
								path:foundList[index],
								state:"file"
							}
						);
						break;
					case 2://folder
						foundCandidates.push(
							{
								path:foundList[index],
								state:"folder"
							}
						);
						break;
					default:
						//do nothing
						break;
				}
			}
		}
	}
	
	//filter with searchKeyword and add to res
	if(foundCandidates.length > 0){
		for(var index = 0, len = foundCandidates.length ; index < len ; index++){
			//check if candidates contains searchKeyword on head
			var candidate = foundCandidates[index].path;
			var emphasizedCandidate = emphasize(foundCandidates[index].path, searchKeyword);
			//if(foundCandidates[index].path.toLocaleLowerCase().indexOf(searchKeyword.toLocaleLowerCase()) == 0){
			if(emphasizedCandidate.length > 0 || searchKeyword.length == 0){
				//add to res.
				var descriptionMessage = 
					"Set this path : \"" + foundCandidates[index].path + "\"";
				//var redirect;
				var innerId, innerTitle, innerIcon, innerRedirect;
				switch(foundCandidates[index].state){
					case "drive":
						innerTitle = "";
						innerId = 
							commandHeader + " " + 
							currentDirectory + foundCandidates[index].path + "\\";
						innerIcon = "#fa fa-hdd-o";
						innerRedirect = innerId;
						break;
					case "file":
						innerTitle = ".\\";
						innerId = 
							commandHeader + " " + 
							currentDirectory + foundCandidates[index].path;
						innerIcon = "#fa fa-file";
						innerRedirect = innerId;
						break;
					case "folder":
						innerTitle = ".\\";
						innerId = 
							commandHeader + " " + 
							currentDirectory + foundCandidates[index].path + "\\";
						innerIcon = "#fa fa-folder";
						innerRedirect = innerId;
						break;
				}
				/*
				innerTitle = innerTitle + 
					"<b>" + foundCandidates[index].path.substring(0,searchKeyword.length) + "</b>" + 
					foundCandidates[index].path.substring(searchKeyword.length);
					*/
				if(searchKeyword.length == 0){
					innerTitle = innerTitle + foundCandidates[index].path;
				}else{
					innerTitle = innerTitle + emphasizedCandidate;
				}
				res.add(
					{
						//id: checkingDrive,
						id: innerId,
						payload: 'complement',
						title: innerTitle,
						icon: innerIcon,
						desc: descriptionMessage,
						redirect:innerRedirect
					}
				);
			}
		}
	}
	//return foundCandidates;
}
