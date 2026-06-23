/* ==========================================================
   navbar.js — Mobile Hamburger Menu Toggle
   Smart Spend | Shared across: Dashboard, Reports, Expense List, Account
   ========================================================== */

document.addEventListener('DOMContentLoaded', () => {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navbar        = document.querySelector('.navbar');

    if (!mobileMenuBtn || !navbar) return;

    mobileMenuBtn.addEventListener('click', () => {
        navbar.classList.toggle('open');

        const isOpen = navbar.classList.contains('open');
        mobileMenuBtn.innerHTML = `<i data-lucide="${isOpen ? 'x' : 'menu'}"></i>`;

        lucide.createIcons();
    });
});
