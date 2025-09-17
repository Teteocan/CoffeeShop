/* Utilidades */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

/* Año dinámico */
$('#year').textContent = new Date().getFullYear().toString();

/* Navegación móvil */
(() => {
  const toggle = $('.nav-toggle');
  const list = $('#menu');
  if (!toggle || !list) return;
  toggle.addEventListener('click', () => {
    const isOpen = list.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });
  // Cerrar al navegar
  list.addEventListener('click', e => {
    if (e.target.matches('a')) {
      list.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
})();

/* Scroll: revelar elementos con IntersectionObserver */
(() => {
  const toReveal = $$('.reveal');
  if (!toReveal.length) return;
  const obs = new IntersectionObserver((entries, o) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        o.unobserve(entry.target);
      }
    });
  }, { threshold: 0.16, rootMargin: '60px' });
  toReveal.forEach(el => obs.observe(el));
})();

/* Ajuste de anclas: compensar altura de header en scroll */
(() => {
  const header = $('.site-header');
  const headerH = () => (header ? header.getBoundingClientRect().height : 0);
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    if (!id || id === '#') return;
    const target = $(id);
    if (!target) return;
    e.preventDefault();
    const top = target.getBoundingClientRect().top + window.scrollY - headerH() - 8;
    window.scrollTo({ top, behavior: 'smooth' });
    history.pushState(null, '', id);
  });
})();

/* Three.js: escena de granos de café flotando */
(() => {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const container = $('#bg3d');
  const canvas = $('#beans');
  if (!container || !canvas) return;

  // Cargar Three.js como módulo desde CDN
  const boot = async () => {
    const THREE = await import('https://unpkg.com/three@0.161.0/build/three.module.js');

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 0.6, 5);
    scene.add(camera);

    // Luces
    const amb = new THREE.AmbientLight(0xffffff, 0.55);
    const key = new THREE.DirectionalLight(0xffe2c0, 1.0);
    key.position.set(2, 3, 2);
    const rim = new THREE.DirectionalLight(0x7a4b2e, 0.6);
    rim.position.set(-3, -1, -2);
    scene.add(amb, key, rim);

    // Material cálido con ligera metalicidad para brillos
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#4a2c2a'),
      roughness: 0.55,
      metalness: 0.1,
      envMapIntensity: 0.7,
    });

    // Geometría base de "grano" modificando esfera
    const makeBeanGeometry = () => {
      const geom = new THREE.SphereGeometry(1, 64, 64);
      const pos = geom.attributes.position;
      const v = new THREE.Vector3();
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i);
        // Escalar a elipsoide
        v.set(v.x * 1.0, v.y * 0.7, v.z * 0.55);
        // Hendidura del grano: curva en X con seno sobre Z
        const crease = 0.2 * Math.exp(-Math.abs(v.x) * 1.5);
        v.y -= Math.sign(v.x) * crease * Math.sin(v.z * Math.PI);
        pos.setXYZ(i, v.x, v.y, v.z);
      }
      pos.needsUpdate = true;
      geom.computeVertexNormals();
      return geom;
    };

    const beanGeom = makeBeanGeometry();

    // Crear varios granos con transformaciones y coloraciones sutiles
    const beans = [];
    const beanCount = 16;
    for (let i = 0; i < beanCount; i++) {
      const m = mat.clone();
      m.color = new THREE.Color().setHSL(0.07 + Math.random() * 0.02, 0.5, 0.28 + Math.random() * 0.05);
      const mesh = new THREE.Mesh(beanGeom, m);
      const radius = 2.2 + Math.random() * 1.6;
      const angle = (i / beanCount) * Math.PI * 2 + Math.random() * 0.6;
      mesh.position.set(Math.cos(angle) * radius, (Math.random() - 0.5) * 1.2, Math.sin(angle) * radius);
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      const s = 0.28 + Math.random() * 0.2;
      mesh.scale.setScalar(s);
      scene.add(mesh);
      beans.push({ mesh, speed: 0.2 + Math.random() * 0.35, rot: new THREE.Vector3(Math.random()*.3, Math.random()*.3, Math.random()*.3) });
    }

    // Partículas sutiles
    const starsGeom = new THREE.BufferGeometry();
    const starCount = 300;
    const positions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 6;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    starsGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const stars = new THREE.Points(starsGeom, new THREE.PointsMaterial({ color: 0xffffff, size: 0.01, transparent: true, opacity: 0.35 }));
    scene.add(stars);

    // Parallax con el mouse
    const mouse = { x: 0, y: 0 };
    let targetCamX = 0, targetCamY = 0;
    window.addEventListener('pointermove', (e) => {
      const rect = container.getBoundingClientRect();
      mouse.x = (e.clientX - rect.left) / rect.width * 2 - 1;
      mouse.y = (e.clientY - rect.top) / rect.height * 2 - 1;
    });

    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', onResize, { passive: true });
    onResize();

    let t = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      if (!prefersReduced) requestAnimationFrame(animate);
      const dt = clock.getDelta();
      t += dt;

      // Mover y rotar granos
      beans.forEach((b, i) => {
        const { mesh, speed, rot } = b;
        mesh.rotation.x += rot.x * dt;
        mesh.rotation.y += rot.y * dt;
        mesh.rotation.z += rot.z * dt;
        mesh.position.y = Math.sin(t * speed + i) * 0.4;
      });

      // Parallax suave
      targetCamX += (mouse.x * 0.5 - targetCamX) * 0.04;
      targetCamY += (mouse.y * -0.3 - targetCamY) * 0.04;
      camera.position.x = targetCamX;
      camera.position.y = 0.6 + targetCamY;
      camera.lookAt(0, 0, 0);

      stars.rotation.y += 0.01 * dt;

      renderer.render(scene, camera);
    };

    if (!prefersReduced) animate();
  };

  // Ejecutar
  boot().catch(err => console.error('Fallo al iniciar 3D:', err));
})();

/* Carrusel de testimonios: autoplay, controles y dots */
(() => {
  const slider = $('#testi-slider');
  if (!slider) return;
  const slides = $$('.slide', slider);
  const prev = $('.slider-btn.prev');
  const next = $('.slider-btn.next');
  const dotsWrap = $('#testi-dots');
  let index = 0;
  let autoplayId;

  // Crear dots
  const dots = slides.map((_, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.addEventListener('click', () => goTo(i));
    dotsWrap.appendChild(b);
    return b;
  });

  const setActive = (i) => {
    dots.forEach((d, idx) => d.classList.toggle('active', idx === i));
  };

  const goTo = (i) => {
    index = (i + slides.length) % slides.length;
    slides[index].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    setActive(index);
  };

  const nextSlide = () => goTo(index + 1);
  const prevSlide = () => goTo(index - 1);

  next?.addEventListener('click', nextSlide);
  prev?.addEventListener('click', prevSlide);

  // Autoplay
  const start = () => {
    stop();
    autoplayId = setInterval(nextSlide, 4200);
  };
  const stop = () => autoplayId && clearInterval(autoplayId);

  slider.addEventListener('mouseenter', stop);
  slider.addEventListener('mouseleave', start);
  slider.addEventListener('focusin', stop);
  slider.addEventListener('focusout', start);

  // Seguir posición con scroll manual
  slider.addEventListener('scroll', () => {
    const centers = slides.map(el => {
      const rect = el.getBoundingClientRect();
      return Math.abs(rect.left + rect.width / 2 - (window.innerWidth / 2));
    });
    const nearest = centers.indexOf(Math.min(...centers));
    if (nearest !== -1 && nearest !== index) {
      index = nearest;
      setActive(index);
    }
  }, { passive: true });

  // Inicializar
  setActive(index);
  start();
})();

/* Mapa interactivo con Leaflet (sin claves) */
(() => {
  const mapDiv = $('#map');
  const directions = $('#directions');
  if (!mapDiv) return;

  const lat = parseFloat(mapDiv.dataset.lat || '40.4168');
  const lng = parseFloat(mapDiv.dataset.lng || '-3.7038');
  const title = mapDiv.dataset.title || 'Origen Café';

  // Cargar CSS de Leaflet dinámicamente
  const css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  document.head.appendChild(css);

  const loadMap = async () => {
    const L = await import('https://unpkg.com/leaflet@1.9.4/dist/leaflet-src.esm.js');

    const map = L.map(mapDiv, {
      zoomControl: true,
      scrollWheelZoom: false,
      attributionControl: true
    }).setView([lat, lng], 15);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap, &copy; CARTO',
      maxZoom: 20
    }).addTo(map);

    const icon = L.divIcon({
      className: 'coffee-marker',
      html: `<div style="width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#c17a48,#7a4b2e);display:flex;align-items:center;justify-content:center;color:#0b0908;font-weight:900;border:2px solid rgba(255,255,255,.6);box-shadow:0 8px 20px rgba(193,122,72,.4)">☕</div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });

    const marker = L.marker([lat, lng], { icon }).addTo(map);
    marker.bindPopup(`<strong>${title}</strong><br>Av. Aromas 123`).openPopup();

    if (directions) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=&travelmode=walking`;
      directions.setAttribute('href', url);
    }
  };

  loadMap().catch(err => console.error('No se pudo cargar el mapa:', err));
})();

/* Newsletter (demo sin backend) */
(() => {
  const form = $('#newsletter-form');
  const input = $('#newsletter-email');
  const status = $('#newsletter-feedback');
  if (!form || !input || !status) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = input.value.trim();
    if (!email) return;

    // Simular éxito
    status.textContent = '¡Gracias! Revisa tu bandeja para confirmar la suscripción.';
    input.value = '';
  });
})();

/* ==============================================
   ENHANCED TESTIMONIALS FUNCTIONALITY
   ============================================== */

/* Animación de contadores */
(() => {
  const counters = $$('.stat-number[data-target]');
  if (!counters.length) return;

  const animateCounter = (el, target) => {
    let current = 0;
    const increment = target / 60; // 60 frames para la animación
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      el.textContent = Math.floor(current).toString();
    }, 16); // ~60fps
  };

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = parseFloat(entry.target.dataset.target);
        animateCounter(entry.target, target);
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(counter => obs.observe(counter));
})();

/* Filtro de testimonios por rating */
(() => {
  const filterBtns = $$('.rating-btn');
  const testimonials = $$('.testimonial-card[data-rating]');
  
  if (!filterBtns.length || !testimonials.length) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Actualizar botones activos
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const filterValue = btn.dataset.rating;
      
      // Filtrar testimonios
      testimonials.forEach(testimonial => {
        const show = filterValue === 'all' || testimonial.dataset.rating === filterValue;
        testimonial.style.display = show ? 'block' : 'none';
        
        if (show) {
          testimonial.style.animation = 'fadeInUp 0.5s ease forwards';
        }
      });
    });
  });
})();

/* Botones de "útil" en testimonios */
(() => {
  const helpfulBtns = $$('.helpful-btn');
  
  helpfulBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const currentCount = parseInt(btn.dataset.helpful) || 0;
      const newCount = currentCount + 1;
      btn.dataset.helpful = newCount;
      btn.innerHTML = `👍 ${newCount}`;
      btn.disabled = true;
      btn.style.opacity = '0.6';
      
      // Mostrar feedback
      const feedback = document.createElement('span');
      feedback.textContent = '¡Gracias!';
      feedback.style.cssText = `
        position: absolute;
        background: var(--brand);
        color: #000;
        padding: 0.3rem 0.6rem;
        border-radius: 8px;
        font-size: 0.8rem;
        transform: translateY(-30px);
        opacity: 0;
        animation: fadeInOut 2s ease forwards;
      `;
      
      btn.style.position = 'relative';
      btn.appendChild(feedback);
      
      setTimeout(() => feedback.remove(), 2000);
    });
  });
})();

/* Cargar más reseñas */
(() => {
  const loadMoreBtn = $('#loadMoreReviews');
  const reviewsCount = $('.reviews-count');
  
  if (!loadMoreBtn) return;
  
  loadMoreBtn.addEventListener('click', () => {
    // Simular carga de más reseñas
    loadMoreBtn.innerHTML = `
      <span>Cargando...</span>
      <div class="spinner"></div>
    `;
    loadMoreBtn.disabled = true;
    
    setTimeout(() => {
      // Simular que se cargaron más reseñas
      if (reviewsCount) {
        reviewsCount.textContent = 'Mostrando 12 de 1,200+ reseñas';
      }
      loadMoreBtn.innerHTML = `
        Ver más reseñas
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M7 10l5 5 5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      `;
      loadMoreBtn.disabled = false;
    }, 1500);
  });
})();

/* Modal para escribir reseña */
(() => {
  const writeReviewBtn = $('#writeReviewBtn');
  
  if (!writeReviewBtn) return;
  
  writeReviewBtn.addEventListener('click', () => {
    // Simular modal o redirigir a formulario
    alert('¡Gracias por tu interés! Te redirigiremos a nuestro formulario de reseñas.');
    // En una implementación real, aquí abriríamos un modal o redirigirías
  });
})();

/* ==============================================
   ENHANCED LOCATION FUNCTIONALITY
   ============================================== */

/* Funcionalidad de direcciones */
window.openDirections = (lat, lng) => {
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  let url;
  if (isMobile) {
    // Usar la app nativa de mapas
    url = `https://maps.google.com/maps?daddr=${lat},${lng}`;
  } else {
    // Usar Google Maps web
    url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  }
  
  window.open(url, '_blank');
};

/* Simular mapa interactivo */
(() => {
  const maps = $$('#map, .mini-map');
  
  maps.forEach(mapEl => {
    if (!mapEl) return;
    
    mapEl.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; text-align: center; gap: 1rem;">
        <div style="font-size: 3rem;">📍</div>
        <div>
          <strong style="color: var(--text);">Origen Café</strong><br>
          <span style="color: var(--muted); font-size: 0.9rem;">Av. Aromas 123, Centro</span>
        </div>
        <div style="font-size: 0.8rem; color: var(--muted);">Haz clic en "Cómo llegar" para abrir el mapa</div>
      </div>
    `;
    
    mapEl.style.cursor = 'pointer';
    mapEl.addEventListener('click', () => {
      const lat = mapEl.dataset.lat || '40.4168';
      const lng = mapEl.dataset.lng || '-3.7038';
      openDirections(parseFloat(lat), parseFloat(lng));
    });
  });
})();

/* ==============================================
   ENHANCED FOOTER FUNCTIONALITY
   ============================================== */

/* Back to top button */
(() => {
  const backToTop = $('#backToTop');
  if (!backToTop) return;

  // Mostrar/ocultar botón basado en scroll
  window.addEventListener('scroll', () => {
    if (window.pageYOffset > 300) {
      backToTop.classList.add('visible');
    } else {
      backToTop.classList.remove('visible');
    }
  });

  // Scroll suave al hacer clic
  backToTop.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
})();

/* Newsletter form mejorado */
(() => {
  const form = $('#newsletter-form');
  const input = $('#newsletter-email');
  const feedback = $('#newsletter-feedback');
  
  if (!form || !input || !feedback) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const email = input.value.trim();
    if (!email) {
      feedback.textContent = 'Por favor, ingresa un email válido.';
      feedback.style.color = '#ff6b6b';
      return;
    }

    // Validación básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      feedback.textContent = 'Por favor, ingresa un email válido.';
      feedback.style.color = '#ff6b6b';
      return;
    }

    // Simular envío
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    submitBtn.innerHTML = `
      <span>Enviando...</span>
      <div class="spinner" style="width: 16px; height: 16px; border: 2px solid transparent; border-top: 2px solid #000; border-radius: 50%; animation: spin 1s linear infinite;"></div>
    `;
    submitBtn.disabled = true;

    setTimeout(() => {
      feedback.textContent = '¡Gracias! Te has suscrito exitosamente a nuestro newsletter.';
      feedback.style.color = 'var(--accent)';
      input.value = '';
      
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
      
      // Ocultar mensaje después de 5 segundos
      setTimeout(() => {
        feedback.textContent = '';
      }, 5000);
    }, 2000);
  });
})();

/* Animaciones de entrada para elementos del footer */
(() => {
  const footerElements = $$('.footer-brand, .footer-nav, .footer-services, .footer-contact');
  
  if (!footerElements.length) return;
  
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.style.animation = 'fadeInUp 0.6s ease forwards';
          entry.target.style.opacity = '1';
        }, index * 100);
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  footerElements.forEach(el => {
    el.style.opacity = '0';
    obs.observe(el);
  });
})();

/* CSS para animaciones */
(() => {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    @keyframes fadeInOut {
      0% { opacity: 0; transform: translateY(-30px); }
      20% { opacity: 1; transform: translateY(-25px); }
      80% { opacity: 1; transform: translateY(-25px); }
      100% { opacity: 0; transform: translateY(-30px); }
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid transparent;
      border-top: 2px solid currentColor;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
  `;
  document.head.appendChild(style);
})();
