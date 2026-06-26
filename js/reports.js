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
    let monthlyBudget = 0;
    let currentAIReport = null;
    let currentCategoryData = null;
    let currentMonthTotal = 0;

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
            monthlyBudget = Number(userDoc.data().budget) || 0;
            if (monthlyBudget === 0) {
                alert("من فضلك قم بإدخال راتبك الشهري في صفحة الحساب (Account) لتتمكن من متابعة مصاريفك بشكل صحيح.");
            }
        }

        // 2. Initial AI Check
        await checkExistingAnalysis();

        // 3. Listen to Expenses
        db.collection('users').doc(currentUser.uid).collection('expenses')
            .onSnapshot(snapshot => {
                currentMonthTotal = 0;
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
                            currentMonthTotal += amt;
                            currentMonthCount++;
                            const rawCat = data.categoryId || data.category || 'Others';
                            const cat = window.categoryMap && window.categoryMap[rawCat] ? window.categoryMap[rawCat] : rawCat;
                            if (categoryData[cat] !== undefined) {
                                categoryData[cat] += amt;
                            } else {
                                categoryData['Others'] += amt;
                            }
                        } else if ((dYear === currentYear && dMonth === currentMonth - 1) || (currentMonth === 0 && dYear === currentYear - 1 && dMonth === 11)) {
                            lastMonthSpending += amt;
                            const rawCat = data.categoryId || data.category || 'Others';
                            const cat = window.categoryMap && window.categoryMap[rawCat] ? window.categoryMap[rawCat] : rawCat;
                            if (lastMonthCategoryData[cat] !== undefined) {
                                lastMonthCategoryData[cat] += amt;
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
                const currentSavings = Math.max(0, monthlyBudget - currentMonthTotal);
                const lastSavings = Math.max(0, monthlyBudget - lastMonthSpending);
                let savingsDiff = 0;
                if (lastSavings === 0) {
                    savingsDiff = currentSavings > 0 ? 100 : 0;
                } else {
                    savingsDiff = ((currentSavings - lastSavings) / lastSavings) * 100;
                }

                // 3. Daily Average
                const daysPassed = now.getDate(); // current day of month
                const dailyAvg = currentMonthTotal / daysPassed;
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
                    if (bsCat) {
                        const catName = window.categoryMap && window.categoryMap[topCat] ? window.categoryMap[topCat] : topCat;
                        bsCat.innerText = catName;
                    }

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

                currentCategoryData = categoryData;

                // 6. Generate Smart Tip
                generateSmartTip(currentMonthTotal, categoryData);
                
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

        const percentage = ((topAmt / total) * 100);
        
        const topCatName = window.categoryMap && window.categoryMap[topCat] ? window.categoryMap[topCat] : topCat;
        if (percentage > 50) {
            tipText.innerHTML = `You spent <span class="tip-highlight">$${topAmt.toLocaleString()}</span> on ${topCatName} this month, which is <span class="tip-highlight">${percentage.toFixed(0)}%</span> of your total spending. Consider reviewing this to increase your savings.`;
        } else if (total > monthlyBudget) {
            tipText.innerHTML = `Your total spending of <span class="tip-highlight">$${total.toLocaleString()}</span> has exceeded your monthly budget. Try to cut back on ${topCatName}.`;
        } else {
            tipText.innerHTML = `Great job! Your spending is well diversified. Your biggest expense was ${topCatName} at <span class="tip-highlight">$${topAmt.toLocaleString()}</span>. Keep it up!`;
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
            db.collection('users').doc(currentUser.uid)
                                 .collection('ai_reports').doc(currentMonth)
                                 .onSnapshot(aiDoc => {
                if (aiDoc.exists) {
                    currentAIReport = aiDoc.data();
                    displayAIResults(currentAIReport);
                    if (currentCategoryData !== null) {
                        generateSmartTip(currentMonthTotal, currentCategoryData);
                    }
                }
            });
            
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
                const cats = currentCategoryData || {};
                const apiBody = {
                    user_id: currentUser.uid,
                    month: currentMonth,
                    salary: monthlyBudget,
                    food: (cats["Food"] || 0) + (cats["Dining"] || 0),
                    drink: cats["Drink"] || 0,
                    shopping: cats["Shopping"] || 0,
                    transport: cats["Transportation"] || 0,
                    bills: cats["Bills"] || 0,
                    health: cats["Health"] || 0,
                    entertainment: cats["Entertainment"] || 0,
                };

                const response = await fetch("https://ahmed-m-final-project.hf.space/analyze", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(apiBody),
                });
                
                if (!response.ok) throw new Error("AI API failed");
                const aiResult = await response.json();

                const finalResult = {
                    summary: `إجمالي المصروفات: $${aiResult.total_spend || 0}، المتبقي من الميزانية: $${aiResult.remaining || 0}.`,
                    insights: [],
                    recommendations: aiResult.recommendation ? [aiResult.recommendation] : [],
                    analyzedAt: firebase.firestore.FieldValue.serverTimestamp(),
                };

                await db.collection('users').doc(currentUser.uid).collection('ai_reports').doc(currentMonth).set(finalResult);
                
                // The onSnapshot listener will automatically call displayAIResults() and update the tip banner
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
