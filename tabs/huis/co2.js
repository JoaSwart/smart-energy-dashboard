let allCo2Labels = [];
let allCo2Values = [];
let co2Chart = null;
let allLuchtvochtigheid = [];

function updateCo2Chart(filter) {
  let labels = allCo2Labels;
  let values = allCo2Values;
  if (filter === '3h') {
    labels = allCo2Labels.slice(-12);
    values = allCo2Values.slice(-12);
  } else if (filter === 'day') {
    labels = allCo2Labels.slice(-96);
    values = allCo2Values.slice(-96);
  }
  if (co2Chart) {
    co2Chart.data.labels = labels;
    co2Chart.data.datasets[0].data = values;
    co2Chart.update();
  }
}

function updateLuchtvochtigheidDonut(filter) {
  let values = allLuchtvochtigheid;
  if (filter === '3h') {
    values = allLuchtvochtigheid.slice(-12);
  } else if (filter === 'day') {
    values = allLuchtvochtigheid.slice(-96);
  }
  // Bereken gemiddelde
  const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  const donutData = [avg, 100 - avg];
  // Toon waarde in het midden
  const valueDiv = document.getElementById('luchtvochtigheidDonutValue');
  if (valueDiv) {
    valueDiv.textContent = Math.round(avg) + '%';
  }
  // Debug: check of canvas bestaat
  const canvas = document.getElementById('luchtvochtigheidDonut');
  console.log('updateLuchtvochtigheidDonut aangeroepen, canvas:', canvas);
  if (!canvas) {
    console.error('Canvas voor luchtvochtigheidDonut niet gevonden!');
    return;
  }
  if (window.luchtvochtigheidDonutChart) {
    window.luchtvochtigheidDonutChart.data.datasets[0].data = donutData;
    window.luchtvochtigheidDonutChart.update();
  } else {
    const ctx = canvas.getContext('2d');
    window.luchtvochtigheidDonutChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Gemiddelde luchtvochtigheid (%)', 'Overig'],
        datasets: [{
          data: donutData,
          backgroundColor: ['#4299e1', '#e2e8f0'],
          borderWidth: 1
        }]
      },
      options: {
        cutout: '70%',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function(context) {
                return context.label + ': ' + context.parsed + '%';
              }
            }
          }
        }
      }
    });
  }
}

Promise.all([
  fetch('../../data/co2-binnen.csv').then(r => r.text()),
  fetch('../../data/huisverbruik.csv').then(r => r.text()),
  fetch('../../data/luchtvochtigheid.csv').then(r => r.text())
]).then(([co2Text, tijdText, luchtText]) => {
  // co2- waardes
  const co2Lines = co2Text.trim().split('\n');
  co2Lines.shift(); // verwijder header
  const co2Values = co2Lines.map(v => parseFloat(v.replace(',', '.')));

  // tijdlabels
  const tijdLines = tijdText.trim().split('\n');
  tijdLines.shift(); // verwijder header
  const tijdLabels = tijdLines.map(line => line.split(/\t|,/)[0].trim());

  // zorg dat arrays even lang zijn
  const minLen = Math.min(co2Values.length, tijdLabels.length);
  allCo2Values = co2Values.slice(0, minLen);
  allCo2Labels = tijdLabels.slice(0, minLen);

  // luchtvochtigheid inladen
  const luchtLines = luchtText.trim().split('\n');
  luchtLines.shift();
  allLuchtvochtigheid = luchtLines.map(v => parseFloat(v.replace(',', '.')));

  const canvas = document.getElementById('co2Binnen');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    // Linear gradient voor de lijnvulling
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#4A90E2');
    gradient.addColorStop(0.4, '#B3D4FC');
    gradient.addColorStop(0.7, '#fff');
    gradient.addColorStop(1, '#fff');
    co2Chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: allCo2Labels,
        datasets: [{
          label: 'CO₂-concentratie (ppm)',
          data: allCo2Values,
          borderColor: '#4A90E2',
          backgroundColor: gradient,
          borderWidth: 2,
          pointRadius: 1,
          tension: 0.4,
          fill: true,
        }]
      },
      options: {
        responsive: false,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true },
        },
        scales: {
          y: {
            title: {
              display: true,
              text: 'ppm'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Tijd'
            },
            ticks: {
              maxTicksLimit: 12,
              autoSkip: true
            }
          }
        }
      }
    });
    // Standaard: week (alles)
    updateCo2Chart('week');
    // Init donut
    updateLuchtvochtigheidDonut('week');
  }
});

document.addEventListener('DOMContentLoaded', function() {
  const filterBtns = document.querySelectorAll('#filter-co2 .filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      filterBtns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      updateCo2Chart(this.dataset.filter);
      updateLuchtvochtigheidDonut(this.dataset.filter);
    });
  });
}); 