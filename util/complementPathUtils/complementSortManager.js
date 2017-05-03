var filteredCandidates = [];
var addFilteredCandidates = function(currentDirectory, originalCandidate, eval, keyword){
	if(originalCandidate != undefined && eval != undefined){
		var len = filteredCandidates.length;
		if(len > 0){
			for(var index = 0; index < len; index++){
				var savedOriginalCandidate = filteredCandidates[index].originalCandidate;
				var savedEval = filteredCandidates[index].eval;
				if(savedOriginalCandidate == originalCandidate && savedEval == eval){
					//do nothing
					return;
				}
			}
		}
		//add
		filteredCandidates.push(
			{
				currentDirectory: currentDirectory,
				originalCandidate: originalCandidate,
				eval: eval,
				keyword: keyword
			}
		);
	}
}
var resetFilteredCandidates = function(){
	filteredCandidates = [];
}
var hasFilteredCandidate = function(path, eval){
	if(path && eval){
		for(var index = 0, len = filteredCandidates.length; index < len; index++){
			var savedPath = filteredCandidates[index].originalCandidate;
			var savedEval = filteredCandidates[index].eval;
			if(savedPath == path && savedEval == 0){
				return true;
			}
		}
	}
	return false;
}

var sortCandidatesByEval = function(list){
	list.sort(function (a, b) {
		if(a.eval > b.eval){
			return -1;
		}else if(a.eval < b.eval){
			return 1;
		}else{
			if(a.originalCandidate > b.originalCandidate){
				return 1;
			}else if(a.originalCandidate < b.originalCandidate) {
				return -1;
			}else{
				return 0;
			}
		}
	});
}
var getSortedCandidates = function(){
	//copy
	var sortedCandidates = filteredCandidates.slice();
	//sort
	sortCandidatesByEval(sortedCandidates);
	//return
	return sortedCandidates;
}

exports.add = addFilteredCandidates;
exports.reset = resetFilteredCandidates;
exports.hasFilteredCandidate = hasFilteredCandidate;
exports.getSortedCandidates = getSortedCandidates;
