//to access filesystem
const fs = require('fs');
//to format filepath
const path = require('path');

var commonUtil = require("./commonUtil");
var commonSearchUtil = require("./commonSearchUtil");
//var searchDriveUtil = require("./searchDriveUtil");

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
			if(foundCandidates[index].path.toLocaleLowerCase().indexOf(searchKeyword.toLocaleLowerCase()) == 0){
				//add to res.
				var descriptionMessage = 
					"Set this path : \"" + foundCandidates[index].path + "\"";
				//var redirect;
				var innerId, innerTitle, innerRedirect;
				switch(foundCandidates[index].state){
					case "drive":
						innerTitle = "";
						innerId = 
							commandHeader + " " + 
							currentDirectory + foundCandidates[index].path + "\\";
						innerRedirect = innerId;
						break;
					case "file":
						innerTitle = ".\\";
						innerId = 
							commandHeader + " " + 
							currentDirectory + foundCandidates[index].path;
						innerRedirect = innerId;
						break;
					case "folder":
						innerTitle = ".\\";
						innerId = 
							commandHeader + " " + 
							currentDirectory + foundCandidates[index].path + "\\";
						innerRedirect = innerId;
						break;
				}
				innerTitle = innerTitle + 
					"<b>" + foundCandidates[index].path.substring(0,searchKeyword.length) + "</b>" + 
					foundCandidates[index].path.substring(searchKeyword.length);
				res.add(
					{
						//id: checkingDrive,
						id: innerId,
						payload: 'complement',
						title: innerTitle,
						desc: descriptionMessage,
						redirect:innerRedirect
					}
				);
			}
		}
	}
	//return foundCandidates;
}
