// lijsten om data in op te slaan die we in de grafiek gebruiken
let allWaterstofLabels = [];
let allWaterstofValues = [];
let waterstofChart = null;
let uniqueDays = []; // Alleen unieke datums


 //Past de grafiek aan op basis van de gekozen tijdsfilter
 
function updateWaterstofChart(filter) {
  // Stop als er nog geen grafiek is
  if (!waterstofChart) return;

  // Voor deze update beginnen we met lege lijsten
  let labelsForChart = [];
  let valuesForChart = [];
  let chartTitle = '';
  let xAxisLabel = '';
  let maxTicks = 12;

  if (filter === 'vandaag') {
    const todayStr = uniqueDays[uniqueDays.length - 1];

    // pak alleen metingen van vandaag
    for (let i = 0; i < allWaterstofLabels.length; i++) {
      if (allWaterstofLabels[i].startsWith(todayStr)) {
        labelsForChart.push(allWaterstofLabels[i].split(' ')[1]); // alleen de tijd
        valuesForChart.push(allWaterstofValues[i]);
      }
    }
    chartTitle = 'Waterstofverbruik vandaag';
    xAxisLabel = 'Tijd';

  } else if (filter === 'gisteren') {
    const yesterdayStr = uniqueDays[uniqueDays.length - 2];

    // pak alleen metingen van gisteren
    for (let i = 0; i < allWaterstofLabels.length; i++) {
      if (allWaterstofLabels[i].startsWith(yesterdayStr)) {
        labelsForChart.push(allWaterstofLabels[i].split(' ')[1]);
        valuesForChart.push(allWaterstofValues[i]);
      }
    }
    chartTitle = 'Waterstofverbruik gisteren';
    xAxisLabel = 'Tijd';

  } else if (filter === 'laatste7d' || filter === 'laatste30d') {
    const numDays = (filter === 'laatste7d') ? 7 : 30;
    const relevantDays = uniqueDays.slice(-numDays);

    for (const day of relevantDays) {
      let sumOfDay = 0;
      let countOfDay = 0;

      // tel alle waardes van die dag bij elkaar op
      for (let i = 0; i < allWaterstofLabels.length; i++) {
        if (allWaterstofLabels[i].startsWith(day)) {
          sumOfDay += allWaterstofValues[i];
          countOfDay++;
        }
      }

      // bereken gemiddelde, en voorkom fout als er geen data is
      const average = countOfDay > 0 ? sumOfDay / countOfDay : 0;

      // zet het label om naar dag/maand (bv. 14/06)
      const dayParts = day.split('-');
      const label = `${dayParts[0]}/${dayParts[1]}`;
      labelsForChart.push(label);
      valuesForChart.push(average);
    }

    chartTitle = `Waterstofverbruik laatste ${numDays} dagen`;
    xAxisLabel = 'Datum';
    maxTicks = numDays <= 7 ? 7 : 10;
  }

  // vul de grafiek met nieuwe data
  waterstofChart.data.labels = labelsForChart;
  waterstofChart.data.datasets[0].data = valuesForChart;
  waterstofChart.options.plugins.title.text = chartTitle;
  waterstofChart.options.scales.x.title.text = xAxisLabel;
  waterstofChart.options.scales.x.ticks.maxTicksLimit = maxTicks;
  waterstofChart.update(); // teken de grafiek opnieuw
}

// laad de data en maak de grafiek aan
Promise.all([
  fetch('../../data/waterstofverbruikAuto.csv').then(r => r.text()),
  fetch('../../data/huisverbruik.csv').then(r => r.text())
]).then(([waterstofText, tijdText]) => {
  // lees de waterstofwaardes
  const waterstofValues = waterstofText.trim().split('\n').slice(1).map(v => parseFloat(v.replace(',', '.')));

  // Lees de tijdstempels
  const tijdLabels = tijdText.trim().split('\n').slice(1).map(line => line.split(/\t|,/)[0].trim());

  // zorg dat beide lijsten even lang zijn
  const minLen = Math.min(waterstofValues.length, tijdLabels.length);
  allWaterstofValues = waterstofValues.slice(0, minLen);
  allWaterstofLabels = tijdLabels.slice(0, minLen);

  // haal unieke datums uit de labels
  uniqueDays = [...new Set(allWaterstofLabels.map(l => l.split(' ')[0]))].sort();

  // zoek het canvas en maak de grafiek
  const canvas = document.getElementById('waterstofverbruikAuto');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    waterstofChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: [],
        datasets: [{
          label: 'Waterstofverbruik auto (L/u)',
          data: [],
          backgroundColor: 'rgba(66, 153, 225, 0.6)',
          borderColor: '#4299e1',
          borderWidth: 1,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: true },
          title: { display: true, text: 'Waterstofverbruik', font: { size: 18 } },
        },
        scales: {
          y: { title: { display: true, text: 'L/u' } },
          x: { title: { display: true, text: 'Tijd' } }
        }
      }
    });

    // laat meteen de data van vandaag zien
    updateWaterstofChart('vandaag');
  }
});

// Wacht tot de pagina klaar is
document.addEventListener('DOMContentLoaded', function() {
  const filter = document.getElementById('tijd-filter');
  if (filter) {
    // Als je iets kiest in de dropdown, pas de grafiek aan
    filter.addEventListener('change', function() {
      updateWaterstofChart(this.value);
    });
  }
});
