document.addEventListener('DOMContentLoaded', () => {
    const navTabs = document.querySelector('.nav-tabs');
    const tabs = document.querySelectorAll('.nav-tabs a');
    let underline = document.querySelector('.nav-underline');

    // Create underline element if it doesn't exist
    if (!underline) {
        underline = document.createElement('div');
        underline.classList.add('nav-underline');
        navTabs.appendChild(underline);
    }

    // Function to update underline position and width
    const updateUnderline = (activeTab) => {
        if (!activeTab) return;
        const rect = activeTab.getBoundingClientRect();
        const navRect = navTabs.getBoundingClientRect();
        underline.style.width = `${rect.width}px`;
        underline.style.left = `${rect.left - navRect.left}px`;
    };

    // Initialize underline position
    const activeTab = document.querySelector('.nav-tabs a.active');
    if (activeTab) {
        updateUnderline(activeTab);
    }

    // Update underline on window resize
    window.addEventListener('resize', () => {
        const currentActiveTab = document.querySelector('.nav-tabs a.active');
        updateUnderline(currentActiveTab);
    });
});