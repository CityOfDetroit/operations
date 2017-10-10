var _ = require('lodash')

const Legend = {

  addLayer: function(categoryUl, layer, url) {
    let div = document.createElement("div")
    div.classList = ['layer-item']
    if (layer.legend) {
      let style = layer.legend.join("")
      console.log(style)
    }
    div.innerHTML = `
          <div id="${layer.layer_name}_icon" class="legend-icon ml1 mr4" style="${layer.legend ? layer.legend.join("") : ''}"> </div>
          <input type="checkbox" class="layer-toggle mr1 ml1" id="${layer.layer_name}" value="${layer.layer_name}">
          <label for="${layer.layer_name}">${layer.name} <a href="https://data.detroitmi.gov/d/${url}">(source)</a></label>`
    categoryUl.appendChild(div)
    return div
  }
}

export default Legend;