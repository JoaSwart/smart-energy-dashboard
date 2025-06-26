console.log("huisverbruik.js werkt");

let allLabels = [];
let allValues = [];
let huisverbruikChart = null;

function updateHuisverbruikChart(filter) {
  let labels, values;

  if (allLabels.length === 0) return;

  if (filter === '3h') {
    labels = allLabels.slice(-12); //12 kwartieren = 3 uur
    values = allValues.slice(-12);
  } else if (filter === 'day') {
    labels = allLabels.slice(-96); //96 kwartieren = 1 dag
    values = allValues.slice(-96);
  } else { 
    labels = allLabels;
    values = allValues;
  }

  if (huisverbruikChart) {
    huisverbruikChart.data.labels = labels;
    huisverbruikChart.data.datasets[0].data = values;
    huisverbruikChart.update();
  }
}

fetch('../../data/huisverbruik.csv')
  .then(response => response.text())
  .then(csvText => {
    const lines = csvText.trim().split('\n');
    lines.shift();
    allLabels = [];
    allValues = [];
    lines.forEach(line => {
      const parts = line.split(/\t|,/);
      if (parts.length >= 2) {
        allLabels.push(parts[0].trim());
        allValues.push(parseFloat(parts[1].trim()));
      }
    });

    const ctx = document.getElementById('huisVerbruik').getContext('2d');
    huisverbruikChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: 'Huisverbruik (kW)',
          data: [],
          borderColor: '#38a169',
          backgroundColor: 'rgba(56, 161, 105, 0.15)',
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.4,
          fill: true,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
         y: {
          min: 0.1, // Start op 0.1 in plaats van 0
          title: { display: true, text: 'kW' }
          },
          x: { title: { display: true, text: 'Tijd' }, ticks: { maxTicksLimit: 12 } }
        }
      }
    });

    updateHuisverbruikChart('3h');
    document.querySelector('#filter-huisverbruik .filter-btn[data-filter="3h"]').classList.add('active');
  });

document.addEventListener('DOMContentLoaded', function() {
  const filterBtns = document.querySelectorAll('#filter-huisverbruik .filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      filterBtns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      updateHuisverbruikChart(this.dataset.filter);
    });
  });

  //kosten vandaag grafiek (mock data) 
  const kostenCanvas = document.getElementById('kostenVandaag');
  if (kostenCanvas) {
    const ctx = kostenCanvas.getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Vandaag'], //1 label
        datasets: [{
          label: 'Kosten (€)',
          data: [50.75], //1 datapunt voor de totale kosten
          backgroundColor: '#a2dfc8',
          borderColor: '#38a169',
          borderWidth: 1,
          borderRadius: 5,
          maxBarThickness: 60 //zorgt dat de staaf niet te breed wordt
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          y: { beginAtZero: true, title: { display: true, text: '€' } },
          x: { grid: { display: false } }
        }
      }
    });
  }
});