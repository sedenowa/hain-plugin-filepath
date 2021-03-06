
//searching considering white spaces
var patternCheckProgress = 0;
//getter
exports.getProgress = function(){
	return patternCheckProgress;
}

var patternMax = 0;
//getter
var getPatternMax = function(){
	return patternMax;
};

var foundPathNum = 0;
var getFoundPathNum = function(){
	return foundPathNum;
};
var addFoundPathNum = function(){
	foundPathNum += 1;
};
var resetFoundPathNum = function(){
	foundPathNum = 0;
};

var isPatternMaxLocked = false;

//set patternCheckProgress to 0
//    patternMax to 0
//    isPatternMaxLocked to false
var reset = function(){
	patternCheckProgress = 0;
	patternMax = 0;
	isPatternMaxLocked = false;
	resetFoundPathNum();
}

var setPatternMax = function(listAllLayer){
	if(isPatternMaxLocked == false) {
		if(listAllLayer.length == 0){
			patternMax = 0;
		}else{
			var patternNum = 1;
			for(var index = 0, len = listAllLayer.length; index < len; index++){
				var targetLayer = listAllLayer[index];
				var targetLen = targetLayer.length;
				if(targetLen > 0){
					patternNum *= targetLen;
				}
			}
			patternMax = patternNum;
		}
		isPatternMaxLocked = true;
		return true;
	}else{
		return false;
	}
}
var setPatternMaxByNum = function(max){
	if(isPatternMaxLocked == false) {
		patternMax = max;
		isPatternMaxLocked = true;
		return true;
	}else{
		return false;
	}
}

var addProgressByRemainingList = function(remainingList){//calc pattern
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

var isPathAdded = function(){
	if(getFoundPathNum() > 0){
		return true;
	}else{
		return false;
	}
}

//exports
exports.getFoundPathNum = getFoundPathNum;
exports.getPatternMax = getPatternMax;
exports.reset = reset;
exports.setPatternMax = setPatternMax;
exports.addProgressByRemainingList = addProgressByRemainingList;
exports.addProgressByNum = addProgressByNum;
exports.isSearchCompleted = isSearchCompleted;
exports.addFoundPathNum = addFoundPathNum;
exports.isPathAdded = isPathAdded;