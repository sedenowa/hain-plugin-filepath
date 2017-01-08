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
		var normalizedQuery = path.normalize(stringRemovedUnavailableCharacters);
		if(normalizedQuery == "."){
			normalizedQuery = "";
		}
	
	return normalizedQuery;
}