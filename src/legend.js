var _ = require('lodash')

const Legend = {

  addLayer: function(categoryUl, layer, url) {
    let div = document.createElement("div")
    div.classList = ['layer-item']
    // if (layer.legend.style) {
    //   let style = layer.legend.style.join("")
    //   console.log(style)
    // }
    let legendDiv = ''
    if (layer.legend) {
      legendDiv += `
        <div id="${layer.layer_name}_icon" 
        class="legend-icon" 
        style="${layer.legend.style ? layer.legend.style.join("") : ''}"> 
        ${layer.legend.image ? `<img src=${layer.legend.image}>` : ''}
        </div>
      `
    }
    div.innerHTML = `
          ${legendDiv ? legendDiv : ''}
          <input type="checkbox" class="layer-toggle mr1 ml1" id="${layer.layer_name}" value="${layer.layer_name}">
          <label for="${layer.layer_name}">${layer.name} <a href="https://data.detroitmi.gov/d/${url}">(source)</a></label>`
    categoryUl.appendChild(div)
    return div
  }
}

export default Legend;