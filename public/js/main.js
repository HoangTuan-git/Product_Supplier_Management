// Main JavaScript file for Product Management System

$(document).ready(function() {
    // Initialize tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Initialize popovers
    var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });

    // Auto-hide alerts after 5 seconds
    $('.alert').each(function() {
        const alert = this;
        setTimeout(function() {
            $(alert).fadeOut();
        }, 5000);
    });

    // Confirm delete actions
    $('[data-confirm-delete]').on('click', function(e) {
        e.preventDefault();
        const message = $(this).data('confirm-delete') || 'Bạn có chắc chắn muốn xóa?';
        const href = $(this).attr('href');
        
        if (confirm(message)) {
            // Create and submit a delete form
            const form = $('<form>', {
                method: 'POST',
                action: href
            });
            
            form.append($('<input>', {
                type: 'hidden',
                name: '_method',
                value: 'DELETE'
            }));
            
            form.appendTo('body').submit();
        }
    });

    // Live search functionality
    let searchTimeout;
    $('#live-search').on('input', function() {
        const query = $(this).val();
        const resultsContainer = $('#search-results');
        
        clearTimeout(searchTimeout);
        
        if (query.length < 2) {
            resultsContainer.empty().hide();
            return;
        }
        
        searchTimeout = setTimeout(function() {
            $.ajax({
                url: '/api/search',
                method: 'GET',
                data: { q: query },
                success: function(response) {
                    if (response.success && response.data.length > 0) {
                        let html = '';
                        response.data.forEach(function(item) {
                            html += `
                                <div class="dropdown-item">
                                    <div class="d-flex">
                                        <div class="flex-grow-1">
                                            <div class="fw-bold">${item.name}</div>
                                            <small class="text-muted">${item.type}</small>
                                        </div>
                                        <div class="flex-shrink-0">
                                            <a href="${item.url}" class="btn btn-sm btn-outline-primary">Xem</a>
                                        </div>
                                    </div>
                                </div>
                            `;
                        });
                        resultsContainer.html(html).show();
                    } else {
                        resultsContainer.html('<div class="dropdown-item text-muted">Không tìm thấy kết quả</div>').show();
                    }
                },
                error: function() {
                    resultsContainer.html('<div class="dropdown-item text-danger">Có lỗi xảy ra</div>').show();
                }
            });
        }, 300);
    });

    // Hide search results when clicking outside
    $(document).on('click', function(e) {
        if (!$(e.target).closest('#live-search, #search-results').length) {
            $('#search-results').hide();
        }
    });

    // Form validation enhancement
    $('form[novalidate]').on('submit', function(e) {
        const form = this;
        if (!form.checkValidity()) {
            e.preventDefault();
            e.stopPropagation();
        }
        $(form).addClass('was-validated');
    });

    // Dynamic supplier selection in product form
    $('#supplier-select').on('change', function() {
        const supplierId = $(this).val();
        if (supplierId) {
            // Load products from this supplier for reference
            $.ajax({
                url: `/api/products/by-supplier/${supplierId}`,
                method: 'GET',
                success: function(response) {
                    if (response.success && response.data.length > 0) {
                        let html = '<small class="form-text text-muted">Sản phẩm hiện có: ';
                        response.data.slice(0, 3).forEach(function(product, index) {
                            if (index > 0) html += ', ';
                            html += product.name;
                        });
                        if (response.data.length > 3) {
                            html += ` và ${response.data.length - 3} sản phẩm khác`;
                        }
                        html += '</small>';
                        $('#supplier-products-info').html(html);
                    } else {
                        $('#supplier-products-info').html('<small class="form-text text-muted">Nhà cung cấp này chưa có sản phẩm nào</small>');
                    }
                }
            });
        } else {
            $('#supplier-products-info').empty();
        }
    });

    // Auto-format currency inputs
    $('.currency-input').on('input', function() {
        let value = $(this).val().replace(/[^\d]/g, '');
        if (value) {
            const formatted = new Intl.NumberFormat('vi-VN').format(value);
            $(this).val(formatted);
        }
    });

    // Auto-format phone inputs
    $('.phone-input').on('input', function() {
        let value = $(this).val().replace(/[^\d]/g, '');
        if (value.length > 0) {
            if (value.length <= 10) {
                value = value.replace(/(\d{4})(\d{3})(\d{3})/, '$1.$2.$3');
            } else {
                value = value.substring(0, 10).replace(/(\d{4})(\d{3})(\d{3})/, '$1.$2.$3');
            }
            $(this).val(value);
        }
    });

    // Infinite scroll for product lists
    let loading = false;
    let currentPage = 1;
    const $productContainer = $('#product-container');
    const $loadMoreBtn = $('#load-more-btn');

    $loadMoreBtn.on('click', function() {
        loadMoreProducts();
    });

    function loadMoreProducts() {
        if (loading) return;
        
        loading = true;
        $loadMoreBtn.html('<span class="spinner-border spinner-border-sm"></span> Đang tải...').prop('disabled', true);
        
        const searchParams = new URLSearchParams(window.location.search);
        searchParams.set('page', currentPage + 1);
        
        $.ajax({
            url: window.location.pathname + '?' + searchParams.toString(),
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            },
            success: function(response) {
                if (response.products && response.products.length > 0) {
                    response.products.forEach(function(product) {
                        const productHtml = createProductCard(product);
                        $productContainer.append(productHtml);
                    });
                    currentPage++;
                    
                    if (response.pagination.current >= response.pagination.total) {
                        $loadMoreBtn.hide();
                    }
                } else {
                    $loadMoreBtn.hide();
                }
            },
            error: function() {
                alert('Có lỗi xảy ra khi tải thêm sản phẩm');
            },
            complete: function() {
                loading = false;
                $loadMoreBtn.html('Tải thêm').prop('disabled', false);
            }
        });
    }

    function createProductCard(product) {
        return `
            <div class="col-md-6 col-lg-4 mb-3">
                <div class="card h-100">
                    <div class="card-body">
                        <h6 class="card-title">${product.name}</h6>
                        <p class="card-text text-muted small">${product.supplier?.name || 'N/A'}</p>
                        <div class="d-flex justify-content-between align-items-center">
                            <span class="text-primary fw-bold">${product.formattedPrice}</span>
                            <span class="badge bg-${product.quantity > 10 ? 'success' : product.quantity > 0 ? 'warning' : 'danger'}">
                                SL: ${product.quantity}
                            </span>
                        </div>
                    </div>
                    <div class="card-footer bg-white border-0">
                        <a href="/products/${product._id}" class="btn btn-primary btn-sm">Xem chi tiết</a>
                    </div>
                </div>
            </div>
        `;
    }

    // Advanced search toggle
    $('#advanced-search-toggle').on('click', function() {
        $('#advanced-search-form').toggle();
        const isVisible = $('#advanced-search-form').is(':visible');
        $(this).html(isVisible ? 'Thu gọn <i class="bi bi-chevron-up"></i>' : 'Tìm kiếm nâng cao <i class="bi bi-chevron-down"></i>');
    });

    // Export functionality
    $('.export-btn').on('click', function() {
        const format = $(this).data('format');
        const currentUrl = new URL(window.location);
        currentUrl.searchParams.set('export', format);
        window.open(currentUrl.toString(), '_blank');
    });

    // Back to top button
    const $backToTop = $('#back-to-top');
    
    $(window).on('scroll', function() {
        if ($(this).scrollTop() > 300) {
            $backToTop.fadeIn();
        } else {
            $backToTop.fadeOut();
        }
    });

    $backToTop.on('click', function() {
        $('html, body').animate({ scrollTop: 0 }, 600);
    });

    // Initialize animations for elements in viewport
    function initAnimations() {
        $('.fade-in, .slide-in-left').each(function() {
            const element = this;
            const observer = new IntersectionObserver(function(entries) {
                entries.forEach(function(entry) {
                    if (entry.isIntersecting) {
                        $(element).addClass('animated');
                        observer.unobserve(element);
                    }
                });
            });
            observer.observe(element);
        });
    }

    // Initialize animations if IntersectionObserver is supported
    if ('IntersectionObserver' in window) {
        initAnimations();
    }

    // Theme toggle (if implemented)
    $('#theme-toggle').on('click', function() {
        $('body').toggleClass('dark-theme');
        localStorage.setItem('theme', $('body').hasClass('dark-theme') ? 'dark' : 'light');
    });

    // Load saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        $('body').addClass('dark-theme');
    }
});

// Utility functions
window.utils = {
    formatCurrency: function(amount) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    },

    formatDate: function(date) {
        return new Intl.DateTimeFormat('vi-VN').format(new Date(date));
    },

    showToast: function(message, type = 'info') {
        const toastHtml = `
            <div class="toast align-items-center text-white bg-${type} border-0" role="alert">
                <div class="d-flex">
                    <div class="toast-body">${message}</div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            </div>
        `;
        
        $('#toast-container').append(toastHtml);
        const $toast = $('#toast-container .toast:last');
        const toast = new bootstrap.Toast($toast[0]);
        toast.show();
        
        // Remove toast after it's hidden
        $toast.on('hidden.bs.toast', function() {
            $(this).remove();
        });
    },

    debounce: function(func, wait, immediate) {
        let timeout;
        return function executedFunction() {
            const context = this;
            const args = arguments;
            const later = function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    }
};