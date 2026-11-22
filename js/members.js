/**
 * REPZONE — Premium Gym Management System
 * Member Lifecycle & Roster Manager (js/members.js)
 * Implements member table rendering, multi-criteria filtering, live search,
 * add-member modal validation with auto-computed expiry date, and dossier drawer.
 */

(function () {
  'use strict';

  let currentSearch = '';
  let currentStatusFilter = 'all';
  let currentPlanFilter = 'all';
  let activeDossierMemberId = null;

  // DOM Elements
  const tableBody = document.getElementById('members-table-body');
  const emptyState = document.getElementById('table-empty-state');
  const showingCount = document.getElementById('table-showing-count');
  const searchInput = document.getElementById('member-table-search');
  const clearSearchBtn = document.getElementById('btn-clear-search');
  const planSelect = document.getElementById('plan-filter-select');
  const statusFilterGroup = document.getElementById('status-filter-group');
  const resetFiltersBtn = document.getElementById('btn-reset-filters');

  // Form Elements
  const addForm = document.getElementById('add-member-form');
  const inputFirstName = document.getElementById('input-first-name');
  const inputLastName = document.getElementById('input-last-name');
  const inputEmail = document.getElementById('input-email');
  const inputPhone = document.getElementById('input-phone');
  const selectPlan = document.getElementById('select-plan');
  const selectDuration = document.getElementById('select-duration');
  const inputStartDate = document.getElementById('input-start-date');
  const previewExpiry = document.getElementById('preview-expiry-date');
  const inputNotes = document.getElementById('input-notes');

  const btnOpenAddMember = document.getElementById('btn-open-add-member');
  const btnCloseAddModal = document.getElementById('btn-close-add-modal');
  const btnCancelAddModal = document.getElementById('btn-cancel-add-modal');

  // Dossier Modal Elements
  const btnCloseDetailModal = document.getElementById('btn-close-detail-modal');
  const btnCloseDetailFooter = document.getElementById('btn-close-detail-footer');
  const btnCheckinFromDetail = document.getElementById('btn-checkin-from-detail');
  const btnDeleteMemberDetail = document.getElementById('btn-delete-member-detail');

  /**
   * Helper: Get Initials from Name
   */
  function getInitials(firstName, lastName) {
    const f = firstName ? firstName.charAt(0).toUpperCase() : '';
    const l = lastName ? lastName.charAt(0).toUpperCase() : '';
    return `${f}${l}` || 'RZ';
  }

  /**
   * Helper: Calculate remaining days
   */
  function getDaysRemaining(expiryDateStr) {
    if (!expiryDateStr) return 0;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const [y, m, d] = expiryDateStr.split('-').map(Number);
    const expiry = new Date(y, m - 1, d);
    expiry.setHours(0, 0, 0, 0);
    return Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
  }

  /**
   * Render Members Table
   */
  function renderTable() {
    const state = window.REPZONE.state;
    if (!state || !tableBody) return;

    const allMembers = state.members || [];
    const query = currentSearch.trim().toLowerCase();

    // Filter members
    const filtered = allMembers.filter(member => {
      // 1. Text search
      const fullName = `${member.firstName} ${member.lastName}`.toLowerCase();
      const email = (member.email || '').toLowerCase();
      const phone = (member.phone || '').toLowerCase();
      const id = (member.id || '').toLowerCase();

      const matchesSearch = !query || 
        fullName.includes(query) || 
        email.includes(query) || 
        phone.includes(query) || 
        id.includes(query);

      if (!matchesSearch) return false;

      // 2. Status filter
      if (currentStatusFilter === 'in-studio') {
        const checkedInToday = (state.todayAttendance || []).some(a => a.memberId === member.id);
        if (!checkedInToday) return false;
      } else if (currentStatusFilter !== 'all') {
        const status = window.REPZONE.getMemberStatus(member.expiryDate);
        if (status !== currentStatusFilter) return false;
      }

      // 3. Plan filter
      if (currentPlanFilter !== 'all' && member.plan !== currentPlanFilter) {
        return false;
      }

      return true;
    });

    // Clear existing rows
    tableBody.innerHTML = '';

    if (filtered.length === 0) {
      if (emptyState) emptyState.hidden = false;
    } else {
      if (emptyState) emptyState.hidden = true;

      filtered.forEach(member => {
        const tr = document.createElement('tr');
        const status = window.REPZONE.getMemberStatus(member.expiryDate);
        const initials = getInitials(member.firstName, member.lastName);
        const daysLeft = getDaysRemaining(member.expiryDate);

        let statusText = 'Active';
        let statusClass = 'status-active';
        if (status === 'expiring') {
          statusText = `Expiring (${daysLeft}d)`;
          statusClass = 'status-expiring';
        } else if (status === 'expired') {
          statusText = `Expired (${Math.abs(daysLeft)}d ago)`;
          statusClass = 'status-expired';
        }

        tr.innerHTML = `
          <td>
            <div class="table-athlete-cell">
              <div class="table-athlete-avatar">${initials}</div>
              <div class="table-athlete-info">
                <span class="table-athlete-name">${member.firstName} ${member.lastName}</span>
                <span class="table-athlete-email">${member.email} &bull; ${member.id}</span>
              </div>
            </div>
          </td>
          <td>
            <span class="plan-tag">${member.plan}</span>
          </td>
          <td>
            <span class="table-date">${window.REPZONE.formatDisplayDate(member.startDate)}</span>
          </td>
          <td>
            <span class="table-date">${window.REPZONE.formatDisplayDate(member.expiryDate)}</span>
          </td>
          <td>
            <span class="status-pill ${statusClass}">
              <span class="status-dot"></span>
              <span>${statusText}</span>
            </span>
          </td>
          <td class="text-right">
            <div class="table-actions">
              <button type="button" class="action-icon-btn btn-table-checkin" title="Quick Check-in" data-id="${member.id}" aria-label="Check-in">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </button>
              <button type="button" class="action-icon-btn btn-table-renew" title="Renew Plan" data-id="${member.id}" aria-label="Renew Plan">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
              </button>
              <button type="button" class="action-icon-btn btn-table-view" title="View Dossier" data-id="${member.id}" aria-label="View Details">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
              <button type="button" class="action-icon-btn btn-delete btn-table-delete" title="Delete Member" data-id="${member.id}" aria-label="Delete">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          </td>
        `;

        tableBody.appendChild(tr);
      });
    }

    // Update table count text
    if (showingCount) {
      showingCount.textContent = `Showing ${filtered.length} of ${allMembers.length} members`;
    }

    // Attach row action events
    attachRowEvents();
  }

  /**
   * Row action button handlers
   */
  function attachRowEvents() {
    // Quick Check-in
    document.querySelectorAll('.btn-table-checkin').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (window.REPZONE.checkInMemberById) {
          window.REPZONE.checkInMemberById(id);
        }
      });
    });

    // Renew Membership
    document.querySelectorAll('.btn-table-renew').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        openRenewalModal(id);
      });
    });

    // View Details / Dossier
    document.querySelectorAll('.btn-table-view').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        openMemberDossier(id);
      });
    });

    // Delete Member
    document.querySelectorAll('.btn-table-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        deleteMember(id);
      });
    });
  }

  /**
   * Open Member Dossier Modal
   */
  function openMemberDossier(memberId) {
    const state = window.REPZONE.state;
    const member = state.members.find(m => m.id === memberId);
    if (!member) return;

    activeDossierMemberId = memberId;
    const detailBody = document.getElementById('member-detail-body');
    const modalTitle = document.getElementById('modal-detail-name');
    if (modalTitle) modalTitle.textContent = `${member.firstName} ${member.lastName}`;

    const status = window.REPZONE.getMemberStatus(member.expiryDate);
    const initials = getInitials(member.firstName, member.lastName);
    const daysLeft = getDaysRemaining(member.expiryDate);

    // Filter attendance history for this member
    const checkinHistory = (state.todayAttendance || []).filter(a => a.memberId === member.id);

    let statusBadgeHtml = '<span class="status-pill status-active"><span class="status-dot"></span> Active</span>';
    if (status === 'expiring') {
      statusBadgeHtml = `<span class="status-pill status-expiring"><span class="status-dot"></span> Expiring in ${daysLeft} days</span>`;
    } else if (status === 'expired') {
      statusBadgeHtml = `<span class="status-pill status-expired"><span class="status-dot"></span> Expired ${Math.abs(daysLeft)} days ago</span>`;
    }

    let historyHtml = '<div class="dossier-history-empty">No check-ins recorded today.</div>';
    if (checkinHistory.length > 0) {
      historyHtml = checkinHistory.map(h => `
        <div class="stream-item">
          <div>
            <strong>Check-in</strong> &bull; <span class="stream-item-time">${h.time}</span>
          </div>
          <span class="status-pill status-active">&check; Verified</span>
        </div>
      `).join('');
    }

    if (detailBody) {
      detailBody.innerHTML = `
        <div class="dossier-grid">
          <div class="dossier-profile-card">
            <div class="dossier-avatar-large">${initials}</div>
            <h4 class="dossier-name">${member.firstName} ${member.lastName}</h4>
            <span class="dossier-email">${member.email}</span>
            <div style="margin-bottom: 14px;">${statusBadgeHtml}</div>

            <div class="dossier-stats-list">
              <div class="dossier-stat-row">
                <span>Member ID:</span>
                <span>${member.id}</span>
              </div>
              <div class="dossier-stat-row">
                <span>Phone:</span>
                <span>${member.phone || '--'}</span>
              </div>
              <div class="dossier-stat-row">
                <span>Tier:</span>
                <span class="plan-tag">${member.plan}</span>
              </div>
              <div class="dossier-stat-row">
                <span>Start Date:</span>
                <span>${window.REPZONE.formatDisplayDate(member.startDate)}</span>
              </div>
              <div class="dossier-stat-row">
                <span>Expiry Date:</span>
                <span>${window.REPZONE.formatDisplayDate(member.expiryDate)}</span>
              </div>
              <div class="dossier-stat-row">
                <span>Lifetime Visits:</span>
                <span>${member.attendanceCount || 0}</span>
              </div>
            </div>
          </div>

          <div class="dossier-history-section">
            <h4>Today's Check-in Log</h4>
            <div class="dossier-history-feed">
              ${historyHtml}
            </div>

            <h4 style="margin-top: 24px;">Physical & Training Notes</h4>
            <p style="font-size: 0.88rem; color: var(--text-secondary); line-height: 1.6; background: var(--bg-primary); padding: 12px; border-radius: 8px; border: 1px solid var(--border-subtle);">
              ${member.notes ? member.notes : 'No specific physical considerations or emergency directives logged.'}
            </p>
          </div>
        </div>
      `;
    }

    window.REPZONE.openModal('member-detail-modal');
  }

  /**
   * Delete Member
   */
  function deleteMember(memberId) {
    const state = window.REPZONE.state;
    const member = state.members.find(m => m.id === memberId);
    if (!member) return;

    if (confirm(`Remove athlete ${member.firstName} ${member.lastName} from the studio roster?`)) {
      state.members = state.members.filter(m => m.id !== memberId);
      window.REPZONE.saveState();
      window.REPZONE.showToast(`Athlete ${member.firstName} ${member.lastName} removed.`, 'warning');
      window.REPZONE.closeModal('member-detail-modal');
      renderTable();
      if (window.REPZONE.refreshDashboard) window.REPZONE.refreshDashboard();
      if (window.REPZONE.refreshAttendanceList) window.REPZONE.refreshAttendanceList();
    }
  }

  /**
   * Live preview expiry date inside Add Member Form
   */
  function updateComputedExpiryPreview() {
    const startDate = inputStartDate ? inputStartDate.value : '';
    const duration = selectDuration ? selectDuration.value : 3;
    if (startDate && previewExpiry) {
      const expDate = window.REPZONE.calculateExpiryDate(startDate, duration);
      previewExpiry.textContent = window.REPZONE.formatDisplayDate(expDate);
    } else if (previewExpiry) {
      previewExpiry.textContent = '--';
    }
  }

  /**
   * Add Member Form Submission & Validation
   */
  function handleAddMemberSubmit(e) {
    e.preventDefault();

    // Reset error messages
    document.querySelectorAll('.form-error').forEach(el => el.textContent = '');

    let isValid = true;
    const firstName = inputFirstName.value.trim();
    const lastName = inputLastName.value.trim();
    const email = inputEmail.value.trim();
    const phone = inputPhone.value.trim();
    const plan = selectPlan.value;
    const duration = parseInt(selectDuration.value, 10);
    const startDate = inputStartDate.value;
    const notes = inputNotes ? inputNotes.value.trim() : '';

    // Validation checks
    if (!firstName) {
      document.getElementById('err-first-name').textContent = 'First name is required';
      isValid = false;
    }
    if (!lastName) {
      document.getElementById('err-last-name').textContent = 'Last name is required';
      isValid = false;
    }
    if (!email) {
      document.getElementById('err-email').textContent = 'Email address is required';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      document.getElementById('err-email').textContent = 'Enter a valid email address';
      isValid = false;
    }
    if (!phone) {
      document.getElementById('err-phone').textContent = 'Phone number is required';
      isValid = false;
    }
    if (!startDate) {
      document.getElementById('err-start-date').textContent = 'Please choose a start date';
      isValid = false;
    }

    if (!isValid) return;

    // Calculate expiry date
    const expiryDate = window.REPZONE.calculateExpiryDate(startDate, duration);

    // Generate unique ID
    const nextNum = Math.floor(1000 + Math.random() * 9000);
    const newId = `RZ-${nextNum}`;

    const newMember = {
      id: newId,
      firstName,
      lastName,
      email,
      phone,
      plan,
      duration,
      startDate,
      expiryDate,
      notes,
      attendanceCount: 0
    };

    const state = window.REPZONE.state;
    state.members.unshift(newMember);
    window.REPZONE.saveState();

    window.REPZONE.showToast(`Member registered: ${firstName} ${lastName}`, 'success');
    window.REPZONE.closeModal('add-member-modal');
    addForm.reset();

    // Re-render
    renderTable();
    if (window.REPZONE.refreshDashboard) window.REPZONE.refreshDashboard();
    if (window.REPZONE.refreshAttendanceList) window.REPZONE.refreshAttendanceList();
  }

  /**
   * Membership Renewal Modal Functions
   */
  let activeRenewMemberId = null;

  function openRenewalModal(memberId) {
    const state = window.REPZONE.state;
    const member = (state.members || []).find(m => m.id === memberId);
    if (!member) return;

    activeRenewMemberId = memberId;

    const elIdInput = document.getElementById('renew-member-id');
    const elSummary = document.getElementById('renew-athlete-summary');
    const elDuration = document.getElementById('renew-select-duration');
    const elTier = document.getElementById('renew-select-tier');

    if (elIdInput) elIdInput.value = member.id;
    if (elTier) elTier.value = member.plan;
    if (elDuration) elDuration.value = '3';

    if (elSummary) {
      const status = window.REPZONE.getMemberStatus(member.expiryDate);
      elSummary.innerHTML = `
        <strong>${member.firstName} ${member.lastName}</strong> &bull; <code>${member.id}</code><br>
        Current Plan: <strong>${member.plan}</strong> &bull; Current Expiry: <strong>${window.REPZONE.formatDisplayDate(member.expiryDate)}</strong> (${status.toUpperCase()})
      `;
    }

    updateRenewalExpiryPreview();
    window.REPZONE.openModal('renew-member-modal');
  }

  function updateRenewalExpiryPreview() {
    const state = window.REPZONE.state;
    const member = (state.members || []).find(m => m.id === activeRenewMemberId);
    const elDuration = document.getElementById('renew-select-duration');
    const elPreview = document.getElementById('renew-preview-expiry');
    if (!member || !elDuration || !elPreview) return;

    const durationMonths = parseInt(elDuration.value, 10);
    const todayStr = window.REPZONE.getTodayDateString();
    
    // If membership is already expired, extend from today; otherwise extend from existing expiryDate
    const status = window.REPZONE.getMemberStatus(member.expiryDate);
    const baseDate = status === 'expired' ? todayStr : member.expiryDate;

    const newExpiry = window.REPZONE.calculateExpiryDate(baseDate, durationMonths);
    elPreview.textContent = `${window.REPZONE.formatDisplayDate(newExpiry)} (+${durationMonths} months)`;
  }

  function handleRenewalSubmit(e) {
    e.preventDefault();
    const state = window.REPZONE.state;
    const member = (state.members || []).find(m => m.id === activeRenewMemberId);
    if (!member) return;

    const elDuration = document.getElementById('renew-select-duration');
    const elTier = document.getElementById('renew-select-tier');
    const durationMonths = parseInt(elDuration.value, 10);

    const todayStr = window.REPZONE.getTodayDateString();
    const status = window.REPZONE.getMemberStatus(member.expiryDate);
    const baseDate = status === 'expired' ? todayStr : member.expiryDate;

    member.expiryDate = window.REPZONE.calculateExpiryDate(baseDate, durationMonths);
    if (elTier) member.plan = elTier.value;

    window.REPZONE.saveState();
    window.REPZONE.showToast(`Membership renewed for ${member.firstName} ${member.lastName} (+${durationMonths} mo)`, 'success');
    window.REPZONE.closeModal('renew-member-modal');
    window.REPZONE.closeModal('member-detail-modal');

    renderTable();
    if (window.REPZONE.refreshDashboard) window.REPZONE.refreshDashboard();
  }

  /**
   * Export Member Roster to CSV
   */
  function exportMembersToCSV() {
    const state = window.REPZONE.state;
    const members = state.members || [];
    if (members.length === 0) {
      window.REPZONE.showToast('No member records to export.', 'warning');
      return;
    }

    const headers = ['Member ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Plan', 'Start Date', 'Expiry Date', 'Status', 'Lifetime Visits'];
    const rows = members.map(m => [
      m.id,
      `"${m.firstName}"`,
      `"${m.lastName}"`,
      `"${m.email}"`,
      `"${m.phone}"`,
      m.plan,
      m.startDate,
      m.expiryDate,
      window.REPZONE.getMemberStatus(m.expiryDate),
      m.attendanceCount || 0
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `REPZONE_Members_Roster_${window.REPZONE.getTodayDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.REPZONE.showToast(`Exported ${members.length} members to CSV.`, 'success');
  }

  /**
   * Reset all filters
   */
  function resetFilters() {
    currentSearch = '';
    currentStatusFilter = 'all';
    currentPlanFilter = 'all';

    if (searchInput) searchInput.value = '';
    if (clearSearchBtn) clearSearchBtn.classList.remove('visible');
    if (planSelect) planSelect.value = 'all';

    if (statusFilterGroup) {
      statusFilterGroup.querySelectorAll('.filter-pill').forEach(pill => {
        pill.classList.toggle('active', pill.getAttribute('data-filter') === 'all');
      });
    }

    renderTable();
  }

  /**
   * Initialization
   */
  function init() {
    // Open Add Member modal button
    if (btnOpenAddMember) {
      btnOpenAddMember.addEventListener('click', () => {
        if (inputStartDate && !inputStartDate.value) {
          inputStartDate.value = window.REPZONE.getTodayDateString();
        }
        updateComputedExpiryPreview();
        window.REPZONE.openModal('add-member-modal');
      });
    }

    if (btnCloseAddModal) {
      btnCloseAddModal.addEventListener('click', () => window.REPZONE.closeModal('add-member-modal'));
    }
    if (btnCancelAddModal) {
      btnCancelAddModal.addEventListener('click', () => window.REPZONE.closeModal('add-member-modal'));
    }

    // Detail modal closing
    if (btnCloseDetailModal) {
      btnCloseDetailModal.addEventListener('click', () => window.REPZONE.closeModal('member-detail-modal'));
    }
    if (btnCloseDetailFooter) {
      btnCloseDetailFooter.addEventListener('click', () => window.REPZONE.closeModal('member-detail-modal'));
    }

    // Check in from dossier
    if (btnCheckinFromDetail) {
      btnCheckinFromDetail.addEventListener('click', () => {
        if (activeDossierMemberId && window.REPZONE.checkInMemberById) {
          window.REPZONE.checkInMemberById(activeDossierMemberId);
          openMemberDossier(activeDossierMemberId); // refresh dossier
        }
      });
    }

    // Renew from dossier
    const btnRenewFromDetail = document.getElementById('btn-renew-from-detail');
    if (btnRenewFromDetail) {
      btnRenewFromDetail.addEventListener('click', () => {
        if (activeDossierMemberId) {
          openRenewalModal(activeDossierMemberId);
        }
      });
    }

    // Export CSV button
    const btnExportCSV = document.getElementById('btn-export-csv');
    if (btnExportCSV) {
      btnExportCSV.addEventListener('click', exportMembersToCSV);
    }

    // Renewal modal form & controls
    const renewForm = document.getElementById('renew-member-form');
    if (renewForm) {
      renewForm.addEventListener('submit', handleRenewalSubmit);
    }
    const renewDurationSelect = document.getElementById('renew-select-duration');
    if (renewDurationSelect) {
      renewDurationSelect.addEventListener('change', updateRenewalExpiryPreview);
    }
    const btnCloseRenewModal = document.getElementById('btn-close-renew-modal');
    if (btnCloseRenewModal) {
      btnCloseRenewModal.addEventListener('click', () => window.REPZONE.closeModal('renew-member-modal'));
    }
    const btnCancelRenewModal = document.getElementById('btn-cancel-renew-modal');
    if (btnCancelRenewModal) {
      btnCancelRenewModal.addEventListener('click', () => window.REPZONE.closeModal('renew-member-modal'));
    }

    // Delete from dossier
    if (btnDeleteMemberDetail) {
      btnDeleteMemberDetail.addEventListener('click', () => {
        if (activeDossierMemberId) {
          deleteMember(activeDossierMemberId);
        }
      });
    }

    // Live search input
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        currentSearch = e.target.value;
        if (clearSearchBtn) {
          clearSearchBtn.classList.toggle('visible', currentSearch.length > 0);
        }
        renderTable();
      });
    }

    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        currentSearch = '';
        clearSearchBtn.classList.remove('visible');
        renderTable();
      });
    }

    // Status filter pills
    if (statusFilterGroup) {
      statusFilterGroup.querySelectorAll('.filter-pill').forEach(pill => {
        pill.addEventListener('click', () => {
          statusFilterGroup.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
          pill.classList.add('active');
          currentStatusFilter = pill.getAttribute('data-filter') || 'all';
          renderTable();
        });
      });
    }

    // Plan select filter
    if (planSelect) {
      planSelect.addEventListener('change', (e) => {
        currentPlanFilter = e.target.value;
        renderTable();
      });
    }

    // Reset filters button
    if (resetFiltersBtn) {
      resetFiltersBtn.addEventListener('click', resetFilters);
    }

    // Add member form events
    if (addForm) {
      addForm.addEventListener('submit', handleAddMemberSubmit);
    }
    if (inputStartDate) {
      inputStartDate.addEventListener('change', updateComputedExpiryPreview);
    }
    if (selectDuration) {
      selectDuration.addEventListener('change', updateComputedExpiryPreview);
    }

    renderTable();
  }

  // Export refresh hook
  window.REPZONE.refreshMembersTable = renderTable;

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
