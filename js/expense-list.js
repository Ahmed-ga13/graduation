/* ==========================================================
   expense-list.js — Expense List Page Logic (Robust Firestore)
   Smart Spend | Used on: expense-list.html
   ========================================================== */

document.addEventListener('DOMContentLoaded', () => {

    /* ── State ── */
    let expenses     = [];
    let currentPage  = 1;
    let currentSort  = 'date';
    let searchQuery  = '';
    const ITEMS_PER_PAGE = 9;

    let currentUser    = null;
    let itemToEditId   = null;
    let itemToDeleteId = null;

    /* ── DOM References ── */
    const tbody               = document.getElementById('expense-tbody');
    const paginationContainer = document.getElementById('pagination-container');
    const countBadge          = document.getElementById('expense-count-badge');
    const searchInput         = document.getElementById('searchInput');
    const sortSelect          = document.getElementById('sortSelect');
    const deleteModal         = document.getElementById('deleteModal');
    const editModal           = document.getElementById('editModal');
    const editAmountInput     = document.getElementById('editAmountInput');

    if (tbody) tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px;">Loading expenses...</td></tr>';

    /* ── Auth State Listener ── */
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            listenToExpenses();
        }
    });

    function listenToExpenses() {
        db.collection('users').doc(currentUser.uid).collection('expenses')
            .onSnapshot(snapshot => {
                expenses = [];
                snapshot.forEach(doc => {
                    const data = doc.data();
                    expenses.push({ id: doc.id, ...data });
                });

                if (expenses.length === 0) {
                    if (tbody) tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px;">No expenses found.</td></tr>';
                }

                renderTable();
            }, error => {
                console.error("Firestore error:", error);
                if (tbody) tbody.innerHTML = '<tr><td colspan="5" style="color:red; text-align:center;">Failed to load data.</td></tr>';
            });
    }

    const renderTable = () => {
        if (!tbody) return;

        // Filter
        const term = searchQuery.toLowerCase();
        let filtered = expenses.filter(ex => {
            const cat = ex.categoryId || '';
            const desc = ex.note || '';
            return (cat.toLowerCase().includes(term)) || 
            String(ex.amount).includes(term) ||
            (desc.toLowerCase().includes(term));
        });

        // Sort
        filtered.sort((a, b) => {
            if (currentSort === 'amount') return (b.amount || 0) - (a.amount || 0);
            return (b.date?.seconds || 0) - (a.date?.seconds || 0);
        });

        if (countBadge) countBadge.innerText = `${filtered.length} Expenses`;

        const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
        if (currentPage > totalPages) currentPage = totalPages;

        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const pageItems = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

        tbody.innerHTML = '';
        pageItems.forEach(ex => {
            const dateStr = ex.date ? new Date(ex.date.seconds * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Today';
            const dayStr = ex.date ? new Date(ex.date.seconds * 1000).toLocaleDateString('en-US', { weekday: 'long' }) : '';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <div class="date-cell">
                        <div class="date-icon"><i data-lucide="calendar"></i></div>
                        <div class="date-info">
                            <span class="date-main">${dateStr}</span>
                            <span class="date-sub">${dayStr}</span>
                        </div>
                    </div>
                </td>
                <td class="amt-cell">$${Number(ex.amount || 0).toFixed(2)}</td>
                <td>
                    <span class="badge-cat-icon">
                        <i data-lucide="tag"></i> ${window.categoryMap && window.categoryMap[ex.categoryId] ? window.categoryMap[ex.categoryId] : (ex.categoryId || 'General')}
                    </span>
                </td>
                <td>
                    <div class="payment-cell"><i data-lucide="credit-card"></i> Card</div>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action" onclick="handleEdit('${ex.id}', ${ex.amount})"><i data-lucide="pencil" style="width:14px;height:14px;"></i></button>
                        <button class="btn-action" onclick="handleDelete('${ex.id}')"><i data-lucide="trash-2" style="width:14px;height:14px;"></i></button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });

        lucide.createIcons();
        renderPagination(totalPages);
    };

    const renderPagination = (totalPages) => {
        if (!paginationContainer) return;
        paginationContainer.innerHTML = '';
        if (totalPages <= 1) return;

        const createPageItem = (content, onClick, isActive = false) => {
            const a = document.createElement('a');
            a.href = '#';
            a.className = `page-item${isActive ? ' active' : ''}`;
            a.innerHTML = content;
            a.onclick = (e) => { e.preventDefault(); onClick(); };
            return a;
        };

        paginationContainer.appendChild(createPageItem('<i data-lucide="chevron-left"></i>', () => { if (currentPage > 1) { currentPage--; renderTable(); } }));
        for (let i = 1; i <= totalPages; i++) {
            paginationContainer.appendChild(createPageItem(i, () => { currentPage = i; renderTable(); }, i === currentPage));
        }
        paginationContainer.appendChild(createPageItem('<i data-lucide="chevron-right"></i>', () => { if (currentPage < totalPages) { currentPage++; renderTable(); } }));
        lucide.createIcons();
    };

    // Global handlers for simplicity
    window.handleDelete = (id) => { itemToDeleteId = id; deleteModal.classList.add('active'); };
    window.handleEdit = (id, amt) => { itemToEditId = id; editAmountInput.value = amt; editModal.classList.add('active'); };

    if (searchInput) searchInput.oninput = (e) => { searchQuery = e.target.value; currentPage = 1; renderTable(); };
    if (sortSelect) sortSelect.onchange = (e) => { currentSort = e.target.value; currentPage = 1; renderTable(); };

    document.getElementById('btnConfirmDelete')?.addEventListener('click', async () => {
        try {
            console.log(`[Firestore Write] ProjectId: ${firebaseConfig.projectId}`);
            console.log(`[Firestore Write] currentUser.uid: ${currentUser.uid}`);
            console.log(`[Firestore Write] Target Path: users/${currentUser.uid}/expenses/${itemToDeleteId}`);
            console.log(`[Firestore Write] Document Data: <delete>`);
            await db.collection('users').doc(currentUser.uid).collection('expenses').doc(itemToDeleteId).delete();
            deleteModal.classList.remove('active');
        } catch (e) { alert(e.message); }
    });

    document.getElementById('btnConfirmEdit')?.addEventListener('click', async () => {
        try {
            const dataToSet = { amount: parseFloat(editAmountInput.value) };
            console.log(`[Firestore Write] ProjectId: ${firebaseConfig.projectId}`);
            console.log(`[Firestore Write] currentUser.uid: ${currentUser.uid}`);
            console.log(`[Firestore Write] Target Path: users/${currentUser.uid}/expenses/${itemToEditId}`);
            console.log(`[Firestore Write] Document Data:`, dataToSet);
            await db.collection('users').doc(currentUser.uid).collection('expenses').doc(itemToEditId).update(dataToSet);
            editModal.classList.remove('active');
        } catch (e) { alert(e.message); }
    });

    document.querySelectorAll('.btn-modal-cancel').forEach(btn => btn.onclick = () => {
        deleteModal.classList.remove('active');
        editModal.classList.remove('active');
    });
});
