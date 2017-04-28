
//searching considering white spaces
var patternCheckProgress = 0;
exports.getProgress = function(){
	return patternCheckProgress;
}
var patternMax = 0;
exports.getPatternMax = function(){
	return patternMax;
}
var isPatternMaxLocked = false;
//set patternCheckProgress to 0
//    patternMax to 0
//    isPatternMaxLocked to false
var resetProgress = function(){
	patternCheckProgress = 0;
	patternMax = 0;
	isPatternMaxLocked = false;
}
var setPatternMax = function(listAllLayer){
	if(isPatternMaxLocked == false) {
		var patternNum = 1;
		for(var index = 0, len = listAllLayer.length; index < len; index++){
			var targetLayer = listAllLayer[index];
			var targetLen = targetLayer.length;
			if(targetLen > 0){
				patternNum *= targetLen;
			}
		}
		patternMax = patternNum;
		isPatternMaxLocked = true;
		return true;
	}else{
		return false;
	}
}
var addProgress = function(remainingList){//calc pattern
	function calcPatterns(list){
		var patternNum = 1;
		for(var index = 0, len = list.length; index < len; index++){
			var targetLen = list[index].length;
			if(targetLen > 0){
				patternNum *= targetLen;
			}
		}
		return patternNum;
	}
	if(isPatternMaxLocked == true){
		patternCheckProgress += calcPatterns(remainingList);
		return isSearchCompleted();
	}else{
		return false;
	}
}
var addProgressByNum = function(addition){
	patternCheckProgress += addition;
}
//return true / false
var isSearchCompleted = function(){
	if(patternCheckProgress < patternMax){
		return false;
	}else{
		return true;
	}
}

//exports
exports.resetProgress = resetProgress;
exports.setPatternMax = setPatternMax;
exports.addProgress = addProgress;
exports.addProgressByNum = addProgressByNum;
exports.isSearchCompleted = isSearchCompleted;
