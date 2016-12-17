'use strict'

module.exports = (pluginContext) => {
	const shell = pluginContext.shell;
	const clipboard = pluginContext.clipboard;
	//to access filesystem
	const fs = require('fs');
	
	//check if the file or folder exists
	//return 1:File 2:Folder -1,0:Invalid path
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

	//remove all specified characters from string
	//return string (removed characters).
	//arguments are not modified.
	function removeCharacters(targetString,removingCharacterArray){
		var copyOfTargetString = targetString;
		for(var index = 0 ; index < removingCharacterArray.length ; index++){
			var removingCharacter = removingCharacterArray[index];
			switch(removingCharacter){
				case "*":
				case "?":
				case "|":
					//add '\' to characters which need '\' 
					removingCharacter = "\\" + removingCharacter;
				default:
					//do nothing.
					break;
			}
			copyOfTargetString = 
				copyOfTargetString.replace(
					new RegExp(removingCharacter,"g")
					,""
				);
		}
		return copyOfTargetString;
	}
	
	function search (query, res) {
		//format query.
		//remove spaces attached on head and bottom.
		var trimmedQuery = query.trim();

		//remove unavailable characters ( * / ? " < > | ).
		var queryRemovedUnavailableCharacters = 
			removeCharacters(trimmedQuery,['*','/','?',"\"","<",">","|","\t"]);

		//split by '\'.
		var splittedQuery = queryRemovedUnavailableCharacters.split('\\');
		
		//search available file/folder name. (considering needless space)


		//Check state of formatted path (File or Folder or not).
		//and set Description Message according to the state.
		var descriptionMessage = "";
		switch(checkFileOrFolder(queryRemovedUnavailableCharacters)){
			case -1://invalid
			case 0://invalid
				descriptionMessage = "Not File/Folder. Cannot open."
				break;
			case 1://file
				descriptionMessage = "Open this File."
				break;
			case 2://folder
				descriptionMessage = "Open this Folder."
				break;
		}
		
		//add to res.
		res.add(
			{
				id: queryRemovedUnavailableCharacters,
				payload: 'open',
				title: queryRemovedUnavailableCharacters,
				desc: descriptionMessage
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
