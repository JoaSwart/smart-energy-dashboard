
let allTimeLabels = [];               
let allWaterstofVerbruikValues = []; // waterstofverbruik van de auto
let allAccuValues = [];             
let allWaterstofOpslagValues = [];   
let uniqueDays = [];                 

let waterstofChart = null;
let accuChart = null;
let waterstofOpslagChart = null;



/* initialiseer filterknoppen */
function initializeFilterButtons() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      filterButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      updateAllCharts(button.dataset.filter);
    });
  });
}

/**
 * halve donut grafiek
 * @param {string} canvasId 
 * @param {string} label -de label voor de dataset.
 * @param {string} color - de kleur voor het gevulde deel van de meter.
 * @returns {Chart|null}
 */
function createHalfDonut(canvasId, label, color) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;

  const ctx = canvas.getContext('2d');
  return new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: [label, ''],
      datasets: [{
        data: [0, 100],
        backgroundColor: [color, '#e9ecef'],
        borderWidth: 2,
        circumference: 180,
        rotation: -90,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      cutout: '70%',
    }
  });
}

/**
 * Werkt alle grafieken op de pagina bij op basis van het gekozen tijdsfilter.
 * @param {string} filter 
 */
function updateAllCharts(filter) {
  if (!waterstofChart) return;

  let labelsForChart = [];
  let valuesForBarChart = [];
  let chartTitle = '';
  let xAxisLabel = '';
  let maxTicks = 12;
  let relevantIndices = [];

  //logica voor filteren op dag, week of maand
  if (filter === 'vandaag' && uniqueDays.length > 0) {
    const todayStr = uniqueDays[uniqueDays.length - 1];
    for (let i = 0; i < allTimeLabels.length; i++) {
      if (allTimeLabels[i].startsWith(todayStr)) {
        labelsForChart.push(allTimeLabels[i].split(' ')[1]);
        valuesForBarChart.push(allWaterstofVerbruikValues[i]);
        relevantIndices.push(i);
      }
    }
    chartTitle = 'Waterstofverbruik Vandaag';
    xAxisLabel = 'Tijd';
  } else if (filter === 'gisteren' && uniqueDays.length > 1) {
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
  } else if (filter === 'laatste7d' || filter === 'laatste30d') {
    const numDays = (filter === 'laatste7d') ? 7 : 30;
    const relevantDays = uniqueDays.slice(-numDays);
    for (let i = 0; i < allTimeLabels.length; i++) {
      if (relevantDays.includes(allTimeLabels[i].split(' ')[0])) {
        relevantIndices.push(i);
      }
    }
    for (const day of relevantDays) {
      let sum = 0, count = 0;
      for (const index of relevantIndices) {
        if (allTimeLabels[index].startsWith(day)) {
          sum += allWaterstofVerbruikValues[index];
          count++;
        }
      }
      const avg = count > 0 ? sum / count : 0;
      const [yyyy, mm, dd] = day.split('-');
      labelsForChart.push(`${dd}/${mm}`);
      valuesForBarChart.push(avg);
    }
    chartTitle = `Gemiddeld Waterstofverbruik (${numDays} Dagen)`;
    xAxisLabel = 'Datum';
    maxTicks = numDays <= 7 ? 7 : 10;
  }

  //update staafgrafiek
  document.getElementById('main-chart-title').innerText = chartTitle;
  waterstofChart.data.labels = labelsForChart;
  waterstofChart.data.datasets[0].data = valuesForBarChart;
  waterstofChart.options.scales.x.title.text = xAxisLabel;
  waterstofChart.options.scales.x.ticks.maxTicksLimit = maxTicks;
  waterstofChart.update();

  //bereken de waarden voor de donut-grafieken
  let accuValue = 0;
  let waterstofOpslagValue = 0;
  if (relevantIndices.length > 0) {
    if (filter === 'vandaag' || filter === 'gisteren') {
      const lastIndex = relevantIndices[relevantIndices.length - 1];
      accuValue = allAccuValues[lastIndex];
      waterstofOpslagValue = allWaterstofOpslagValues[lastIndex];
    } else {
      let accuSum = 0, opslagSum = 0;
      relevantIndices.forEach(i => {
        accuSum += allAccuValues[i];
        opslagSum += allWaterstofOpslagValues[i];
      });
      accuValue = accuSum / relevantIndices.length;
      waterstofOpslagValue = opslagSum / relevantIndices.length;
    }
  }

  //update donut-grafieken
  if (accuChart) {
    accuChart.data.datasets[0].data = [accuValue, 100 - accuValue];
    accuChart.update();
    document.getElementById('accuValue').innerText = `${accuValue.toFixed(1)}%`;
  }
  if (waterstofOpslagChart) {
    waterstofOpslagChart.data.datasets[0].data = [waterstofOpslagValue, 100 - waterstofOpslagValue];
    waterstofOpslagChart.update();
    document.getElementById('waterstofOpslagValue').innerText = `${waterstofOpslagValue.toFixed(1)}%`;
  }
}

document.addEventListener('DOMContentLoaded', function () {

  //settings
  //haal de knop en het menu-element op
  const settingsBtn = document.getElementById('settings-menu-btn');
  const settingsMenu = document.getElementById('settings-menu');

  if (settingsBtn && settingsMenu) {
    //open/sluit het menu bij klikken op de knop
    settingsBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      settingsMenu.classList.toggle('active');
    });

    //sluit het menu als je ergens anders op de pagina klikt
    document.addEventListener('click', function(e) {
      if (!settingsMenu.contains(e.target) && !settingsBtn.contains(e.target)) {
        settingsMenu.classList.remove('active');
      }
    });
  }

  
  Promise.all([
    //de csv data laden
    fetch('../../data/huisverbruik.csv').then(r => r.text()), //voor de tijdstempels
    fetch('../../data/accuniveauAuto.csv').then(r => r.text()),
    fetch('../../data/waterstofopslagAuto.csv').then(r => r.text()),
    fetch('../../data/waterstofverbruikAuto.csv').then(r => r.text()) 
  ])
  .then(([tijdText, accuText, opslagText, verbruikText]) => {
    // verwerk de tekst uit de csv bestanden naar bruikbare arrays
    allTimeLabels = tijdText.trim().split('\n').slice(1).map(line => line.split(/\t|,/)[0].trim());
    allAccuValues = accuText.trim().split('\n').slice(1).map(v => parseFloat(v.replace(',', '.')));
    allWaterstofOpslagValues = opslagText.trim().split('\n').slice(1).map(v => parseFloat(v.replace(',', '.')));
    allWaterstofVerbruikValues = verbruikText.trim().split('\n').slice(1).map(v => parseFloat(v.replace(',', '.')));
    
    //zorg dat alle arrays even lang zijn om fouten te voorkomen.
    const minLen = Math.min(allTimeLabels.length, allAccuValues.length, allWaterstofOpslagValues.length, allWaterstofVerbruikValues.length);
    allTimeLabels = allTimeLabels.slice(0, minLen);
    allAccuValues = allAccuValues.slice(0, minLen);
    allWaterstofOpslagValues = allWaterstofOpslagValues.slice(0, minLen);
    allWaterstofVerbruikValues = allWaterstofVerbruikValues.slice(0, minLen);

    //bepaal de dagen voor de filters
    uniqueDays = [...new Set(allTimeLabels.map(l => l.split(' ')[0]))].sort();

    //maak de hoofdgrafiek (staafgrafiek)
    const barCanvas = document.getElementById('waterstofverbruikAuto');
    if (barCanvas) {
      waterstofChart = new Chart(barCanvas.getContext('2d'), {
        type: 'bar',
        data: { labels: [], datasets: [{
          label: 'Waterstofverbruik auto (L/u)', data: [],
          backgroundColor: 'rgba(235, 87, 87, 0.6)', borderColor: '#eb5757', borderWidth: 1
        }]},
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }},
          scales: {
            x: { title: { display: true, text: 'Tijd' }, ticks: { maxTicksLimit: 12 }},
            y: { beginAtZero: true, title: { display: true, text: 'Verbruik (L/u)' }}
          }
        }
      });

      //maak de donut-grafieken
      accuChart = createHalfDonut('accuNiveauDonut', 'Accuniveau', '#38a169');
      waterstofOpslagChart = createHalfDonut('waterstofOpslagDonut', 'Waterstofopslag', '#38a169');

      //activeer de filterknoppen en toon de data van gisteren als standaard
      initializeFilterButtons();
      document.querySelector('.filter-btn[data-filter="gisteren"]').classList.add('active');
      updateAllCharts('gisteren');
    }
  })
  .catch(error => {
    console.error('Fout bij het laden van de data voor de auto-pagina:', error);
    document.getElementById('main-chart-title').innerText = 'Data kon niet geladen worden.';
  });
});