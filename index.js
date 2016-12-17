'use strict'

module.exports = (pluginContext) => {
	const shell = pluginContext.shell;
	const clipboard = pluginContext.clipboard;
	//to access filesystem
	const fs = require('fs');
	
	//check if the file or folder exists
	function checkFileOrFolder(path) {
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

	function search (query, res) {
		//format query.
		//remove spaces attached on head and bottom.
		var query_trim = query.trim();

		//search \n.
		var foundNewLineFlag = false;
		var queryTrimCopy = query_trim;
		//queryTrimCopy = queryTrimCopy.replace(/[\t]/g,"aaa");
		
		//check the length of query
		if (query.trim().length === 0) {
			return;
		}
		
		//identify file or folder

		//add to res.
		var tmpMessageForDebug = queryTrimCopy;

		var splitTest = tmpMessageForDebug.split('\\');

		tmpMessageForDebug = tmpMessageForDebug.replace(/[\t]/g,"ddd");
		tmpMessageForDebug = tmpMessageForDebug.replace(/[　]/g,"eee");
		//tmpMessageForDebug = tmpMessageForDebug.replace(/[\s]/g,"aaa");//including ' ',\t,'　'
		tmpMessageForDebug = tmpMessageForDebug.replace(/[\r]/g,"bbb");
		tmpMessageForDebug = tmpMessageForDebug.replace(/[\n]/g,"ccc");
		
		tmpMessageForDebug = queryTrimCopy.fileSize;
		res.add(
			{
				id: query_trim,
				payload: 'open',
				title: tmpMessageForDebug,
				desc: "Open this File/Folder Path."
			}
		);
	}

	function execute (id, payload) {
		//open file or folder.
		if (payload !== 'open') {
			return
		}
		//shell.beep();
		shell.openItem(`${id}`);
	}

	return { search, execute };
}
