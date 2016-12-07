'use strict'

module.exports = (pluginContext) => {
  const shell = pluginContext.shell

  function search (query, res) {
    //format query
    //add to res
}

  function execute (id, payload) {
    //identify file or folder 
    //open file or folder
    shell.openItem(`${id}`)
  }

  return { search, execute }
}
