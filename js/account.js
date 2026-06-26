/* ==========================================================
   account.js — Account Page Logic (Firestore Integrated)
   Smart Spend | Used on: account.html
   ========================================================== */

document.addEventListener('DOMContentLoaded', () => {

    /* ── DOM References ── */
    const budgetInput      = document.getElementById('budgetInput');
    const spendingAmountEl = document.getElementById('spendingAmount');
    const progressFill     = document.getElementById('progressFill');
    const progressText     = document.getElementById('progressText');
    const alertMsg         = document.getElementById('budget-alert-msg');
    const saveBudgetBtn    = document.getElementById('saveBudgetBtn');
    
    const accountNameInput = document.getElementById('accountName');
    const accountEmailInput = document.getElementById('accountEmail');
    const accountPasswordInput = document.getElementById('accountPassword');
    const updateProfileBtn = document.querySelector('.btn-update:not(#saveBudgetBtn)');

    /* ── State ── */
    let currentUser     = null;
    let currentSpending = 0;
    let monthlyBudget   = 2500;

    /* ── Auth State Listener ── */
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            listenToUserData();
            calculateSpending();
        }
    });

    /* ── Listen to User Profile & Budget ── */
    function listenToUserData() {
        db.collection('users').doc(currentUser.uid).onSnapshot(doc => {
            if (doc.exists) {
                const data = doc.data();
                monthlyBudget = Number(data.budget) || 2500;
                
                const displayName = data.name || currentUser.displayName || 'User';
                const displayEmail = data.email || currentUser.email || '';

                // Update Profile Card
                const displayProfileName = document.getElementById('displayProfileName');
                const displayProfileEmail = document.getElementById('displayProfileEmail');
                if (displayProfileName) displayProfileName.textContent = displayName;
                if (displayProfileEmail) displayProfileEmail.textContent = displayEmail;

                // Only update input if it's not focused (to prevent jumping)
                if (document.activeElement !== budgetInput) {
                    budgetInput.value = monthlyBudget;
                }
                
                if (accountNameInput && document.activeElement !== accountNameInput) {
                    accountNameInput.value = displayName;
                }
                if (accountEmailInput) {
                    accountEmailInput.value = displayEmail;
                }
                
                updateBudgetUI();
            }
        });
    }

    /* ── Calculate Total Spending ── */
    function calculateSpending() {
        db.collection('users').doc(currentUser.uid).collection('expenses')
            .onSnapshot(snapshot => {
                const now = new Date();
                const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                
                currentSpending = 0;
                snapshot.forEach(doc => {
                    const data = doc.data();
                    let expenseDate = data.date;
                    
                    let d;
                    if (expenseDate && typeof expenseDate.toDate === 'function') {
                        d = expenseDate.toDate();
                    } else if (expenseDate) {
                        d = new Date(expenseDate);
                    } else {
                        d = new Date();
                    }

                    const expenseMonthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                    
                    if (expenseMonthStr === currentMonthStr) {
                        currentSpending += Number(data.amount || 0);
                    }
                });
                
                if (spendingAmountEl) spendingAmountEl.innerText = '$' + currentSpending.toLocaleString();
                updateBudgetUI();
            });
    }

    /* ── Budget UI Updater ── */
    const updateBudgetUI = () => {
        if (!budgetInput) return;
        let budgetVal = parseFloat(String(budgetInput.value).replace(/,/g, ''));
        if (isNaN(budgetVal) || budgetVal <= 0) budgetVal = 1;

        const percentage       = (currentSpending / budgetVal) * 100;
        const visualPercentage = Math.min(Math.max(percentage, 0), 100);

        if (progressText) progressText.innerText       = `${percentage.toFixed(1)}% of budget used`;
        if (progressFill) progressFill.style.width     = visualPercentage + '%';

        if (percentage >= 100) {
            if (progressFill) progressFill.style.backgroundColor = '#ef4444';
            if (alertMsg) alertMsg.style.display = 'flex';
        } else {
            if (progressFill) progressFill.style.backgroundColor = percentage >= 85 ? '#ef4444' : (percentage >= 50 ? '#f59e0b' : '#10b981');
            if (alertMsg) alertMsg.style.display = 'none';
        }
    };

    /* ── Listeners ── */
    if (budgetInput) budgetInput.addEventListener('input', updateBudgetUI);

    if (saveBudgetBtn) {
        saveBudgetBtn.addEventListener('click', async () => {
            const newBudget = parseFloat(String(budgetInput.value).replace(/,/g, ''));
            if (isNaN(newBudget)) return;

            try {
                const dataToSet = { budget: newBudget };
                console.log(`[Firestore Write] ProjectId: ${firebaseConfig.projectId}`);
                console.log(`[Firestore Write] currentUser.uid: ${currentUser.uid}`);
                console.log(`[Firestore Write] Target Path: users/${currentUser.uid}`);
                console.log(`[Firestore Write] Document Data:`, dataToSet);
                await db.collection('users').doc(currentUser.uid).set(dataToSet, { merge: true });
                showSuccess(saveBudgetBtn);
            } catch (error) { 
                console.error(error); 
                alert("Error saving budget: " + error.message);
            }
        });
    }

    if (updateProfileBtn) {
        updateProfileBtn.addEventListener('click', async () => {
            const newName = accountNameInput.value.trim();
            const newPassword = accountPasswordInput.value;

            try {
                // Update Name
                if (newName) {
                    const dataToSet = { name: newName };
                    console.log(`[Firestore Write] ProjectId: ${firebaseConfig.projectId}`);
                    console.log(`[Firestore Write] currentUser.uid: ${currentUser.uid}`);
                    console.log(`[Firestore Write] Target Path: users/${currentUser.uid}`);
                    console.log(`[Firestore Write] Document Data:`, dataToSet);
                    await db.collection('users').doc(currentUser.uid).set(dataToSet, { merge: true });
                    await currentUser.updateProfile({ displayName: newName });
                }

                // Update Password if provided
                if (newPassword) {
                    const success = await window.updateUserPassword(newPassword);
                    if (!success) return;
                    accountPasswordInput.value = '';
                }

                showSuccess(updateProfileBtn);
            } catch (error) { 
                console.error(error);
                alert("Error updating profile: " + error.message); 
            }
        });
    }

    /* ── Helper: Success Animation ── */
    function showSuccess(btn) {
        const originalHTML = btn.innerHTML;
        const originalBG = btn.style.backgroundColor;
        btn.innerHTML = '<i data-lucide="check"></i> Saved!';
        btn.style.backgroundColor = '#10b981';
        btn.style.color = 'white';
        lucide.createIcons();

        setTimeout(() => {
            btn.innerHTML = originalHTML;
            btn.style.backgroundColor = originalBG;
            btn.style.color = '';
            lucide.createIcons();
        }, 2000);
    }
});
