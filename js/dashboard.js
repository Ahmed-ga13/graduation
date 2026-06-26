/* ==========================================================
   dashboard.js — Dashboard Page Logic (Robust Firestore)
   Smart Spend | Used on: dashboard.html
   ========================================================== */

document.addEventListener('DOMContentLoaded', () => {

    /* ── DOM References ── */
    const spendingEl     = document.querySelector('.card:nth-child(1) .amount.green');
    const budgetEl       = document.querySelector('.card:nth-child(2) .amount.black');
    const percentageEl   = document.querySelector('.budget-percentage');
    const progressFillEl = document.querySelector('.progress-fill');
    const remainingEl    = document.querySelector('.budget-remaining');
    const alertMsgEl     = document.getElementById('budget-alert-msg');
    const tbody          = document.querySelector('.transactions-table tbody');

    /* ── Modals ── */
    const deleteModal       = document.getElementById('deleteModal');
    const editModal         = document.getElementById('editModal');
    const addExpenseModal   = document.getElementById('addExpenseModal');
    const editAmountInput   = document.getElementById('editAmountInput');
    const newExpenseAmount  = document.getElementById('newExpenseAmount');
    const newExpenseCategory = document.getElementById('newExpenseCategory');
    const newExpenseDate     = document.getElementById('newExpenseDate');
    const openAddExpenseBtn = document.getElementById('openAddExpenseBtn');
    
    window.populateCategoryDropdown = () => {
        if (!newExpenseCategory) return;
        const currentVal = newExpenseCategory.value;
        newExpenseCategory.innerHTML = '<option value="" disabled selected hidden>Select Category</option>';
        if (window.categoryMap && Object.keys(window.categoryMap).length > 0) {
            for (const [id, name] of Object.entries(window.categoryMap)) {
                newExpenseCategory.innerHTML += `<option value="${id}">${name}</option>`;
            }
        } else {
            // Fallbacks if no categories fetched yet
            ['Food', 'Drink', 'Shopping', 'Transportation', 'Bills', 'Health', 'Entertainment'].forEach(c => {
                newExpenseCategory.innerHTML += `<option value="${c}">${c}</option>`;
            });
        }
        if (currentVal) newExpenseCategory.value = currentVal;
    };
    if (window.categoryMap) window.populateCategoryDropdown();

    /* ── Helpers ── */
    const formatAmount = (num) => Number(num || 0).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    /* ── State ── */
    let monthlyBudget = 5000;
    let currentUser   = null;
    let currentRowIdToDelete = null;
    let currentRowIdToEdit   = null;
    let currentTotalSpending = 0;

    // Reset UI
    if (spendingEl) spendingEl.innerText = '0.00';
    if (budgetEl) budgetEl.innerText = '0.00';
    if (tbody) tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px;">Loading...</td></tr>';

    /* ── Auth State Listener ── */
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            listenToUserBudget();
            listenToExpenses();
            listenToAIReport(); // Fetch dynamic AI tips
        }
    });

    /* ── Listen to AI Analysis for Dynamic Tip ── */
    function listenToAIReport() {
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        
        const insightEl = document.getElementById('aiInsightText');
        const recommendationEl = document.getElementById('aiRecommendationText');
        
        db.collection('users').doc(currentUser.uid)
          .collection('ai_reports').doc(currentMonth)
          .onSnapshot(doc => {
            if (doc.exists) {
                const data = doc.data();
                
                // Use first insight or summary
                let insight = data.insights && data.insights.length > 0 
                    ? data.insights[0] 
                    : (data.summary || "You're doing great with your spending!");
                
                // Use first recommendation
                let recommendation = data.recommendations && data.recommendations.length > 0
                    ? data.recommendations[0]
                    : "Keep tracking your expenses to stay on budget.";

                if (insightEl) insightEl.innerHTML = "";
                if (recommendationEl) recommendationEl.innerHTML = formatAIText(recommendation);
            } else {
                if (insightEl) insightEl.textContent = "No AI analysis for this month yet.";
                if (recommendationEl) recommendationEl.textContent = "Go to Reports to generate your first AI insight!";
            }
          });
    }

    // Helper to highlight numbers/percentages in AI text
    function formatAIText(text) {
        // Find numbers like $340 or 23% and wrap them in highligh span
        return text.replace(/(\$\d+(?:\.\d+)?|\d+%)/g, '<span class="tip-highlight">$1</span>');
    }

    function listenToUserBudget() {
        db.collection('users').doc(currentUser.uid).onSnapshot(doc => {
            if (doc.exists) {
                monthlyBudget = doc.data().budget || 5000;
                if (budgetEl) budgetEl.innerText = formatAmount(monthlyBudget);
                updateBudgetUI(currentTotalSpending); // Re-calculate percentage
            } else {
                // Init user if missing
                db.collection('users').doc(currentUser.uid).set({
                    name: currentUser.displayName || 'User',
                    email: currentUser.email,
                    budget: 5000,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        });
    }

    function listenToExpenses() {
        db.collection('users').doc(currentUser.uid).collection('expenses')
            .onSnapshot(snapshot => {
                let currentMonthSpending = 0;
                let lastMonthSpending = 0;
                let categoryData = {
                    'Food': 0, 'Drink': 0, 'Shopping': 0, 'Transportation': 0,
                    'Bills': 0, 'Health': 0, 'Entertainment': 0, 'Others': 0
                };
                let trendData = new Array(9).fill(0);

                const now = new Date();
                const currentMonth = now.getMonth();
                const currentYear = now.getFullYear();

                const docs = [];
                snapshot.forEach(doc => {
                    const data = doc.data();
                    docs.push({ id: doc.id, ...data });
                    
                    const amt = Number(data.amount) || 0;
                    
                    if (data.date) {
                        const dateObj = data.date.toDate ? data.date.toDate() : new Date(data.date);
                        const dMonth = dateObj.getMonth();
                        const dYear = dateObj.getFullYear();
                        
                        // Current month spending
                        if (dYear === currentYear && dMonth === currentMonth) {
                            currentMonthSpending += amt;
                            
                            // Aggregate categories only for the current month
                            const cat = data.categoryId || 'Others';
                            if (categoryData[cat] !== undefined) {
                                categoryData[cat] += amt;
                            } else {
                                categoryData['Others'] += amt;
                            }
                        } 
                        // Last month spending
                        else if (dYear === currentYear && dMonth === currentMonth - 1) {
                            lastMonthSpending += amt;
                        } 
                        // Last month spending (Edge case: Jan -> Dec of previous year)
                        else if (currentMonth === 0 && dYear === currentYear - 1 && dMonth === 11) {
                            lastMonthSpending += amt;
                        }

                        // Aggregate trend for the chart
                        if (dMonth < 9) trendData[dMonth] += amt;
                    }
                });

                currentTotalSpending = currentMonthSpending;

                // Update percentage vs last month badge
                const diffBadgeEl = document.querySelector('.card:nth-child(1) .card-footer span');
                if (diffBadgeEl) {
                    diffBadgeEl.className = 'badge-red'; // Reset to base class for padding/styling
                    
                    if (lastMonthSpending === 0) {
                        diffBadgeEl.textContent = currentMonthSpending > 0 ? '+100%' : '0%';
                        diffBadgeEl.style.backgroundColor = currentMonthSpending > 0 ? '#fee2e2' : '#f3f4f6';
                        diffBadgeEl.style.color = currentMonthSpending > 0 ? '#ef4444' : '#4b5563';
                    } else {
                        const diff = ((currentMonthSpending - lastMonthSpending) / lastMonthSpending) * 100;
                        const sign = diff > 0 ? '+' : '';
                        diffBadgeEl.textContent = `${sign}${diff.toFixed(1)}%`;
                        
                        if (diff <= 0) {
                            // Good: Spending decreased or stayed same (Green)
                            diffBadgeEl.style.backgroundColor = '#dcfce7';
                            diffBadgeEl.style.color = '#125e3a';
                        } else {
                            // Bad: Spending increased (Red)
                            diffBadgeEl.style.backgroundColor = '#fee2e2';
                            diffBadgeEl.style.color = '#ef4444';
                        }
                    }
                }

                // Update UI
                if (tbody) {
                    tbody.innerHTML = '';
                    if (docs.length === 0) {
                        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px;">No transactions yet.</td></tr>';
                    } else {
                        // Sort by date desc
                        docs.sort((a, b) => {
                            const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date || 0);
                            const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date || 0);
                            return dateB - dateA;
                        });
                        docs.slice(0, 5).forEach(data => renderExpenseRow(data.id, data));
                    }
                }

                updateBudgetUI(currentMonthSpending);
                
                if (window.updateChartsWithData) {
                    window.updateChartsWithData(trendData, Object.values(categoryData));
                }
                
                lucide.createIcons();
            }, error => {
                console.error("Firestore error:", error);
                if (tbody) tbody.innerHTML = `<tr><td colspan="5" style="color:red; text-align:center;">Error: ${error.message}</td></tr>`;
            });
    }

    function updateBudgetUI(monthlySpending) {
        if (!spendingEl) return;

        let percentage = (monthlySpending / monthlyBudget) * 100;
        percentage = Math.min(Math.max(percentage, 0), 100);

        spendingEl.innerText    = formatAmount(monthlySpending);
        if (percentageEl) percentageEl.innerText  = percentage.toFixed(1) + '%';
        if (progressFillEl) progressFillEl.style.width = percentage.toFixed(1) + '%';

        const remaining = monthlyBudget - monthlySpending;
        if (remainingEl) remainingEl.innerText   = 'Remaining: ' + formatAmount(remaining);

        if (percentage >= 100) {
            if (progressFillEl) progressFillEl.style.backgroundColor = '#ef4444';
            if (alertMsgEl) alertMsgEl.style.display = 'flex';
        } else {
            if (progressFillEl) progressFillEl.style.backgroundColor = percentage >= 85 ? '#ef4444' : (percentage >= 50 ? '#f59e0b' : '#10b981');
            if (alertMsgEl) alertMsgEl.style.display = 'none';
        }
    }

    function renderExpenseRow(id, data) {
        const dateObj = data.date?.toDate ? data.date.toDate() : new Date(data.date || Date.now());
        const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        
        const catName = window.categoryMap && window.categoryMap[data.categoryId] ? window.categoryMap[data.categoryId] : (data.categoryId || 'General');
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><div class="tx-desc"><div class="tx-icon"><i data-lucide="banknote"></i></div> ${data.note || 'Expense'}</div></td>
            <td><span class="badge-cat" style="background-color:#f3f4f6;color:#4b5563;">${catName}</span></td>
            <td class="tx-date">${dateStr}</td>
            <td class="tx-amount">${formatAmount(data.amount)}</td>
            <td>
                <div class="tx-actions">
                    <i data-lucide="pencil" onclick="handleEdit('${id}', ${data.amount})"></i>
                    <i data-lucide="trash-2" onclick="handleDelete('${id}')"></i>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    }

    // Modal Interaction Handlers
    window.handleDelete = (id) => {
        currentRowIdToDelete = id;
        deleteModal.classList.add('active');
    };

    window.handleEdit = (id, amt) => {
        currentRowIdToEdit = id;
        editAmountInput.value = amt;
        editModal.classList.add('active');
    };

    if (openAddExpenseBtn) {
        openAddExpenseBtn.onclick = () => {
            newExpenseAmount.value = '';
            newExpenseDate.value = new Date().toISOString().split('T')[0]; // Set today as default
            addExpenseModal.classList.add('active');
        };
    }

    document.getElementById('btnConfirmAdd')?.addEventListener('click', async () => {
        const amount = parseFloat(newExpenseAmount.value);
        const category = newExpenseCategory.value || 'Others';
        const dateStr = newExpenseDate.value;
        
        if (isNaN(amount) || amount <= 0) return alert("Enter valid amount");
        if (!dateStr) return alert("Please select a date");

        try {
            const expensesRef = db.collection('users').doc(currentUser.uid).collection('expenses');
            const newDocRef = expensesRef.doc();
            
            const expenseData = {
                id: newDocRef.id,
                uid: currentUser.uid,
                amount: amount,
                categoryId: category,
                date: firebase.firestore.Timestamp.fromDate(new Date(dateStr)),
                note: category + " expense",
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            console.log(`[Firestore Write] ProjectId: ${firebaseConfig.projectId}`);
            console.log(`[Firestore Write] currentUser.uid: ${currentUser.uid}`);
            console.log(`[Firestore Write] Target Path: users/${currentUser.uid}/expenses/${newDocRef.id}`);
            console.log(`[Firestore Write] Document Data:`, expenseData);

            await newDocRef.set(expenseData);
            
            addExpenseModal.classList.remove('active');
        } catch (e) { 
            console.error(`[Firestore Error] Failed path: users/${currentUser.uid}/expenses/`);
            console.error(e);
            alert("Error: " + e.message + "\nPath: users/" + currentUser.uid + "/expenses/"); 
        }
    });

    document.getElementById('btnConfirmDelete')?.addEventListener('click', async () => {
        try {
            console.log(`[Firestore Write] ProjectId: ${firebaseConfig.projectId}`);
            console.log(`[Firestore Write] currentUser.uid: ${currentUser.uid}`);
            console.log(`[Firestore Write] Target Path: users/${currentUser.uid}/expenses/${currentRowIdToDelete}`);
            console.log(`[Firestore Write] Document Data: <delete>`);
            await db.collection('users').doc(currentUser.uid).collection('expenses').doc(currentRowIdToDelete).delete();
            deleteModal.classList.remove('active');
        } catch (e) { alert(e.message); }
    });

    document.getElementById('btnConfirmEdit')?.addEventListener('click', async () => {
        const newAmt = parseFloat(editAmountInput.value);
        try {
            const dataToSet = { amount: newAmt };
            console.log(`[Firestore Write] ProjectId: ${firebaseConfig.projectId}`);
            console.log(`[Firestore Write] currentUser.uid: ${currentUser.uid}`);
            console.log(`[Firestore Write] Target Path: users/${currentUser.uid}/expenses/${currentRowIdToEdit}`);
            console.log(`[Firestore Write] Document Data:`, dataToSet);
            await db.collection('users').doc(currentUser.uid).collection('expenses').doc(currentRowIdToEdit).update(dataToSet);
            editModal.classList.remove('active');
        } catch (e) { alert(e.message); }
    });

    // Close modals
    document.querySelectorAll('.btn-modal-cancel').forEach(btn => {
        btn.onclick = () => {
            deleteModal.classList.remove('active');
            editModal.classList.remove('active');
            addExpenseModal.classList.remove('active');
        };
    });
});
