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
    // 5. UPIGateway Merchant Connect Integration
    const payButton = document.getElementById('pay-button');
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

            // Disable button to prevent double clicks
            payButton.disabled = true;
            payButton.innerText = 'Creating Secure Order...';

            try {
                // Call our backend to create order (avoids CORS issues)
                const response = await fetch('/api/create-order', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        customer_name: name,
                        customer_email: email,
                        customer_mobile: mobile
                    })
                });

                const result = await response.json();

                if (result.status && result.data && result.data.payment_url) {
                    // Success: Redirect user to the payment gateway
                    window.location.href = result.data.payment_url;
                } else {
                    // Detailed error message if available
                    const errorMsg = result.msg || 'Unknown Error';
                    console.error('Order Creation Failed:', errorMsg);
                    alert('Order Creation Failed: ' + errorMsg);
                    payButton.disabled = false;
                    payButton.innerText = 'Download Instantly';
                }
            } catch (error) {
                console.error('Payment Error:', error);
                alert('Connection Error. Please try again or check your internet.');
                payButton.disabled = false;
                payButton.innerText = 'Download Instantly';
            }
        });
    }
});
