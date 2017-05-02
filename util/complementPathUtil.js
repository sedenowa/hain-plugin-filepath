//to access filesystem
const fs = require('fs');
//to format filepath
const path = require('path');

var commonUtil = require("./common/commonUtil");
var commonSearchUtil = require("./common/commonSearchUtil");
var searchDriveUtil = require("./searchDriveUtil");
var searchProgressManager = require("./common/searchProgressManager");
var complementProgressManager = require("./common/complementProgressManager");

var searchCandidates = function(formattedQuery, availableDrives, res){
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

	//search and filter child folder/files
	function suggestChildlen(){

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

	//main process
	(function(formattedQuery, availableDrives, res){
		complementProgressManager.reset();

		var keywords = extractKeywords(formattedQuery);
		var currentDirectory = keywords[0];
		var searchKeyword = keywords[1];
		//search available path to complement
		//check if the current directory is empty or not
		//empty (suggest available drives)
		if(currentDirectory == ""){
			//search available path to complement
			//var foundCandidates = [];

			var len = availableDrives.length;
			complementProgressManager.setComplementCandidateNum(len);
			/*
			res.add(
				{
					id: "",
					payload: 'notfound',
					title: "len of list",
					desc: len
				}
			);
			*/

			//listup available drives
			for (var index = 0; index < len ; index++){
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
						complementProgressManager.addAddedComplementCandidateNum();
					}
				}
				complementProgressManager.addProgress();
			}
			checkProgress(res, currentDirectory);
		}else{//not empty (suggest available child folder/files)
			//check the status of currentpath async
			fs.stat(currentDirectory, function(err, stats){
				if(err){
					//console.log("err");
				}else if(stats.isDirectory()){
					//when only currentPath is folder
					//exec fs.readdir (get child folder/files)
					fs.readdir(currentDirectory, function(err, list){
						var len = list.length;
						complementProgressManager.setComplementCandidateNum(len)
						/*
						res.add(
							{
								id: "",
								payload: 'notfound',
								title: "len of list",
								desc: len
							}
						);
						*/
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
											//do nothing
											//console.log("err");
										}else if(stats.isFile() == true){
											addComplementCandidateToRes(
												currentDirectory, "file", originalCandidate,
												"", originalCandidate, res
											);
											complementProgressManager.addAddedComplementCandidateNum();
										}else{
											addComplementCandidateToRes(
												currentDirectory, "folder", originalCandidate,
												"", originalCandidate, res
											);
											complementProgressManager.addAddedComplementCandidateNum();
										}
										complementProgressManager.addProgress();
										checkProgress(res, currentDirectory);
									});
								}
							}else{
								for(var index = 0, len = list.length ; index < len ; index++) {
									/*
									res.add(
										{
											id: "",
											payload: 'notfound',
											title: "aaa",
											desc: len
										}
									);
									*/
									let originalCandidate = list[index];
									//filter
									let innerSearchKeyword = searchKeyword;

									var filteredCandidate = filter(originalCandidate, innerSearchKeyword);
									let emphasizedCandidate = filteredCandidate[0];
									let eval = filteredCandidate[1];
									/*
									res.add(
										{
											id: "",
											payload: 'notfound',
											title: emphasizedCandidate + " : " + searchKeyword,
											desc: eval
										}
									);
									*/

									if(eval > 0){
										//add to res
										fs.stat(currentDirectory + originalCandidate, function(err, stats) {
											if(err){
												//do nothing
											}else if (stats.isFile() == true) {
												addComplementCandidateToRes(
													currentDirectory, "file", originalCandidate,
													innerSearchKeyword, emphasizedCandidate, res
												);
												complementProgressManager.addAddedComplementCandidateNum();
											} else {
												addComplementCandidateToRes(
													currentDirectory, "folder", originalCandidate,
													innerSearchKeyword, emphasizedCandidate, res
												);
												complementProgressManager.addAddedComplementCandidateNum();
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
					});
				}else{
					//console.log("else");
				}
			});
		}
		//Search Available Drives again.
		searchDriveUtil.searchAvailableDrivesAsync();
	})(formattedQuery, availableDrives, res);
}

function checkProgress(res, currentDirectory){
	/*
	res.add(
		{
			id: "",
			payload: 'notfound',
			title: "progress of complement",
			desc: complementProgressManager.getComplementProgressNum()
		}
	);
	*/
	if(searchProgressManager.isSearchCompleted() == true &&
		complementProgressManager.isComplementCompleted() == true){
		/*
		res.add(
			{
				id: "",
				payload: 'notfound',
				title: "searchProgressManager : isSearchCompleted",
				desc: searchProgressManager.isSearchCompleted()
			}
		);
		res.add(
			{
				id: "",
				payload: 'notfound',
				title: "searchProgressManager : isPathAdded",
				desc: searchProgressManager.isPathAdded()
			}
		);
		res.add(
			{
				id: "",
				payload: 'notfound',
				title: "complementProgressManager : isComplementCompleted",
				desc: complementProgressManager.isComplementCompleted()
			}
		);
		res.add(
			{
				id: "",
				payload: 'notfound',
				title: "complementProgressManager : isComplementAdded",
				desc: complementProgressManager.isComplementAdded()
			}
		);
		*/
		if(searchProgressManager.isPathAdded() == false &&
			complementProgressManager.isComplementAdded() == false){
			res.add(
				{
					id: commonUtil.commandHeader + " " + currentDirectory,
					icon: "#fa undo",
					payload: 'notfound',
					redirect: commonUtil.commandHeader + " " + currentDirectory,
					title: "Not Found",
					desc: "No file/folder was not found.",
					//group: "notfound"
				}
			);
		}
	}
	/*
	if(searchProgressManager.isSearchCompleted() == true &&
		searchProgressManager.isPathAdded() == false &&
		complementProgressManager.isComplementCompleted() == true &&
		complementProgressManager.isComplementAdded() == false
		){
		res.add(
			{
				id: "",
				payload: 'notfound',
				title: "notfound",
				desc: "notfound"
			}
		);
	}
	*/
}

exports.searchCandidates = searchCandidates;