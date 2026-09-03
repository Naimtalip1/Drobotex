// Mobile nav toggle
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('is-open');
  });
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => navLinks.classList.remove('is-open'));
  });
}

// Registration form (client-side only — no backend wired yet)
const form = document.getElementById('registerForm');
const note = document.getElementById('formNote');
if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    note.textContent = 'Thanks! You\'re on the list — we\'ll be in touch before DROBOTEX 2026 kicks off.';
    note.style.color = '#35c9f5';
    form.reset();
  });
}

// Reveal-on-scroll for sections
const revealTargets = document.querySelectorAll('.obj-card, .module-card, .comp-card, .audience-item, .detail-list__item');
const io = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

revealTargets.forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(18px)';
  el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  io.observe(el);
});
