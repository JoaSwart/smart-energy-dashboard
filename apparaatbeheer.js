document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.apparaat-menu-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      document.querySelectorAll('.apparaat-menu').forEach(menu => menu.classList.remove('active'));
      const apparaat = btn.getAttribute('data-apparaat');
      const menu = document.querySelector('.apparaat-menu[data-apparaat="' + apparaat + '"]');
      if (menu) menu.classList.toggle('active');
    });
  });

  // sluit het menu als je erbuiten klikt
  document.addEventListener('click', function() {
    document.querySelectorAll('.apparaat-menu').forEach(menu => menu.classList.remove('active'));
  });

  // voorkom dat het menu sluit als je er binnenin klikt
  document.querySelectorAll('.apparaat-menu').forEach(menu => {
    menu.addEventListener('click', function(e) {
      e.stopPropagation();
    });
  });
});