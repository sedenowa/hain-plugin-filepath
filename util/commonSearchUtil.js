//to access filesystem
const fs = require('fs');
//to format filepath
const path = require('path');

//var commonUtil = require("./commonUtil");

//check if the file or folder exists
//return 1:File 2:Folder -1,0:Invalid path
exports.checkFileOrFolder = function(path) {
	try {
		var stat = fs.statSync(path);
		if(stat.isFile() == true){
			return 1;//file
		}else if(stat.isDirectory() == true){
			return 2;//folder
		}else{//unreachable
			return 0;//invalid
		}
	} catch(err) {
		if(err.code === 'ENOENT'){
			return -1;//invalid
		}
	}
}

var networkHeader = "\\\\";
function checkFileServer(query){
	//check if the path is file server.
	//if the path is file server, remove "\\" attached on head.
	var isFileServer = false;
	if(query.indexOf(networkHeader) == 0 &&
		 query[networkHeader.length] != '\\' &&
		 query[networkHeader.length] != undefined){
		isFileServer = true;
	}
	return isFileServer;
}

var separator = "\\";
exports.separatePath = function(targetPath){
	//split path
	//check if the path is file server.
	//if the path is file server, remove "\\" attached on head.
	var isFileServer = checkFileServer(targetPath);
	if(isFileServer == true){
		targetPath = targetPath.substring(("\\\\").length);
	}

	//split by separator('\' or '/').
	var splittedPath = targetPath.split(separator);

	//if isFileServer is true, combine 1st and 2nd element.
	if(isFileServer == true){
		if(splittedPath.length >= 2){
			splittedPath[1] = networkHeader + splittedPath[0] + separator + splittedPath[1];
			splittedPath.shift();
		}else if (splittedPath.length == 1){
			splittedPath[0] = networkHeader + splittedPath[0];
		}
	}
	//remove empty element in splittedQuery.
	splittedPath = splittedPath.filter(function(e){return e !== "";});
	return splittedPath;
}