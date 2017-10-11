var _ = require('lodash')

const Legend = {

  addLayer: function(layerTable, layer, url) {
    let tr = document.createElement("tr")
    let legendDiv = ''
    if (layer.legend) {
      legendDiv += `<div id="${layer.layer_name}_icon" class="legend-icon" style="${layer.legend.style ? layer.legend.style.join("") : ''}">${layer.legend.image ? `<img src=${layer.legend.image}>` : ''}</div>`
    }
    tr.innerHTML = `
          <td class='tc w-5 v-mid'>${legendDiv ? legendDiv : ''}</td>
          <td class='w-auto fw3 f5 mr2'><label for="${layer.layer_name}">${layer.name}</label></td>
          <td class='tc w-5 v-mid ml2'><input type="checkbox" class="layer-toggle" id="${layer.layer_name}" value="${layer.layer_name}"></td>
          <td class='tc w-5 v-mid'><a href="https://data.detroitmi.gov/d/${url}" class='f7 fw6 db dark-blue no-underline underline-hover'>data</a></td>
          `        
    layerTable.appendChild(tr)
    return tr
  }
}

export default Legend;