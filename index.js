'use strict'

module.exports = (pluginContext) => {
	const shell = pluginContext.shell;

	function search (query, res) {
		//format query.
		var query_format = "xxx";
		//check the length of query
		if (query_format.length === 0) {
			return;
		}
		//identify file or folder

		//add to res.
		res.add(
			{
				id: query_trim,
				payload: 'open',
				title: query_format,
				desc: "Open this File/Folder Path."
			}
		);
	}

	function execute (id, payload) {
		//open file or folder.
		if (payload !== 'open') {
			return
		}
		shell.openItem(`${id}`);
	}

	return { search, execute };
}
