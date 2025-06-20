console.log("script.js werkt");

fetch('../data/huisverbruik.csv')
  .then(response => response.text())
  .then(csvText => {
    // Parse CSV
    const lines = csvText.trim().split('\n');
    lines.shift(); // remove header

    const labels = [];
    const values = [];

    lines.forEach(line => {
      // Split by tab or comma
      const parts = line.split(/\t|,/);
      if (parts.length >= 2) {
        labels.push(parts[0].trim());
        values.push(parseFloat(parts[1].trim()));
      }
    });

    // Draw chart
    const ctx = document.getElementById('huisVerbruik').getContext('2d');
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Huisverbruik (kW)',
          data: values,
          borderColor: '#38a169',
          backgroundColor: 'rgba(56, 161, 105, 0.10)',
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.4,
          fill: true,
          borderCapStyle: 'round',
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
  });
