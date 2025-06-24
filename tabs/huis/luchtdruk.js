let allLuchtdrukLabels = [];
let allLuchtdrukValues = [];
let luchtdrukChart = null;

function updateLuchtdrukChart(filter) {
  let labels = allLuchtdrukLabels;
  let values = allLuchtdrukValues;
  if (filter === '3h') {
    labels = allLuchtdrukLabels.slice(-12);
    values = allLuchtdrukValues.slice(-12);
  } else if (filter === 'day') {
    labels = allLuchtdrukLabels.slice(-96);
    values = allLuchtdrukValues.slice(-96);
  }
  if (luchtdrukChart) {
    luchtdrukChart.data.labels = labels;
    luchtdrukChart.data.datasets[0].data = values;
    luchtdrukChart.update();
  }
}

Promise.all([
  fetch('../../data/luchtdruk.csv').then(r => r.text()),
  fetch('../../data/huisverbruik.csv').then(r => r.text()) // tijdlabels
]).then(([luchtdrukText, tijdText]) => {
  // luchtdruk waardes
  const luchtdrukLines = luchtdrukText.trim().split('\n');
  luchtdrukLines.shift(); // verwijder header
  const luchtdrukValues = luchtdrukLines.map(v => parseFloat(v.replace(',', '.')));

  // tijdlabels
  const tijdLines = tijdText.trim().split('\n');
  tijdLines.shift(); // verwijder header
  const tijdLabels = tijdLines.map(line => line.split(/\t|,/)[0].trim());

  // arrays even lang maken
  const minLen = Math.min(luchtdrukValues.length, tijdLabels.length);
  allLuchtdrukValues = luchtdrukValues.slice(0, minLen);
  allLuchtdrukLabels = tijdLabels.slice(0, minLen);

  const canvas = document.getElementById('luchtdruk');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    // Linear gradient voor de lijnvulling
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, 'rgba(66, 153, 225, 0.6)'); // blauw met 60% opacity
    gradient.addColorStop(1, 'rgba(66, 153, 225, 0)');   // onderaan: transparant
    luchtdrukChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: allLuchtdrukLabels,
        datasets: [{
          label: 'Luchtdruk (hPa)',
          data: allLuchtdrukValues,
          borderColor: '#4299e1',
          backgroundColor: gradient,
          borderWidth: 2,
          pointRadius: 1,
          tension: 0.4,
          fill: true,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: true },
        },
        scales: {
          y: {
            title: {
              display: true,
              text: 'hPa'
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
    updateLuchtdrukChart('week');
  }
});

document.addEventListener('DOMContentLoaded', function() {
  const filterBtns = document.querySelectorAll('#subtab-luchtdruk .filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      filterBtns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      updateLuchtdrukChart(this.dataset.filter);
    });
  });
});
