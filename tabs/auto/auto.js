//data uit de csv bestanden
let allTimeLabels = [];               //alle tijdstempels
let allWaterstofVerbruikValues = []; 
let allAccuValues = [];             
let allWaterstofOpslagValues = [];   
let uniqueDays = [];                 //datums

// grafiek-instanties worden globaal bewaard om ze later te kunnen updaten.
let waterstofChart = null;
let accuChart = null;
let waterstofOpslagChart = null;


/*initialiseert de filterknoppen en koppelt de klik-events. */
function initializeFilterButtons() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      //verwijder active class van alle knoppen en voeg toe aan de geklikte knop
      filterButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      //update alle grafieken op basis van de filter
      updateAllCharts(button.dataset.filter);
    });
  });
}

/** 
 * halve donut grafiek
 * @param {string} canvasId 
 * @param {string} label het label voor de dataset
 * @param {string} color de kleur voor het gevulde deel van de meter
 * @returns {Chart|null} een Chart.js object of null als het canvas niet gevonden wordt
 */
function createHalfDonut(canvasId, label, color) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;

  const ctx = canvas.getContext('2d');
  return new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: [label, ''], //alleen het actieve deel krijgt een label
      datasets: [{
        data: [0, 100],     //startwaarde (0% gevuld)
        backgroundColor: [color, '#e9ecef'], //kleur voor data en de achtergrond
        borderColor: ['#ffffff', '#ffffff'],
        borderWidth: 2,
        circumference: 180, //teken een halve cirkel
        rotation: -90,      //start bovenaan
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false },
      },
      cutout: '70%', // bepaalt de dikte van de ring
    }
  });
}

/**
 *werkt alle grafieken op de pagina bij op basis van het gekozen tijdsfilter
 * @param {string} filter 
 */
function updateAllCharts(filter) {
  if (!waterstofChart) return;

  // data voorbereiden op basis van het filter
  let labelsForChart = [];
  let valuesForBarChart = [];
  let chartTitle = '';
  let xAxisLabel = '';
  let maxTicks = 12;
  let relevantIndices = []; // Indexen van de datapunten die bij het filter passen

  //filter voor vandaag
  if (filter === 'vandaag' && uniqueDays.length > 0) {
    const todayStr = uniqueDays[uniqueDays.length - 1];
    for (let i = 0; i < allTimeLabels.length; i++) {
      if (allTimeLabels[i].startsWith(todayStr)) {
        labelsForChart.push(allTimeLabels[i].split(' ')[1]); // Alleen tijd (bv. "14:30")
        valuesForBarChart.push(allWaterstofVerbruikValues[i]);
        relevantIndices.push(i);
      }
    }
    chartTitle = 'Waterstofverbruik Vandaag';
    xAxisLabel = 'Tijd';
  }
  //filter voor gisteren
  else if (filter === 'gisteren' && uniqueDays.length > 1) {
    const yesterdayStr = uniqueDays[uniqueDays.length - 2];
    for (let i = 0; i < allTimeLabels.length; i++) {
      if (allTimeLabels[i].startsWith(yesterdayStr)) {
        labelsForChart.push(allTimeLabels[i].split(' ')[1]);
        valuesForBarChart.push(allWaterstofVerbruikValues[i]);
        relevantIndices.push(i);
      }
    }
    chartTitle = 'Waterstofverbruik Gisteren';
    xAxisLabel = 'Tijd';
  }
  //filter voor laatste 7 of 30 dagen (gemiddelde per dag)
  else if (filter === 'laatste7d' || filter === 'laatste30d') {
    const numDays = (filter === 'laatste7d') ? 7 : 30;
    const relevantDays = uniqueDays.slice(-numDays);

    //verzamel eerst alle relevante indexen
    for (let i = 0; i < allTimeLabels.length; i++) {
      const dayPart = allTimeLabels[i].split(' ')[0];
      if (relevantDays.includes(dayPart)) {
        relevantIndices.push(i);
      }
    }

    //bereken het gemiddelde per dag en voeg toe aan de grafiekdata
    for (const day of relevantDays) {
      let sumOfDay = 0;
      let countOfDay = 0;
      for (const index of relevantIndices) {
        if (allTimeLabels[index].startsWith(day)) {
          sumOfDay += allWaterstofVerbruikValues[index];
          countOfDay++;
        }
      }
      const average = countOfDay > 0 ? sumOfDay / countOfDay : 0;
      const [yyyy, mm, dd] = day.split('-'); // datum in jaar, maand, dag
      labelsForChart.push(`${dd}/${mm}`);    
      valuesForBarChart.push(average);
    }
    chartTitle = `Gemiddeld Waterstofverbruik (${numDays} Dagen)`;
    xAxisLabel = 'Datum';
    maxTicks = numDays <= 7 ? 7 : 10;
  }

  // staafgrafieken updaten
  document.getElementById('main-chart-title').innerText = chartTitle;
  waterstofChart.data.labels = labelsForChart;
  waterstofChart.data.datasets[0].data = valuesForBarChart;
  waterstofChart.options.scales.x.title.text = xAxisLabel;
  waterstofChart.options.scales.x.ticks.maxTicksLimit = maxTicks;
  waterstofChart.update();

  // donutgrafieken updaten
  let accuValue = 0;
  let waterstofOpslagValue = 0;

  if (relevantIndices.length > 0) {
    //voor vandaag of gisteren, neem de allerlaatste meting
    if (filter === 'vandaag' || filter === 'gisteren') {
      const lastIndex = relevantIndices[relevantIndices.length - 1];
      accuValue = allAccuValues[lastIndex];
      waterstofOpslagValue = allWaterstofOpslagValues[lastIndex];
    }
    //voor laatste 7/30 dagen, neem het gemiddelde over de hele periode
    else {
      let accuSum = 0, waterstofOpslagSum = 0;
      relevantIndices.forEach(index => {
        accuSum += allAccuValues[index];
        waterstofOpslagSum += allWaterstofOpslagValues[index];
      });
      accuValue = accuSum / relevantIndices.length;
      waterstofOpslagValue = waterstofOpslagSum / relevantIndices.length;
    }
  }

  //update de accu-donutgrafiek en de tekst
  if (accuChart) {
    accuChart.data.datasets[0].data = [accuValue, 100 - accuValue];
    accuChart.update();
    document.getElementById('accuValue').innerText = `${accuValue.toFixed(1)}%`;
  }

  //update de waterstofopslag-donutgrafiek en de tekst
  if (waterstofOpslagChart) {
    waterstofOpslagChart.data.datasets[0].data = [waterstofOpslagValue, 100 - waterstofOpslagValue];
    waterstofOpslagChart.update();
    document.getElementById('waterstofOpslagValue').innerText = `${waterstofOpslagValue.toFixed(1)}%`;
  }
}

document.addEventListener('DOMContentLoaded', function() {
  
  //start het laden van alle data
  Promise.all([
    fetch('../../data/huisverbruik.csv').then(r => r.text()),
    fetch('../../data/accuniveauAuto.csv').then(r => r.text()),
    fetch('../../data/waterstofopslagAuto.csv').then(r => r.text()),
    fetch('../../data/waterstofverbruikAuto.csv').then(r => r.text())
  ])
  .then(([tijdText, accuText, opslagText, verbruikText]) => {
    //verwerk de tekst uit de CSV-bestanden
    const tijdLabels = tijdText.trim().split('\n').slice(1).map(line => line.split(/\t|,/)[0].trim());
    const accuValues = accuText.trim().split('\n').slice(1).map(v => parseFloat(v.replace(',', '.')));
    const opslagValues = opslagText.trim().split('\n').slice(1).map(v => parseFloat(v.replace(',', '.')));
    const verbruikValues = verbruikText.trim().split('\n').slice(1).map(v => parseFloat(v.replace(',', '.')));
    
    //zorg dat alle arrays even lang zijn om data-mismatches te voorkomen
    const minLen = Math.min(tijdLabels.length, accuValues.length, opslagValues.length, verbruikValues.length);
    allTimeLabels = tijdLabels.slice(0, minLen);
    allAccuValues = accuValues.slice(0, minLen);
    allWaterstofOpslagValues = opslagValues.slice(0, minLen);
    allWaterstofVerbruikValues = verbruikValues.slice(0, minLen);

    //bepaal de unieke dagen uit de tijdlabels voor de filters
    uniqueDays = [...new Set(allTimeLabels.map(l => l.split(' ')[0]))].sort();

    //maak de hoofdgrafiek (staafgrafiek)
    const barCanvas = document.getElementById('waterstofverbruikAuto');
    if (barCanvas) {
      const ctx = barCanvas.getContext('2d');
      waterstofChart = new Chart(ctx, {
        type: 'bar',
        data: { labels: [], datasets: [{
            label: 'Waterstofverbruik auto (L/u)',
            data: [],
            backgroundColor: 'rgba(235, 87, 87, 0.6)',
            borderColor: '#eb5757',
            borderWidth: 1
        }]},
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false }},
          scales: {
            x: { title: { display: true, text: 'Tijd' }, ticks: { maxTicksLimit: 12 }},
            y: { beginAtZero: true, title: { display: true, text: 'Verbruik (L/u)' }}
          }
        }
      });

      //maak de donutgrafieken
      accuChart = createHalfDonut('accuNiveauDonut', 'Accuniveau', '#38a169');
      waterstofOpslagChart = createHalfDonut('waterstofOpslagDonut', 'Waterstofopslag', '#38a169');

      //activeer de knoppen en toon de data
      initializeFilterButtons();
      document.querySelector('.filter-btn[data-filter="gisteren"]').classList.add('active'); // Zet gisteren als actieve knop
      updateAllCharts('gisteren'); //start met het tonen van de data van gisteren
    }
  })
  .catch(error => {
    //vang eventuele fouten af tijdens het laden van de data
    console.error('Fout bij het laden of verwerken van de data:', error);
    //toon eventueel een foutmelding aan de gebruiker op de pagina
    document.getElementById('main-chart-title').innerText = 'Data kon niet geladen worden.';
  });

  //event handler voor het instellingenmenu
  const settingsBtn = document.getElementById('settings-menu-btn');
  const settingsMenu = document.getElementById('settings-menu');
  if (settingsBtn && settingsMenu) {
    settingsBtn.addEventListener('click', (event) => {
      event.stopPropagation(); //voorkom dat de document click-handler meteen sluit
      settingsMenu.classList.toggle('active');
    });
    //sluit het menu als er buiten geklikt wordt
    document.addEventListener('click', (event) => {
      if (!settingsMenu.contains(event.target) && !settingsBtn.contains(event.target)) {
        settingsMenu.classList.remove('active');
      }
    });
  }
});