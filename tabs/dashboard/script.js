

document.addEventListener('DOMContentLoaded', () => {

 // kleine lijngrafiek
  function createMiniChart(canvasId, data, labels, color) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
      console.error(`Canvas met ID "${canvasId}" niet gevonden!`);
      return;
    }
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 80);
    gradient.addColorStop(0, `${color}80`);
    gradient.addColorStop(1, `${color}00`);

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          borderColor: color,
          backgroundColor: gradient,
          fill: true,
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: {
          x: { 
            display: false 
          },
          
          y: { 
            display: true,
            grid: {
                display: false, 
                drawBorder: false 
            },
            ticks: {
                maxTicksLimit: 4, // maximaal 4 labels
                font: {
                    size: 10 
                }
            }
          }
        }
      }
    });
  }

  //laad alle data
  Promise.all([
    fetch('../../data/huisverbruik.csv').then(r => r.text()),
    fetch('../../data/zonnedata.csv').then(r => r.text()),
    fetch('../../data/accuniveauAuto.csv').then(r => r.text()),
    fetch('../../data/waterstofopslagWoning.csv').then(r => r.text())
  ])
  .then(([huisText, solarCsvText, autoText, waterstofText]) => {
    
    const parseSimpleCsv = (text) => text.trim().split('\n').slice(1).map(v => parseFloat(v.replace(',', '.')));
    
    const huisData = parseSimpleCsv(huisText);
    const autoData = parseSimpleCsv(autoText);
    const waterstofData = parseSimpleCsv(waterstofText);
    const timeLabels = huisText.trim().split('\n').slice(1).map(line => line.split(/\t|,/)[0].trim());

    const solarData = solarCsvText.trim().split('\n').slice(1).map(line => {
        const parts = line.split(',');
        if (parts.length < 3) return 0;
        const voltage = parseFloat(parts[1]);
        const current = parseFloat(parts[2]);
        return voltage * current;
    });

    const last24 = (data) => data.slice(-24);

    document.getElementById('solar-value').innerText = `${solarData[solarData.length - 1].toFixed(2)} W`;
    document.getElementById('house-value').innerText = `${huisData[huisData.length - 1].toFixed(3)} kW`;
    document.getElementById('car-value').innerText = `${autoData[autoData.length - 1].toFixed(2)} %`;
    document.getElementById('hydrogen-value').innerText = `${waterstofData[waterstofData.length - 1].toFixed(2)} %`;

    const chartColor = '#659162';
    createMiniChart('solar-chart', last24(solarData), last24(timeLabels), chartColor);
    createMiniChart('house-chart', last24(huisData), last24(timeLabels), chartColor);
    createMiniChart('car-chart', last24(autoData), last24(timeLabels), chartColor);
    createMiniChart('hydrogen-chart', last24(waterstofData), last24(timeLabels), chartColor);

  })
  .catch(error => {
    console.error('Fout bij het laden van de dashboard data:', error);
    document.querySelector('.dashboard-title').innerText = 'Data kon niet geladen worden.';
  });

  //event handler voor het instellingenmenu
  const settingsBtn = document.getElementById('settings-menu-btn');
  const settingsMenu = document.getElementById('settings-menu');
  if (settingsBtn && settingsMenu) {
    settingsBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      settingsMenu.classList.toggle('active');
    });
    document.addEventListener('click', (event) => {
      if (!settingsMenu.contains(event.target) && !settingsBtn.contains(event.target)) {
        settingsMenu.classList.remove('active');
      }
    });
  }
});