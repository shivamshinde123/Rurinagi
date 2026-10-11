const nav = document.querySelector('.nav-shell');
const reveals = document.querySelectorAll('.reveal');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

document.querySelector('#year').textContent = String(new Date().getFullYear());
addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 12), { passive: true });

if (reducedMotion || !('IntersectionObserver' in window)) {
  reveals.forEach((element) => element.classList.add('visible'));
} else {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  }, { threshold: 0.12 });
  reveals.forEach((element) => observer.observe(element));
}
