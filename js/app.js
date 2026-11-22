/**
 * REPZONE — Premium Gym Management System
 * Core Application Manager (js/app.js)
 * Handles LocalStorage persistence, seed data, view switching, toasts, and modals.
 */

// Global App Namespace
window.REPZONE = window.REPZONE || {};

(function () {
  'use strict';

  const STORAGE_KEY_MEMBERS = 'repzone_members_v1';
  const STORAGE_KEY_ATTENDANCE = 'repzone_attendance_v1';
  const STORAGE_KEY_WEEKLY = 'repzone_weekly_v1';

  // Seed Data: 9 authentic gym members
  const DEFAULT_MEMBERS = [
    {
      id: 'RZ-1001',
      firstName: 'Elena',
      lastName: 'Rostova',
      email: 'elena.rostova@atelier.io',
      phone: '+1 (555) 234-8901',
      plan: 'Performance',
      duration: 6,
      startDate: '2026-08-15',
      expiryDate: '2027-02-15',
      notes: 'Olympic weightlifting background; focuses on eccentric phases.',
      attendanceCount: 42
    },
    {
      id: 'RZ-1002',
      firstName: 'Julian',
      lastName: 'Mercer',
      email: 'j.mercer@kinetics.org',
      phone: '+1 (555) 872-3310',
      plan: 'Unlimited',
      duration: 12,
      startDate: '2026-03-01',
      expiryDate: '2027-03-01',
      notes: 'Private recovery suite booking; mobility coaching prioritized.',
      attendanceCount: 78
    },
    {
      id: 'RZ-1003',
      firstName: 'Aria',
      lastName: 'Chen',
      email: 'aria.chen@designstudio.co',
      phone: '+1 (555) 419-7723',
      plan: 'Essential',
      duration: 3,
      startDate: '2026-10-01',
      expiryDate: '2026-11-25', // Expiring in ~3 days relative to Nov 22, 2026
      notes: 'Early morning floor sessions; kettlebell flow preference.',
      attendanceCount: 19
    },
    {
      id: 'RZ-1004',
      firstName: 'Mateo',
      lastName: 'Silva',
      email: 'mateo.silva@archdesign.com',
      phone: '+1 (555) 902-6641',
      plan: 'Performance',
      duration: 3,
      startDate: '2026-09-10',
      expiryDate: '2026-11-28', // Expiring in ~6 days
      notes: 'Shoulder impingement history. Strict form adherence requested.',
      attendanceCount: 31
    },
    {
      id: 'RZ-1005',
      firstName: 'Sophia',
      lastName: 'Lindqvist',
      email: 's.lindqvist@nordiclaw.se',
      phone: '+1 (555) 334-1189',
      plan: 'Unlimited',
      duration: 6,
      startDate: '2026-06-20',
      expiryDate: '2026-12-20',
      notes: 'Cold plunge protocol user; bi-weekly kinetic assessment.',
      attendanceCount: 54
    },
    {
      id: 'RZ-1006',
      firstName: 'David',
      lastName: 'Kim',
      email: 'david.kim@quantlabs.io',
      phone: '+1 (555) 671-8890',
      plan: 'Essential',
      duration: 1,
      startDate: '2026-10-10',
      expiryDate: '2026-11-10', // Expired ~12 days ago
      notes: 'Renewal discussion pending travel schedule.',
      attendanceCount: 12
    },
    {
      id: 'RZ-1007',
      firstName: 'Claire',
      lastName: 'Vanderbilt',
      email: 'claire.v@heritage.org',
      phone: '+1 (555) 542-9904',
      plan: 'Performance',
      duration: 6,
      startDate: '2026-07-01',
      expiryDate: '2027-01-01',
      notes: 'Endurance runner; strength maintenance for hip stability.',
      attendanceCount: 37
    },
    {
      id: 'RZ-1008',
      firstName: 'Marcus',
      lastName: 'Thorne',
      email: 'm.thorne@vanguard.tech',
      phone: '+1 (555) 129-4475',
      plan: 'Unlimited',
      duration: 12,
      startDate: '2026-01-15',
      expiryDate: '2027-01-15',
      notes: 'Full concierge program. Biomechanical curl sequence enthusiast.',
      attendanceCount: 92
    },
    {
      id: 'RZ-1009',
      firstName: 'Kavita',
      lastName: 'Patel',
      email: 'kavita.patel@biopharma.org',
      phone: '+1 (555) 789-2234',
      plan: 'Essential',
      duration: 3,
      startDate: '2026-08-01',
      expiryDate: '2026-11-01', // Expired
      notes: 'Paused for overseas conference.',
      attendanceCount: 22
    }
  ];

  // Default Today's Attendance Seed (Initial Check-ins)
  const DEFAULT_ATTENDANCE = [
    {
      id: 'chk-1',
      memberId: 'RZ-1001',
      memberName: 'Elena Rostova',
      memberPlan: 'Performance',
      time: '07:15 AM',
      date: getTodayDateString()
    },
    {
      id: 'chk-2',
      memberId: 'RZ-1002',
      memberName: 'Julian Mercer',
      memberPlan: 'Unlimited',
      time: '08:40 AM',
      date: getTodayDateString()
    },
    {
      id: 'chk-3',
      memberId: 'RZ-1005',
      memberName: 'Sophia Lindqvist',
      memberPlan: 'Unlimited',
      time: '10:20 AM',
      date: getTodayDateString()
    },
    {
      id: 'chk-4',
      memberId: 'RZ-1008',
      memberName: 'Marcus Thorne',
      memberPlan: 'Unlimited',
      time: '01:15 PM',
      date: getTodayDateString()
    }
  ];

  // Default Weekly Attendance Breakdown (Past 7 days)
  const DEFAULT_WEEKLY = [
    { day: 'Mon', count: 28, fullDate: 'Nov 16' },
    { day: 'Tue', count: 34, fullDate: 'Nov 17' },
    { day: 'Wed', count: 42, fullDate: 'Nov 18' },
    { day: 'Thu', count: 39, fullDate: 'Nov 19' },
    { day: 'Fri', count: 46, fullDate: 'Nov 20' },
    { day: 'Sat', count: 33, fullDate: 'Nov 21' },
    { day: 'Sun', count: 18, fullDate: 'Nov 22' } // Today
  ];

  /**
   * Helper: returns YYYY-MM-DD for today
   */
  function getTodayDateString() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /**
   * Status Resolver: computes status string based on expiry date
   * - Active: expiry > 7 days from now
   * - Expiring: 0 <= expiry <= 7 days from now
   * - Expired: expiry < now
   */
  function getMemberStatus(expiryDateStr) {
    if (!expiryDateStr) return 'active';
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const [y, m, d] = expiryDateStr.split('-').map(Number);
    const expiry = new Date(y, m - 1, d);
    expiry.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'expired';
    if (diffDays <= 7) return 'expiring';
    return 'active';
  }

  /**
   * Expiry Calculator: given start date and duration months, returns YYYY-MM-DD
   */
  function calculateExpiryDate(startDateStr, durationMonths) {
    if (!startDateStr) return '';
    const [y, m, d] = startDateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setMonth(date.getMonth() + Number(durationMonths));
    const resY = date.getFullYear();
    const resM = String(date.getMonth() + 1).padStart(2, '0');
    const resD = String(date.getDate()).padStart(2, '0');
    return `${resY}-${resM}-${resD}`;
  }

  /**
   * Format date for readable display (e.g., Nov 25, 2026)
   */
  function formatDisplayDate(dateStr) {
    if (!dateStr) return '--';
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  // State Container
  const state = {
    members: [],
    todayAttendance: [],
    weeklyAttendance: [],
    currentView: 'landing' // 'landing' | 'dashboard'
  };

  /**
   * Storage Initialization & Sync
   */
  function loadState() {
    try {
      const storedMembers = localStorage.getItem(STORAGE_KEY_MEMBERS);
      state.members = storedMembers ? JSON.parse(storedMembers) : DEFAULT_MEMBERS;

      const storedAttendance = localStorage.getItem(STORAGE_KEY_ATTENDANCE);
      state.todayAttendance = storedAttendance ? JSON.parse(storedAttendance) : DEFAULT_ATTENDANCE;

      const storedWeekly = localStorage.getItem(STORAGE_KEY_WEEKLY);
      state.weeklyAttendance = storedWeekly ? JSON.parse(storedWeekly) : DEFAULT_WEEKLY;
      
      saveState();
    } catch (e) {
      console.warn('LocalStorage error, falling back to defaults:', e);
      state.members = DEFAULT_MEMBERS;
      state.todayAttendance = DEFAULT_ATTENDANCE;
      state.weeklyAttendance = DEFAULT_WEEKLY;
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY_MEMBERS, JSON.stringify(state.members));
      localStorage.setItem(STORAGE_KEY_ATTENDANCE, JSON.stringify(state.todayAttendance));
      localStorage.setItem(STORAGE_KEY_WEEKLY, JSON.stringify(state.weeklyAttendance));
    } catch (e) {
      console.error('Error saving state to localStorage', e);
    }
  }

  function resetState() {
    localStorage.removeItem(STORAGE_KEY_MEMBERS);
    localStorage.removeItem(STORAGE_KEY_ATTENDANCE);
    localStorage.removeItem(STORAGE_KEY_WEEKLY);
    loadState();
    showToast('Demo data reset to original studio records.', 'success');
    window.REPZONE.refreshAll();
  }

  /**
   * Toast Notification Controller
   */
  function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = '&check;';
    if (type === 'warning') icon = '&#9888;';
    if (type === 'danger') icon = '&times;';

    toast.innerHTML = `
      <span class="check-icon" style="background: transparent; color: inherit; font-size: 1rem;">${icon}</span>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-exit');
      toast.addEventListener('animationend', () => toast.remove());
    }, 3500);
  }

  /**
   * View Switcher: Landing <-> Dashboard
   */
  function setView(viewName) {
    const landingView = document.getElementById('landing-view');
    const dashboardView = document.getElementById('dashboard-view');
    const toggleBtn = document.getElementById('btn-toggle-view');
    const toggleText = toggleBtn ? toggleBtn.querySelector('.toggle-text') : null;
    const navLinks = document.querySelectorAll('.nav-link, .mobile-link');

    state.currentView = viewName;

    if (viewName === 'dashboard') {
      landingView.classList.remove('active-view');
      dashboardView.classList.add('active-view');
      if (toggleText) toggleText.textContent = 'Studio Site';
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Highlight portal link
      navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('data-view') === 'dashboard');
      });

      // Trigger dashboard re-render
      if (window.REPZONE.refreshDashboard) {
        window.REPZONE.refreshDashboard();
      }
    } else {
      dashboardView.classList.remove('active-view');
      landingView.classList.add('active-view');
      if (toggleText) toggleText.textContent = 'Gym Portal';

      // Highlight active nav link
      navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('data-view') === 'landing');
      });
    }

    // Close mobile drawer if open
    closeMobileDrawer();
  }

  /**
   * Modal Management
   */
  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Focus first input if available
    const input = modal.querySelector('input:not([type=hidden]), select, textarea');
    if (input) setTimeout(() => input.focus(), 100);
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  /**
   * Mobile Drawer Management
   */
  function toggleMobileDrawer() {
    const drawer = document.getElementById('mobile-nav-drawer');
    const menuBtn = document.getElementById('mobile-menu-btn');
    if (!drawer) return;
    const isOpen = drawer.classList.contains('open');
    if (isOpen) {
      closeMobileDrawer();
    } else {
      drawer.classList.add('open');
      drawer.setAttribute('aria-hidden', 'false');
      if (menuBtn) menuBtn.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeMobileDrawer() {
    const drawer = document.getElementById('mobile-nav-drawer');
    const menuBtn = document.getElementById('mobile-menu-btn');
    if (!drawer) return;
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  /**
   * Initialization
   */
  function init() {
    loadState();

    // Toggle button in header
    const toggleBtn = document.getElementById('btn-toggle-view');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        setView(state.currentView === 'landing' ? 'dashboard' : 'landing');
      });
    }

    // Hero portal CTA
    const heroPortalBtn = document.getElementById('hero-portal-btn');
    if (heroPortalBtn) {
      heroPortalBtn.addEventListener('click', () => setView('dashboard'));
    }

    // Nav portal link
    const navDashboardLink = document.getElementById('nav-dashboard-link');
    if (navDashboardLink) {
      navDashboardLink.addEventListener('click', (e) => {
        e.preventDefault();
        setView('dashboard');
      });
    }

    // Back to landing button from dashboard
    const btnBackToLanding = document.getElementById('btn-back-to-landing');
    if (btnBackToLanding) {
      btnBackToLanding.addEventListener('click', () => setView('landing'));
    }

    // Logo click returns to landing hero
    const brandLogo = document.getElementById('brand-logo');
    if (brandLogo) {
      brandLogo.addEventListener('click', (e) => {
        e.preventDefault();
        setView('landing');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // Footer portal links
    document.querySelectorAll('.footer-portal-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        setView('dashboard');
      });
    });

    // Footer reset button
    const footerReset = document.getElementById('footer-reset-data');
    if (footerReset) {
      footerReset.addEventListener('click', () => {
        if (confirm('Reset all demo data back to factory gym records?')) {
          resetState();
        }
      });
    }

    // Mobile menu triggers
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    if (mobileMenuBtn) {
      mobileMenuBtn.addEventListener('click', toggleMobileDrawer);
    }
    const mobileCloseBtn = document.getElementById('mobile-close-btn');
    if (mobileCloseBtn) {
      mobileCloseBtn.addEventListener('click', closeMobileDrawer);
    }

    // Mobile link clicks
    document.querySelectorAll('.mobile-link').forEach(link => {
      link.addEventListener('click', (e) => {
        const targetView = link.getAttribute('data-view');
        const href = link.getAttribute('href');
        if (targetView === 'dashboard') {
          e.preventDefault();
          setView('dashboard');
        } else {
          setView('landing');
          if (href && href.startsWith('#') && href.length > 1) {
            e.preventDefault();
            setTimeout(() => {
              const targetEl = document.querySelector(href);
              if (targetEl) {
                targetEl.scrollIntoView({ behavior: 'smooth' });
              }
            }, 80);
          }
        }
        closeMobileDrawer();
      });
    });

    // Desktop nav link clicks (handle jumping back from dashboard)
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        const targetView = link.getAttribute('data-view');
        const href = link.getAttribute('href');
        if (targetView === 'dashboard') {
          e.preventDefault();
          setView('dashboard');
        } else if (state.currentView === 'dashboard') {
          setView('landing');
          if (href && href.startsWith('#') && href.length > 1) {
            e.preventDefault();
            setTimeout(() => {
              const targetEl = document.querySelector(href);
              if (targetEl) {
                targetEl.scrollIntoView({ behavior: 'smooth' });
              }
            }, 80);
          }
        }
      });
    });

    // Close modals on backdrop click or ESC key
    document.querySelectorAll('.modal-backdrop').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeModal(modal.id);
        }
      });
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-backdrop.open').forEach(modal => {
          closeModal(modal.id);
        });
        closeMobileDrawer();
      }
    });

    // Plan selection buttons pre-fill modal and open dashboard
    document.querySelectorAll('.plan-select-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tier = btn.getAttribute('data-plan-tier') || 'Performance';
        setView('dashboard');
        setTimeout(() => {
          const selectPlan = document.getElementById('select-plan');
          if (selectPlan) selectPlan.value = tier;
          openModal('add-member-modal');
        }, 150);
      });
    });
  }

  // Export to namespace
  window.REPZONE.state = state;
  window.REPZONE.saveState = saveState;
  window.REPZONE.getMemberStatus = getMemberStatus;
  window.REPZONE.calculateExpiryDate = calculateExpiryDate;
  window.REPZONE.formatDisplayDate = formatDisplayDate;
  window.REPZONE.getTodayDateString = getTodayDateString;
  window.REPZONE.showToast = showToast;
  window.REPZONE.setView = setView;
  window.REPZONE.openModal = openModal;
  window.REPZONE.closeModal = closeModal;
  window.REPZONE.refreshAll = function () {
    if (window.REPZONE.refreshDashboard) window.REPZONE.refreshDashboard();
    if (window.REPZONE.refreshMembersTable) window.REPZONE.refreshMembersTable();
    if (window.REPZONE.refreshAttendanceList) window.REPZONE.refreshAttendanceList();
  };

  // Run on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
