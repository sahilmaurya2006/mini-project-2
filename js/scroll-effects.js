/**
 * REPZONE — Premium Gym Management System
 * Scroll-Controlled Bicep Curl Kinetic Engine (js/scroll-effects.js)
 * Implements smooth canvas rendering, sub-frame interpolation, camera zoom/pan,
 * requestAnimationFrame scheduling, and dynamic HUD indicators.
 */

(function () {
  'use strict';

  // Frame sequence configuration
  const FRAME_PATHS = [
    'assets/athlete-frames/frame_01.jpg',
    'assets/athlete-frames/frame_02.jpg',
    'assets/athlete-frames/frame_03.jpg',
    'assets/athlete-frames/frame_04.jpg'
  ];

  const loadedImages = [];
  let isLoaded = false;
  let targetProgress = 0;
  let currentProgress = 0;
  let animationFrameId = null;

  // DOM Elements
  const trackElement = document.getElementById('curl-track');
  const canvas = document.getElementById('curl-canvas');
  const ctx = canvas ? canvas.getContext('2d') : null;
  const hudStage = document.getElementById('hud-stage-name');
  const hudAngle = document.getElementById('hud-angle-val');
  const hudProgress = document.getElementById('hud-progress-val');
  const timelineFill = document.getElementById('timeline-fill');
  const cp1 = document.getElementById('cp-1');
  const cp2 = document.getElementById('cp-2');
  const cp3 = document.getElementById('cp-3');
  const fallbackBox = document.getElementById('curl-fallback');
  const siteHeader = document.getElementById('site-header');

  /**
   * Preload Image Sequence
   */
  function preloadImages() {
    let loadedCount = 0;
    const totalFrames = FRAME_PATHS.length;

    FRAME_PATHS.forEach((path, idx) => {
      const img = new Image();
      img.src = path;
      img.onload = () => {
        loadedCount++;
        loadedImages[idx] = img;
        if (loadedCount === totalFrames) {
          isLoaded = true;
          if (fallbackBox) fallbackBox.style.display = 'none';
          renderCanvas();
        }
      };
      img.onerror = () => {
        console.warn(`REPZONE: Frame asset not found at "${path}". Showing documented placeholder.`);
        if (fallbackBox) fallbackBox.style.display = 'flex';
      };
    });
  }

  /**
   * Resize Canvas for High-DPI screens
   */
  function resizeCanvas() {
    if (!canvas || !canvas.parentElement) return;
    const rect = canvas.parentElement.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    if (ctx) {
      ctx.scale(dpr, dpr);
    }
    renderCanvas();
  }

  /**
   * Compute normalized scroll progress within the sticky track [0, 1]
   */
  function updateScrollProgress() {
    if (!trackElement) return;

    const rect = trackElement.getBoundingClientRect();
    const windowH = window.innerHeight;
    const totalScrollableDistance = rect.height - windowH;

    if (totalScrollableDistance <= 0) {
      targetProgress = 0;
      return;
    }

    // Progress = distance scrolled past the top of the track
    const scrolledPastTop = -rect.top;
    const rawProgress = scrolledPastTop / totalScrollableDistance;

    // Clamp strictly between 0 and 1
    targetProgress = Math.max(0, Math.min(1, rawProgress));
  }

  /**
   * Draw fitted image with zoom and pan transforms
   */
  function drawFittedImage(image, alpha = 1, scale = 1, panY = 0) {
    if (!ctx || !canvas) return;

    const canvasW = canvas.parentElement.clientWidth;
    const canvasH = canvas.parentElement.clientHeight;

    const imgW = image.naturalWidth || image.width;
    const imgH = image.naturalHeight || image.height;
    if (!imgW || !imgH) return;

    // Aspect ratio calculation (contain style with minimal edge cropping)
    const scaleFactor = Math.max(canvasW / imgW, canvasH / imgH);
    const renderW = imgW * scaleFactor * scale;
    const renderH = imgH * scaleFactor * scale;

    const offsetX = (canvasW - renderW) / 2;
    const offsetY = (canvasH - renderH) / 2 + panY;

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.drawImage(image, offsetX, offsetY, renderW, renderH);
    ctx.restore();
  }

  /**
   * Render Canvas Frame with sub-frame cross-fading & camera depth
   */
  function renderCanvas() {
    if (!ctx || !canvas || !isLoaded || loadedImages.length === 0) return;

    const canvasW = canvas.parentElement.clientWidth;
    const canvasH = canvas.parentElement.clientHeight;

    // Clear background with studio limestone tone #EFECE3
    ctx.fillStyle = '#EFECE3';
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Subtle camera zoom & vertical translation
    const cameraScale = 1.0 + currentProgress * 0.045;
    const cameraPanY = (currentProgress - 0.5) * -10;

    // Map progress to frame index & fractional blend
    const totalFrames = loadedImages.length;
    const virtualIndex = currentProgress * (totalFrames - 1);
    const baseIndex = Math.floor(virtualIndex);
    const nextIndex = Math.min(baseIndex + 1, totalFrames - 1);
    const blendFactor = virtualIndex - baseIndex;

    const baseImage = loadedImages[baseIndex];
    const nextImage = loadedImages[nextIndex];

    if (baseImage && baseImage.complete) {
      drawFittedImage(baseImage, 1.0, cameraScale, cameraPanY);
    }

    if (nextImage && nextImage.complete && nextIndex !== baseIndex && blendFactor > 0.001) {
      drawFittedImage(nextImage, blendFactor, cameraScale, cameraPanY);
    }

    updateHudAndTimeline(currentProgress);
  }

  /**
   * Update HUD metrics, joint angles, and timeline status
   */
  function updateHudAndTimeline(p) {
    // 1. Rep percentage
    const pct = Math.round(p * 100);
    if (hudProgress) hudProgress.textContent = `${pct}%`;

    // 2. Elbow flexion angle (starts at 180deg straight down, finishes around 45deg peak contraction)
    const angle = Math.round(180 - p * 135);
    if (hudAngle) hudAngle.textContent = `${angle}°`;

    // 3. Stage title & checkpoint indicators
    if (p < 0.3) {
      if (hudStage) hudStage.textContent = 'Phase 01: Setup & Tension';
      if (cp1) cp1.className = 'checkpoint active';
      if (cp2) cp2.className = 'checkpoint';
      if (cp3) cp3.className = 'checkpoint';
    } else if (p < 0.72) {
      if (hudStage) hudStage.textContent = 'Phase 02: Dynamic Flexion';
      if (cp1) cp1.className = 'checkpoint';
      if (cp2) cp2.className = 'checkpoint active';
      if (cp3) cp3.className = 'checkpoint';
    } else {
      if (hudStage) hudStage.textContent = 'Phase 03: Peak Contraction';
      if (cp1) cp1.className = 'checkpoint';
      if (cp2) cp2.className = 'checkpoint';
      if (cp3) cp3.className = 'checkpoint active';
    }

    // 4. Timeline bar
    if (timelineFill) {
      timelineFill.style.width = `${pct}%`;
    }
  }

  /**
   * Animation Loop with Lerp Smoothing
   */
  function loop() {
    updateScrollProgress();

    // Lerp progress for ultra-fluid response
    const diff = targetProgress - currentProgress;
    if (Math.abs(diff) > 0.0005) {
      currentProgress += diff * 0.14;
      renderCanvas();
    }

    // Navbar scroll shadow
    if (siteHeader) {
      if (window.scrollY > 40) {
        siteHeader.style.boxShadow = '0 4px 20px rgba(20, 34, 26, 0.06)';
      } else {
        siteHeader.style.boxShadow = 'none';
      }
    }

    animationFrameId = requestAnimationFrame(loop);
  }

  /**
   * Initialization
   */
  function init() {
    preloadImages();
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas, { passive: true });
    window.addEventListener('orientationchange', () => setTimeout(resizeCanvas, 200), { passive: true });
    window.addEventListener('scroll', updateScrollProgress, { passive: true });
    window.addEventListener('touchmove', updateScrollProgress, { passive: true });

    // Start RAF loop
    animationFrameId = requestAnimationFrame(loop);
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
