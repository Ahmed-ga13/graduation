/* ==========================================================
   reports.js — Reports Page Logic (Full Dynamic)
   Smart Spend | Used on: reports.html
   ========================================================== */

document.addEventListener('DOMContentLoaded', () => {

    /* ── DOM References ── */
    const summaryAmounts = document.querySelectorAll('.summary-card .amount.black');
    const tipTitle       = document.getElementById('tipTitle');
    const tipText        = document.getElementById('tipDescription');

    /* ── State ── */
    let currentUser = null;
    let monthlyBudget = 5000;
    let currentAIReport = null;

    /* ── Auth State Listener ── */
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            loadData();
        }
    });

    async function loadData() {
        // 1. Get Budget
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        if (userDoc.exists) {
            monthlyBudget = userDoc.data().budget || 5000;
        }

        // 2. Initial AI Check
        await checkExistingAnalysis();

        // 3. Listen to Expenses
        db.collection('expenses')
            .where('userId', '==', currentUser.uid)
            .onSnapshot(snapshot => {
                let currentMonthSpending = 0;
                let lastMonthSpending = 0;
                let currentMonthCount = 0;
                
                let categoryData = {
                    'Food': 0, 'Drink': 0, 'Shopping': 0, 'Transportation': 0,
                    'Bills': 0, 'Health': 0, 'Entertainment': 0, 'Others': 0
                };
                
                let lastMonthCategoryData = {
                    'Food': 0, 'Drink': 0, 'Shopping': 0, 'Transportation': 0,
                    'Bills': 0, 'Health': 0, 'Entertainment': 0, 'Others': 0
                };

                let trendData = new Array(12).fill(0);
                
                const now = new Date();
                const currentMonth = now.getMonth();
                const currentYear = now.getFullYear();

                snapshot.forEach(doc => {
                    const data = doc.data();
                    const amt = Number(data.amount) || 0;

                    if (data.date) {
                        const dateObj = data.date.toDate ? data.date.toDate() : new Date(data.date.seconds * 1000);
                        const dMonth = dateObj.getMonth();
                        const dYear = dateObj.getFullYear();
                        
                        if (dYear === currentYear && dMonth === currentMonth) {
                            currentMonthSpending += amt;
                            currentMonthCount++;
                            if (categoryData[data.category] !== undefined) {
                                categoryData[data.category] += amt;
                            } else {
                                categoryData['Others'] += amt;
                            }
                        } else if ((dYear === currentYear && dMonth === currentMonth - 1) || (currentMonth === 0 && dYear === currentYear - 1 && dMonth === 11)) {
                            lastMonthSpending += amt;
                            if (lastMonthCategoryData[data.category] !== undefined) {
                                lastMonthCategoryData[data.category] += amt;
                            } else {
                                lastMonthCategoryData['Others'] += amt;
                            }
                        }

                        if (dMonth < 12) trendData[dMonth] += amt;
                    }
                });

                // 1. Biggest Spending Category
                let topCat = 'Others';
                let topAmt = 0;
                for (let cat in categoryData) {
                    if (categoryData[cat] > topAmt) {
                        topAmt = categoryData[cat];
                        topCat = cat;
                    }
                }
                
                let lastTopAmt = lastMonthCategoryData[topCat] || 0;
                let biggestSpendingDiff = 0;
                if (lastTopAmt === 0) {
                    biggestSpendingDiff = topAmt > 0 ? 100 : 0;
                } else {
                    biggestSpendingDiff = ((topAmt - lastTopAmt) / lastTopAmt) * 100;
                }

                // 2. Total Savings
                const currentSavings = Math.max(0, monthlyBudget - currentMonthSpending);
                const lastSavings = Math.max(0, monthlyBudget - lastMonthSpending);
                let savingsDiff = 0;
                if (lastSavings === 0) {
                    savingsDiff = currentSavings > 0 ? 100 : 0;
                } else {
                    savingsDiff = ((currentSavings - lastSavings) / lastSavings) * 100;
                }

                // 3. Daily Average
                const daysPassed = now.getDate(); // current day of month
                const dailyAvg = currentMonthSpending / daysPassed;
                const targetDailyAvg = monthlyBudget / 30; // approx 30 days
                let dailyAvgDiff = 0;
                if (targetDailyAvg === 0) {
                    dailyAvgDiff = dailyAvg > 0 ? 100 : 0;
                } else {
                    dailyAvgDiff = ((dailyAvg - targetDailyAvg) / targetDailyAvg) * 100;
                }

                // 4. Update Summary Cards
                if (summaryAmounts.length >= 3) {
                    // Biggest Spending
                    summaryAmounts[0].innerText = '$' + topAmt.toLocaleString(undefined, { maximumFractionDigits: 0 });
                    const bsBadge = document.querySelector('.summary-card:nth-child(1) .card-footer span:nth-child(1)');
                    const bsCat = document.querySelector('.summary-card:nth-child(1) .card-footer span:nth-child(2)');
                    if (bsBadge) {
                        bsBadge.innerText = `${biggestSpendingDiff > 0 ? '+' : ''}${biggestSpendingDiff.toFixed(1)}% vs last month`;
                        bsBadge.className = biggestSpendingDiff > 0 ? 'badge-red-light' : 'badge-green-light';
                        bsBadge.style.color = biggestSpendingDiff > 0 ? '#ef4444' : '#10b981';
                        bsBadge.style.backgroundColor = biggestSpendingDiff > 0 ? '#fee2e2' : '#dcfce7';
                    }
                    if (bsCat) bsCat.innerText = topCat;

                    // Total Savings
                    summaryAmounts[1].innerText = '$' + currentSavings.toLocaleString(undefined, { maximumFractionDigits: 0 });
                    const tsBadge = document.querySelector('.summary-card:nth-child(2) .card-footer span:nth-child(1)');
                    if (tsBadge) {
                        tsBadge.innerText = `${savingsDiff > 0 ? '+' : ''}${savingsDiff.toFixed(1)}% vs last month`;
                        tsBadge.className = savingsDiff >= 0 ? 'badge-green-light' : 'badge-red-light';
                        tsBadge.style.color = savingsDiff >= 0 ? '#10b981' : '#ef4444';
                        tsBadge.style.backgroundColor = savingsDiff >= 0 ? '#dcfce7' : '#fee2e2';
                    }

                    // Daily Average
                    summaryAmounts[2].innerText = '$' + dailyAvg.toLocaleString(undefined, { maximumFractionDigits: 1 });
                    const daBadge = document.querySelector('.summary-card:nth-child(3) .card-footer span:nth-child(1)');
                    if (daBadge) {
                        daBadge.innerText = `${dailyAvgDiff > 0 ? '+' : ''}${dailyAvgDiff.toFixed(1)}% vs target`;
                        daBadge.className = dailyAvgDiff > 0 ? 'badge-yellow-light' : 'badge-green-light';
                        daBadge.style.color = dailyAvgDiff > 0 ? '#f59e0b' : '#10b981';
                        daBadge.style.backgroundColor = dailyAvgDiff > 0 ? '#fef3c7' : '#dcfce7';
                    }
                }

                // 5. Update Charts
                if (window.updateChartsWithData) {
                    window.updateChartsWithData(trendData.slice(0, 9), Object.values(categoryData));
                }

                // 6. Generate Smart Tip
                generateSmartTip(currentMonthSpending, categoryData);
                
                lucide.createIcons();
            });
    }

    function generateSmartTip(total, categories) {
        if (!tipText) return;

        // Priority 1: AI Recommendations if available
        if (currentAIReport && currentAIReport.recommendations && currentAIReport.recommendations.length > 0) {
            tipText.innerHTML = formatTipText(currentAIReport.recommendations[0]);
            return;
        }

        // Priority 2: Fallback to rule-based logic
        let topCat = 'Others';
        let topAmt = 0;
        for (let cat in categories) {
            if (categories[cat] > topAmt) {
                topAmt = categories[cat];
                topCat = cat;
            }
        }

        if (total === 0) {
            tipText.innerText = "Start adding your expenses to get personalized financial tips!";
            return;
        }

        const percentage = ((topAmt / total) * 100).toFixed(0);
        
        if (total > monthlyBudget) {
            tipText.innerHTML = `Warning: You are <span class="text-orange">over budget</span> by $${(total - monthlyBudget).toLocaleString()}. Try reducing your <strong>${topCat}</strong> spending which accounts for ${percentage}% of your total.`;
        } else if (percentage > 50) {
            tipText.innerHTML = `Your <strong>${topCat}</strong> spending is quite high (${percentage}% of total). Consider finding cheaper alternatives to save more this month.`;
        } else {
            tipText.innerHTML = `Great job! Your spending is well distributed. You've saved <span class="text-orange">$${(monthlyBudget - total).toLocaleString()}</span> so far. Keep it up!`;
        }
    }

    function formatTipText(text) {
        // Highlight numbers and percentages
        return text.replace(/(\$\d+(?:\.\d+)?|\d+%)/g, '<span class="text-orange">$1</span>');
    }

    /* ── AI Analysis Logic ── */
    const aiContainer = document.getElementById('aiInsightsContainer');
    const btnAnalyzeAI = document.getElementById('btnAnalyzeAI');
    const aiSummary = document.getElementById('aiSummary');
    const aiInsightsList = document.getElementById('aiInsightsList');
    const aiRecommendationsList = document.getElementById('aiRecommendationsList');
    const aiStatus = document.getElementById('aiStatus');

    async function checkExistingAnalysis() {
        if (!currentUser) return;
        
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        
        try {
            const aiDoc = await db.collection('users').doc(currentUser.uid)
                                 .collection('ai_reports').doc(currentMonth).get();
            
            if (aiDoc.exists) {
                currentAIReport = aiDoc.data();
                displayAIResults(currentAIReport);
            }
            
            if (aiContainer) aiContainer.style.display = 'block';
        } catch (e) {
            console.error("Error checking AI analysis:", e);
        }
    }

    function displayAIResults(data) {
        if (!data) return;
        
        if (aiSummary) aiSummary.innerText = data.summary || "No summary available.";
        
        if (aiInsightsList) {
            aiInsightsList.innerHTML = (data.insights || [])
                .map(insight => `<li>${insight}</li>`).join('');
        }
        
        if (aiRecommendationsList) {
            aiRecommendationsList.innerHTML = (data.recommendations || [])
                .map(rec => `<li>${rec}</li>`).join('');
        }
        
        if (aiStatus) aiStatus.innerText = "Analyzed";
        if (btnAnalyzeAI) btnAnalyzeAI.innerText = "Re-analyze with AI";
    }

    if (btnAnalyzeAI) {
        btnAnalyzeAI.addEventListener('click', async () => {
            const now = new Date();
            const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            
            btnAnalyzeAI.disabled = true;
            btnAnalyzeAI.innerHTML = '<span class="spinner"></span> Analyzing...';
            if (aiStatus) aiStatus.innerText = "Processing...";

            try {
                const functions = firebase.functions();
                const analyzeFn = functions.httpsCallable('analyzeMonthlySpending');
                const result = await analyzeFn({ month: currentMonth, force: true });
                currentAIReport = result.data;
                displayAIResults(currentAIReport);
                
                // Also update the tip banner
                loadData(); 
            } catch (error) {
                console.error("AI Analysis failed:", error);
                alert("Failed to analyze spending: " + error.message);
                if (aiStatus) aiStatus.innerText = "Error";
            } finally {
                btnAnalyzeAI.disabled = false;
                btnAnalyzeAI.innerHTML = '<i data-lucide="zap" style="width: 16px; margin-right: 8px;"></i> Generate AI Analysis';
                lucide.createIcons();
            }
        });
    }
});
