/* ==============================================
   CAFETERIA CLEAN - JAVASCRIPT OPTIMIZADO
   ============================================== */

// Utilidades
const $ = (selector, context = document) => context.querySelector(selector);
const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));

// Configuración global
const config = {
  animationDuration: 300,
  scrollOffset: 80,
  counterSpeed: 60,
  autoplayInterval: 5000
};

/* ==============================================
   INICIALIZACIÓN
   ============================================== */

document.addEventListener('DOMContentLoaded', () => {
  initializeYear();
  initializeNavigation();
  initializeScrollReveal();
  initializeSmoothScroll();
  initializeCounters();
  initializeTestimonials();
  initializeLocation();
  initializeFooter();
});

/* ==============================================
   AÑO DINÁMICO
   ============================================== */

function initializeYear() {
  const yearElement = $('#year');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }
}

/* ==============================================
   NAVEGACIÓN
   ============================================== */

function initializeNavigation() {
  const toggle = $('.nav-toggle');
  const menu = $('#menu');
  
  if (!toggle || !menu) return;
  
  // Toggle menu móvil
  toggle.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('open');
    toggle.setAttribute('aria-expanded', isOpen);
  });
  
  // Cerrar menu al hacer clic en enlace
  menu.addEventListener('click', (e) => {
    if (e.target.matches('a')) {
      menu.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
  
  // Cerrar menu al hacer clic fuera
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav') && menu.classList.contains('open')) {
      menu.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
}

/* ==============================================
   SCROLL REVEAL
   ============================================== */

function initializeScrollReveal() {
  const elements = $$('.reveal');
  if (!elements.length) return;
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '50px'
  });
  
  elements.forEach(el => observer.observe(el));
}

/* ==============================================
   SMOOTH SCROLL
   ============================================== */

function initializeSmoothScroll() {
  const header = $('.site-header');
  
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    
    const href = link.getAttribute('href');
    if (!href || href === '#') return;
    
    const target = $(href);
    if (!target) return;
    
    e.preventDefault();
    
    const headerHeight = header ? header.offsetHeight : 0;
    const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;
    
    window.scrollTo({
      top: targetPosition,
      behavior: 'smooth'
    });
    
    // Actualizar URL sin saltar
    history.pushState(null, '', href);
  });
}

/* ==============================================
   CONTADORES ANIMADOS
   ============================================== */

function initializeCounters() {
  const counters = $$('.stat-number[data-target]');
  if (!counters.length) return;
  
  const animateCounter = (element, target, duration = 2000) => {
    const start = 0;
    const startTime = performance.now();
    
    const updateCounter = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Función de easing (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = start + (target - start) * easeOut;
      
      // Formatear número
      if (target === 4.9) {
        element.textContent = current.toFixed(1);
      } else {
        element.textContent = Math.floor(current).toLocaleString();
      }
      
      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      }
    };
    
    requestAnimationFrame(updateCounter);
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = parseFloat(entry.target.dataset.target);
        animateCounter(entry.target, target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  
  counters.forEach(counter => observer.observe(counter));
}

/* ==============================================
   TESTIMONIOS
   ============================================== */

function initializeTestimonials() {
  initializeRatingFilter();
  initializeHelpfulButtons();
  initializeLoadMore();
  initializeWriteReview();
}

function initializeRatingFilter() {
  const filterBtns = $$('.rating-btn');
  const testimonials = $$('.testimonial-card[data-rating]');
  
  if (!filterBtns.length || !testimonials.length) return;
  
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Actualizar botones activos
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const filterValue = btn.dataset.rating;
      
      // Filtrar testimonios con animación
      testimonials.forEach((testimonial, index) => {
        const show = filterValue === 'all' || testimonial.dataset.rating === filterValue;
        
        if (show) {
          testimonial.style.display = 'block';
          setTimeout(() => {
            testimonial.classList.add('fade-in');
          }, index * 100);
        } else {
          testimonial.style.display = 'none';
          testimonial.classList.remove('fade-in');
        }
      });
    });
  });
}

function initializeHelpfulButtons() {
  const helpfulBtns = $$('.helpful-btn');
  
  helpfulBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const currentCount = parseInt(btn.dataset.helpful) || 0;
      const newCount = currentCount + 1;
      
      btn.dataset.helpful = newCount;
      btn.innerHTML = `👍 ${newCount}`;
      btn.disabled = true;
      btn.style.opacity = '0.6';
      
      // Mostrar feedback temporal
      showTemporaryFeedback(btn, '¡Gracias!', 'success');
    });
  });
}

function initializeLoadMore() {
  const loadMoreBtn = $('#loadMoreReviews');
  if (!loadMoreBtn) return;
  
  loadMoreBtn.addEventListener('click', () => {
    const originalText = loadMoreBtn.innerHTML;
    
    // Mostrar estado de carga
    loadMoreBtn.innerHTML = 'Cargando...';
    loadMoreBtn.disabled = true;
    
    // Simular carga
    setTimeout(() => {
      loadMoreBtn.innerHTML = originalText;
      loadMoreBtn.disabled = false;
      showNotification('Se cargaron más reseñas', 'success');
    }, 1500);
  });
}

function initializeWriteReview() {
  const writeReviewBtn = $('#writeReviewBtn');
  if (!writeReviewBtn) return;
  
  writeReviewBtn.addEventListener('click', () => {
    showNotification('¡Gracias por tu interés! Te redirigiremos a nuestro formulario de reseñas.', 'info');
  });
}

/* ==============================================
   UBICACIÓN
   ============================================== */

function initializeLocation() {
  initializeMapPlaceholders();
}

function initializeMapPlaceholders() {
  const mapPlaceholders = $$('.map-placeholder');
  
  mapPlaceholders.forEach(placeholder => {
    placeholder.addEventListener('click', () => {
      const lat = placeholder.closest('[data-lat]')?.dataset.lat || '40.4168';
      const lng = placeholder.closest('[data-lng]')?.dataset.lng || '-3.7038';
      openDirections(parseFloat(lat), parseFloat(lng));
    });
  });
}

// Función global para abrir direcciones
window.openDirections = (lat, lng) => {
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  let url;
  if (isMobile) {
    url = `https://maps.google.com/maps?daddr=${lat},${lng}`;
  } else {
    url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  }
  
  window.open(url, '_blank');
};

/* ==============================================
   FOOTER
   ============================================== */

function initializeFooter() {
  initializeNewsletter();
  initializeBackToTop();
  initializeSocialLinks();
}

function initializeNewsletter() {
  const form = $('#newsletter-form');
  const input = $('#newsletter-email');
  const feedback = $('#newsletter-feedback');
  
  if (!form || !input || !feedback) return;
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const email = input.value.trim();
    if (!email) {
      showFeedback(feedback, 'Por favor, ingresa un email válido.', 'error');
      return;
    }
    
    // Validación básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showFeedback(feedback, 'Por favor, ingresa un email válido.', 'error');
      return;
    }
    
    // Simular envío
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    submitBtn.textContent = 'Enviando...';
    submitBtn.disabled = true;
    
    setTimeout(() => {
      showFeedback(feedback, '¡Gracias! Te has suscrito exitosamente a nuestro newsletter.', 'success');
      input.value = '';
      
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
      
      // Ocultar mensaje después de 5 segundos
      setTimeout(() => {
        feedback.textContent = '';
        feedback.className = 'feedback';
      }, 5000);
    }, 2000);
  });
}

function initializeBackToTop() {
  const backToTop = $('#backToTop');
  if (!backToTop) return;
  
  // Mostrar/ocultar botón basado en scroll
  const toggleVisibility = () => {
    if (window.pageYOffset > 300) {
      backToTop.classList.add('visible');
    } else {
      backToTop.classList.remove('visible');
    }
  };
  
  window.addEventListener('scroll', toggleVisibility, { passive: true });
  
  // Scroll al top
  backToTop.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

function initializeSocialLinks() {
  const socialLinks = $$('.social-link');
  
  socialLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      // Agregar efecto visual
      link.style.transform = 'scale(0.95)';
      setTimeout(() => {
        link.style.transform = '';
      }, 150);
    });
  });
}

/* ==============================================
   UTILIDADES
   ============================================== */

function showFeedback(element, message, type) {
  element.textContent = message;
  element.className = `feedback ${type}`;
}

function showTemporaryFeedback(targetElement, message, type, duration = 2000) {
  const feedback = document.createElement('div');
  feedback.textContent = message;
  feedback.className = `temporary-feedback ${type}`;
  feedback.style.cssText = `
    position: absolute;
    top: -40px;
    left: 50%;
    transform: translateX(-50%);
    background: ${type === 'success' ? 'var(--accent)' : 'var(--brand)'};
    color: #000;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-size: 0.8rem;
    font-weight: 600;
    z-index: 100;
    opacity: 0;
    animation: fadeInOut 2s ease forwards;
  `;
  
  targetElement.style.position = 'relative';
  targetElement.appendChild(feedback);
  
  setTimeout(() => feedback.remove(), duration);
}

function showNotification(message, type) {
  // Crear notificación temporal
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.className = `notification ${type}`;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? 'var(--accent)' : type === 'error' ? '#ff6b6b' : 'var(--brand)'};
    color: ${type === 'success' || type === 'error' ? '#fff' : '#000'};
    padding: 1rem 1.5rem;
    border-radius: 8px;
    font-weight: 600;
    z-index: 1000;
    transform: translateX(100%);
    transition: transform 0.3s ease;
    max-width: 300px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
  `;
  
  document.body.appendChild(notification);
  
  // Animar entrada
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
  }, 100);
  
  // Animar salida
  setTimeout(() => {
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => notification.remove(), 300);
  }, 4000);
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/* ==============================================
   ESTILOS DINÁMICOS
   ============================================== */

// Agregar estilos para animaciones dinámicas
function addDynamicStyles() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeInOut {
      0% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
      20% { opacity: 1; transform: translateX(-50%) translateY(-15px); }
      80% { opacity: 1; transform: translateX(-50%) translateY(-15px); }
      100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
    }
    
    .temporary-feedback {
      pointer-events: none;
    }
    
    .notification {
      font-family: Inter, system-ui, sans-serif;
      line-height: 1.4;
    }
    
    .fade-in {
      animation: fadeIn 0.6s ease forwards;
    }
    
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    /* Loading spinner */
    .spinner {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid transparent;
      border-top: 2px solid currentColor;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    /* Mejoras de accesibilidad */
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
    
    /* Focus visible para mejor accesibilidad */
    .btn:focus-visible,
    .nav-list a:focus-visible,
    .social-link:focus-visible {
      outline: 2px solid var(--brand);
      outline-offset: 2px;
    }
    
    /* Animación de hover mejorada */
    .card,
    .menu-item,
    .testimonial-card {
      will-change: transform;
    }
    
    /* Optimización para dispositivos de bajo rendimiento */
    @media (prefers-reduced-motion: reduce) {
      .fade-in,
      .temporary-feedback,
      .notification {
        animation: none !important;
        transition: none !important;
      }
    }
  `;
  
  document.head.appendChild(style);
}

// Inicializar estilos dinámicos
addDynamicStyles();

/* ==============================================
   MANEJO DE ERRORES
   ============================================== */

window.addEventListener('error', (e) => {
  console.error('Error en la aplicación:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('Promise rechazada:', e.reason);
});

/* ==============================================
   PERFORMANCE OPTIMIZATION
   ============================================== */

// Lazy loading para imágenes
if ('IntersectionObserver' in window) {
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
        }
        imageObserver.unobserve(img);
      }
    });
  });
  
  // Observar imágenes con data-src
  $$('img[data-src]').forEach(img => imageObserver.observe(img));
}

// Preload crítico
function preloadCriticalResources() {
  const criticalImages = [
    'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=500&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1498804103079-a6351b050096?q=80&w=500&auto=format&fit=crop'
  ];
  
  criticalImages.forEach(src => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    document.head.appendChild(link);
  });
}

// Inicializar optimizaciones
document.addEventListener('DOMContentLoaded', () => {
  if (window.requestIdleCallback) {
    window.requestIdleCallback(preloadCriticalResources);
  } else {
    setTimeout(preloadCriticalResources, 1000);
  }
});
