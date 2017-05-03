//to format filepath
const path = require('path');

//remove all specified characters from string
//return string (removed characters).
function removeCharacters(string, removingCharactersArray){
	var stringRemovedCharacters = string;
	for(var index = 0 ; index < removingCharactersArray.length ; index++){
		var removingCharacter = removingCharactersArray[index];
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
		stringRemovedCharacters = 
			stringRemovedCharacters.replace(
				new RegExp(removingCharacter,"g")
				,""
			);
	}
	return stringRemovedCharacters;
}

//format string as below.
//remove spaces attached on head and bottom.
//remove line feed code and spaces attached to it.
exports.formatString = function(string){
	//remove spaces attached on head and bottom.
	var trimmedString = string.trim();

	//remove unavailable characters.
	var stringRemovedUnavailableCharacters = 
		removeCharacters(trimmedString,['*','/','?',"\"","<",">","|","\t"]);

	//normalize
	//var normalizedQuery = path.normalize(stringRemovedUnavailableCharacters);
	var normalizedQuery = path.normalize(stringRemovedUnavailableCharacters);
	if(stringRemovedUnavailableCharacters.indexOf("\\\\") == 0) {
		if(normalizedQuery.indexOf("\\\\") != 0){
			normalizedQuery = "\\" + normalizedQuery;
		}
	}

	if(normalizedQuery == "."){
		normalizedQuery = "";
	}else if(normalizedQuery == "\\" || normalizedQuery == "\\\\"){
		normalizedQuery = "";
	}

	if(normalizedQuery[0] >= 'A' && normalizedQuery[0] <= 'Z' && normalizedQuery[1] >= ':'){
		if(normalizedQuery[2] == "."){
			normalizedQuery = normalizedQuery.slice().substring(0, 2) + normalizedQuery.slice().substring(3);
		}
	}
	
	return normalizedQuery;
}