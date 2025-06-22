console.log("script.js werkt");

let allLabels = [];
let allValues = [];
let chart = null;

function updateHuisverbruikChart(filter) {
  let labels = allLabels;
  let values = allValues;
  if (filter === '3h') {
    // Laatste 12 punten (bij 15 min interval = 3 uur)
    labels = allLabels.slice(-12);
    values = allValues.slice(-12);
  } else if (filter === 'day') {
    // Laatste 96 punten (24 uur bij 15 min interval)
    labels = allLabels.slice(-96);
    values = allValues.slice(-96);
  } // 'week' = alles tonen

  if (chart) {
    chart.data.labels = labels;
    chart.data.datasets[0].data = values;
    chart.update();
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
    chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: allLabels,
        datasets: [{
          label: 'Huisverbruik (kW)',
          data: allValues,
          borderColor: '#38a169',
          backgroundColor: 'rgba(56, 161, 105, 0.10)',
          borderWidth: 2,
          pointRadius: 0,
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
              text: 'kW'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Tijd'
            },
            ticks: {
              maxTicksLimit: 12
            }
          }
        }
      }
    });
    // Standaard: week (alles)
    updateHuisverbruikChart('week');
  });

// Filter buttons event listeners

document.addEventListener('DOMContentLoaded', function() {
  const filterBtns = document.querySelectorAll('#filter-huisverbruik .filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      filterBtns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      updateHuisverbruikChart(this.dataset.filter);
    });
  });
});
