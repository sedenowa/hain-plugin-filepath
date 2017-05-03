'use strict'

module.exports = (pluginContext) => {
	//to access context of app
	const app = pluginContext.app;
	//to open File/Folder
	const shell = pluginContext.shell;
	
	//Utils
	var formatStringUtil = require("./util/formatStringUtil");
	var searchPathUtil = require("./util/searchPathUtils/searchPathUtil");
	var searchDriveUtil = require("./util/complementPathUtils/searchDriveUtil");
	var complementPathUtil = require("./util/complementPathUtils/complementPathUtil");
	
	function startup(){
		//Search Available Drives.
		searchDriveUtil.searchAvailableDrivesAsync();
	}
	
	function search (query, res) {
		//format query.
		var formattedQuery = formatStringUtil.formatString(query);

		//search available path considering unnecessary spaces.
		searchPathUtil.searchAvailablePathAsync(formattedQuery, res)
		//(search available path to complement)
		//(search Available Drives.)
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
			case 'notfound':
				//back to parent folder
				app.setQuery(id);
				break;
			case 'pending':
				break;
			default:
				break;
		}
	}

	return { startup, search, execute };
}
