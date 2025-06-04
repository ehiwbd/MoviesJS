/**
 * Simple router for handling navigation between pages
 * Manages hash-based routing for SPA functionality
 */
class Router {
    constructor() {
        this.routes = {
            '/': () => this.renderPage(HomePage),
            '/home': () => this.renderPage(HomePage),
            '/profile': () => this.renderPage(ProfilePage),
            '/reviews': () => this.renderPage(ReviewsPage)
        };
        this.currentPage = null;
    }

    /**
     * Initialize the router
     */
    init() {
        this.handleRoute();
    }

    /**
     * Navigate to a specific route
     */
    navigate(route) {
        window.location.hash = route;
        this.handleRoute();
    }

    /**
     * Handle current route
     */
    handleRoute() {
        const hash = window.location.hash.slice(1) || '/';
        const route = this.findRoute(hash);
        
        if (route && this.routes[route]) {
            this.routes[route]();
        } else {
            // Default to home page
            this.routes['/']();
        }
    }

    /**
     * Find matching route
     */
    findRoute(hash) {
        // Remove query parameters for route matching
        const routePath = hash.split('?')[0];
        
        // Check for exact match first
        if (this.routes[routePath]) {
            return routePath;
        }
        
        // Default to home
        return '/';
    }

    /**
     * Render a page component
     */
    renderPage(PageClass) {
        try {
            // Destroy current page if exists
            if (this.currentPage && typeof this.currentPage.destroy === 'function') {
                this.currentPage.destroy();
            }

            // Create and render new page
            this.currentPage = new PageClass();
            this.currentPage.render();

            // Store reference for header access
            if (PageClass === HomePage) {
                window.homePage = this.currentPage;
            }

        } catch (error) {
            console.error('Error rendering page:', error);
            this.showErrorPage(error.message);
        }
    }

    /**
     * Show error page
     */
    showErrorPage(message) {
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="error-page">
                    <div class="container">
                        <div class="error-content">
                            <h1>Ошибка загрузки страницы</h1>
                            <p>${message}</p>
                            <button class="btn btn-primary" onclick="window.location.reload()">
                                Обновить страницу
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    /**
     * Get current route
     */
    getCurrentRoute() {
        return window.location.hash.slice(1) || '/';
    }

    /**
     * Check if route is active
     */
    isRouteActive(route) {
        const currentRoute = this.getCurrentRoute().split('?')[0];
        return currentRoute === route;
    }
}