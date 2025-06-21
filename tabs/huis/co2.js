
Promise.all([
  fetch('../../data/co2-binnen.csv').then(r => r.text()),
  fetch('../../data/huisverbruik.csv').then(r => r.text()) //pakt de tijd data
]).then(([co2Text, tijdText]) => {
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
  const values = co2Values.slice(0, minLen);
  const labels = tijdLabels.slice(0, minLen);

  const canvas = document.getElementById('co2Binnen');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'CO₂-concentratie (ppm)',
          data: values,
          borderColor: '#3182ce', // blauw
          backgroundColor: 'rgba(49, 130, 206, 0.10)',
          borderWidth: 1,
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
  }
}); 