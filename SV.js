/*!
 * ScrollVelocity Web Component
 * ----------------------------------------
 * Smooth scroll-reactive marquee text using Web Components
 *
 * Author: Simran Singh
 * Version: 1.0.0
 * License: MIT
 *
 * Homepage: https://github.com/SimranSingh8283/scroll-velocity
 *
 * Usage:
 * <scroll-velocity velocity="100" clone="6" inverted="false">
 *   Scrolling Text
 * </scroll-velocity>
 *
 * Attributes:
 * - velocity   (number)  Base speed
 * - clone      (number)  Number of clones
 * - inverted   (boolean) Reverse direction
 *
 * CSS Parts:
 * - ScrollVelocity-container
 * - ScrollVelocity-track
 * - ScrollVelocity-item
 */

(function (global, factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        module.exports = factory();
    } else if (typeof define === "function" && define.amd) {
        define(factory);
    } else {
        global.ScrollVelocity = factory();
    }
})(typeof window !== "undefined" ? window : this, function () {
    "use strict";

    class ScrollVelocity extends HTMLElement {
        constructor() {
            super();
            this.attachShadow({ mode: "open" });

            this.baseX = 0;
            this.currentVelocity = 0;
            this.lastScrollY = window.scrollY;
            this.lastTime = performance.now();
            this.scrollVelocity = 0;
            this.hasScrolled = false;
            this.classList.add("ScrollVelocity-root");
        }

        connectedCallback() {
            this.velocity = Number(this.getAttribute("velocity")) || 100;
            this.cloneCount = Number(this.getAttribute("clone")) || 6;
            this.inverted = this.getAttribute("inverted") === "true";

            this.baseDir = Math.sign(this.velocity) || 1;

            if (this.inverted) {
                this.baseDir *= -1;
            }

            this.render();
            this.setupScroll();
            this.startAnimation();
        }

        disconnectedCallback() {
            window.removeEventListener("scroll", this.onScroll);
            cancelAnimationFrame(this.raf);
        }

        render() {
            const html = this.innerHTML.trim();
            this.innerHTML = "";

            this.shadowRoot.innerHTML = `
<style>
:host {
    display: block;
    overflow: hidden;
}

.ScrollVelocity-track {
    display: flex;
    white-space: nowrap;
    font-size: 2.25rem;
    font-weight: bold;
    font-family: sans-serif;
    will-change: transform;
}

.ScrollVelocity-item {
    flex-shrink: 0;
    padding-inline: 1.5em;
}

@media (min-width: 768px) {
    .ScrollVelocity-track {
        font-size: 5rem;
    }
}
</style>

<div part="ScrollVelocity-container" class="ScrollVelocity-container">
    <div part="ScrollVelocity-track" class="ScrollVelocity-track"></div>
</div>
`;

            this.track = this.shadowRoot.querySelector(".ScrollVelocity-track");

            for (let i = 0; i < this.cloneCount; i++) {
                const span = document.createElement("span");
                span.className = "ScrollVelocity-item";
                span.setAttribute("part", span.className);
                span.innerHTML = html;
                this.track.appendChild(span);
            }

            this.copyWidth = this.track.children[0].offsetWidth;
            this.currentVelocity = Math.abs(this.velocity);
        }

        setupScroll() {
            this.onScroll = () => {
                const now = performance.now();
                const deltaY = window.scrollY - this.lastScrollY;
                const deltaT = now - this.lastTime;

                if (deltaT > 0) {
                    let vel = (deltaY / deltaT) * 1000;

                    if (!this.hasScrolled) {
                        vel = 0;
                        this.hasScrolled = true;
                    } else {
                        vel = Math.max(Math.min(vel, 500), -500);
                    }

                    this.scrollVelocity = vel;
                }

                this.lastScrollY = window.scrollY;
                this.lastTime = now;
            };

            window.addEventListener("scroll", this.onScroll, { passive: true });
        }

        wrap(min, max, value) {
            const range = max - min;
            return ((((value - min) % range) + range) % range) + min;
        }

        startAnimation() {
            const animate = () => {
                let direction = this.baseDir;

                if (this.scrollVelocity < -0.5) direction = -this.baseDir;
                if (this.scrollVelocity > 0.5) direction = this.baseDir;

                const targetVelocity =
                    Math.abs(this.velocity) + Math.abs(this.scrollVelocity);

                this.currentVelocity +=
                    (targetVelocity - this.currentVelocity) * 0.2;

                this.baseX += direction * this.currentVelocity * (1 / 60);

                if (this.copyWidth > 0) {
                    const wrapped = this.wrap(-this.copyWidth, 0, this.baseX);
                    this.track.style.transform = `translateX(${wrapped}px)`;
                }

                this.raf = requestAnimationFrame(animate);
            };

            animate();
        }
    }

    if (!customElements.get("scroll-velocity")) {
        customElements.define("scroll-velocity", ScrollVelocity);
    }

    return {
        ScrollVelocity,
        version: "1.0.0",
    };
});
