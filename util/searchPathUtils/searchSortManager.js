var foundPathes = [];
function addFoundPath(path, state, difference){
	if(path != undefined && state != undefined && difference != undefined){
		var len = foundPathes.length;
		if(len > 0){
			for(var index = 0; index < len; index++){
				var savedFoundPath = foundPathes[index];
				var savedPath = savedFoundPath.path;
				var savedState = savedFoundPath.state;
				var savedDifference = savedFoundPath.difference;
				if(savedPath == path && savedState == state){
					return;
				}
			}
		}
	}
	//add
	foundPathes.push(
		{
			path: path,
			state: state,
			difference: difference
		}
	);
}
function resetFoundPathes(){
	foundPathes = [];
}
function hasFoundPath(path, state){
	if(path != undefined && state != undefined){
		for(var index = 0, len = foundPathes.length; index < len; index++){
			var foundPath = foundPathes[index];
			var savedPath = foundPath.path;
			var savedState = foundPath.state;
			if(savedPath == path && savedState == state){
				return true;
			}
		}
	}
	return false;
}

function sortFoundPathesByDifference(list){
	list.sort(function (a, b) {
		if(a.difference > b.difference){
			return 1;
		}else if(a.difference < b.difference){
			return -1;
		}else{
			if(a.path > b.path){
				return 1;
			}else if(a.path < b.path) {
				return -1;
			}else{
				return 0;
			}
		}
	});
}
function getSortedFoundPathes() {
	//copy
	var sortedFoundPathes = foundPathes.slice();
	//sort
	sortFoundPathesByDifference(sortedFoundPathes);
	//return
	return sortedFoundPathes;
}

exports.add = addFoundPath;
exports.reset = resetFoundPathes;
exports.getSortedFoundPathes = getSortedFoundPathes;
