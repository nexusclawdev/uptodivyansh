document.addEventListener('DOMContentLoaded', () => {
    // 1. Navigation Border on Scroll
    const nav = document.getElementById('nav');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 20) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    });

    // 2. Intersection Observer for Smooth Reveal
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    // 3. Subtle Magnetic Button Effect (Premium interaction)
    const magneticButtons = document.querySelectorAll('.magnetic');
    
    magneticButtons.forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const position = btn.getBoundingClientRect();
            const x = e.pageX - position.left - position.width / 2;
            const y = e.pageY - position.top - position.height / 2;
            
            const strength = btn.dataset.strength || 20;
            
            btn.style.transform = `translate(${x / strength}px, ${y / strength}px)`;
        });

        btn.addEventListener('mouseleave', () => {
            btn.style.transform = `translate(0px, 0px)`;
            btn.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        });
        
        btn.addEventListener('mouseenter', () => {
            btn.style.transition = 'none';
        });
    });

    // 4. Smooth Anchor Scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            // For #checkout links, scroll to the price/form box directly
            const scrollTarget = (targetId === '#checkout')
                ? document.querySelector('.checkout-action') || document.querySelector(targetId)
                : document.querySelector(targetId);
            if (!scrollTarget) return;
            const navHeight = document.getElementById('nav') ? document.getElementById('nav').offsetHeight : 0;
            const top = scrollTarget.getBoundingClientRect().top + window.pageYOffset - navHeight - 16;
            window.scrollTo({ top, behavior: 'smooth' });
        });
    });
    const payButton = document.getElementById('pay-button');
    const modal = document.getElementById('uropay-modal');
    const modalClose = document.getElementById('modal-close');
    const qrImg = document.getElementById('uropay-qr');
    const intentBtn = document.getElementById('uropay-intent-btn');
    const statusText = document.getElementById('uropay-status-text');

    let checkInterval = null;

    if (payButton) {
        payButton.addEventListener('click', async () => {
            const nameInput = document.getElementById('cust_name');
            const emailInput = document.getElementById('cust_email');
            const mobileInput = document.getElementById('cust_mobile');
            
            const name = nameInput ? nameInput.value : '';
            const email = emailInput ? emailInput.value : '';
            const mobile = mobileInput ? mobileInput.value : '';

            if (!name || !email || !mobile) {
                alert('Please fill in all required fields.');
                return;
            }

            payButton.disabled = true;
            payButton.innerText = 'Initializing Secure Checkout...';

            try {
                const response = await fetch('/api/create-uropay-order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        customer_name: name,
                        customer_email: email,
                        customer_mobile: mobile
                    })
                });

                const result = await response.json();

                if (result.status && result.data) {
                    // Show custom modal
                    modal.classList.remove('hidden');
                    modal.classList.add('active');
                    
                    qrImg.src = result.data.qrCode;
                    
                    // Show intent button on mobile devices roughly
                    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
                    if (isMobile && result.data.upiString) {
                        intentBtn.style.display = 'flex';
                        intentBtn.href = result.data.upiString;
                    }

                    statusText.style.display = 'block';

                    // Start polling
                    const orderId = result.data.uroPayOrderId;
                    checkInterval = setInterval(async () => {
                        try {
                            const vRes = await fetch(`/api/verify-uropay?orderId=${orderId}`);
                            const vData = await vRes.json();
                            if (vData.data && vData.data.orderStatus === 'COMPLETED') {
                                clearInterval(checkInterval);
                                statusText.innerText = 'Payment Successful! Redirecting...';
                                statusText.style.color = '#10b981'; // green
                                setTimeout(() => window.location.href = '/success.html', 1500);
                            } else if (vData.data && (vData.data.orderStatus === 'FAILED' || vData.data.orderStatus === 'CANCELLED')) {
                                clearInterval(checkInterval);
                                statusText.innerText = 'Payment Failed or Cancelled.';
                                statusText.style.color = '#ef4444'; // red
                            }
                        } catch(e) {}
                    }, 3000);

                } else {
                    alert('Order Creation Failed: ' + (result.msg || 'Unknown Error'));
                }
            } catch (error) {
                console.error(error);
                alert('Connection Error. Please check your internet.');
            } finally {
                payButton.disabled = false;
                payButton.innerText = 'Get Access Now';
            }
        });
    }

    if (modalClose) {
        modalClose.addEventListener('click', () => {
            modal.classList.remove('active');
            setTimeout(() => modal.classList.add('hidden'), 300);
            if (checkInterval) {
                clearInterval(checkInterval);
                checkInterval = null;
            }
        });
    }
});
