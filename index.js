'use strict'

module.exports = (pluginContext) => {
	//to access context of app
	const app = pluginContext.app;
	//to open File/Folder
	const shell = pluginContext.shell;
	
	//Utils
	var formatStringUtil = require("./util/formatStringUtil");
	var searchPathUtil = require("./util/searchPathUtil");
	var searchDriveUtil = require("./util/searchDriveUtil");
	var complementPathUtil = require("./util/complementPathUtil");
	
	function startup(){
		//Search Available Drives.
		searchDriveUtil.searchAvailableDrivesAsync();
	}
	
	function search (query, res) {
		//format query.
		var formattedQuery = formatStringUtil.formatString(query);

		//search available path considering unnecessary spaces.
		searchPathUtil.addOpenCommand(formattedQuery, res);

		//search available path to complement
		var availableDrives = searchDriveUtil.getAvailableDrives();
		complementPathUtil.searchCandidates(formattedQuery, availableDrives, res);

		//refresh command to the end of list
		searchDriveUtil.addRefreshCommand(query,res);
	}

	function execute (id, payload) {
		//open file or folder.
		switch (payload){
			case 'open':
				//open file/folder
				shell.openItem(`${id}`);
				break;
			case 'complement':
				//complement path (set id to query)
				app.setQuery(id);
				break;
			case 'refresh':
				//search available drives again.
				searchDriveUtil.searchAvailableDrivesAsync();
				app.setQuery(id);
				break;
			case 'pending':
			default:
				return;
		}
	}

	return { startup, search, execute };
}
