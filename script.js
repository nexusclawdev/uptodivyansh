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
    // UPIGateway legacy logic replaced by UroPay script embed.
});
