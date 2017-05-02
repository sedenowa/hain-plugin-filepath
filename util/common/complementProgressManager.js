
var complementProgressNum = 0;
var getComplementProgressNum = function(){
	return complementProgressNum;
};
var addProgress = function(){
	complementProgressNum += 1;
}

var complementCandidateNum = 0;
var setComplementCandidateNum = function(num){
	complementCandidateNum = num;
}
var getComplementCandidateNum = function(){
	return complementCandidateNum;
}

var addedComplementCandidateNum = 0;
var getAddedComplementCandidateNum = function(){
	return addedComplementCandidateNum;
}
var addAddedComplementCandidateNum = function(){
	addedComplementCandidateNum += 1;
}

var reset = function(){
	complementCandidateNum = 0;
	complementProgressNum = 0;
	addedComplementCandidateNum = 0;
}

var isComplementCompleted = function(){
	if(getComplementProgressNum() < getComplementCandidateNum()){
		return false;
	}else{
		return true;
	}
}

var isComplementAdded = function(){
	if(getAddedComplementCandidateNum() > 0){
		return true;
	}else{
		return false;
	}
}

exports.setComplementCandidateNum = setComplementCandidateNum;
exports.getComplementProgressNum = getComplementProgressNum;
exports.reset = reset;
exports.addProgress = addProgress;
exports.isComplementCompleted = isComplementCompleted;
exports.isComplementAdded = isComplementAdded;
exports.addAddedComplementCandidateNum = addAddedComplementCandidateNum;