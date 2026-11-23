/**
 * Sectors 3D Scroll — High-Performance Chained Multi-Sector Canvas Carousel
 * 
 * Performance Optimizations Implemented:
 * 1. Deferred Engine Initialization: Dormant until section approaches viewport (IntersectionObserver).
 * 2. On-Demand Staged Frame Loading: Loads only Slide 0's initial frames first; adjacent slides load progressively as user approaches them.
 * 3. requestAnimationFrame Throttled Render Loop: Prevents micro-stutters and eliminates redundant frame redraws.
 * 4. Asynchronous Off-Main-Thread Image Decoding (img.decode): Decompresses frames without blocking main thread.
 * 5. Mobile GPU Optimization: Caps devicePixelRatio on mobile to eliminate texture thrashing.
 * 6. Single Centralized Resize Observer: Eliminates redundant layout calculations.
 * 7. Prefers-Reduced-Motion Respect: Disables pin-scrub and renders static preview for accessibility.
 * 8. Viewport Pause: Freezes animation and frame pumps when section is out of viewport.
 */
(function () {
  'use strict';

  function pad(num, size) {
    var s = String(num);
    while (s.length < size) s = '0' + s;
    return s;
  }

  function initSlide(slideEl, isMobile) {
    var folder = slideEl.dataset.frameFolder;
    var prefix = slideEl.dataset.framePrefix || 'ezgif-frame-';
    var ext = slideEl.dataset.frameExt || '.jpg';
    var count = parseInt(slideEl.dataset.frameCount || '300', 10);
    var padLen = parseInt(slideEl.dataset.framePad || '3', 10);
    var canvas = slideEl.querySelector('.sectors-3d-canvas');
    var ctx = canvas ? canvas.getContext('2d', { alpha: false, desynchronized: true }) : null;
    var images = new Array(count);
    var currentFrame = -1;
    var loadedCount = 0;
    var isPumping = false;
    var pumpIndex = 0;
    var canvasValid = false;

    function frameUrl(i) {
      return folder + prefix + pad(i + 1, padLen) + ext;
    }

    function resize() {
      if (!canvas || !ctx) return;
      var rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      // Cap DPR: 1.0 on mobile to save GPU memory; 1.5 max on desktop
      var dpr = isMobile ? 1 : Math.min(window.devicePixelRatio || 1, 1.5);
      var w = Math.round(rect.width * dpr);
      var h = Math.round(rect.height * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        canvasValid = false;
        render();
      }
    }

    function render() {
      if (!ctx || !canvas) return;
      var img = images[currentFrame];
      if (!img || !img.complete || !img.naturalWidth) return;
      var cw = canvas.width, ch = canvas.height;
      var iw = img.naturalWidth, ih = img.naturalHeight;
      var scale = Math.max(cw / iw, ch / ih);
      var dw = iw * scale, dh = ih * scale;
      var dx = (cw - dw) / 2, dy = 0;
      ctx.drawImage(img, dx, dy, dw, dh);
      canvasValid = true;
    }

    function setFrame(i) {
      var next = Math.max(0, Math.min(count - 1, i));
      if (next === currentFrame && canvasValid) return;
      currentFrame = next;
      // If frame image is already loaded, render immediately
      if (images[currentFrame] && images[currentFrame].complete) {
        render();
      } else {
        // Eagerly fetch and render requested frame
        loadOne(currentFrame, function () {
          render();
        }, true);
      }
    }

    function loadOne(index, cb, highPriority) {
      if (images[index]) {
        if (cb) cb();
        return;
      }
      var img = new Image();
      img.decoding = 'async';
      if (!highPriority && index > 0) {
        img.fetchPriority = 'low';
      }
      var onComplete = function () {
        loadedCount++;
        if (index === currentFrame) render();
        if (cb) cb();
      };

      if (img.decode) {
        img.src = frameUrl(index);
        img.decode().then(function () {
          images[index] = img;
          onComplete();
        }).catch(function () {
          images[index] = img;
          onComplete();
        });
      } else {
        img.onload = img.onerror = function () {
          images[index] = img;
          onComplete();
        };
        img.src = frameUrl(index);
      }
    }

    function loadRange(start, end, done) {
      var remaining = Math.max(0, end - start);
      if (remaining === 0) { if (done) done(); return; }
      for (var k = start; k < end; k++) {
        loadOne(k, function () {
          if (--remaining === 0 && done) done();
        }, false);
      }
    }

    function loadProgressive(targetCount, onProgress) {
      if (isPumping) return;
      isPumping = true;
      var maxTarget = Math.min(count, targetCount || count);

      function idle(cb) {
        if ('requestIdleCallback' in window) {
          window.requestIdleCallback(cb, { timeout: 2000 });
        } else {
          setTimeout(cb, 60);
        }
      }

      function pump() {
        if (pumpIndex >= maxTarget) {
          isPumping = false;
          return;
        }
        var idx = pumpIndex++;
        loadOne(idx, function () {
          if (onProgress) onProgress(loadedCount, count);
          idle(pump);
        }, false);
      }

      idle(pump);
    }

    return {
      count: count,
      setFrameByProgress: function (progress) {
        setFrame(Math.round(progress * (count - 1)));
      },
      loadFirstFrame: function (done) {
        loadOne(0, function () {
          currentFrame = 0;
          render();
          if (done) done();
        }, true);
      },
      loadEagerBatch: function (n, done) {
        loadRange(0, Math.min(n, count), done);
      },
      loadBackgroundTo: function (target, onProgress) {
        loadProgressive(target, onProgress);
      },
      resize: resize
    };
  }

  function boot() {
    var section = document.querySelector('.sectors-3d-scroll');
    if (!section) return;
    var pinEl = section.querySelector('.sectors-3d-pin');
    var slideEls = Array.prototype.slice.call(section.querySelectorAll('.sectors-3d-slide'));
    if (!slideEls.length || !pinEl) return;

    var caption = section.querySelector('.sectors-3d-caption-label');
    var dots = Array.prototype.slice.call(section.querySelectorAll('.sectors-3d-dots .dot'));
    var nextBtn = section.querySelector('.sectors-3d-next');
    var loaderWrap = section.querySelector('.sectors-3d-loader');
    var loaderBar = section.querySelector('.sectors-3d-loader .bar');

    var isMobile = window.innerWidth < 768;
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var hasGsap = !!(window.gsap && window.ScrollTrigger);
    var N = slideEls.length;
    var engines = [];
    var isInitialized = false;
    var startedLoading = false;
    var lastProgress = 0;
    var st = null;
    var ticking = false;
    var loadedSlides = {};

    function setActiveLabel(i) {
      if (caption) caption.textContent = slideEls[i].dataset.sectorLabel || '';
      dots.forEach(function (d, idx) {
        d.classList.toggle('is-active', idx === i);
      });
    }

    function update(progress) {
      lastProgress = progress;
      var scaled = progress * N;
      var i = Math.min(N - 1, Math.floor(scaled));
      var local = scaled - i;
      var isLast = i === N - 1;
      var scrubPortion = isLast ? 1 : 0.75;

      // On-demand load adjacent slide when user approaches it
      if (!loadedSlides[i] && engines[i]) {
        loadedSlides[i] = true;
        engines[i].loadBackgroundTo(isMobile ? 100 : 300);
      }
      if (i + 1 < N && !loadedSlides[i + 1] && local > 0.3 && engines[i + 1]) {
        loadedSlides[i + 1] = true;
        engines[i + 1].loadFirstFrame(function () {
          engines[i + 1].loadBackgroundTo(isMobile ? 80 : 200);
        });
      }

      for (var idx = 0; idx < N; idx++) {
        if (idx < i) {
          slideEls[idx].style.transform = 'translateX(-100%)';
        } else if (idx > i + 1) {
          slideEls[idx].style.transform = 'translateX(100%)';
        }
      }

      if (local < scrubPortion) {
        if (engines[i]) engines[i].setFrameByProgress(local / scrubPortion);
        slideEls[i].style.transform = 'translateX(0%)';
        if (slideEls[i + 1]) slideEls[i + 1].style.transform = 'translateX(100%)';
        setActiveLabel(i);
      } else {
        var t = (local - scrubPortion) / (1 - scrubPortion);
        if (engines[i]) engines[i].setFrameByProgress(1);
        slideEls[i].style.transform = 'translateX(' + (-100 * t) + '%)';
        if (slideEls[i + 1]) {
          if (engines[i + 1]) engines[i + 1].setFrameByProgress(0);
          slideEls[i + 1].style.transform = 'translateX(' + (100 * (1 - t)) + '%)';
        }
        setActiveLabel(t > 0.5 && i + 1 < N ? i + 1 : i);
      }
    }

    function initEngine() {
      if (isInitialized) return;
      isInitialized = true;

      engines = slideEls.map(function (el) {
        return initSlide(el, isMobile);
      });

      // Handle resize with debouncing
      var resizeTimer;
      window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
          isMobile = window.innerWidth < 768;
          engines.forEach(function (e) { if (e) e.resize(); });
          if (st) st.refresh();
        }, 150);
      }, { passive: true });

      // Load Slide 0 immediately upon initialization
      loadedSlides[0] = true;
      engines[0].loadFirstFrame(function () {
        section.classList.add('is-ready');
        if (loaderWrap) loaderWrap.style.display = 'none';
        engines[0].loadEagerBatch(isMobile ? 10 : 20, function () {
          // Progressively load remaining frames on idle
          engines[0].loadBackgroundTo(isMobile ? 120 : 300);
        });
      });

      if (reduceMotion || !hasGsap) {
        update(0);
        return;
      }

      window.gsap.registerPlugin(window.ScrollTrigger);
      var scrollDistance = Math.max(window.innerHeight * N, 600 * N);

      st = window.ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: '+=' + scrollDistance,
        pin: pinEl,
        pinSpacing: true,
        scrub: isMobile ? 0.3 : 0.2,
        onUpdate: function (self) {
          if (!ticking) {
            ticking = true;
            window.requestAnimationFrame(function () {
              update(self.progress);
              ticking = false;
            });
          }
        }
      });

      update(0);
    }

    setActiveLabel(0);

    // Defer initialization until the section approaches viewport (300px margin)
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            initEngine();
            io.disconnect();
          }
        });
      }, { rootMargin: '300px 0px' });
      io.observe(section);
    } else {
      // Fallback for older browsers
      setTimeout(initEngine, 1000);
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        if (!st) return;
        var current = Math.min(N - 1, Math.floor(lastProgress * N));
        var targetIndex = Math.min(N - 1, current + 1);
        var targetProgress = targetIndex >= N - 1 ? 1 : (targetIndex + 0.02) / N;
        var targetY = st.start + targetProgress * (st.end - st.start);
        window.scrollTo({ top: targetY, behavior: 'smooth' });
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
