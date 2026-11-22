/**
 * REPZONE — Premium Gym Management System
 * Attendance Station & Check-in Feed (js/attendance.js)
 * Implements quick athlete autocomplete, 1-click check-in, duplicate detection,
 * live daily stream logging, and metric synchronization.
 */

(function () {
  'use strict';

  let selectedAthlete = null;

  // DOM Elements
  const searchInput = document.getElementById('checkin-search-input');
  const autocompleteBox = document.getElementById('checkin-autocomplete');
  const emptyStateBox = document.getElementById('checkin-empty-state');
  const selectedAthleteBox = document.getElementById('checkin-selected-athlete');
  const avatarEl = document.getElementById('checkin-athlete-avatar');
  const nameEl = document.getElementById('checkin-athlete-name');
  const planEl = document.getElementById('checkin-athlete-plan');
  const statusEl = document.getElementById('checkin-athlete-status');
  const btnConfirm = document.getElementById('btn-confirm-checkin');
  const streamList = document.getElementById('today-stream-list');
  const streamCountBadge = document.getElementById('stream-count-badge');

  /**
   * Helper: Current Time formatted (e.g. 05:45 PM)
   */
  function getCurrentTimeString() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 becomes 12
    const strHours = String(hours).padStart(2, '0');
    return `${strHours}:${minutes} ${ampm}`;
  }

  /**
   * Helper: Get Initials
   */
  function getInitials(firstName, lastName) {
    const f = firstName ? firstName.charAt(0).toUpperCase() : '';
    const l = lastName ? lastName.charAt(0).toUpperCase() : '';
    return `${f}${l}` || 'RZ';
  }

  /**
   * Render Today's Attendance Feed
   */
  function renderAttendanceStream() {
    const state = window.REPZONE.state;
    if (!state || !streamList) return;

    const list = state.todayAttendance || [];
    if (streamCountBadge) {
      streamCountBadge.textContent = `${list.length} today`;
    }

    streamList.innerHTML = '';

    if (list.length === 0) {
      streamList.innerHTML = `
        <div style="padding: 18px 0; text-align: center; color: var(--text-tertiary); font-size: 0.85rem;">
          No athlete visits recorded today yet.
        </div>
      `;
      return;
    }

    list.forEach(item => {
      const el = document.createElement('div');
      el.className = 'stream-item';
      el.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="status-dot" style="background-color: var(--accent-sage);"></span>
          <div>
            <span class="stream-item-athlete">${item.memberName}</span>
            <span style="font-size: 0.72rem; color: var(--text-tertiary); margin-left: 6px;">(${item.memberPlan})</span>
          </div>
        </div>
        <span class="stream-item-time">${item.time}</span>
      `;
      streamList.appendChild(el);
    });
  }

  /**
   * Execute Check-in for a given member object
   */
  function recordCheckIn(member) {
    if (!member) return;
    const state = window.REPZONE.state;

    // Check status
    const status = window.REPZONE.getMemberStatus(member.expiryDate);
    if (status === 'expired') {
      const proceed = confirm(`Warning: Athlete ${member.firstName} ${member.lastName}'s membership is EXPIRED. Log entry anyway?`);
      if (!proceed) return;
    }

    // Check duplicate check-in today
    const alreadyCheckedIn = (state.todayAttendance || []).find(a => a.memberId === member.id);
    if (alreadyCheckedIn) {
      const proceed = confirm(`Notice: ${member.firstName} already checked in today at ${alreadyCheckedIn.time}. Record an additional session entry?`);
      if (!proceed) return;
    }

    const timeStr = getCurrentTimeString();
    const newRecord = {
      id: 'chk-' + Date.now(),
      memberId: member.id,
      memberName: `${member.firstName} ${member.lastName}`,
      memberPlan: member.plan,
      time: timeStr,
      date: window.REPZONE.getTodayDateString()
    };

    // Increment member visit count
    member.attendanceCount = (member.attendanceCount || 0) + 1;

    // Add to today's stream at the top
    state.todayAttendance.unshift(newRecord);

    // Save
    window.REPZONE.saveState();

    // Feedback
    window.REPZONE.showToast(`Check-in recorded: ${member.firstName} ${member.lastName} (${timeStr})`, 'success');

    // Reset autocomplete selection
    resetSelection();

    // Re-render
    renderAttendanceStream();
    if (window.REPZONE.refreshDashboard) window.REPZONE.refreshDashboard();
    if (window.REPZONE.refreshMembersTable) window.REPZONE.refreshMembersTable();
  }

  /**
   * Select an athlete in the quick check-in box
   */
  function selectAthlete(member) {
    selectedAthlete = member;
    if (!member) {
      resetSelection();
      return;
    }

    if (emptyStateBox) emptyStateBox.hidden = true;
    if (selectedAthleteBox) selectedAthleteBox.hidden = false;

    if (avatarEl) avatarEl.textContent = getInitials(member.firstName, member.lastName);
    if (nameEl) nameEl.textContent = `${member.firstName} ${member.lastName}`;
    if (planEl) planEl.textContent = `${member.plan} Tier`;

    const status = window.REPZONE.getMemberStatus(member.expiryDate);
    if (statusEl) {
      statusEl.className = 'athlete-status-pill';
      if (status === 'active') {
        statusEl.classList.add('status-active');
        statusEl.textContent = 'Active';
      } else if (status === 'expiring') {
        statusEl.classList.add('status-expiring');
        statusEl.textContent = 'Expiring Soon';
      } else {
        statusEl.classList.add('status-expired');
        statusEl.textContent = 'Expired';
      }
    }

    // Hide dropdown
    if (autocompleteBox) {
      autocompleteBox.hidden = true;
      autocompleteBox.innerHTML = '';
    }
  }

  function resetSelection() {
    selectedAthlete = null;
    if (searchInput) searchInput.value = '';
    if (emptyStateBox) emptyStateBox.hidden = false;
    if (selectedAthleteBox) selectedAthleteBox.hidden = true;
    if (autocompleteBox) {
      autocompleteBox.hidden = true;
      autocompleteBox.innerHTML = '';
    }
  }

  /**
   * Filter Autocomplete Results
   */
  function handleSearchInput(e) {
    const val = e.target.value.trim().toLowerCase();
    if (!val || val.length < 1) {
      if (autocompleteBox) {
        autocompleteBox.hidden = true;
        autocompleteBox.innerHTML = '';
      }
      return;
    }

    const state = window.REPZONE.state;
    const matches = (state.members || []).filter(m => {
      const fullName = `${m.firstName} ${m.lastName}`.toLowerCase();
      const email = (m.email || '').toLowerCase();
      const id = (m.id || '').toLowerCase();
      return fullName.includes(val) || email.includes(val) || id.includes(val);
    }).slice(0, 5);

    if (matches.length === 0) {
      autocompleteBox.innerHTML = `
        <div style="padding: 10px 14px; font-size: 0.82rem; color: var(--text-tertiary);">
          No matching active athletes found.
        </div>
      `;
      autocompleteBox.hidden = false;
      return;
    }

    autocompleteBox.innerHTML = '';
    matches.forEach(m => {
      const item = document.createElement('div');
      item.className = 'autocomplete-item';
      item.innerHTML = `
        <div>
          <div class="autocomplete-name">${m.firstName} ${m.lastName}</div>
          <div class="autocomplete-sub">${m.plan} &bull; ${m.email}</div>
        </div>
        <span class="plan-tag" style="font-size: 0.72rem;">${m.id}</span>
      `;
      item.addEventListener('click', () => {
        selectAthlete(m);
      });
      autocompleteBox.appendChild(item);
    });

    autocompleteBox.hidden = false;
  }

  /**
   * Check in member by ID (accessible across modules)
   */
  function checkInMemberById(id) {
    const state = window.REPZONE.state;
    const member = (state.members || []).find(m => m.id === id);
    if (member) {
      recordCheckIn(member);
    }
  }

  /**
   * Initialization
   */
  function init() {
    if (searchInput) {
      searchInput.addEventListener('input', handleSearchInput);
      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !autocompleteBox.contains(e.target)) {
          if (autocompleteBox) autocompleteBox.hidden = true;
        }
      });
    }

    if (btnConfirm) {
      btnConfirm.addEventListener('click', () => {
        if (selectedAthlete) {
          recordCheckIn(selectedAthlete);
        }
      });
    }

    renderAttendanceStream();
  }

  // Export to namespace
  window.REPZONE.checkInMemberById = checkInMemberById;
  window.REPZONE.refreshAttendanceList = renderAttendanceStream;

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
