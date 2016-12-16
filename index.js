'use strict'

module.exports = (pluginContext) => {
	const shell = pluginContext.shell

	function search (query, res) {
		//format query.
		const query_trim = query.trim()
		if (query_trim.length === 0) {
			return
		}
		//identify file or folder

		//add to res.
		res.add({
			id: query_trim,
			payload: 'open',
			title: query_trim,
			desc: 'Search on Google.com'
		})
	}

	function execute (id, payload) {
		//open file or folder.
		if (payload !== 'open') {
			return
		}
		shell.openItem(`${id}`)
		//shell.openExternal(`http://www.google.com/search?q=${id}`)
	}

	return { search, execute }
}
