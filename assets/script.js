// Mobile nav toggle
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
  navLinks.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => navLinks.classList.remove('open'))
  );
}

// Header shrink on scroll
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
  if (window.scrollY > 40) header.style.borderBottomColor = 'rgba(30,200,255,.25)';
  else header.style.borderBottomColor = '';
});

// Footer year
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Events modal
const eventsBtn = document.getElementById('eventsBtn');
const eventsModal = document.getElementById('eventsModal');
const eventsClose = document.getElementById('eventsClose');
if (eventsBtn && eventsModal && eventsClose) {
  eventsBtn.addEventListener('click', () => eventsModal.classList.add('open'));
  eventsClose.addEventListener('click', () => eventsModal.classList.remove('open'));
  eventsModal.addEventListener('click', (e) => {
    if (e.target === eventsModal) eventsModal.classList.remove('open');
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') eventsModal.classList.remove('open');
  });
}
