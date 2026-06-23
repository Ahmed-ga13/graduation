import { setGlobalOptions } from "firebase-functions";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

setGlobalOptions({ maxInstances: 10 });

const FAST_API_URL = "https://ahmed-m-final-project.hf.space/analyze";

export const analyzeMonthlySpending = onCall(async (request) => {
    // 1. Authenticate
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "User must be logged in.");
    }

    const uid = request.auth.uid;
    const { month, force } = request.data; // Expected format: "2024-05"

    if (!month) {
        throw new HttpsError("invalid-argument", "Month is required.");
    }

    const aiReportRef = db.collection("users").doc(uid).collection("ai_reports").doc(month);
    const reportRef = db.collection("users").doc(uid).collection("reports").doc(month);

    // 2. Check for cached result (skip if force=true)
    if (!force) {
        const aiDoc = await aiReportRef.get();
        if (aiDoc.exists) {
            logger.info(`Returning cached AI report for ${uid} and ${month}`);
            return aiDoc.data();
        }
    } else {
        logger.info(`Force re-analysis requested for ${uid} and ${month}`);
    }

    // 3. Get or generate monthly report
    let reportData: any = null;
    const reportDoc = await reportRef.get();

    if (reportDoc.exists) {
        reportData = reportDoc.data();
    } else {
        // Generate aggregation on the fly
        logger.info(`Aggregating data for ${uid} and ${month}`);
        
        // Find start and end date for the month
        const [year, m] = month.split("-").map(Number);
        const startDate = new Date(year, m - 1, 1);
        const endDate = new Date(year, m, 0, 23, 59, 59);

        const expensesSnapshot = await db.collection("expenses")
            .where("userId", "==", uid)
            .where("date", ">=", startDate)
            .where("date", "<=", endDate)
            .get();

        let totalSpending = 0;
        const categories: { [key: string]: number } = {
            "Food": 0, "Drink": 0, "Shopping": 0, "Transportation": 0,
            "Bills": 0, "Health": 0, "Entertainment": 0, "Others": 0,
        };

        expensesSnapshot.forEach((doc) => {
            const data = doc.data();
            const amt = Number(data.amount) || 0;
            totalSpending += amt;
            const cat = data.category || "Others";
            categories[cat] = (categories[cat] || 0) + amt;
        });

        reportData = {
            totalSpending,
            categories,
            month,
            userId: uid,
            generatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        // Save aggregated report
        await reportRef.set(reportData);
    }

    // 4. Call FastAPI
    try {
        // Fetch User Budget for Salary
        const userDoc = await db.collection("users").doc(uid).get();
        const userData = userDoc.data();
        const salary = userData?.budget || 2500;

        const cats = reportData.categories;
        const apiBody = {
            user_id: uid,
            month: month,
            salary: salary,
            food: (cats["Food"] || 0) + (cats["Dining"] || 0),
            drink: cats["Drink"] || 0,
            shopping: cats["Shopping"] || 0,
            transport: cats["Transportation"] || 0,
            bills: cats["Bills"] || 0,
            health: cats["Health"] || 0,
            entertainment: cats["Entertainment"] || 0,
        };

        logger.info(`Calling AI API for ${uid} and ${month}`);
        const response = await fetch(FAST_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(apiBody),
        });

        if (!response.ok) {
            const errorText = await response.text();
            logger.error(`AI API failed: ${response.status} ${errorText}`);
            throw new Error(`AI API responded with status ${response.status}`);
        }

        const aiResult = await response.json();
        
        // 5. Store and return result
        const finalResult = {
            summary: `إجمالي المصروفات: $${aiResult.total_spend || 0}، المتبقي من الميزانية: $${aiResult.remaining || 0}.`,
            insights: [],
            recommendations: aiResult.recommendation ? [aiResult.recommendation] : [],
            analyzedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        await aiReportRef.set(finalResult);
        return finalResult;

    } catch (error: any) {
        logger.error(`Analysis failed: ${error.message}`);
        throw new HttpsError("internal", "Failed to analyze spending. Please try again later.");
    }
});
