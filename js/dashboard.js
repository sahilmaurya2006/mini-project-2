/**
 * REPZONE — Premium Gym Management System
 * Dashboard KPI Metrics & SVG Attendance Chart Engine (js/dashboard.js)
 * Implements real-time stats calculation and a pure SVG weekly attendance chart.
 */

(function () {
  'use strict';

  /**
   * Render 4 KPI Stat Cards
   */
  function renderMetrics() {
    const state = window.REPZONE.state;
    if (!state || !state.members) return;

    const total = state.members.length;
    let active = 0;
    let expiring = 0;

    state.members.forEach(member => {
      const status = window.REPZONE.getMemberStatus(member.expiryDate);
      if (status === 'active') active++;
      if (status === 'expiring') expiring++;
    });

    const todayAttendanceCount = state.todayAttendance ? state.todayAttendance.length : 0;
    const activeRate = total > 0 ? Math.round((active / total) * 100) : 0;

    // Update DOM
    const elTotal = document.getElementById('stat-total-members');
    const elActive = document.getElementById('stat-active-members');
    const elActiveRate = document.getElementById('stat-active-rate');
    const elToday = document.getElementById('stat-today-attendance');
    const elExpiring = document.getElementById('stat-expiring-members');

    if (elTotal) elTotal.textContent = total;
    if (elActive) elActive.textContent = active;
    if (elActiveRate) elActiveRate.textContent = `${activeRate}% active roster`;
    if (elToday) elToday.textContent = todayAttendanceCount;
    if (elExpiring) elExpiring.textContent = expiring;
  }

  /**
   * Render Interactive Weekly Attendance SVG Chart
   */
  function renderWeeklyChart() {
    const svg = document.getElementById('weekly-svg-chart');
    const tooltip = document.getElementById('chart-tooltip');
    const state = window.REPZONE.state;
    if (!svg || !state || !state.weeklyAttendance) return;

    const data = state.weeklyAttendance;
    const width = 650;
    const height = 240;
    const padding = { top: 28, right: 30, bottom: 42, left: 45 };

    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    // Synchronize today's day count with live todayAttendance count
    const todayCount = state.todayAttendance ? state.todayAttendance.length : 0;
    if (data.length > 0) {
      // Last item in weeklyAttendance is today
      data[data.length - 1].count = Math.max(data[data.length - 1].count, todayCount);
    }

    const counts = data.map(d => d.count);
    const maxVal = Math.max(...counts, 40);
    const niceMax = Math.ceil(maxVal / 10) * 10;

    // Clear SVG contents
    svg.innerHTML = '';

    // Draw horizontal grid lines
    const gridSteps = 4;
    for (let i = 0; i <= gridSteps; i++) {
      const val = Math.round((niceMax / gridSteps) * i);
      const y = padding.top + chartH - (val / niceMax) * chartH;

      // Line
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', padding.left);
      line.setAttribute('y1', y);
      line.setAttribute('x2', width - padding.right);
      line.setAttribute('y2', y);
      line.setAttribute('stroke', '#E2DDD1');
      line.setAttribute('stroke-dasharray', i === 0 ? 'none' : '3 3');
      line.setAttribute('stroke-width', '1');
      svg.appendChild(line);

      // Y-axis label
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', padding.left - 12);
      text.setAttribute('y', y + 4);
      text.setAttribute('text-anchor', 'end');
      text.setAttribute('font-size', '11');
      text.setAttribute('fill', '#87938A');
      text.setAttribute('font-family', 'var(--font-sans)');
      text.textContent = val;
      svg.appendChild(text);
    }

    // Bar dimensions
    const barCount = data.length;
    const slotW = chartW / barCount;
    const barW = Math.min(36, slotW * 0.55);

    // Points for connecting trendline
    const trendPoints = [];

    data.forEach((d, i) => {
      const xCenter = padding.left + i * slotW + slotW / 2;
      const barH = (d.count / niceMax) * chartH;
      const barY = padding.top + chartH - barH;
      const barX = xCenter - barW / 2;

      trendPoints.push({ x: xCenter, y: barY });

      // Bar rect
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', barX);
      rect.setAttribute('y', barY);
      rect.setAttribute('width', barW);
      rect.setAttribute('height', Math.max(2, barH));
      rect.setAttribute('rx', '4');
      rect.setAttribute('ry', '4');
      // Today gets slightly accented fill
      const isToday = i === barCount - 1;
      rect.setAttribute('fill', isToday ? '#5E7153' : '#8A9B84');
      rect.style.transition = 'all 0.2s ease';
      rect.style.cursor = 'pointer';

      // Bar hover & touch tooltip events
      const showTooltip = (clientX, clientY) => {
        rect.setAttribute('fill', '#14221A');
        if (tooltip) {
          tooltip.innerHTML = `<strong>${d.day} (${d.fullDate})</strong>: ${d.count} check-ins`;
          tooltip.style.opacity = '1';
          const containerRect = svg.parentElement.getBoundingClientRect();
          const posX = clientX - containerRect.left;
          const posY = clientY - containerRect.top;
          tooltip.style.left = `${posX}px`;
          tooltip.style.top = `${posY - 14}px`;
        }
      };

      const hideTooltip = () => {
        rect.setAttribute('fill', isToday ? '#5E7153' : '#8A9B84');
        if (tooltip) tooltip.style.opacity = '0';
      };

      rect.addEventListener('mouseenter', (e) => showTooltip(e.clientX, e.clientY));
      rect.addEventListener('mousemove', (e) => showTooltip(e.clientX, e.clientY));
      rect.addEventListener('mouseleave', hideTooltip);

      // Touch events for mobile phones
      rect.addEventListener('touchstart', (e) => {
        if (e.touches && e.touches[0]) {
          showTooltip(e.touches[0].clientX, e.touches[0].clientY);
        }
      }, { passive: true });
      rect.addEventListener('touchend', () => {
        setTimeout(hideTooltip, 2000);
      });

      svg.appendChild(rect);

      // X-axis Day label
      const dayLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      dayLabel.setAttribute('x', xCenter);
      dayLabel.setAttribute('y', height - padding.bottom + 20);
      dayLabel.setAttribute('text-anchor', 'middle');
      dayLabel.setAttribute('font-size', '12');
      dayLabel.setAttribute('font-weight', isToday ? '600' : '400');
      dayLabel.setAttribute('fill', isToday ? '#14221A' : '#566459');
      dayLabel.setAttribute('font-family', 'var(--font-sans)');
      dayLabel.textContent = d.day;
      svg.appendChild(dayLabel);
    });

    // Trendline overlay
    if (trendPoints.length > 1) {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      let dStr = `M ${trendPoints[0].x} ${trendPoints[0].y}`;
      for (let i = 1; i < trendPoints.length; i++) {
        const prev = trendPoints[i - 1];
        const curr = trendPoints[i];
        const cx = (prev.x + curr.x) / 2;
        dStr += ` C ${cx} ${prev.y}, ${cx} ${curr.y}, ${curr.x} ${curr.y}`;
      }
      path.setAttribute('d', dStr);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', '#14221A');
      path.setAttribute('stroke-width', '1.5');
      path.setAttribute('opacity', '0.45');
      svg.appendChild(path);

      // Dots on trendline
      trendPoints.forEach(pt => {
        const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        dot.setAttribute('cx', pt.x);
        dot.setAttribute('cy', pt.y);
        dot.setAttribute('r', '3');
        dot.setAttribute('fill', '#FFFFFF');
        dot.setAttribute('stroke', '#14221A');
        dot.setAttribute('stroke-width', '1.5');
        svg.appendChild(dot);
      });
    }

    // Update Summary Stats below chart
    const totalCheckins = counts.reduce((acc, c) => acc + c, 0);
    const avgCheckins = Math.round(totalCheckins / counts.length);
    let peakCount = -1;
    let peakDayName = '';
    data.forEach(d => {
      if (d.count > peakCount) {
        peakCount = d.count;
        peakDayName = `${d.day} (${d.count})`;
      }
    });

    const elTotal = document.getElementById('chart-total-count');
    const elAvg = document.getElementById('chart-avg-count');
    const elPeak = document.getElementById('chart-peak-day');

    if (elTotal) elTotal.textContent = totalCheckins;
    if (elAvg) elAvg.textContent = `${avgCheckins}/day`;
    if (elPeak) elPeak.textContent = peakDayName;
  }

  /**
   * Render Live Studio Capacity & Flow Meter
   */
  function renderStudioCapacity() {
    const state = window.REPZONE.state;
    if (!state) return;

    const maxCapacity = 35;
    // Current floor occupants derived realistically from today's active visits
    const todayCount = state.todayAttendance ? state.todayAttendance.length : 0;
    // Estimated active athletes currently on floor
    const currentOccupants = Math.min(Math.max(todayCount, 4), maxCapacity);
    const percent = Math.round((currentOccupants / maxCapacity) * 100);

    const elNum = document.getElementById('capacity-current-num');
    const elPct = document.getElementById('capacity-percent');
    const elBar = document.getElementById('capacity-fill-bar');
    const elStatusText = document.getElementById('capacity-status-text');
    const elStatusPill = document.getElementById('capacity-status-pill');

    if (elNum) elNum.textContent = currentOccupants;
    if (elPct) elPct.textContent = `${percent}% Occupancy`;
    if (elBar) elBar.style.width = `${percent}%`;

    if (elStatusText && elStatusPill) {
      if (percent < 50) {
        elStatusText.textContent = 'Optimal Flow & Space';
        elStatusPill.className = 'status-pill status-active';
      } else if (percent < 80) {
        elStatusText.textContent = 'Moderate Activity';
        elStatusPill.className = 'status-pill status-active';
      } else {
        elStatusText.textContent = 'High Floor Density';
        elStatusPill.className = 'status-pill status-expiring';
      }
    }
  }

  /**
   * Render Projected MRR & Membership Tier Distribution
   */
  function renderRevenueAndTiers() {
    const state = window.REPZONE.state;
    if (!state || !state.members) return;

    let essentialCount = 0;
    let perfCount = 0;
    let unlimitedCount = 0;

    state.members.forEach(m => {
      const status = window.REPZONE.getMemberStatus(m.expiryDate);
      if (status !== 'expired') {
        if (m.plan === 'Essential') essentialCount++;
        else if (m.plan === 'Performance') perfCount++;
        else if (m.plan === 'Unlimited') unlimitedCount++;
      }
    });

    const activeTotal = essentialCount + perfCount + unlimitedCount;
    const mrr = (essentialCount * 120) + (perfCount * 220) + (unlimitedCount * 350);

    const elMrr = document.getElementById('stat-mrr-val');
    if (elMrr) {
      elMrr.textContent = `$${mrr.toLocaleString()}`;
    }

    // Update Segmented Bar Widths
    const elSegEss = document.getElementById('seg-essential');
    const elSegPerf = document.getElementById('seg-performance');
    const elSegUnl = document.getElementById('seg-unlimited');

    if (activeTotal > 0) {
      const essPct = Math.round((essentialCount / activeTotal) * 100);
      const perfPct = Math.round((perfCount / activeTotal) * 100);
      const unlPct = 100 - essPct - perfPct;

      if (elSegEss) elSegEss.style.width = `${essPct}%`;
      if (elSegPerf) elSegPerf.style.width = `${perfPct}%`;
      if (elSegUnl) elSegUnl.style.width = `${unlPct}%`;
    }

    // Update Legend stats
    const elLegEss = document.getElementById('legend-essential-stats');
    const elLegPerf = document.getElementById('legend-performance-stats');
    const elLegUnl = document.getElementById('legend-unlimited-stats');

    if (elLegEss) elLegEss.textContent = `${essentialCount} athletes &bull; $${(essentialCount * 120).toLocaleString()}/mo`;
    if (elLegPerf) elLegPerf.textContent = `${perfCount} athletes &bull; $${(perfCount * 220).toLocaleString()}/mo`;
    if (elLegUnl) elLegUnl.textContent = `${unlimitedCount} athletes &bull; $${(unlimitedCount * 350).toLocaleString()}/mo`;
  }

  /**
   * Guided Masterclasses & Kinetic Sessions Data & Booking
   */
  const DEFAULT_SESSIONS = [
    {
      id: 'sess-1',
      time: '07:30 AM',
      title: 'Neuromuscular Flow & Mobility',
      coach: 'Coach Marcus Thorne',
      booked: 8,
      max: 10
    },
    {
      id: 'sess-2',
      time: '10:00 AM',
      title: 'Biomechanical Bicep & Arm Mechanics',
      coach: 'Coach Elena Rostova',
      booked: 6,
      max: 8
    },
    {
      id: 'sess-3',
      time: '05:30 PM',
      title: 'Eccentric Hypertrophy & Pulling',
      coach: 'Coach Julian Mercer',
      booked: 10,
      max: 10
    },
    {
      id: 'sess-4',
      time: '07:00 PM',
      title: 'Contrast Therapy & Nervous Reset',
      coach: 'Coach Sophia Lindqvist',
      booked: 7,
      max: 12
    }
  ];

  function getSessions() {
    try {
      const stored = localStorage.getItem('repzone_sessions_v1');
      return stored ? JSON.parse(stored) : DEFAULT_SESSIONS;
    } catch (e) {
      return DEFAULT_SESSIONS;
    }
  }

  function saveSessions(sessions) {
    try {
      localStorage.setItem('repzone_sessions_v1', JSON.stringify(sessions));
    } catch (e) {
      console.warn('LocalStorage error on sessions:', e);
    }
  }

  function renderGuidedSessions() {
    const container = document.getElementById('sessions-container');
    if (!container) return;

    const sessions = getSessions();
    container.innerHTML = '';

    sessions.forEach(sess => {
      const card = document.createElement('div');
      card.className = 'session-card';
      const isFull = sess.booked >= sess.max;

      card.innerHTML = `
        <div>
          <span class="session-time-tag">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            ${sess.time}
          </span>
          <h4 class="session-title">${sess.title}</h4>
          <span class="session-coach">${sess.coach}</span>
        </div>
        <div class="session-card-footer">
          <span class="session-occupancy">${sess.booked} / ${sess.max} Spots</span>
          <button type="button" class="session-reserve-btn" data-id="${sess.id}" ${isFull ? 'disabled' : ''}>
            ${isFull ? 'Session Full' : 'Reserve Spot'}
          </button>
        </div>
      `;

      container.appendChild(card);
    });

    // Attach click listeners to reserve buttons
    container.querySelectorAll('.session-reserve-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        reserveSessionSpot(id);
      });
    });
  }

  function reserveSessionSpot(sessionId) {
    const sessions = getSessions();
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    if (session.booked < session.max) {
      session.booked++;
      saveSessions(sessions);
      window.REPZONE.showToast(`Spot reserved: ${session.title}`, 'success');
      renderGuidedSessions();
    } else {
      window.REPZONE.showToast('This session has reached maximum capacity.', 'warning');
    }
  }

  /**
   * Global refresh hook
   */
  window.REPZONE.refreshDashboard = function () {
    renderMetrics();
    renderWeeklyChart();
    renderStudioCapacity();
    renderRevenueAndTiers();
    renderGuidedSessions();
  };

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.REPZONE.refreshDashboard();
    });
  } else {
    window.REPZONE.refreshDashboard();
  }
})();
