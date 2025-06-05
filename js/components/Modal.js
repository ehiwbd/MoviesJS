/**
 * Modal component for displaying overlays and dialogs
 * Handles modal creation, display, and interaction management
 */
class Modal {
    constructor() {
        this.isOpen = false;
        this.modalElement = null;
        this.onClose = null;
        this.escapeKeyHandler = this.handleEscapeKey.bind(this);
    }

    /**
     * Show modal with specified content and options
     */
    show(options = {}) {
        const {
            title = '',
            content = '',
            size = 'medium',
            closable = true,
            backdrop = true,
            className = '',
            onClose = null
        } = options;

        // Close any existing modal
        this.hide();

        this.onClose = onClose;

        // Create modal overlay
        this.modalElement = document.createElement('div');
        this.modalElement.className = 'modal-overlay';
        this.modalElement.innerHTML = this.renderModal(title, content, size, closable, className);

        // Add to DOM
        document.body.appendChild(this.modalElement);
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';

        // Setup event listeners
        this.setupEventListeners(backdrop, closable);

        // Animate in
        setTimeout(() => {
            this.modalElement.classList.add('modal-open');
        }, 10);

        this.isOpen = true;

        return this;
    }

    /**
     * Hide and remove modal
     */
    hide() {
        if (!this.isOpen || !this.modalElement) return;

        // Call onClose callback if provided
        if (this.onClose && typeof this.onClose === 'function') {
            this.onClose();
        }

        // Animate out
        this.modalElement.classList.add('modal-closing');

        setTimeout(() => {
            if (this.modalElement && this.modalElement.parentNode) {
                this.modalElement.parentNode.removeChild(this.modalElement);
            }
            
            // Restore body scroll
            document.body.style.overflow = '';
            
            // Remove escape key listener
            document.removeEventListener('keydown', this.escapeKeyHandler);
            
            this.modalElement = null;
            this.isOpen = false;
        }, 300);

        return this;
    }

    /**
     * Render modal HTML structure
     */
    renderModal(title, content, size, closable, className) {
        return `
            <div class="modal modal-${size} ${className}" role="dialog" aria-modal="true">
                ${title ? `
                    <div class="modal-header">
                        <h2 class="modal-title">${title}</h2>
                        ${closable ? `
                            <button class="modal-close" aria-label="Закрыть">
                                <i class="fas fa-times"></i>
                            </button>
                        ` : ''}
                    </div>
                ` : ''}
                
                <div class="modal-body">
                    ${content}
                </div>
            </div>
        `;
    }

    /**
     * Setup event listeners for modal interactions
     */
    setupEventListeners(backdrop, closable) {
        if (!this.modalElement) return;

        // Close button
        if (closable) {
            const closeButton = this.modalElement.querySelector('.modal-close');
            if (closeButton) {
                closeButton.addEventListener('click', () => this.hide());
            }
        }

        // Backdrop click
        if (backdrop) {
            this.modalElement.addEventListener('click', (e) => {
                if (e.target === this.modalElement) {
                    this.hide();
                }
            });
        }

        // Escape key
        document.addEventListener('keydown', this.escapeKeyHandler);

        // Prevent modal content from closing when clicked
        const modalContent = this.modalElement.querySelector('.modal');
        if (modalContent) {
            modalContent.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }
    }

    /**
     * Handle escape key press
     */
    handleEscapeKey(e) {
        if (e.key === 'Escape' && this.isOpen) {
            this.hide();
        }
    }

    /**
     * Update modal content
     */
    updateContent(content) {
        if (!this.modalElement) return;

        const modalBody = this.modalElement.querySelector('.modal-body');
        if (modalBody) {
            modalBody.innerHTML = content;
        }
    }

    /**
     * Update modal title
     */
    updateTitle(title) {
        if (!this.modalElement) return;

        const modalTitle = this.modalElement.querySelector('.modal-title');
        if (modalTitle) {
            modalTitle.textContent = title;
        }
    }

    /**
     * Add loading state to modal
     */
    showLoading(message = 'Загрузка...') {
        this.updateContent(`
            <div class="modal-loading">
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                </div>
                <p>${message}</p>
            </div>
        `);
    }

    /**
     * Show error state in modal
     */
    showError(message = 'Произошла ошибка', details = '') {
        this.updateContent(`
            <div class="modal-error">
                <div class="error-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h3>Ошибка</h3>
                <p>${message}</p>
                ${details ? `<div class="error-details">${details}</div>` : ''}
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="this.closest('.modal-overlay').remove()">
                        Закрыть
                    </button>
                </div>
            </div>
        `);
    }

    /**
     * Static method to show confirmation dialog
     */
    static confirm(options = {}) {
        const {
            title = 'Подтверждение',
            message = 'Вы уверены?',
            confirmText = 'Да',
            cancelText = 'Отмена',
            onConfirm = null,
            onCancel = null,
            type = 'default' // default, danger, warning
        } = options;

        return new Promise((resolve) => {
            const modal = new Modal();
            
            modal.show({
                title: title,
                content: `
                    <div class="confirmation-dialog">
                        <div class="confirmation-icon ${type}">
                            <i class="fas fa-${type === 'danger' ? 'exclamation-triangle' : type === 'warning' ? 'exclamation-circle' : 'question-circle'}"></i>
                        </div>
                        <p class="confirmation-message">${message}</p>
                        <div class="modal-footer">
                            <button class="btn btn-secondary cancel-btn">
                                ${cancelText}
                            </button>
                            <button class="btn ${type === 'danger' ? 'btn-danger' : 'btn-primary'} confirm-btn">
                                ${confirmText}
                            </button>
                        </div>
                    </div>
                `,
                size: 'small',
                className: 'confirmation-modal'
            });

            // Setup button handlers
            setTimeout(() => {
                const confirmBtn = modal.modalElement.querySelector('.confirm-btn');
                const cancelBtn = modal.modalElement.querySelector('.cancel-btn');

                if (confirmBtn) {
                    confirmBtn.addEventListener('click', () => {
                        if (onConfirm) onConfirm();
                        resolve(true);
                        modal.hide();
                    });
                }

                if (cancelBtn) {
                    cancelBtn.addEventListener('click', () => {
                        if (onCancel) onCancel();
                        resolve(false);
                        modal.hide();
                    });
                }
            }, 10);
        });
    }

    /**
     * Static method to show alert dialog
     */
    static alert(options = {}) {
        const {
            title = 'Уведомление',
            message = '',
            buttonText = 'OK',
            type = 'info' // info, success, warning, error
        } = options;

        return new Promise((resolve) => {
            const modal = new Modal();
            
            modal.show({
                title: title,
                content: `
                    <div class="alert-dialog">
                        <div class="alert-icon ${type}">
                            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : type === 'error' ? 'times-circle' : 'info-circle'}"></i>
                        </div>
                        <p class="alert-message">${message}</p>
                        <div class="modal-footer">
                            <button class="btn btn-primary ok-btn">
                                ${buttonText}
                            </button>
                        </div>
                    </div>
                `,
                size: 'small',
                className: 'alert-modal'
            });

            // Setup OK button handler
            setTimeout(() => {
                const okBtn = modal.modalElement.querySelector('.ok-btn');
                if (okBtn) {
                    okBtn.addEventListener('click', () => {
                        resolve(true);
                        modal.hide();
                    });
                }
            }, 10);
        });
    }

    /**
     * Static method to show prompt dialog
     */
    static prompt(options = {}) {
        const {
            title = 'Ввод данных',
            message = '',
            placeholder = '',
            defaultValue = '',
            inputType = 'text',
            required = false,
            onSubmit = null
        } = options;

        return new Promise((resolve) => {
            const modal = new Modal();
            
            modal.show({
                title: title,
                content: `
                    <form class="prompt-dialog">
                        ${message ? `<p class="prompt-message">${message}</p>` : ''}
                        <div class="form-group">
                            <input 
                                type="${inputType}" 
                                class="form-input prompt-input" 
                                placeholder="${placeholder}"
                                value="${defaultValue}"
                                ${required ? 'required' : ''}
                                autofocus
                            >
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary cancel-btn">
                                Отмена
                            </button>
                            <button type="submit" class="btn btn-primary submit-btn">
                                OK
                            </button>
                        </div>
                    </form>
                `,
                size: 'small',
                className: 'prompt-modal'
            });

            // Setup form handlers
            setTimeout(() => {
                const form = modal.modalElement.querySelector('.prompt-dialog');
                const input = modal.modalElement.querySelector('.prompt-input');
                const submitBtn = modal.modalElement.querySelector('.submit-btn');
                const cancelBtn = modal.modalElement.querySelector('.cancel-btn');

                if (form) {
                    form.addEventListener('submit', (e) => {
                        e.preventDefault();
                        const value = input.value.trim();
                        
                        if (required && !value) {
                            input.focus();
                            return;
                        }

                        if (onSubmit) onSubmit(value);
                        resolve(value);
                        modal.hide();
                    });
                }

                if (cancelBtn) {
                    cancelBtn.addEventListener('click', () => {
                        resolve(null);
                        modal.hide();
                    });
                }

                // Focus input
                if (input) {
                    input.focus();
                    input.select();
                }
            }, 10);
        });
    }

    /**
     * Static method to show image gallery modal
     */
    static showImageGallery(images, currentIndex = 0) {
        const modal = new Modal();
        let index = currentIndex;

        const renderGallery = () => {
            const image = images[index];
            return `
                <div class="image-gallery">
                    <div class="gallery-header">
                        <div class="gallery-counter">${index + 1} из ${images.length}</div>
                        <button class="gallery-close">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="gallery-content">
                        <button class="gallery-nav gallery-prev ${index === 0 ? 'disabled' : ''}" ${index === 0 ? 'disabled' : ''}>
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        
                        <div class="gallery-image-container">
                            <img src="${image.url}" alt="${image.title || ''}" class="gallery-image">
                            ${image.title ? `<div class="gallery-caption">${image.title}</div>` : ''}
                        </div>
                        
                        <button class="gallery-nav gallery-next ${index === images.length - 1 ? 'disabled' : ''}" ${index === images.length - 1 ? 'disabled' : ''}>
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                    
                    <div class="gallery-thumbnails">
                        ${images.map((img, i) => `
                            <button class="gallery-thumbnail ${i === index ? 'active' : ''}" data-index="${i}">
                                <img src="${img.thumbnail || img.url}" alt="${img.title || ''}">
                            </button>
                        `).join('')}
                    </div>
                </div>
            `;
        };

        modal.show({
            content: renderGallery(),
            size: 'large',
            className: 'gallery-modal',
            closable: false
        });

        // Setup gallery controls
        setTimeout(() => {
            const updateGallery = () => {
                modal.updateContent(renderGallery());
                setupGalleryControls();
            };

            const setupGalleryControls = () => {
                const prevBtn = modal.modalElement.querySelector('.gallery-prev');
                const nextBtn = modal.modalElement.querySelector('.gallery-next');
                const closeBtn = modal.modalElement.querySelector('.gallery-close');
                const thumbnails = modal.modalElement.querySelectorAll('.gallery-thumbnail');

                if (prevBtn) {
                    prevBtn.addEventListener('click', () => {
                        if (index > 0) {
                            index--;
                            updateGallery();
                        }
                    });
                }

                if (nextBtn) {
                    nextBtn.addEventListener('click', () => {
                        if (index < images.length - 1) {
                            index++;
                            updateGallery();
                        }
                    });
                }

                if (closeBtn) {
                    closeBtn.addEventListener('click', () => modal.hide());
                }

                thumbnails.forEach(thumb => {
                    thumb.addEventListener('click', () => {
                        index = parseInt(thumb.getAttribute('data-index'));
                        updateGallery();
                    });
                });

                // Keyboard navigation
                const handleKeydown = (e) => {
                    switch (e.key) {
                        case 'ArrowLeft':
                            if (index > 0) {
                                index--;
                                updateGallery();
                            }
                            break;
                        case 'ArrowRight':
                            if (index < images.length - 1) {
                                index++;
                                updateGallery();
                            }
                            break;
                        case 'Escape':
                            modal.hide();
                            break;
                    }
                };

                document.addEventListener('keydown', handleKeydown);
                modal.onClose = () => document.removeEventListener('keydown', handleKeydown);
            };

            setupGalleryControls();
        }, 10);

        return modal;
    }
}
