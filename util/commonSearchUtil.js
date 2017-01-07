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
