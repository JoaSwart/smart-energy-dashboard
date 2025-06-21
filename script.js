document.addEventListener('DOMContentLoaded', function() {
  // Settings menu logic for all pages
  document.querySelectorAll('.settings-menu-container').forEach(container => {
    const btn = container.querySelector('span.material-icons[id^="settings-menu-btn"]');
    const menu = container.querySelector('.settings-menu');

    if (btn && menu) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        menu.classList.toggle('active');
      });

      // Close menu when clicking outside
      document.addEventListener('click', function(e) {
        if (menu.classList.contains('active') && !menu.contains(e.target) && e.target !== btn) {
          menu.classList.remove('active');
        }
      });
    }
  });
});
