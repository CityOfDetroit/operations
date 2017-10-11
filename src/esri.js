import Helpers from './helpers.js'

const Esri = {
  makeURL: function(url, type, params) {
    return `${url}/query?${Helpers.makeParamString(params)}`
  }
}

export default Esri;