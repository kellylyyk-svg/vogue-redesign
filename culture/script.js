let scrollX = 0;
let scrollXRef = 0;
let scrollLocked = false;
let hasPassedIntro = false;
const totalPages = 7;
const maxScroll = (totalPages - 1) * 100;

let cursorX = 0;
let cursorY = 0;
let targetCursorX = 0;
let targetCursorY = 0;

const ROTATION_DURATION = 4000;
const TOTAL_DURATION = 9000;

let introStartTime = null;
let introRenderer = null;
let introScene = null;
let introCamera = null;
let introModel = null;
let introAnimationId = null;

function easeInOutQuint(t) {
  return t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2;
}

function initIntroPage() {
  const container = document.getElementById('introCanvas');
  if (!container) return;

  introScene = new THREE.Scene();
  introCamera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
  introCamera.position.z = 5;

  introRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  introRenderer.setSize(container.clientWidth, container.clientHeight);
  introRenderer.setPixelRatio(window.devicePixelRatio);
  introRenderer.toneMapping = THREE.ACESFilmicToneMapping;
  introRenderer.toneMappingExposure = 1.5;
  introRenderer.outputEncoding = THREE.sRGBEncoding;
  container.appendChild(introRenderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  introScene.add(ambientLight);

  const pointLight = new THREE.PointLight(0xffffff, 100);
  pointLight.position.set(5, 5, 5);
  introScene.add(pointLight);

  const loader = new THREE.GLTFLoader();
  loader.load('./VOGUE.glb', (gltf) => {
    introModel = gltf.scene;
    introModel.scale.set(1.6, 1.6, 1.6);
    introModel.position.set(0, 0, 0);

    introModel.traverse((child) => {
      if (child.isMesh) {
        const material = new THREE.MeshPhysicalMaterial({
          color: 0xffffff,
          metalness: 1.0,
          roughness: 0.02,
        });
        child.material = material;
      }
    });

    introScene.add(introModel);

    document.getElementById('loadingText').style.display = 'none';
    document.getElementById('loadingBarContainer').style.display = 'block';
    introStartTime = Date.now();
  }, undefined, (error) => {
    console.error('Model load error:', error);
  });

  const rgbeLoader = new THREE.RGBELoader();
  rgbeLoader.load('./hdri.hdr', (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    introScene.environment = texture;
  });

  animateIntro();
}

function animateIntro() {
  introAnimationId = requestAnimationFrame(animateIntro);

  if (introModel && introScene.environment && introStartTime) {
    const elapsed = Date.now() - introStartTime;

    const rotationCycle = (elapsed % ROTATION_DURATION) / ROTATION_DURATION;
    const easedRotation = easeInOutQuint(rotationCycle);
    introModel.rotation.y = easedRotation * Math.PI * 2;

    const progress = Math.min(elapsed / TOTAL_DURATION, 1);
    document.getElementById('loadingBar').style.width = (progress * 100) + '%';

    if (progress >= 0.95 && !hasPassedIntro) {
      document.getElementById('introPage').classList.add('fading');
    }

    if (elapsed >= TOTAL_DURATION && !hasPassedIntro) {
      hasPassedIntro = true;

      // Auto-advance to Page 1
      goToPage(1);

      // Remove intro mode styles
      document.body.classList.remove('intro-mode');
      document.getElementById('topNav').classList.add('visible');

      cancelAnimationFrame(introAnimationId);
      if (introRenderer) {
        introRenderer.dispose();
      }
    }
  }

  if (introRenderer && introScene && introCamera) {
    introRenderer.render(introScene, introCamera);
  }
}

function initHeroLogo() {
  const container = document.getElementById('heroLogoContainer');
  if (!container) return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
  camera.position.z = 5;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.5;
  renderer.outputEncoding = THREE.sRGBEncoding;
  container.appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const pointLight = new THREE.PointLight(0xffffff, 100);
  pointLight.position.set(5, 5, 5);
  scene.add(pointLight);

  let heroModel = null;

  const loader = new THREE.GLTFLoader();
  loader.load('./VOGUE_hero.glb', (gltf) => {
    heroModel = gltf.scene;
    heroModel.scale.set(1.8, 1.8, 1.8);
    heroModel.position.set(0, 0, 0);

    heroModel.traverse((child) => {
      if (child.isMesh) {
        const material = new THREE.MeshPhysicalMaterial({
          color: 0xffffff,
          metalness: 1.0,
          roughness: 0.02,
        });
        child.material = material;
      }
    });

    scene.add(heroModel);
  });

  const rgbeLoader = new THREE.RGBELoader();
  rgbeLoader.load('./hdri.hdr', (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = texture;
  });

  let mouseX = 0;
  let mouseY = 0;

  window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  function animate() {
    requestAnimationFrame(animate);

    if (heroModel && scene.environment) {
      heroModel.rotation.y += (mouseX * 0.5 - heroModel.rotation.y) * 0.05;
      heroModel.rotation.x += (-mouseY * 0.3 - heroModel.rotation.x) * 0.05;
    }

    renderer.render(scene, camera);
  }

  animate();
}

function goToPage(pageIndex) {
  if (pageIndex < 0 || pageIndex >= totalPages) return;

  const minScroll = hasPassedIntro ? 100 : 0;
  if (pageIndex * 100 < minScroll) return;

  scrollX = pageIndex * 100;
  scrollXRef = scrollX;
  updatePages();
  updateIndicators();
  updateNav();
}

function updatePages() {
  const pages = document.querySelectorAll('.page');
  pages.forEach((page, index) => {
    const pageOffset = index * 100;
    const translateX = pageOffset - scrollX;
    page.style.transform = `translateX(${translateX}%)`;
    page.style.zIndex = totalPages - index;
  });
}

function updateIndicators() {
  const currentPage = Math.round(scrollX / 100);
  const indicators = document.querySelectorAll('.page-indicator');
  indicators.forEach((indicator, index) => {
    indicator.classList.toggle('active', index === currentPage);
  });
}

function updateNav() {
  const currentPage = Math.round(scrollX / 100);
  const nav = document.getElementById('topNav');

  if (currentPage > 0) {
    nav.classList.add('visible');
  } else {
    nav.classList.remove('visible');
  }

  const darkPages = [2, 4, 5, 6];
  if (darkPages.includes(currentPage)) {
    nav.classList.add('dark');
  } else {
    nav.classList.remove('dark');
  }
}


let isScrolling = false;


// ========================================
// Scroll & Logic
// ========================================

let snapTimeout = null;
let cultureExpandCount = 0;
let cultureScrolling = false; // "Trap" lock

// --- Video Page Data & State ---
let videoCurrentIndex = 0;
const videoData = [
  { title: "Troya", video: "https://cdn.coverr.co/videos/coverr-woman-in-a-photoshoot-5169/1080p.mp4" },
  { title: "Versace Fragrance", video: "https://cdn.coverr.co/videos/coverr-models-backstage-2271/1080p.mp4" },
  { title: "Hermès Ski", video: "https://cdn.coverr.co/videos/coverr-a-woman-walking-on-a-field-7447/1080p.mp4" },
  { title: "Dior Rouge", video: "https://cdn.coverr.co/videos/coverr-woman-in-a-photoshoot-5169/1080p.mp4" },
  { title: "Vogue The Independents", video: "https://cdn.coverr.co/videos/coverr-models-backstage-2271/1080p.mp4" },
  { title: "Louis Vuitton Cruise", video: "https://cdn.coverr.co/videos/coverr-a-woman-walking-on-a-field-7447/1080p.mp4" },
  { title: "Jacquemus", video: "https://cdn.coverr.co/videos/coverr-woman-in-a-photoshoot-5169/1080p.mp4" },
  { title: "Vogue Pr Da Pra", video: "https://cdn.coverr.co/videos/coverr-models-backstage-2271/1080p.mp4" }
];

function setVideoIndex(index) {
  if (index < 0 || index >= videoData.length) return;
  videoCurrentIndex = index;
  updateVideoUI();
}

function updateVideoUI() {
  // 1. Update List Active State
  const listItems = document.querySelectorAll('.video-list-item');
  listItems.forEach((item, i) => {
    item.classList.toggle('active', i === videoCurrentIndex);
  });

  // 2. Update Carousel Videos (Vertical Stack Effect)
  // We have 4 thumb slots: data-offset -1, 0, 1, 2
  // We map them relative to videoCurrentIndex
  const thumbs = document.querySelectorAll('.video-thumb');
  thumbs.forEach(thumb => {
    const offset = parseInt(thumb.dataset.offset);
    const dataIndex = videoCurrentIndex + offset;

    // Vertical Translation & Scale/Opacity logic based on offset
    // 0 = Center (Active)
    // 1 = Below, -1 = Above (or hidden)

    let yPos = 0;
    let scale = 1;
    let opacity = 1;
    let zIndex = 10;

    if (offset === 0) {
      yPos = 0;
      scale = 1;
      opacity = 1;
      zIndex = 10;
    } else if (offset === 1) {
      yPos = 120; // px down
      scale = 0.9;
      opacity = 0.6;
      zIndex = 9;
    } else if (offset === 2) {
      yPos = 240;
      scale = 0.8;
      opacity = 0.3;
      zIndex = 8;
    } else if (offset === -1) {
      yPos = -120; // px up
      scale = 0.9;
      opacity = 0; // Fade out above
      zIndex = 5;
    }

    thumb.style.transform = `translateY(${yPos}%) scale(${scale})`; // Using % for responsive
    thumb.style.opacity = opacity;
    thumb.style.zIndex = zIndex;

    // Content Update - Use VIDEO with SOURCE tag
    if (dataIndex >= 0 && dataIndex < videoData.length) {
      // Check if video exists, if not create
      let video = thumb.querySelector('video');
      if (!video) {
        video = document.createElement('video');
        video.setAttribute('autoplay', '');
        video.setAttribute('muted', '');
        video.setAttribute('loop', '');
        video.setAttribute('playsinline', '');
        thumb.appendChild(video);
      }

      // Check if source exists, if not create
      let source = video.querySelector('source');
      if (!source) {
        source = document.createElement('source');
        source.setAttribute('type', 'video/mp4');
        video.appendChild(source);
      }

      // Update source if different
      if (source.src !== videoData[dataIndex].video) {
        source.src = videoData[dataIndex].video;
        video.load(); // Reload the video with new source

        // Play the video when it's the active one
        if (offset === 0) {
          video.play().catch(e => console.log('Video play failed:', e));
        }
      }
    } else {
      // Empty/Hide if out of bounds
      thumb.style.opacity = 0;
    }
  });
}


function handleWheel(e) {
  e.preventDefault();
  if (scrollLocked) return;
  if (!hasPassedIntro) return; // Block scroll during intro

  const delta = e.deltaY * 0.5; // Sensitivity
  const currentPage = Math.round(scrollX / 100);

  // --- Culture Page Logic (Page 5) ---
  if (currentPage === 5) {
    const cards = document.querySelectorAll('.culture-card');

    if (e.deltaY > 0) { // Scrolling Down
      if (cultureExpandCount < cards.length) {
        if (!cultureScrolling) {
          expandCultureCard(cultureExpandCount, true);
        }
        return;
      }
    } else { // Scrolling Up
      if (cultureExpandCount > 0) {
        if (!cultureScrolling) {
          expandCultureCard(cultureExpandCount - 1, false);
        }
        return;
      }
    }
  }

  // --- Video Page Logic (Page 6) ---
  if (currentPage === 6) {
    if (e.deltaY > 0) {
      // Scroll Down -> Next Video
      if (videoCurrentIndex < videoData.length - 1) {
        setVideoIndex(videoCurrentIndex + 1);
        return; // Trap
      }
    } else {
      // Scroll Up -> Prev Video
      if (videoCurrentIndex > 0) {
        setVideoIndex(videoCurrentIndex - 1);
        return; // Trap
      }
      // If at index 0 and scroll up, we allow natural scroll to go back to page 5
    }
  }

  // --- Video Page Logic (Page 6) ---
  if (currentPage === 6) {
    if (e.deltaY > 0) {
      // Scroll Down -> Next Video
      if (videoCurrentIndex < videoData.length - 1) {
        setVideoIndex(videoCurrentIndex + 1);
        return; // Trap
      }
    } else {
      // Scroll Up -> Prev Video
      if (videoCurrentIndex > 0) {
        setVideoIndex(videoCurrentIndex - 1);
        return; // Trap
      } else {
        // Optionally allow release to Page 5?
        // The Culture page also traps.
        // If we are at index 0 and scroll up, we might want to go to Page 5.
        // Let's allow natural scroll to take over if we are at bounds.
      }
    }
  }

  // --- Free Scroll Logic ---
  // Just add delta to scrollX
  let nextScroll = scrollX + delta;

  // Bounds
  if (nextScroll < 0) nextScroll = 0;
  if (nextScroll > maxScroll) nextScroll = maxScroll;

  // Intro constraint
  if (hasPassedIntro && nextScroll < 100) nextScroll = 100; // Cannot scroll back to Page 0


  scrollX = nextScroll;
  scrollXRef = scrollX;
  updatePages();
  updateIndicators();
  updateNav();

  // --- Snap to Page on Stop ---
  clearTimeout(snapTimeout);
  snapTimeout = setTimeout(() => {
    snapToNearestPage();
  }, 100); // 100ms debounce
}

function expandCultureCard(index, expand) {
  cultureScrolling = true;
  const cards = document.querySelectorAll('.culture-card');
  const dots = document.querySelectorAll('.culture-dot');
  const hint = document.getElementById('cultureHint');

  if (expand) {
    cards[index].classList.add('expanded');
    dots[index].classList.add('active');
    cultureExpandCount++;
  } else {
    cards[index].classList.remove('expanded');
    dots[index].classList.remove('active');
    cultureExpandCount--;
  }

  if (cultureExpandCount === cards.length) {
    if (hint) hint.textContent = "Scroll to continue";
  } else {
    if (hint) hint.textContent = "Scroll to expand";
  }

  setTimeout(() => {
    cultureScrolling = false;
  }, 600); // Animation duration
}

function snapToNearestPage() {
  // If we are "trapped" in culture animation or logic, maybe don't snap?
  // Actually standard snap is fine.

  // Animate to nearest 100
  const targetPage = Math.round(scrollX / 100);
  const targetScroll = targetPage * 100;

  // We can use a simple JS animation loop for smooth snap
  animateScrollTo(targetScroll);
}

function animateScrollTo(target) {
  const start = scrollX;
  const dist = target - start;
  if (Math.abs(dist) < 0.5) return;

  const duration = 400;
  const startTime = performance.now();

  function step(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3); // Cubic ease out

    scrollX = start + (dist * ease);
    scrollXRef = scrollX;
    updatePages();
    updateIndicators();
    updateNav();

    if (progress < 1) {
      requestAnimationFrame(step);
    }
  }
  requestAnimationFrame(step);
}

function handleKeyDown(e) {
  if (scrollLocked) return; // Removed scrollXRef checks to simplify, relying on hasPassedIntro
  if (!hasPassedIntro) return; // Block keys during intro

  const minScroll = hasPassedIntro ? 100 : 0;

  if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
    e.preventDefault();
    const newScroll = Math.min(maxScroll, scrollXRef + 100);
    scrollXRef = newScroll;
    scrollX = newScroll;
    updatePages();
    updateIndicators();
    updateNav();
  } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
    e.preventDefault();
    const newScroll = Math.max(minScroll, scrollXRef - 100);
    scrollXRef = newScroll;
    scrollX = newScroll;
    updatePages();
    updateIndicators();
    updateNav();
  }
}

let touchStartX = 0;

function handleTouchStart(e) {
  touchStartX = e.touches[0].clientX;
}

// Touch Support with Snap
function handleTouchMove(e) {
  if (scrollLocked) return;
  if (!hasPassedIntro) return; // Block touch during intro
  const currentX = e.touches[0].clientX;
  const deltaX = (touchStartX - currentX) * 0.5; // Drag sensitivity

  // Update Scroll
  let nextScroll = scrollX + deltaX;
  if (nextScroll < 0) nextScroll = 0;
  if (nextScroll > maxScroll) nextScroll = maxScroll;
  if (hasPassedIntro && nextScroll < 100) nextScroll = 100;

  scrollX = nextScroll;
  scrollXRef = scrollX;
  touchStartX = currentX;

  updatePages();
  updateIndicators();
  updateNav();

  // We should snap when touch ENDS, not during move.
}

function handleTouchEnd(e) {
  snapToNearestPage();
}

// Update Listeners
function initEventListeners() {
  const flipbook = document.getElementById('flipbook');

  flipbook.addEventListener('wheel', handleWheel, { passive: false });
  flipbook.addEventListener('touchstart', handleTouchStart, { passive: true });
  flipbook.addEventListener('touchmove', handleTouchMove, { passive: true });
  flipbook.addEventListener('touchend', handleTouchEnd, { passive: true });
  window.addEventListener('keydown', handleKeyDown);

  // Side Indicators
  const indicators = document.querySelectorAll('.page-indicator');
  indicators.forEach((indicator) => {
    indicator.addEventListener('click', () => {
      const pageIndex = parseInt(indicator.dataset.page);
      goToPage(pageIndex);
    });
  });

  // Top Nav Items (Buttons & Links)
  const navItems = document.querySelectorAll('.top-nav-item');
  navItems.forEach((item) => {
    item.addEventListener('click', (e) => {
      // Only prevent default if it's NOT a link to another page
      // Check if it has a dataset.page (internal nav)
      if (item.dataset.page !== undefined) {
        const page = parseInt(item.dataset.page);
        if (!isNaN(page)) {
          goToPage(page);
        }
      }
      // If it's a link (href) without data-page, let it bubble (default behavior)
    });
  });
}


function initCursor() {
  const cursor = document.getElementById('cursor');

  document.addEventListener('mousemove', (e) => {
    targetCursorX = e.clientX;
    targetCursorY = e.clientY;
  });

  function animateCursor() {
    const damping = 0.15;
    cursorX += (targetCursorX - cursorX) * damping;
    cursorY += (targetCursorY - cursorY) * damping;

    cursor.style.left = cursorX + 'px';
    cursor.style.top = cursorY + 'px';

    requestAnimationFrame(animateCursor);
  }

  animateCursor();
}

// No second initEventListeners to avoid hoisting conflict


document.addEventListener('DOMContentLoaded', () => {
  initCursor();
  initIntroPage();
  initHeroLogo();
  initEventListeners();

  // Video Page Click Listeners
  const videoItems = document.querySelectorAll('.video-list-item');
  videoItems.forEach((item) => {
    item.addEventListener('click', () => {
      const index = parseInt(item.dataset.index);
      setVideoIndex(index);
    });
  });

  updatePages();
  updateIndicators();
  setVideoIndex(0); // Init Video Page
});


const stampContainer = document.getElementById('stampContainer');

let lastStampTime = 0;

window.addEventListener('mousemove', (e) => {
  const now = Date.now();

  // 너무 많이 찍히는 것 방지 (간격 조절)
  if (now - lastStampTime < 80) return;
  lastStampTime = now;

  const stamp = document.createElement('div');
  stamp.className = 'stamp';

  const stampImages = [
    'Group 2608253.png', 'a.png', 'baby_milo_3d_cutout 1.png', 'cat.png',
    'image 1216.png', 'image 1221.png', 'image 1224.png', 'image 1225.png',
    'image 1231.png', 'image 1235.png', 'image 1237.png', 'image 1238.png',
    'image 1242.png', 'image 1245.png', 'image 1247.png', 'image 1250.png',
    'image 1251.png', 'image 1252.png', 'image 1255.png', 'image 1258.png',
    'image 1259.png', 'image 1260.png', 'image 1261.png', 'image 1268.png',
    'image 1269.png', 'image 1270.png', 'image 1275.png', 'image 1281.png',
    'image 1282.png', 'image 1284.png', 'image 1286.png', 'image 1287.png',
    'image 1288.png', 'image 1293.png', 'image 1294.png', 'image 1295.png',
    'image 1297.png', 'image 1298.png', 'image 1299.png',
    'vivienne_westwood_cutout_keep_black 1.png', 'vogue_metal_LAST 1.png',
    'vogue_metal_VER2 1.png', '스크린샷 2026-01-12 오후 11.59.16 1.png'
  ];

  const img = document.createElement('img');
  const randomImage = stampImages[Math.floor(Math.random() * stampImages.length)];
  img.src = `images/${randomImage}`;
  stamp.appendChild(img);

  // 랜덤 회전 & 스케일
  const rotation = Math.random() * 60 - 30;
  const scale = 0.8 + Math.random() * 0.6;

  stamp.style.setProperty('--rotation', `${rotation}deg`);
  stamp.style.setProperty('--scale', scale);

  stamp.style.left = `${e.clientX}px`;
  stamp.style.top = `${e.clientY}px`;

  stampContainer.appendChild(stamp);

  // 일정 시간 후 제거 (DOM 정리)
  setTimeout(() => {
    stamp.remove();
  }, 2000);
});
