// Client Portal JavaScript
class WellnessPortal {
    constructor() {
        this.currentClient = 'Jordan Smith';
        this.currentPage = 'overview';
        this.data = this.loadData();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadClientData();
        this.showPage('overview');
    }

    setupEventListeners() {
        // Hamburger menu toggle
        const hamburgerMenu = document.getElementById('hamburgerMenu');
        const navMenu = document.getElementById('navMenu');
        
        hamburgerMenu.addEventListener('click', () => {
            hamburgerMenu.classList.toggle('active');
            navMenu.classList.toggle('show');
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!hamburgerMenu.contains(e.target) && !navMenu.contains(e.target)) {
                hamburgerMenu.classList.remove('active');
                navMenu.classList.remove('show');
            }
        });

        // Navigation buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const page = e.target.dataset.page;
                this.showPage(page);
                // Close mobile menu after selection
                hamburgerMenu.classList.remove('active');
                navMenu.classList.remove('show');
            });
        });

        // Overview modality cards
        document.querySelectorAll('.modality-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const page = e.target.closest('.modality-card').dataset.page;
                this.showPage(page);
            });
        });

        // History links
        document.querySelectorAll('.history-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const details = e.target.nextElementSibling;
                if (details.style.display === 'none') {
                    details.style.display = 'block';
                    e.target.textContent = 'Hide details';
                } else {
                    details.style.display = 'none';
                    e.target.textContent = 'Click for details';
                }
            });
        });
    }

    showPage(pageId) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });

        // Show selected page
        document.getElementById(pageId).classList.add('active');

        // Update navigation buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-page="${pageId}"]`).classList.add('active');

        this.currentPage = pageId;
        this.saveData();
    }

    loadData() {
        const savedData = localStorage.getItem('wellnessPortalData');
        return savedData ? JSON.parse(savedData) : this.getDefaultData();
    }

    saveData() {
        const dataToSave = {
            ...this.data,
            currentPage: this.currentPage
        };
        localStorage.setItem('wellnessPortalData', JSON.stringify(dataToSave));
    }

    getDefaultData() {
        return {
            clients: {
                'Jordan Smith': {
                    complaints: [
                        'Cough at night',
                        'Headaches',
                        'Tired & unmotivated'
                    ],
                    overallRecommendations: [
                        'Homeopathic Herbal',
                        'Homeopathic Herbal Massage',
                        'Human Design'
                    ],
                    homeopathy: {
                        current: ['Carbo Veg'],
                        history: [
                            { date: '2024-01-15', treatment: 'Arnica 30C', notes: 'For general fatigue' },
                            { date: '2024-02-20', treatment: 'Pulsatilla 6C', notes: 'For night cough' }
                        ]
                    },
                    humanDesign: {
                        current: ['Twice Monthly Massage'],
                        chart: 'manifestor', // This would contain chart data
                        history: [
                            { date: '2024-01-10', session: 'Initial reading', notes: 'Discovered manifestor type' }
                        ]
                    },
                    herbalNutrition: {
                        current: ['Evening Primrose Oil', 'Magnesium supplement', 'Anti-inflammatory diet'],
                        history: [
                            { date: '2024-01-05', treatment: 'Turmeric supplement', notes: 'For inflammation' }
                        ]
                    },
                    selfCare: {
                        current: ['Twice Monthly Massage', 'Daily meditation (10 minutes)', 'Evening breathing exercises'],
                        history: [
                            { date: '2024-01-20', practice: 'Morning yoga routine', notes: 'Started 20-minute routine' }
                        ]
                    },
                    homeDetox: {
                        current: ['Lemon water morning routine', 'Dry brushing before shower', 'Liver support herbs'],
                        history: [
                            { date: '2024-01-25', protocol: '7-day liver cleanse', notes: 'Completed successfully' }
                        ]
                    }
                }
            },
            currentPage: 'overview'
        };
    }

    loadClientData() {
        const clientData = this.data.clients[this.currentClient];
        if (!clientData) return;

        // Update client name
        document.getElementById('clientName').textContent = this.currentClient;

        // Load complaints
        const complaintsList = document.getElementById('complaints-list');
        complaintsList.innerHTML = '';
        clientData.complaints.forEach(complaint => {
            const li = document.createElement('li');
            li.textContent = complaint;
            complaintsList.appendChild(li);
        });

        // Load overall recommendations
        const overallRecList = document.getElementById('overall-recommendations-list');
        overallRecList.innerHTML = '';
        clientData.overallRecommendations.forEach(rec => {
            const li = document.createElement('li');
            li.textContent = rec;
            overallRecList.appendChild(li);
        });

        // Load modality-specific recommendations
        this.updateModalityRecommendations('homeopathy', clientData.homeopathy.current);
        this.updateModalityRecommendations('human-design', clientData.humanDesign.current);
        this.updateModalityRecommendations('herbal', clientData.herbalNutrition.current);
        this.updateModalityRecommendations('self-care', clientData.selfCare.current);
        this.updateModalityRecommendations('detox', clientData.homeDetox.current);

        // Load history details
        this.loadHistoryDetails(clientData);

        // Restore current page
        if (this.data.currentPage) {
            this.showPage(this.data.currentPage);
        }
    }

    updateModalityRecommendations(modalityPrefix, recommendations) {
        const elementId = `${modalityPrefix}-recommendations`;
        const element = document.getElementById(elementId);
        if (!element) return;

        element.innerHTML = '';
        recommendations.forEach(rec => {
            const li = document.createElement('li');
            li.textContent = rec;
            element.appendChild(li);
        });
    }

    loadHistoryDetails(clientData) {
        // This would populate the history sections with actual data
        // For now, we'll just update the placeholder text
        const historyDetails = document.querySelectorAll('.history-details p');
        historyDetails.forEach(detail => {
            detail.textContent = 'Treatment history and progress notes would be loaded here from the client data...';
        });
    }

    // Admin functions (for adding data)
    addComplaint(complaint) {
        if (!this.data.clients[this.currentClient]) {
            this.data.clients[this.currentClient] = this.getDefaultData().clients['Jordan Smith'];
        }
        this.data.clients[this.currentClient].complaints.push(complaint);
        this.saveData();
        this.loadClientData();
    }

    addRecommendation(modality, recommendation) {
        if (!this.data.clients[this.currentClient]) {
            this.data.clients[this.currentClient] = this.getDefaultData().clients['Jordan Smith'];
        }
        
        switch(modality) {
            case 'overall':
                this.data.clients[this.currentClient].overallRecommendations.push(recommendation);
                break;
            case 'homeopathy':
                this.data.clients[this.currentClient].homeopathy.current.push(recommendation);
                break;
            case 'human-design':
                this.data.clients[this.currentClient].humanDesign.current.push(recommendation);
                break;
            case 'herbal':
                this.data.clients[this.currentClient].herbalNutrition.current.push(recommendation);
                break;
            case 'self-care':
                this.data.clients[this.currentClient].selfCare.current.push(recommendation);
                break;
            case 'detox':
                this.data.clients[this.currentClient].homeDetox.current.push(recommendation);
                break;
        }
        this.saveData();
        this.loadClientData();
    }

    addHistoryEntry(modality, entry) {
        if (!this.data.clients[this.currentClient]) {
            this.data.clients[this.currentClient] = this.getDefaultData().clients['Jordan Smith'];
        }
        
        const currentDate = new Date().toISOString().split('T')[0];
        const historyEntry = {
            date: currentDate,
            ...entry
        };
        
        switch(modality) {
            case 'homeopathy':
                this.data.clients[this.currentClient].homeopathy.history.push(historyEntry);
                break;
            case 'human-design':
                this.data.clients[this.currentClient].humanDesign.history.push(historyEntry);
                break;
            case 'herbal':
                this.data.clients[this.currentClient].herbalNutrition.history.push(historyEntry);
                break;
            case 'self-care':
                this.data.clients[this.currentClient].selfCare.history.push(historyEntry);
                break;
            case 'detox':
                this.data.clients[this.currentClient].homeDetox.history.push(historyEntry);
                break;
        }
        this.saveData();
    }

    // Switch client (for future multi-client support)
    switchClient(clientName) {
        this.currentClient = clientName;
        this.loadClientData();
    }

    // Clear all data (admin function)
    clearAllData() {
        localStorage.removeItem('wellnessPortalData');
        this.data = this.getDefaultData();
        this.loadClientData();
    }

    // Export client data
    exportClientData(clientName = this.currentClient) {
        const clientData = this.data.clients[clientName];
        if (clientData) {
            const dataStr = JSON.stringify(clientData, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            
            const exportFileDefaultName = `${clientName.replace(/\s+/g, '_')}_wellness_data.json`;
            
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
        }
    }
}

// Initialize the portal when the page loads
document.addEventListener('DOMContentLoaded', function() {
    window.wellnessPortal = new WellnessPortal();
});

// Console helper functions for testing/admin
window.addComplaint = (complaint) => window.wellnessPortal.addComplaint(complaint);
window.addRecommendation = (modality, rec) => window.wellnessPortal.addRecommendation(modality, rec);
window.addHistory = (modality, entry) => window.wellnessPortal.addHistoryEntry(modality, entry);
window.exportData = () => window.wellnessPortal.exportClientData();
window.clearData = () => window.wellnessPortal.clearAllData();
