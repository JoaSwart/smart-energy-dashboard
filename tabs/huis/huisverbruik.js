console.log("script.js werkt");

fetch('../../data/huisverbruik.csv')
  .then(response => response.text()) //omgezet naar text
  .then(csvText => {
    
    const lines = csvText.trim().split('\n'); //verwijder onnodige regels
    lines.shift(); // verwijder de eerste regels van het csv bestand (tijd, verbruik)

    const labels = []; //tijd
    const values = []; //verbruik

    lines.forEach(line => {
      // . of , ertussen
      const parts = line.split(/\t|,/);
      if (parts.length >= 2) { //als er minstens 2 stukjes data zijn 
        labels.push(parts[0].trim()); //gaat het eerste stukje naar labels
        values.push(parseFloat(parts[1].trim())); //parsefloat zet het om naar kommagetallen ipv text
      }
    });

    // teken de grafiek
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
          tension: 0.4, //hoe gebogen of hoekig de lijn is
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
  });
