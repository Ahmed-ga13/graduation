/* ==========================================================
   auth.js — Firebase Authentication Logic
   Smart Spend | Used on all pages
   ========================================================== */

// Auth State Monitoring & Route Protection
auth.onAuthStateChanged(async (user) => {
    const path = window.location.pathname;
    const isAuthPage = path.includes('login') || path.includes('register') || path === '/' || path === '';

    if (user) {
        console.log("Auth State: Logged In", user.email);
        
        // Ensure user document exists in Firestore
        try {
            const userRef = db.collection('users').doc(user.uid);
            const doc = await userRef.get();
            if (!doc.exists) {
                const dataToSet = {
                    name: user.displayName || user.email.split('@')[0],
                    email: user.email,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    budget: 5000
                };
                console.log(`[Firestore Write] ProjectId: ${firebaseConfig.projectId}`);
                console.log(`[Firestore Write] currentUser.uid: ${user.uid}`);
                console.log(`[Firestore Write] Target Path: users/${user.uid}`);
                console.log(`[Firestore Write] Document Data:`, dataToSet);
                await userRef.set(dataToSet, { merge: true });
            }
        } catch (e) { console.error("Error syncing user doc:", e); }
        
        // Initialize global category map
        window.categoryMap = {};
        db.collection('users').doc(user.uid).collection('categories').onSnapshot(snap => {
            snap.forEach(c => window.categoryMap[c.id] = c.data().name || c.id);
            if (window.populateCategoryDropdown) window.populateCategoryDropdown();
        });
        db.collection('categories').onSnapshot(snap => {
            snap.forEach(c => window.categoryMap[c.id] = c.data().name || c.id);
            if (window.populateCategoryDropdown) window.populateCategoryDropdown();
        });

        updateNavbarForUser(user);

        if (isAuthPage) {
            window.location.href = 'dashboard.html';
        }
    } else {
        console.log("Auth State: Logged Out");
        if (!isAuthPage) {
            window.location.href = 'login.html';
        }
    }
});

// UI Helpers
function updateNavbarForUser(user) {
    const navActions = document.querySelector('.nav-actions');
    if (navActions && !window.location.pathname.includes('login') && !window.location.pathname.includes('register')) {
        const displayName = user.displayName || user.email.split('@')[0];
        navActions.innerHTML = `
            <div class="user-nav-info" style="display:flex; align-items:center; gap:12px;">
                <span style="font-size:14px; font-weight:500; color:#111827;">${displayName}</span>
                <div style="width:36px; height:36px; border-radius:50%; background:#125e3a; color:white; display:flex; align-items:center; justify-content:center; font-weight:600; font-size:14px; text-transform:uppercase;">
                    ${displayName.charAt(0)}
                </div>
                <button class="btn-logout-nav" id="logoutBtnNav" style="background:none; border:none; color:#ef4444; cursor:pointer; font-size:14px; padding:0 5px;">Logout</button>
            </div>
        `;
        
        // Logout event for navbar button
        const logoutBtnNav = document.getElementById('logoutBtnNav');
        if (logoutBtnNav) {
            logoutBtnNav.onclick = () => auth.signOut();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {

    // 1. Register Logic
    const registerBtn = document.getElementById('registerBtn');
    if (registerBtn) {
        registerBtn.addEventListener('click', async () => {
            const name = document.getElementById('regName').value.trim();
            const email = document.getElementById('regEmail').value.trim();
            const password = document.getElementById('regPassword').value;
            const confirmPassword = document.getElementById('regConfirmPassword').value;

            if (!name || !email || !password) {
                alert("Please fill in all fields.");
                return;
            }

            if (password !== confirmPassword) {
                alert("Passwords do not match.");
                return;
            }

            try {
                registerBtn.disabled = true;
                registerBtn.innerText = "Creating account...";
                
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                const user = userCredential.user;

                // Update profile with name
                await user.updateProfile({ displayName: name });

                // Initialize user data in Firestore
                const dataToSet = {
                    name: name,
                    email: email,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    budget: 5000 
                };
                console.log(`[Firestore Write] ProjectId: ${firebaseConfig.projectId}`);
                console.log(`[Firestore Write] currentUser.uid: ${user.uid}`);
                console.log(`[Firestore Write] Target Path: users/${user.uid}`);
                console.log(`[Firestore Write] Document Data:`, dataToSet);
                await db.collection('users').doc(user.uid).set(dataToSet);

                window.location.href = 'dashboard.html';
            } catch (error) {
                console.error("Registration error:", error);
                alert(error.message);
                registerBtn.disabled = false;
                registerBtn.innerText = "Create an account";
            }
        });
    }

    // 2. Login Logic
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', async () => {
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;

            if (!email || !password) {
                alert("Please enter both email and password.");
                return;
            }

            try {
                loginBtn.disabled = true;
                loginBtn.innerText = "Logging in...";
                await auth.signInWithEmailAndPassword(email, password);
                window.location.href = 'dashboard.html';
            } catch (error) {
                console.error("Login error:", error);
                alert(error.message);
                loginBtn.disabled = false;
                loginBtn.innerText = "Login";
            }
        });
    }

    // 3. Google Login Logic
    const googleLoginBtn = document.getElementById('googleLoginBtn');
    const googleRegisterBtn = document.getElementById('googleRegisterBtn');
    
    const handleGoogleLogin = async () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        try {
            const result = await auth.signInWithPopup(provider);
            const user = result.user;

            // Check if user exists in Firestore, if not create
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (!userDoc.exists) {
                const dataToSet = {
                    name: user.displayName,
                    email: user.email,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    budget: 5000
                };
                console.log(`[Firestore Write] ProjectId: ${firebaseConfig.projectId}`);
                console.log(`[Firestore Write] currentUser.uid: ${user.uid}`);
                console.log(`[Firestore Write] Target Path: users/${user.uid}`);
                console.log(`[Firestore Write] Document Data:`, dataToSet);
                await db.collection('users').doc(user.uid).set(dataToSet);
            }
            window.location.href = 'dashboard.html';
        } catch (error) {
            console.error("Google Login error:", error);
            alert(error.message);
        }
    };

    if (googleLoginBtn) googleLoginBtn.addEventListener('click', handleGoogleLogin);
    if (googleRegisterBtn) googleRegisterBtn.addEventListener('click', handleGoogleLogin);

    // 4. Forgot Password Logic
    const forgotPasswordBtn = document.querySelector('.forgot-password');
    if (forgotPasswordBtn) {
        forgotPasswordBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value.trim();
            if (!email) return alert("Please enter your email to reset password.");
            try {
                await auth.sendPasswordResetEmail(email);
                alert("Password reset email sent! Check your inbox.");
            } catch (error) { alert(error.message); }
        });
    }

    // 5. Global Logout Logic
    const logoutBtn = document.querySelector('.btn-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => auth.signOut());
    }
});

// Global Helper for Account Page Password Update
window.updateUserPassword = async (newPassword) => {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error("No user logged in");
        await user.updatePassword(newPassword);
        return true;
    } catch (error) {
        console.error("Password update error:", error);
        if (error.code === 'auth/requires-recent-login') {
            alert("Please log out and log in again to change your password for security reasons.");
        } else {
            alert(error.message);
        }
        return false;
    }
};
