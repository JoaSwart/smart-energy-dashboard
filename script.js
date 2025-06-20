function parseAndProcessData(csv) {
  const lines = csv.trim().split('\n').slice(1);
  const datasets = {};

  lines.forEach(line => {
    const [dateTime, voltageStr, currentStr] = line.split(',');
    if (!dateTime || !voltageStr || !currentStr) return;

    const [datePart, timePart] = dateTime.split(' ');
    const [day, month, year] = datePart.split('-').map(Number);
    const [hours, minutes] = timePart.split(':').map(Number);
    const timestamp = new Date(year, month - 1, day, hours, minutes);

    const voltage = parseFloat(voltageStr.replace(',', '.'));
    const current = parseFloat(currentStr.replace(',', '.'));
    const power = voltage * current;

    if (!datasets[datePart]) {
      datasets[datePart] = {
        label: `Opbrengst ${datePart}`,
        data: [],
        borderColor: getRandomColor(),
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        fill: true,
        tension: 0.4,
        pointRadius: 2,
      };
    }

    datasets[datePart].data.push({ x: timestamp, y: power });
  });

  return Object.values(datasets);
}

function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

async function loadAndDrawChart() {
  try {
    const response = await fetch('../zonnedata.csv');
    const csvData = await response.text();
    const chartData = parseAndProcessData(csvData);

    const ctx = document.getElementById('solarChart').getContext('2d');
    new Chart(ctx, {
      type: 'line',
      data: {
        datasets: chartData
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Zonnepaneel Opbrengst per Dag',
            font: { size: 18 }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) label += ': ';
                if (context.parsed.y !== null) label += context.parsed.y.toFixed(2) + ' W';
                return label;
              }
            }
          }
        },
        scales: {
          x: {
            type: 'time',
            time: {
              unit: 'hour',
              tooltipFormat: 'dd-MM-yyyy HH:mm',
              displayFormats: { hour: 'HH:mm' }
            },
            title: {
              display: true,
              text: 'Tijd'
            }
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Vermogen (Watt)'
            }
          }
        }
      }
    });

  } catch (error) {
    console.error('Fout bij het laden van data:', error);
    const container = document.querySelector('.chart-container');
    container.innerHTML = '<h1>Oeps!</h1><p>Kon de data niet laden. Controleer of "zonnedata.csv" bestaat.</p>';
  }
}

loadAndDrawChart();
