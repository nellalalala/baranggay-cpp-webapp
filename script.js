let complaints = [];
let isAdminLoggedIn = false;

async function fetchComplaints() {
  const res = await fetch('/api/complaints');
  complaints = await res.json();
  if (isAdminLoggedIn) renderAdminRecords();
}

function switchPortal(portal) {
  const residentView = document.getElementById('resident-view');
  const loginView = document.getElementById('admin-login-view');
  const dashboardView = document.getElementById('admin-dashboard-view');
  const tabResident = document.getElementById('tab-resident');
  const tabAdmin = document.getElementById('tab-admin');

  if (portal === 'resident') {
    residentView.classList.remove('hidden');
    loginView.classList.add('hidden');
    dashboardView.classList.add('hidden');
    tabResident.classList.add('active');
    tabAdmin.classList.remove('active');
  } else {
    residentView.classList.add('hidden');
    tabResident.classList.remove('active');
    tabAdmin.classList.add('active');

    if (isAdminLoggedIn) {
      loginView.classList.add('hidden');
      dashboardView.classList.remove('hidden');
      fetchComplaints();
    } else {
      loginView.classList.remove('hidden');
      dashboardView.classList.add('hidden');
    }
  }
}

document.getElementById('anonymous-toggle').addEventListener('change', function (e) {
  const nameInput = document.getElementById('complainant');
  if (e.target.checked) {
    nameInput.value = 'Anonymous Resident';
    nameInput.disabled = true;
  } else {
    nameInput.value = '';
    nameInput.disabled = false;
  }
});

document.getElementById('complaint-form').addEventListener('submit', async function (e) {
  e.preventDefault();

  const payload = {
    complainant: document.getElementById('complainant').value.trim(),
    category: document.getElementById('category').value,
    location: document.getElementById('location').value.trim(),
    description: document.getElementById('description').value.trim(),
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  };

  const res = await fetch('/api/complaints', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();

  await fetchComplaints();
  document.getElementById('generated-id').textContent = data.id;
  document.getElementById('receipt-banner').classList.remove('hidden');
  document.getElementById('track-input').value = data.id;

  this.reset();
  document.getElementById('complainant').disabled = false;
});

function copyTrackingId() {
  const idText = document.getElementById('generated-id').textContent;
  navigator.clipboard.writeText(idText);
  alert(`Copied ${idText} to clipboard.`);
}

async function trackComplaint() {
  await fetchComplaints();
  const queryId = document.getElementById('track-input').value.trim().toUpperCase();
  const resultBox = document.getElementById('track-result');
  const found = complaints.find(item => item.id.toUpperCase() === queryId);

  resultBox.classList.remove('hidden');

  if (!found) {
    resultBox.innerHTML = `<p class="error-text">No complaint record found for ID "<strong>${queryId}</strong>".</p>`;
    return;
  }

  resultBox.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
      <strong>${found.id} • ${found.category}</strong>
      ${getStatusBadge(found.status)}
    </div>
    <p class="record-meta">Location: ${found.location} • Submitted: ${found.date}</p>
    <p class="record-desc">${found.description}</p>
    <div style="background:#FFFFFF; padding:12px; border-radius:10px; border:1px solid #E2E8F0; font-size:0.85rem;">
      <strong>Barangay Remarks:</strong> ${found.remarks || 'No remarks yet.'}
    </div>
  `;
}

function autofillAdmin() {
  document.getElementById('admin-user').value = 'admin';
  document.getElementById('admin-pass').value = 'barangay2026';
}

document.getElementById('login-form').addEventListener('submit', function (e) {
  e.preventDefault();
  const user = document.getElementById('admin-user').value.trim();
  const pass = document.getElementById('admin-pass').value.trim();
  const errorMsg = document.getElementById('login-error');

  if (user === 'admin' && pass === 'barangay2026') {
    isAdminLoggedIn = true;
    errorMsg.classList.add('hidden');
    switchPortal('admin');
  } else {
    errorMsg.classList.remove('hidden');
  }
});

function logoutAdmin() {
  isAdminLoggedIn = false;
  document.getElementById('login-form').reset();
  switchPortal('admin');
}

function getStatusBadge(status) {
  if (status === 'Resolved') return `<span class="badge badge-resolved">Resolved</span>`;
  if (status === 'In Progress') return `<span class="badge badge-progress">In Progress</span>`;
  return `<span class="badge badge-pending">Pending</span>`;
}

function renderAdminRecords() {
  const search = document.getElementById('search-input').value.toLowerCase();
  const catFilter = document.getElementById('filter-category').value;
  const statusFilter = document.getElementById('filter-status').value;

  document.getElementById('stat-total').textContent = complaints.length;
  document.getElementById('stat-pending').textContent = complaints.filter(c => c.status === 'Pending').length;
  document.getElementById('stat-progress').textContent = complaints.filter(c => c.status === 'In Progress').length;
  document.getElementById('stat-resolved').textContent = complaints.filter(c => c.status === 'Resolved').length;

  const filtered = complaints.filter(c => {
    const matchesSearch =
      c.id.toLowerCase().includes(search) ||
      c.complainant.toLowerCase().includes(search) ||
      c.location.toLowerCase().includes(search) ||
      c.description.toLowerCase().includes(search);
    const matchesCat = catFilter === 'All' || c.category === catFilter;
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
    return matchesSearch && matchesCat && matchesStatus;
  });

  const container = document.getElementById('records-list');

  if (filtered.length === 0) {
    container.innerHTML = `<div class="card"><p class="subtitle">No matching complaint records found.</p></div>`;
    return;
  }

  container.innerHTML = filtered.slice().reverse().map(item => `
    <div class="record-item">
      <div class="record-header">
        <div>
          <strong>${item.id}</strong> • <span>${item.category}</span>
        </div>
        ${getStatusBadge(item.status)}
      </div>
      <div class="record-meta">
        Reported by <strong>${item.complainant}</strong> at ${item.location} • ${item.date}
      </div>
      <p class="record-desc">${item.description}</p>
      <div class="admin-controls">
        <select id="status-${item.id}">
          <option value="Pending" ${item.status === 'Pending' ? 'selected' : ''}>Pending</option>
          <option value="In Progress" ${item.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
          <option value="Resolved" ${item.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
        </select>
        <input type="text" id="remarks-${item.id}" value="${item.remarks || ''}" placeholder="Add official barangay remarks..." />
        <button type="button" class="btn btn-primary btn-sm" onclick="updateRecord('${item.id}')">Save Update</button>
      </div>
    </div>
  `).join('');
}

async function updateRecord(id) {
  const newStatus = document.getElementById(`status-${id}`).value;
  const newRemarks = document.getElementById(`remarks-${id}`).value.trim();

  await fetch('/api/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, status: newStatus, remarks: newRemarks })
  });

  await fetchComplaints();
  alert(`Updated record ${id} in C++ array.`);
}

async function resetDemoData() {
  if (confirm('Reset C++ array back to sample records?')) {
    await fetch('/api/reset', { method: 'POST' });
    await fetchComplaints();
  }
}

fetchComplaints();