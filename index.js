'use strict'

module.exports = (pluginContext) => {
	const shell = pluginContext.shell;

	function search (query, res) {
		//format query.
		//remove spaces attached on head and bottom.
		var query_trim = query.trim();

		//search \n.
		var foundNewLineFlag = false;
		var queryTrimCopy = query_trim;
		//queryTrimCopy = queryTrimCopy.replace(/[\t]/g,"aaa");
		/*
		for (var index = 0; index < query_trim.length; index++ ){
			//when \n is found
			if(foundNewLineFlag == true){// if foundNewLineFlag == true;
				//search next valid character (not ' ','　','\t','\n');
				switch(query_trim[index]){
					case ' ':
					case '　':
					case '\t':
						//replace '\n'
						queryTrimCopy[index] = 'a';
						break;
					default :
						//do nothing
						foundNewLineFlag = false;
						break;
				}
			}else{
				if(query_trim[index] == '\n'){
					foundNewLineFlag = true;
				}
			}
		}*/
		
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
		//tmpMessageForDebug = tmpMessageForDebug.replace(/[\s]/g,"aaa");
		tmpMessageForDebug = tmpMessageForDebug.replace(/[\r]/g,"bbb");
		tmpMessageForDebug = tmpMessageForDebug.replace(/[\n]/g,"ccc");
		
		tmpMessageForDebug = "";
		for (var index = 0;index < splitTest.length; index++){
			tmpMessageForDebug += splitTest[index] + "xxx";
		}
		res.add(
			{
				id: queryTrimCopy,
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
		shell.openItem(`${id}`);
	}

	return { search, execute };
}
