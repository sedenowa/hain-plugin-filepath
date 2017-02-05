//to access filesystem
const fs = require('fs');
//to format filepath
const path = require('path');

var commonUtil = require("./commonUtil");
var commonSearchUtil = require("./commonSearchUtil");


exports.searchCandidates = function(formattedQuery, availableDrives, res){
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
	//return: ["<b>AB</b>C<b>D</b>E" or "", evaluation(number)]
	function filter(target, keyword){
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
			return [ret, eval];
		}else{
			return ["", eval];
		}
	}	
	
	//
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
	
	//main process
	(function(formattedQuery, availableDrives, res){
		var keywords = extractKeywords(formattedQuery);
		var currentDirectory = keywords[0];
		var searchKeyword = keywords[1];
		//search available path to complement
		
		//check if the current directory is empty or not
		if(currentDirectory == ""){
			//search available path to complement
			//var foundCandidates = [];

			//listup available drives
			for (var index = 0, len = availableDrives.length ; index < len ; index++){
				if(availableDrives[index].isAvailable == true){
					var originalCandidate = availableDrives[index].driveName;
					//filter
					var filteredCandidate = filter(originalCandidate, searchKeyword);
					var emphasizedCandidate = filteredCandidate[0];
					var eval = filteredCandidate[1];
					if(eval > 0 || searchKeyword.length == 0){
						//add to res
						addComplementCandidateToRes(
							currentDirectory, "drive", originalCandidate, 
							searchKeyword, emphasizedCandidate, res
						);
					}
				}
			}
		 }else{
			//check the status of currentpath async
			fs.stat(currentDirectory, function(err, stats){
				if(err){
					//console.log("err");
				}else if(stats.isDirectory()){
					//when only currentPath is folder
					
					//exec fs.readdir
					fs.readdir(currentDirectory, function(err, list){
						if(err){
							//console.log("err");
						}else{
							for(var index = 0, len = list.length ; index < len ; index++){
								//check the status of currentpath async
								let originalCandidate = list[index];
								fs.stat(currentDirectory + originalCandidate, function(err, stats){
									if(err){
										//console.log("err");
									}else if(stats.isFile() || stats.isDirectory()){
										//filter
										var filteredCandidate = filter(originalCandidate, searchKeyword);
										var emphasizedCandidate = filteredCandidate[0];
										var eval = filteredCandidate[1];
										if(eval > 0 || searchKeyword.length == 0){
											//add to res
											if(stats.isFile() == true){
												addComplementCandidateToRes(
													currentDirectory, "file", originalCandidate,
													searchKeyword, emphasizedCandidate, res
												);
											}else{
												addComplementCandidateToRes(
													currentDirectory, "folder", originalCandidate,
													searchKeyword, emphasizedCandidate, res
												);
											}
										}
									}else{
										//console.log("else");
									}
								});
							}
						}
					});
				}else{
					//console.log("else");
				}
			});
		}
	})(formattedQuery, availableDrives, res);
}
