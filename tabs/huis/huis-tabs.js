// Subtab navigatie voor huis pagina

document.addEventListener('DOMContentLoaded', function() {
  const tabButtons = document.querySelectorAll('.huis-subtab-btn');
  const tabContents = document.querySelectorAll('.huis-subtab-content');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      // Verwijder active van alle knoppen en content
      tabButtons.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      // Voeg active toe aan de geklikte knop en bijbehorende content
      this.classList.add('active');
      const id = this.id.replace('-btn', ''); // bijv. subtab-huisverbruik
      const content = document.getElementById(id);
      if (content) {
        content.classList.add('active');
      }
    });
  });
});

// Resize handler voor responsieve grafieken
window.addEventListener('resize', function() {
  const charts = document.querySelectorAll('canvas');
  charts.forEach(canvas => {
    if (canvas.chart) {
      canvas.chart.resize();
    }
  });
}); 