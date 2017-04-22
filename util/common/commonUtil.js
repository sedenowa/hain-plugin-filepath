//remove character with its potition
//ex func("abc",1) -> return "ac"
exports.removeCharacterWithPosition = function(string, index){
	var firstHalf = string;
	var latterHalf = string;
	var stringRemovedChar = 
		firstHalf.slice(0,index) + 
		latterHalf.slice(index+1);
	return stringRemovedChar;
}

exports.commandHeader = "/fp";