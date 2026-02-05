
// Mock Data for Motion Grid (Simulating infinite scroll source)
const motionItems = [
    { title: "Runway Highlights", img: "images1/sec3-1.png" },
    { title: "Backstage Secrets", img: "images1/sec3-2.png" },
    { title: "Seoul Fashion Week", img: "images1/sec3-3.png" },
    { title: "Designer Interview", img: "images1/sec3-4.png" },
    { title: "Street Style 2026", img: "images1/sec3-5.png" },
    { title: "Vintage Collections", img: "images1/sec3-6.png" },
    { title: "Beauty Trends", img: "images1/sec3-7.png" },
    { title: "Accessory Edit", img: "images1/sec3-8.png" }
];

// Recommended Section Data
const recDataLeft = [
    {
        type: "VOGUE MEETS",
        title: "NewJeans Minji's <br>Makeup Routine",
        img: "images1/sec2-1.png"
    },
    {
        type: "VOGUE FASHION",
        title: "2026 Spring/Summer <br>Collection Highlights",
        img: "images1/sec2-2.png" // Reusing available image as requested or placeholder
    }
];

const recDataRight = [
    {
        type: "VOGUE DIARY",
        title: "What's in my bag? <br>Rose Edition",
        img: "images1/sec2-2.png"
    },
    {
        type: "VOGUE BEAUTY",
        title: "Skincare Secrets <br>for Glowing Skin",
        img: "images1/sec2-1.png" // Reusing available image
    }
];

document.addEventListener('DOMContentLoaded', () => {
    // 0. Loader Remove
    setTimeout(() => {
        document.querySelector('.loader-overlay').classList.add('hidden');
        initAnimations();
    }, 1500);

    // 1. Stagger Animations on Load
    function initAnimations() {
        const heroContent = document.querySelector('.hero-content');
        const videoHero = document.querySelector('.video-hero-wrapper');

        // Simple manual stagger
        heroContent.style.animation = 'fadeInUp 1s forwards';
        setTimeout(() => {
            videoHero.style.animation = 'fadeInUp 1s forwards';
        }, 300);

        // Intersection Observer for scroll stagger
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in-up');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.video-card').forEach((card, index) => {
            card.style.opacity = '0'; // Initial state
            card.style.animationDelay = `${index * 0.2}s`; // Stagger delay
            observer.observe(card);
        });
    }

    // 2. Recommended Section: Cross-fade Logic
    const fadeDuration = 1000; // 1 second transition
    const intervalDuration = 4000; // 4 seconds interval

    let currentIndex = 0;

    function updateRecContent(containerId, data) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Find the image and text elements
        const img = container.querySelector('img');
        const tag = container.querySelector('.tag');
        const title = container.querySelector('h4');

        if (img) img.src = data.img;
        if (tag) tag.textContent = data.type;
        if (title) title.innerHTML = data.title;
    }

    function cycleRecommendedItems() {
        const nextIndex = (currentIndex + 1) % 2; // Toggle between 0 and 1

        // Identifiers for our double buffers
        // Left Side: rec-left-1, rec-left-2
        // Right Side: rec-right-1, rec-right-2

        // Determine which buffer is currently active (visual) and which is hidden (next)
        // We can check class 'active'.

        // Helper to swap a side
        const swapSide = (sidePrefix, dataArray) => {
            const buffer1 = document.getElementById(`${sidePrefix}-1`);
            const buffer2 = document.getElementById(`${sidePrefix}-2`);

            let currentBuffer, nextBuffer;

            if (buffer1.classList.contains('active')) {
                currentBuffer = buffer1;
                nextBuffer = buffer2;
            } else {
                currentBuffer = buffer2;
                nextBuffer = buffer1;
            }

            // 1. Prepare Next Buffer (Content update)
            // We use nextIndex to pick data, but since we just have 2 items in data array matching our buffers roughly,
            // actually we want to cycle through the Data Array independently of the buffer.
            // Let's us currentIndex to pick from Data Array. 
            // Actually, we want to show the NEXT item.

            const dataToShow = dataArray[nextIndex];
            updateRecContent(nextBuffer.id, dataToShow);

            // 2. Cross-fade (Add active to next, remove from current)
            // Note: CSS transition handles the fade.
            nextBuffer.classList.add('active');
            currentBuffer.classList.remove('active');
        };

        swapSide('rec-left', recDataLeft);
        swapSide('rec-right', recDataRight);

        currentIndex = nextIndex;
    }

    // Start Timer
    setInterval(cycleRecommendedItems, intervalDuration);

    // 3. Vogue Motion (4-Column Parallax)
    const motionContainer = document.querySelector('.motion-scroll-container');
    const motionGrid = document.getElementById('motionGrid');

    // Clear and create 4 columns
    motionGrid.innerHTML = '';
    const columns = [];
    for (let i = 0; i < 4; i++) {
        const col = document.createElement('div');
        col.className = 'masonry-col';
        // Add specific classes for Odd/Even identification if needed
        col.dataset.index = i;
        motionGrid.appendChild(col);
        columns.push(col);
    }

    function createMotionItem(data) {
        const item = document.createElement('div');
        item.className = 'motion-item fade-in-up';

        // Fixed Square Layout (653x653 mandated by CSS)
        // No inline styles needed for dimensions, CSS handles it.

        item.innerHTML = `
            <img src="${data.img}" alt="${data.title}">
            <div class="motion-overlay">
                <h3 class="motion-title">${data.title}</h3>
            </div>
        `;

        item.addEventListener('click', () => {
            alert(`Navigate to video player: ${data.title}`);
        });

        return item;
    }

    // Distribute Logic
    function populateColumns(items) {
        items.forEach((data, index) => {
            // Round robin distribution: 0->Col0, 1->Col1, ...
            const targetCol = columns[index % 4];
            targetCol.appendChild(createMotionItem(data));
        });
    }

    // Initial Load - Duplicate data to have enough scroll
    // User asked for specific local images `sec3-1` to `sec3-8`
    // Let's create a larger set by repeating them
    const repeatedItems = [];
    for (let i = 0; i < 5; i++) { // Repeat 5 times
        repeatedItems.push(...motionItems);
    }
    populateColumns(repeatedItems);

    // Infinite Scroll & Parallax Logic
    let lastScrollTop = 0;

    motionContainer.addEventListener('scroll', () => {
        const scrollTop = motionContainer.scrollTop;
        const scrollHeight = motionContainer.scrollHeight;
        const clientHeight = motionContainer.clientHeight;

        // Parallax Effect
        // "Scroll down -> Odd UP, Even DOWN"
        // Factor calculation: how much to move per pixel scrolled
        const factor = 0.2; // Increase speed slightly

        columns.forEach((col, index) => {
            // Grid Columns are 0-indexed.
            const isVisualOdd = (index % 2 === 0); // 1st(0) and 3rd(2)

            if (isVisualOdd) {
                // Odd columns translate negatively (Upwards) faster than scroll
                col.style.transform = `translateY(${scrollTop * -factor}px)`;
            } else {
                // Even columns translate positively (Downwards)
                // Note: The margin-top in CSS sets the initial position.
                // This transform adds dynamic movement.
                col.style.transform = `translateY(${scrollTop * factor}px)`;
            }
        });

        // Infinite Scroll Check - Visual Bottom based
        // We need to check if ANY column's visual bottom is coming into view.
        // Since odd columns move up, their bottom comes into view much faster than DOM scrollHeight would suggest.

        // Find the minimum visual bottom among all columns relative to the viewport
        let minVisualBottom = Infinity;

        columns.forEach(col => {
            const rect = col.getBoundingClientRect();
            // rect.bottom is the distance from the top of the viewport to the bottom of the column
            if (rect.bottom < minVisualBottom) {
                minVisualBottom = rect.bottom;
            }
        });

        // Trigger load if the "highest" bottom is within a threshold of the viewport height
        // Threshold: 1000px to ensure seamless loading well before the gap appears
        // motionContainer takes up the full window height roughly (100vh)
        if (minVisualBottom < window.innerHeight + 1000) {
            // Append content
            populateColumns(motionItems);
        }

        lastScrollTop = scrollTop;
    });

    // 4. Draggable Panorama Logic (3D Cylinder)
    const slider = document.querySelector('.carousel-track');
    const cards = document.querySelectorAll('.video-card');
    let isDown = false;
    let startX;
    let currentAngle = 0;
    let targetAngle = 0;
    let isDragging = false;

    // Configuration
    const radius = 900; // Radius of the cylinder
    const cardCount = cards.length;
    const anglePerCard = 40; // Degrees between each card (adjust for density)

    // Initialize Card Positions
    cards.forEach((card, index) => {
        // Calculate angle for this card. 
        // Center card (index 1 usually) should be at 0 initially? 
        // Let's center the collection.
        // If 3 cards, indices 0, 1, 2. 
        // We want 1 to be at 0 deg.
        // 0 -> -40deg, 1 -> 0deg, 2 -> +40deg
        const offsetIndex = index - Math.floor(cardCount / 2);
        const theta = offsetIndex * anglePerCard;

        // Position card in 3D space
        card.style.transform = `rotateY(${theta}deg) translateZ(${radius}px)`;
    });

    // Event Listeners for Drag (Rotational)
    slider.addEventListener('mousedown', (e) => {
        isDown = true;
        isDragging = false;
        startX = e.pageX;
        slider.style.cursor = 'grabbing';
    });

    slider.addEventListener('mouseleave', () => {
        isDown = false;
        slider.style.cursor = 'grab';
    });

    slider.addEventListener('mouseup', () => {
        isDown = false;
        slider.style.cursor = 'grab';
    });

    slider.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        isDragging = true;
        const x = e.pageX;
        const dx = x - startX;
        startX = x;

        // Convert horizontal drag to rotation angle
        // Sensitivity: 1px drag = 0.1 deg rotation?
        const sensitivity = 0.1;
        targetAngle += dx * sensitivity;

        updateSlider();
    });

    // Smooth Animation Loop for Momentum/Smoothing
    function animateSlider() {
        // Simple lerp for smoothness
        currentAngle += (targetAngle - currentAngle) * 0.1;

        if (Math.abs(targetAngle - currentAngle) > 0.01) {
            updateSlider();
        }
        requestAnimationFrame(animateSlider);
    }

    function updateSlider() {
        // Rotate the TRACK opposite to the camera movement (or rotate track itself)
        // If we rotate track by currentAngle, we traverse the cylinder.
        slider.style.transform = `translateZ(-${radius}px) rotateY(${currentAngle}deg)`;
        // Note: translateZ pushes the pivot point back so we rotate around the center, 
        // BUT we positioned items at +radius. So pivot is at 0,0,0 (center of viewport).
        // Actually, we want the "view" to be inside or outside?
        // Standard Carousel: Items at translateZ(R). Center of carousel at 0,0,0.
        // We look at it from perspective origin (usually 0,0, ~perspective).
        // If radius is 900 and perspective 2000, we are outside.
        // Rotating the Container by angle works.
    }

    animateSlider(); // Start loop

    // 5. Mouse Hover Video Preview Simulation
    document.querySelectorAll('.video-card, .video-container').forEach(card => {
        card.addEventListener('mouseenter', () => {
            console.log('Video Play Triggered');
        });
    });

    // 6. Dynamic Text Color based on Video Brightness
    const heroVideo = document.querySelector('.video-container video');
    const textOverlay = document.querySelector('.video-text-overlay');

    if (heroVideo && textOverlay) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        // Sample a small area from bottom right where text is
        // Text is at bottom: 3rem, right: 3rem. 
        // Let's sample a 50x50px box from likely text location.
        canvas.width = 50;
        canvas.height = 50;

        function checkBrightness() {
            if (heroVideo.paused || heroVideo.ended) {
                requestAnimationFrame(checkBrightness);
                return;
            }

            // Draw the *entire* video frame to canvas? No, that's heavy.
            // Problem: video object-fit: cover makes maping coordinates hard without full draw or match.
            // Simplified: Draw the bottom-right corner of the SOURCE video.
            // Because object-fit: cover generally crops the center, the bottom-right of the viewport
            // corresponds roughly to the bottom-right of the video (unless video is very tall/wide).

            // Actually, best approximation for "Cover" is:
            // Calculate scale to cover container.

            // For now, let's just sample the bottom-right 20% of the video source.
            // It's a heuristic but should work for general mood.

            const vWidth = heroVideo.videoWidth;
            const vHeight = heroVideo.videoHeight;

            if (vWidth === 0 || vHeight === 0) {
                requestAnimationFrame(checkBrightness);
                return;
            }

            // Sample region: Start at 80% width, 80% height, take 20% width, 20% height.
            ctx.drawImage(heroVideo, vWidth * 0.8, vHeight * 0.8, vWidth * 0.2, vHeight * 0.2, 0, 0, 50, 50);

            try {
                const frame = ctx.getImageData(0, 0, 50, 50);
                const data = frame.data;
                let r, g, b, avg;
                let colorSum = 0;

                for (let x = 0; x < data.length; x += 4) {
                    r = data[x];
                    g = data[x + 1];
                    b = data[x + 2];
                    avg = Math.floor((r + g + b) / 3);
                    colorSum += avg;
                }

                const brightness = Math.floor(colorSum / (50 * 50));

                // Threshold: If brightness > 128, it's light -> Use Black text.
                // Else -> Use White text.
                // Added hysteresis or generic threshold
                if (brightness > 150) { // Light background
                    textOverlay.classList.add('dark-mode');
                } else { // Dark background
                    textOverlay.classList.remove('dark-mode');
                }
            } catch (e) {
                // Cross-origin issues if video is external (it's local here so fine)
            }

            // Check every 200ms approx (throttle via counter or just rAF)
            // Using setTimeout for lower CPU than rAF loop
            setTimeout(() => {
                requestAnimationFrame(checkBrightness);
            }, 200);
        }

        heroVideo.addEventListener('play', () => {
            checkBrightness();
        });

        // Start check if already playing
        if (!heroVideo.paused) {
            checkBrightness();
        }
    }
});
