window.onload = function () {
  Particles.init({
    selector: ".background"
  });
  
  // Initialize falling stars on canvas
  initFallingStars();
  
  if($(window).scrollTop() > 20){
    nav.classList.add("sticky");
    scrollBtn.style.display = "block";
  }else{
    nav.classList.remove("sticky");
    scrollBtn.style.display = "none";
  }
};

// Falling Meteors Animation on Canvas
function initFallingStars() {
  const canvas = document.querySelector(".background");
  if (!canvas) return;
  
  const ctx = canvas.getContext("2d");
  const meteors = [];
  // --- Galaxy background simulation state ---
  // Offscreen starfield for performance
  const starCanvas = document.createElement('canvas');
  const starCtx = starCanvas.getContext('2d');
  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // resize starfield buffer
    starCanvas.width = canvas.width;
    starCanvas.height = canvas.height;
    starCanvas.style.width = canvas.style.width;
    starCanvas.style.height = canvas.style.height;
    renderStarfield();
  }
  resizeCanvas();

  // Create static starfield (many tiny stars) with variable brightness
  function renderStarfield() {
    const w = starCanvas.width;
    const h = starCanvas.height;
    starCtx.clearRect(0, 0, w, h);
    const stars = Math.floor((w * h) / 6000); // density scaled by area
    for (let i = 0; i < stars; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const r = Math.random() * 1.2;
      const alpha = 0.25 + Math.random() * 0.75;
      starCtx.beginPath();
      starCtx.fillStyle = `rgba(255,255,255,${alpha})`;
      starCtx.arc(x, y, r, 0, Math.PI * 2);
      starCtx.fill();
    }
  }

  // Nebula/galaxy blobs
  const nebulae = [];
  function createNebula() {
    const w = canvas.width;
    const h = canvas.height;
    const radius = 200 + Math.random() * 800;
    const x = Math.random() * w;
    const y = Math.random() * h;
    const hue = 220 + Math.random() * 120; // bluish to magenta
    const sat = 50 + Math.random() * 40;
    const light = 8 + Math.random() * 30;
    return {
      x, y, radius, hue, sat, light,
      vx: (Math.random() - 0.5) * 0.05, // very slow drift
      vy: (Math.random() - 0.5) * 0.05,
      alpha: 0.12 + Math.random() * 0.25
    };
  }
  function initNebulae() {
    nebulae.length = 0;
    const count = 4 + Math.floor(Math.random() * 4);
    for (let i = 0; i < count; i++) nebulae.push(createNebula());
  }
  initNebulae();

  // Cursor-following meteor removed per user request (mouse-follow disabled)
  
  // Click / tap -> spawn meteor explosion fragments
  const explosions = [];
  function spawnMeteorExplosion(x, y, count = 100) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      // fragments travel fairly far
      const speed = 2 + Math.random() * 8; // 2 - 10 px/frame
      const life = 30 + Math.floor(Math.random() * 50); // shorter duration
      explosions.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 0.35 + Math.random() * 0.65, // thinner meteor fragments
        tailLength: 60 + Math.random() * 100,
        life: life,
        maxLife: life,
        opacity: 0.95,
        trailPositions: []
      });
    }
  }

  window.addEventListener('click', (e) => {
    spawnMeteorExplosion(e.clientX, e.clientY, 120);
  });
  window.addEventListener('touchstart', (e) => {
    if (e.touches && e.touches[0]) {
      spawnMeteorExplosion(e.touches[0].clientX, e.touches[0].clientY, 90);
      e.preventDefault();
    }
  }, { passive: false });
  
  function getMeteorCount() {
    const width = window.innerWidth;
    if (width < 480) return 8;
    if (width < 768) return 12;
    if (width < 1024) return 15;
    return 20;
  }
  
  function createMeteor() {
    const size = Math.random();
    const speed = Math.random() * 3 + 4; // 4-7 pixels per frame (slower)
    
    return {
      x: Math.random() * canvas.width * 1.2 + canvas.width * 0.3, // Start from right side
      y: Math.random() * -200 - 100, // Start above viewport
      size: size < 0.4 ? 0.6 : size > 0.7 ? 1.0 : 0.8, // Narrow heads
      speed: speed,
      vx: -speed * 0.6, // Horizontal movement
      vy: speed * 0.7, // More vertical movement (increased falling angle)
      tailLength: Math.random() * 150 + 200, // 200-350 pixels much longer tail
      opacity: 0.9,
      trailPositions: [],
      colorType: 0, // Golden only
      isDying: false,
      fadeOutDuration: 20
    };
  }
  
  function initMeteors() {
    meteors.length = 0;
    const count = getMeteorCount();
    for (let i = 0; i < count; i++) {
      meteors.push(createMeteor());
    }
  }
  
  function updateMeteors() {
    for (let i = meteors.length - 1; i >= 0; i--) {
      const meteor = meteors[i];
      
      // Store current position in trail
      meteor.trailPositions.push({
        x: meteor.x,
        y: meteor.y,
        opacity: meteor.opacity
      });
      
      // Keep only the last N positions for the tail
      const maxTrailLength = Math.floor(meteor.tailLength / (Math.sqrt(meteor.vx * meteor.vx + meteor.vy * meteor.vy) || 1));
      if (meteor.trailPositions.length > maxTrailLength) {
        meteor.trailPositions.shift();
      }
      
      // Move meteor
      meteor.x += meteor.vx;
      meteor.y += meteor.vy;
      
      // Check if meteor is off screen
      if (meteor.y > canvas.height + 100 || meteor.x < -100) {
        meteors[i] = createMeteor();
      }
    }

    // (mouse-follow removed) no cursor trail to update

    // Update explosion fragments
    for (let p = explosions.length - 1; p >= 0; p--) {
      const frag = explosions[p];
      // record trail
      frag.trailPositions.push({ x: frag.x, y: frag.y, opacity: frag.opacity });
      const maxTrail = Math.floor(frag.tailLength / (Math.sqrt(frag.vx * frag.vx + frag.vy * frag.vy) || 1));
      if (frag.trailPositions.length > maxTrail) frag.trailPositions.shift();

      frag.x += frag.vx;
      frag.y += frag.vy;
      // slight drag
      frag.vx *= 0.993;
      frag.vy *= 0.993;
      frag.life -= 1;
      frag.opacity = Math.max(0, frag.life / frag.maxLife);
      if (frag.life <= 0) explosions.splice(p, 1);
    }
  }
  
  function drawGalaxyBackground(now) {
    // update nebula positions slowly
    for (let n of nebulae) {
      n.x += n.vx * (now ? (now / 1000) : 0.016);
      n.y += n.vy * (now ? (now / 1000) : 0.016);
      // wrap
      if (n.x < -n.radius) n.x = canvas.width + n.radius;
      if (n.x > canvas.width + n.radius) n.x = -n.radius;
      if (n.y < -n.radius) n.y = canvas.height + n.radius;
      if (n.y > canvas.height + n.radius) n.y = -n.radius;
    }

    // base fill (very dark)
    ctx.fillStyle = '#03020a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // draw nebulae using additive blending
    ctx.globalCompositeOperation = 'lighter';
    for (let n of nebulae) {
      const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.radius);
      const hue = Math.floor(n.hue);
      const inner = `hsla(${hue}, ${n.sat}%, ${Math.min(n.light + 30, 80)}%, ${n.alpha})`;
      const mid = `hsla(${hue + 20}, ${Math.min(n.sat + 10, 100)}%, ${Math.min(n.light + 10, 70)}%, ${n.alpha * 0.85})`;
      const outer = `hsla(${hue + 40}, ${Math.max(n.sat - 10, 30)}%, ${Math.max(n.light - 10, 2)}%, 0)`;
      g.addColorStop(0, inner);
      g.addColorStop(0.4, mid);
      g.addColorStop(1, outer);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // draw starfield on top (faint) with slight twinkle variation
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 0.9;
    // twinkle by shifting globalAlpha slightly
    const tw = 0.85 + Math.sin(now / 7000) * 0.08;
    ctx.globalAlpha = tw;
    ctx.drawImage(starCanvas, 0, 0);
    ctx.globalAlpha = 1;
  }

  function drawMeteors(timestamp) {
    const now = timestamp || performance.now();
    drawGalaxyBackground(now);

    // Draw meteors on top
    for (let meteor of meteors) {
      if (meteor.trailPositions.length > 1) {
        for (let j = 0; j < meteor.trailPositions.length - 1; j++) {
          const current = meteor.trailPositions[j];
          const next = meteor.trailPositions[j + 1];
          const tailFadeOpacity = (j / meteor.trailPositions.length) * meteor.opacity * 0.9;
          const gradient = ctx.createLinearGradient(current.x, current.y, next.x, next.y);
          const color1 = `rgba(255, 238, 172, ${tailFadeOpacity})`;
          const color2 = `rgba(255, 238, 172, 0)`;
          gradient.addColorStop(0, color1);
          gradient.addColorStop(1, color2);
          const partIndex = j / meteor.trailPositions.length;
          const drawProbability = 0.3 + (1 - partIndex) * 0.7;
          if (Math.random() > drawProbability) continue;
          ctx.strokeStyle = gradient;
          ctx.lineWidth = meteor.size * 0.6 + partIndex * meteor.size * 2.0;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.beginPath();
          ctx.moveTo(current.x, current.y);
          ctx.lineTo(next.x, next.y);
          ctx.stroke();
        }
      }

      // Draw meteor head (bright core) - larger/wider
      ctx.save();
      const headGradient = ctx.createRadialGradient(
        meteor.x, meteor.y, 0,
        meteor.x, meteor.y, meteor.size * 2.6
      );
      const headColor1 = `rgba(255, 250, 200, ${meteor.opacity})`;
      const headColor2 = `rgba(255, 238, 172, 0)`;
      const coreColor = `rgba(255, 244, 160, ${meteor.opacity})`;
      headGradient.addColorStop(0, headColor1);
      headGradient.addColorStop(1, headColor2);
      ctx.fillStyle = headGradient;
      ctx.beginPath();
      ctx.arc(meteor.x, meteor.y, meteor.size * 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = coreColor;
      ctx.beginPath();
      ctx.arc(meteor.x, meteor.y, meteor.size * 0.9, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Draw cursor-following meteor on top
    // Draw explosion fragments (meteors exploding)
    if (explosions.length) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let idx = 0; idx < explosions.length; idx++) {
        const f = explosions[idx];
        // draw tail
        if (f.trailPositions.length > 1) {
          for (let j = 0; j < f.trailPositions.length - 1; j++) {
            const cur = f.trailPositions[j];
            const next = f.trailPositions[j + 1];
            const tailFadeOpacity = (j / f.trailPositions.length) * f.opacity * 0.9;
            const grad = ctx.createLinearGradient(cur.x, cur.y, next.x, next.y);
            grad.addColorStop(0, `rgba(255,238,172,${tailFadeOpacity})`);
            grad.addColorStop(1, `rgba(255,238,172,0)`);
            ctx.strokeStyle = grad;
            ctx.lineWidth = Math.max(0.3, f.size * (0.3 + (j / f.trailPositions.length) * 0.7));
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(cur.x, cur.y);
            ctx.lineTo(next.x, next.y);
            ctx.stroke();
          }
        }
        // draw head
        const hg = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.size * 3.0);
        hg.addColorStop(0, `rgba(255,250,200,${f.opacity})`);
        hg.addColorStop(1, `rgba(255,238,172,0)`);
        ctx.fillStyle = hg;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.size * 3.0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(255,244,160,${f.opacity})`;
        ctx.beginPath();
        ctx.arc(f.x, f.y, Math.max(0.4, f.size * 0.5), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // cursor-follow removed: no cursor meteor rendering
  }
  
  function animate(timestamp) {
    updateMeteors();
    drawMeteors(timestamp || performance.now());
    requestAnimationFrame(animate);
  }
  
  // Handle window resize
  window.addEventListener("resize", () => {
    resizeCanvas();
    const newCount = getMeteorCount();
    if (newCount !== meteors.length) {
      if (newCount > meteors.length) {
        for (let i = meteors.length; i < newCount; i++) {
          meteors.push(createMeteor());
        }
      } else {
        meteors.splice(newCount);
      }
    }
  });
  
  initMeteors();
  animate();
}
var particles = Particles.init({
  selector: ".background",
  color: ["#faebd7", "white", "burlywood"],
  connectParticles: false,
  responsive: [
    {
      breakpoint: 768,
      options: {
        color: ["#faebd7", "white", "burlywood"],
        maxParticles: 43,
        connectParticles: false
      }
    }
  ]
});

$(window).scroll(function(e){
    parallax();
});

function parallax(){
    var scrolled = $(window).scrollTop();
    $('.home').css('top',-(scrolled*0.0315)+'rem');
    $('.home > .home-content').css('padding-top',(scrolled*0.05)+'rem');
    $('.home > .home-content').css('opacity',1-(scrolled*.00175));
};

// Sticky Navigation Menu Js

let nav = document.querySelector("nav");
let scrollBtn = document.querySelector(".scroll-button a");

let val;

window.onscroll = function() {
  if($(window).scrollTop() > 20){
    nav.classList.add("sticky");
    // scrollBtn.style.display = "block";
  }else{
    nav.classList.remove("sticky");
    // scrollBtn.style.display = "none";
  }
}

// Side Navigation Menu Js
let body = document.querySelector("body");
let navBar = document.querySelector(".navbar");
let menuBtn = document.querySelector(".menu-btn");
let cancelBtn = document.querySelector(".cancel-btn");

menuBtn.onclick = function() {
  navBar.classList.add("active");
  menuBtn.style.opacity = "0";
  menuBtn.style.pointerEvents = "none";
  // body.style.overflowX = "hidden";
  // scrollBtn.style.pointerEvents = "none";
}

cancelBtn.onclick = function() {
  navBar.classList.remove("active");
  menuBtn.style.opacity = "1";
  menuBtn.style.pointerEvents = "auto";
  // body.style.overflowX = "auto";
  // scrollBtn.style.pointerEvents = "auto";
}

// Side Navigation Bar Close While We click On Navigation Links

// let navLinks = document.querySelectorAll(".menu li a");
// for (var i = 0; i < navLinks.length; i++) {
//   navLinks[i].addEventListener("click" , function() {
//     navBar.classList.remove("active");
//     // menuBtn.style.opacity = "1";
//     // menuBtn.style.pointerEvents = "auto";
//   });
// }

// Image Lazy Loading
window.addEventListener("DOMContentLoaded", function() {
  var lazy = document.getElementsByClassName('lazy');
  initializeLoad(lazy);
});

function initializeLoad(imgs) {
  if (imgs.length > 0) {
    if ('IntersectionObserver' in window) {
      lazyLoad(imgs);
    } else {
      loadIntersection(imgs);
    }
  } else {
    return;
  }
}

function lazyLoad(lazy) {
  var options = {
    threshold: 0.8
  }

  var observer = new IntersectionObserver(function(entries, self) {
    for (var i = 0; i < entries.length; i++) {
      var entry = entries[i];
      if (entry.isIntersecting) {
        var src = entry.target.getAttribute('data-src');
        TweenMax.set(entry.target, {attr:{src:src}});
        TweenMax.fromTo(entry.target, 1, {css:{opacity:0, y:"-50px"}}, {css:{opacity:1, y:0}}, 1.5);
        self.unobserve(entry.target);
      }
    }
  }, options)
  for (var i = 0; i < lazy.length; i++) {
    var lazyItem = lazy[i];
    observer.observe(lazyItem);
  }
}

function loadIntersection(lazy) {
  var io = document.createElement('script');
  io.src = "https://polyfill.io/v3/polyfill.min.js?features=IntersectionObserver";
  document.head.appendChild(io);
  return io.onload = function() {
    lazyLoad(lazy);
  }
}

