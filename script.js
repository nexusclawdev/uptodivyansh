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
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
    // 5. UPIGateway Merchant Connect Integration
    const payButton = document.getElementById('pay-button');
    if (payButton) {
        payButton.addEventListener('click', async () => {
            const name = document.getElementById('cust_name').value;
            const email = document.getElementById('cust_email').value;
            const mobile = document.getElementById('cust_mobile').value;

            if (!name || !email) {
                alert('Please fill in your details to proceed with the secure payment.');
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
                    alert('Order Creation Failed: ' + (result.msg || 'Unknown Error'));
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
