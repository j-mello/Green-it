window.addEventListener("DOMContentLoaded", event => {
  const form = document.getElementById("form")
  form.addEventListener("submit", function(evt) {
    evt.preventDefault()

    const city = form.elements["cityName"].value
    const dataDiv = document.getElementById("data")
    const errorH2 = document.getElementById("error")
    const dataCityDiv = document.getElementById("dataCity")
    const dataDepartementDiv = document.getElementById("dataDepartement")
    const dataRegionDiv = document.getElementById("dataRegion")

    fetch(`${window.location.origin}/score/${city}`)
      .then(function(response) {
        if (response.ok) {
          errorH2.classList.add("hidden")
          dataDiv.classList.remove("hidden")
          return response.json()
        } else {
          console.log("Mauvaise réponse du serveur")
          errorH2.classList.remove("hidden")
          dataDiv.classList.add("hidden")
          return false
        }
      })
      .then(data => {
        if (data) {
          dataCityDiv.innerHTML = ""
          const dataCityDivH2 = document.createElement("h2")
          dataCityDivH2.innerHTML = "Ville"
          dataCityDiv.appendChild(dataCityDivH2)

          dataDepartementDiv.innerHTML = ""
          const dataDepartementDivH2 = document.createElement("h2")
          dataDepartementDivH2.innerHTML = "Département"
          dataDepartementDiv.appendChild(dataDepartementDivH2)

          dataRegionDiv.innerHTML = ""
          const dataRegionDivH2 = document.createElement("h2")
          dataRegionDivH2.innerHTML = "Région"
          dataRegionDiv.appendChild(dataRegionDivH2)

          displayDataInDiv(data.city, dataCityDiv)
          displayDataInDiv(data.department, dataDepartementDiv)
          displayDataInDiv(data.region, dataRegionDiv, true)
        } else {
        }
      })
  })
})

function displayDataInDiv(data, div, isRegion = false) {
  const key = isRegion ? "value" : "score"
  const h3 = document.createElement("h3")
  h3.innerText =
    (isRegion ? data.codeRegion : data.name) +
    " (" +
    Math.round(data[key] * 100) / 100 +
    ")"
  div.appendChild(h3)

  data.axes.forEach(axe => {
    const h4 = document.createElement("h4")
    h4.innerText = axe.nom + " (" + Math.round(axe[key] * 100) / 100 + ")"
    div.appendChild(h4)

    const liste = document.createElement("ul")
    axe.indices.forEach(indice => {
      var item = document.createElement("li")
      item.innerText =
        indice.nom + " (" + Math.round(indice[key] * 100) / 100 + ")"
      liste.appendChild(item)
    })
    div.appendChild(liste)
  })
}
