//to access filesystem
const fs = require('fs');

var availableDrives = initAvailableDrives();

function initAvailableDrives(){
	var innnerAvailableDrives = [];
	const ASCIICodeOfA = 65 , ASCIICodeOfZ = 90;
	for (var ASCIICode = ASCIICodeOfA; ASCIICode <= ASCIICodeOfZ ; ASCIICode++){
		var checkingDrive = String.fromCharCode(ASCIICode) + ":";
		innnerAvailableDrives.push(
			{
				driveName:checkingDrive,
				isAvailable:false,
				failureOfAccess:0
			}
		);
	}
	return innnerAvailableDrives;
}

//search available drives.
const failureThreshold = 10;
exports.searchAvailableDrivesAsync = function(){
	//{
	//	driveName:checkingDrive + "\\",
	//	isAvailable:false,
	//	failureOfAccess:0
	//}
	for (var index = 0, len = availableDrives.length ; index < len ; index++){
		let checkingDriveObj = availableDrives[index];
		fs.stat(checkingDriveObj.driveName, function(err,stats){
			if(err){
				if(checkingDriveObj.isAvailable == true){
					checkingDriveObj.failureOfAccess++;
					if(checkingDriveObj.failureOfAccess > failureThreshold){
						checkingDriveObj.isAvailable = false;
						checkingDriveObj.failureOfAccess = 0;
					}
				}
				return;
			}else{
				if(stats.isDirectory() == true){
					if(checkingDriveObj.isAvailable == true){
						checkingDriveObj.failureOfAccess = 0;
					}else{
						checkingDriveObj.isAvailable = true;
					}
				}
			}
		});
	}
}

exports.getAvailableDrives = function(){
	return availableDrives;
}

