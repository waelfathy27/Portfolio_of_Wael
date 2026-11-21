/* ============================================================
   Wael Fathy Gaber - GIS Specialist portfolio (static build)
   js.js : particle flow, scroll reveals, stat counters,
           interactive satellite project map, photo lightbox,
           photo-strip arrows and drag scrolling.
   ============================================================ */
(function () {
    'use strict';

    var REDUCED = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------------- Particle flow (hero + contact) ---------------- */

    function initFlow(canvas) {
        var ctx = canvas.getContext('2d');
        if (!ctx) return;
        var w = 0, h = 0, running = true;
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        var noise = function (x, y) {
            return Math.sin(x * 0.0016 + Math.sin(y * 0.0011) * 2.1) +
                Math.sin(y * 0.0019 + Math.sin(x * 0.0009) * 1.7) +
                Math.sin((x + y) * 0.0007);
        };
        var colors = ['255,122,26', '216,161,60', '115,168,154', '255,217,176'];
        var ps = [];
        var spawn = function () {
            return {
                x: Math.random() * w,
                y: Math.random() * h,
                life: 0,
                max: 50 + Math.random() * 70,
                c: colors[(Math.random() * colors.length) | 0],
                lw: 0.8 + Math.random() * 0.9
            };
        };
        var paint = function () {
            ctx.globalCompositeOperation = 'destination-in';
            ctx.fillStyle = 'rgba(0,0,0,0.93)';
            ctx.fillRect(0, 0, w, h);
            ctx.globalCompositeOperation = 'source-over';
            ctx.lineCap = 'round';
            for (var i = 0; i < ps.length; i += 1) {
                var p = ps[i];
                var a = noise(p.x, p.y) * Math.PI;
                var nx = p.x + Math.cos(a) * 1.5;
                var ny = p.y + Math.sin(a) * 1.5;
                ctx.strokeStyle = 'rgba(' + p.c + ',0.55)';
                ctx.lineWidth = p.lw;
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(nx, ny);
                ctx.stroke();
                p.x = nx;
                p.y = ny;
                p.life += 1;
                if (p.life > p.max || p.x < -8 || p.x > w + 8 || p.y < -8 || p.y > h + 8) {
                    var np = spawn();
                    p.x = np.x; p.y = np.y; p.life = np.life; p.max = np.max; p.c = np.c; p.lw = np.lw;
                }
            }
        };
        var resize = function () {
            var r = canvas.getBoundingClientRect();
            w = Math.max(1, r.width);
            h = Math.max(1, r.height);
            canvas.width = Math.round(w * dpr);
            canvas.height = Math.round(h * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            var count = Math.max(70, Math.min(200, Math.round((w * h) / 8000)));
            ps = [];
            for (var i = 0; i < count; i += 1) ps.push(spawn());
        };
        var ro = new ResizeObserver(resize);
        ro.observe(canvas);
        resize();
        if (REDUCED) {
            for (var i = 0; i < 240; i += 1) paint();
            return;
        }
        var io = new IntersectionObserver(function (es) {
            running = es[0] ? es[0].isIntersecting : true;
        });
        io.observe(canvas);
        var step = function () {
            if (running) paint();
            requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }

    /* ---------------- Scroll reveals ---------------- */

    function initReveals() {
        var els = Array.prototype.slice.call(document.querySelectorAll('.pf-reveal'));
        if (REDUCED || typeof IntersectionObserver !== 'function') {
            els.forEach(function (el) { el.classList.add('pf-in'); });
            return;
        }
        var io = new IntersectionObserver(function (es) {
            es.forEach(function (e) {
                if (e.isIntersecting) {
                    e.target.classList.add('pf-in');
                    io.unobserve(e.target);
                }
            });
        }, { rootMargin: '0px 0px -6% 0px' });
        els.forEach(function (el) { io.observe(el); });
    }

    /* ---------------- Animated stat counters ---------------- */

    function initStats() {
        var band = document.querySelector('.pf-stats');
        if (!band) return;
        var values = Array.prototype.slice.call(band.querySelectorAll('.pf-stat-value'));
        var finals = values.map(function (el) { return el.textContent; });
        var run = function () {
            values.forEach(function (el, i) {
                var m = finals[i].match(/^(\d+)(.*)$/);
                if (!m) { el.textContent = finals[i]; return; }
                var target = parseInt(m[1], 10);
                var suffix = m[2];
                if (REDUCED) { el.textContent = finals[i]; return; }
                var t0 = performance.now();
                var tick = function (t) {
                    var p = Math.min(1, (t - t0) / 1300);
                    el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + suffix;
                    if (p < 1) requestAnimationFrame(tick);
                };
                el.textContent = '0' + suffix;
                requestAnimationFrame(tick);
            });
        };
        if (REDUCED || typeof IntersectionObserver !== 'function') { run(); return; }
        var io = new IntersectionObserver(function (es) {
            es.forEach(function (e) {
                if (e.isIntersecting) {
                    run();
                    io.disconnect();
                }
            });
        }, { threshold: 0.35 });
        io.observe(band);
    }

    /* ---------------- Interactive satellite project map ---------------- */

    var MAP_Z = 8;
    var MAP_OX = 145;
    var MAP_OY = 103;
    var MAP_IMG = 2560;
    var MAP_CENTER = { x: 1370, y: 1000 };
    var ZOOMS = [1, 1.8, 3.1];
    var POPUP_W = 236;

    var MARKERS = [
        { id: 'cairo', name: 'Cairo', tag: 'Home base', note: 'Where I live and work, in the heart of Egypt.', lon: 31.2357, lat: 30.0444, link: null },
        { id: 'sohag', name: 'New Sohag City', tag: 'Project 01 - smart city model', note: 'Geodatabase and 2D/3D web apps for a smart, sustainable New Sohag.', lon: 31.6657, lat: 26.4382, link: 'https://waelfathy27.github.io/new-sohagcity/' },
        { id: 'nac', name: 'New Administrative Capital', tag: 'Project 02 - transport simulation', note: 'Interactive vehicle-movement and route-optimization simulation.', lon: 31.7549, lat: 30.0238, link: 'https://waelfathy27.github.io/THEFUNNY-COMPANY-LIMITED/' }
    ];

    function projectLL(lon, lat) {
        var n = Math.pow(2, MAP_Z);
        var latr = (lat * Math.PI) / 180;
        var x = ((lon + 180) / 360) * n;
        var y = ((1 - Math.log(Math.tan(latr) + 1 / Math.cos(latr)) / Math.PI) / 2) * n;
        return { x: (x - MAP_OX) * 256, y: (y - MAP_OY) * 256 };
    }

    function unprojectLL(ix, iy) {
        var n = Math.pow(2, MAP_Z);
        var lon = ((ix / 256 + MAP_OX) / n) * 360 - 180;
        var y = iy / 256 + MAP_OY;
        var lat = (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n))) * 180) / Math.PI;
        return { lon: lon, lat: lat };
    }

    function formatCoord(lon, lat) {
        return Math.abs(lat).toFixed(4) + '° ' + (lat >= 0 ? 'N' : 'S') + ' / ' +
            Math.abs(lon).toFixed(4) + '° ' + (lon >= 0 ? 'E' : 'W');
    }

    function initMap() {
        var vp = document.querySelector('.pf-map');
        if (!vp) return;
        var plane = vp.querySelector('.pf-map-plane');
        var readoutEl = vp.querySelector('.pf-map-hud-readout');
        var zoomButtons = vp.querySelectorAll('.pf-map-zoom button');
        var btnIn = null, btnOut = null, btnReset = null;
        Array.prototype.forEach.call(zoomButtons, function (b) {
            var label = b.getAttribute('aria-label') || '';
            if (label === 'Zoom in') btnIn = b;
            else if (label === 'Zoom out') btnOut = b;
            else btnReset = b;
        });
        var scaleLine = vp.querySelector('.pf-map-scalebar-line');
        var scaleLabel = vp.querySelector('.pf-map-scalebar-label');

        // Match rendered marker buttons to marker data by aria-label.
        var markerEls = {};
        Array.prototype.forEach.call(vp.querySelectorAll('.pf-map-marker'), function (b) {
            var label = b.getAttribute('aria-label') || '';
            MARKERS.forEach(function (m) {
                if (label.indexOf(m.name + ':') === 0) markerEls[m.id] = b;
            });
        });

        var size = { w: vp.clientWidth || 390, h: vp.clientHeight || 360 };
        var fit = size.w > 0 ? Math.max(size.w / MAP_IMG, size.h / MAP_IMG) : 0.15;
        var view = { s: ZOOMS[0], x: 0, y: 0 };
        var interacted = false;
        var activeId = null;
        var popupEl = null;
        var drag = null;
        var suppressClick = false;

        function clampView(s, x, y) {
            var w = MAP_IMG * fit * s;
            var h = MAP_IMG * fit * s;
            return {
                s: s,
                x: w <= size.w ? (size.w - w) / 2 : Math.min(0, Math.max(size.w - w, x)),
                y: h <= size.h ? (size.h - h) / 2 : Math.min(0, Math.max(size.h - h, y))
            };
        }

        function markerScreen(m) {
            var p = projectLL(m.lon, m.lat);
            return { x: p.x * fit * view.s + view.x, y: p.y * fit * view.s + view.y };
        }

        function renderScaleBar() {
            if (!scaleLine || !scaleLabel || fit <= 0) return;
            var ix = (size.w / 2 - view.x) / (fit * view.s);
            var iy = (size.h / 2 - view.y) / (fit * view.s);
            var lat = unprojectLL(ix, iy).lat;
            var mPerImgPx = (156543.03392 * Math.cos((lat * Math.PI) / 180)) / Math.pow(2, MAP_Z);
            var mPerCssPx = mPerImgPx / (fit * view.s);
            var options = [300, 200, 150, 100, 75, 50, 30, 20, 10, 5];
            var km = 5;
            for (var i = 0; i < options.length; i += 1) {
                if ((options[i] * 1000) / mPerCssPx <= 110) { km = options[i]; break; }
            }
            scaleLine.style.width = ((km * 1000) / mPerCssPx) + 'px';
            scaleLabel.textContent = km + ' km';
        }

        function render() {
            plane.style.width = (MAP_IMG * fit * view.s) + 'px';
            plane.style.height = (MAP_IMG * fit * view.s) + 'px';
            plane.style.transform = 'translate(' + view.x + 'px, ' + view.y + 'px)';
            MARKERS.forEach(function (m) {
                var el = markerEls[m.id];
                if (!el) return;
                var p = markerScreen(m);
                if (p.x < -40 || p.x > size.w + 40 || p.y < -40 || p.y > size.h + 40) {
                    el.style.display = 'none';
                } else {
                    el.style.display = '';
                    el.style.left = p.x + 'px';
                    el.style.top = p.y + 'px';
                }
            });
            if (btnIn) btnIn.disabled = view.s >= ZOOMS[ZOOMS.length - 1];
            if (btnOut) btnOut.disabled = view.s <= ZOOMS[0];
            renderScaleBar();
            positionPopup();
        }

        function closePopup() {
            activeId = null;
            if (popupEl && popupEl.parentNode) popupEl.parentNode.removeChild(popupEl);
            popupEl = null;
            MARKERS.forEach(function (m) {
                if (markerEls[m.id]) markerEls[m.id].classList.remove('is-active');
            });
        }

        function positionPopup() {
            if (!popupEl || !activeId) return;
            var m = null;
            MARKERS.forEach(function (mk) { if (mk.id === activeId) m = mk; });
            if (!m) return;
            var pos = markerScreen(m);
            var above = pos.y > size.h * 0.52;
            var left = Math.min(Math.max(pos.x - POPUP_W / 2, 8), Math.max(8, size.w - POPUP_W - 8));
            popupEl.classList.toggle('is-above', above);
            popupEl.style.left = left + 'px';
            popupEl.style.top = pos.y + 'px';
        }

        function openPopup(m) {
            closePopup();
            activeId = m.id;
            if (markerEls[m.id]) markerEls[m.id].classList.add('is-active');
            popupEl = document.createElement('div');
            popupEl.className = 'pf-map-popup';
            popupEl.style.width = POPUP_W + 'px';
            var tag = document.createElement('div');
            tag.className = 'pf-map-popup-tag';
            tag.textContent = m.tag;
            var name = document.createElement('div');
            name.className = 'pf-map-popup-name';
            name.textContent = m.name;
            var note = document.createElement('div');
            note.className = 'pf-map-popup-note';
            note.textContent = m.note;
            popupEl.appendChild(tag);
            popupEl.appendChild(name);
            popupEl.appendChild(note);
            if (m.link) {
                var a = document.createElement('a');
                a.className = 'pf-map-popup-link';
                a.href = m.link;
                a.target = '_blank';
                a.rel = 'noreferrer';
                a.textContent = 'Open the live app';
                popupEl.appendChild(a);
            }
            var close = document.createElement('button');
            close.type = 'button';
            close.className = 'pf-map-popup-close';
            close.setAttribute('aria-label', 'Close');
            close.innerHTML = '&times;';
            close.addEventListener('click', function (e) {
                e.stopPropagation();
                closePopup();
            });
            popupEl.appendChild(close);
            vp.appendChild(popupEl);
            positionPopup();
        }

        function resetView() {
            interacted = true;
            var s = ZOOMS[0];
            view = clampView(s, size.w / 2 - MAP_CENTER.x * fit * s, size.h / 2 - MAP_CENTER.y * fit * s);
            render();
        }

        function zoomStep(dir) {
            interacted = true;
            var idx = 0;
            for (var i = 0; i < ZOOMS.length; i += 1) {
                if (Math.abs(ZOOMS[i] - view.s) < 0.001) { idx = i; break; }
            }
            var next = Math.min(ZOOMS.length - 1, Math.max(0, idx + dir));
            var ns = ZOOMS[next];
            var cx = size.w / 2;
            var cy = size.h / 2;
            var ix = (cx - view.x) / (fit * view.s);
            var iy = (cy - view.y) / (fit * view.s);
            view = clampView(ns, cx - ix * fit * ns, cy - iy * fit * ns);
            render();
        }

        vp.addEventListener('pointerdown', function (e) {
            if (e.pointerType === 'mouse' && e.button !== 0) return;
            if (e.target.closest('button, a')) return;
            interacted = true;
            drag = { px: e.clientX, py: e.clientY, x: view.x, y: view.y, moved: false };
            try { vp.setPointerCapture(e.pointerId); } catch (err) { /* noop */ }
        });

        vp.addEventListener('pointermove', function (e) {
            var rect = vp.getBoundingClientRect();
            if (rect && fit > 0) {
                var ix = (e.clientX - rect.left - view.x) / (fit * view.s);
                var iy = (e.clientY - rect.top - view.y) / (fit * view.s);
                if (readoutEl) {
                    if (ix >= 0 && ix <= MAP_IMG && iy >= 0 && iy <= MAP_IMG) {
                        var ll = unprojectLL(ix, iy);
                        readoutEl.textContent = formatCoord(ll.lon, ll.lat);
                    } else {
                        readoutEl.textContent = 'Move over the map';
                    }
                }
            }
            if (!drag) return;
            var dx = e.clientX - drag.px;
            var dy = e.clientY - drag.py;
            if (Math.abs(dx) + Math.abs(dy) > 6) drag.moved = true;
            if (drag.moved) {
                vp.style.cursor = 'grabbing';
                view = clampView(view.s, drag.x + dx, drag.y + dy);
                render();
            }
        });

        var endDrag = function () {
            if (drag && drag.moved) {
                suppressClick = true;
                window.setTimeout(function () { suppressClick = false; }, 60);
            }
            drag = null;
            vp.style.cursor = 'grab';
        };
        vp.addEventListener('pointerup', endDrag);
        vp.addEventListener('pointercancel', endDrag);
        vp.addEventListener('pointerleave', function () {
            if (readoutEl) readoutEl.textContent = 'Move over the map';
        });

        vp.addEventListener('click', function () {
            if (!suppressClick) closePopup();
        });

        MARKERS.forEach(function (m) {
            var el = markerEls[m.id];
            if (!el) return;
            el.addEventListener('click', function (e) {
                e.stopPropagation();
                if (suppressClick) return;
                if (activeId === m.id) closePopup();
                else openPopup(m);
            });
        });

        if (btnIn) btnIn.addEventListener('click', function (e) { e.stopPropagation(); zoomStep(1); });
        if (btnOut) btnOut.addEventListener('click', function (e) { e.stopPropagation(); zoomStep(-1); });
        if (btnReset) btnReset.addEventListener('click', function (e) { e.stopPropagation(); resetView(); });

        var ro = new ResizeObserver(function () {
            var w = vp.clientWidth;
            var h = vp.clientHeight;
            if (w <= 0 || h <= 0) return;
            size = { w: w, h: h };
            fit = Math.max(w / MAP_IMG, h / MAP_IMG);
            if (!interacted) {
                view = {
                    s: view.s,
                    x: w / 2 - MAP_CENTER.x * fit * view.s,
                    y: h / 2 - MAP_CENTER.y * fit * view.s
                };
            } else {
                view = clampView(view.s, view.x, view.y);
            }
            render();
        });
        ro.observe(vp);

        // Initial centered view.
        size = { w: vp.clientWidth || 390, h: vp.clientHeight || 360 };
        fit = Math.max(size.w / MAP_IMG, size.h / MAP_IMG);
        view = {
            s: ZOOMS[0],
            x: size.w / 2 - MAP_CENTER.x * fit * ZOOMS[0],
            y: size.h / 2 - MAP_CENTER.y * fit * ZOOMS[0]
        };
        render();
    }

    /* ---------------- Photo lightbox ---------------- */

    function initLightbox() {
        var box = null;
        var close = function () {
            if (box && box.parentNode) box.parentNode.removeChild(box);
            box = null;
            document.removeEventListener('keydown', onKey);
        };
        var onKey = function (e) {
            if (e.key === 'Escape') close();
        };
        Array.prototype.forEach.call(document.querySelectorAll('.file-photo-zoom'), function (btn) {
            btn.addEventListener('click', function () {
                var img = btn.querySelector('img');
                if (!img) return;
                close();
                box = document.createElement('div');
                box.className = 'pfx-lightbox';
                box.setAttribute('role', 'dialog');
                box.setAttribute('aria-label', img.alt || 'Photo, full screen');
                var fig = document.createElement('figure');
                var big = document.createElement('img');
                big.src = img.currentSrc || img.src;
                big.alt = img.alt || '';
                fig.appendChild(big);
                if (img.alt) {
                    var cap = document.createElement('figcaption');
                    cap.textContent = img.alt;
                    fig.appendChild(cap);
                }
                var x = document.createElement('button');
                x.type = 'button';
                x.className = 'pfx-lightbox-close';
                x.setAttribute('aria-label', 'Close');
                x.innerHTML = '&times;';
                x.addEventListener('click', function (e) {
                    e.stopPropagation();
                    close();
                });
                box.appendChild(fig);
                box.appendChild(x);
                box.addEventListener('click', close);
                document.body.appendChild(box);
                document.addEventListener('keydown', onKey);
            });
        });
    }

    /* ---------------- Photo strips: arrows + drag scroll ---------------- */

    function initStrips() {
        Array.prototype.forEach.call(document.querySelectorAll('.file-strip'), function (strip) {
            var scroller = strip.querySelector('.file-photos');
            if (!scroller) return;
            var prev = strip.querySelector('.file-strip-arrow[aria-label="Previous photo"]');
            var next = strip.querySelector('.file-strip-arrow[aria-label="Next photo"]');
            var update = function () {
                if (prev) prev.disabled = scroller.scrollLeft <= 2;
                if (next) next.disabled = scroller.scrollLeft >= scroller.scrollWidth - scroller.clientWidth - 2;
            };
            var step = function (dir) {
                var first = scroller.querySelector('.file-photo-zoom');
                var amount = first ? first.getBoundingClientRect().width + 12 : scroller.clientWidth * 0.8;
                scroller.scrollBy({ left: dir * amount, behavior: REDUCED ? 'auto' : 'smooth' });
            };
            if (prev) prev.addEventListener('click', function () { step(-1); });
            if (next) next.addEventListener('click', function () { step(1); });
            scroller.addEventListener('scroll', update, { passive: true });
            window.addEventListener('resize', update);
            update();

            // Drag to scroll (mouse).
            var dragState = null;
            scroller.addEventListener('pointerdown', function (e) {
                if (e.pointerType !== 'mouse') return;
                dragState = { x: e.clientX, left: scroller.scrollLeft, moved: false };
            });
            scroller.addEventListener('pointermove', function (e) {
                if (!dragState) return;
                var dx = e.clientX - dragState.x;
                if (Math.abs(dx) > 5) {
                    dragState.moved = true;
                    scroller.scrollLeft = dragState.left - dx;
                }
            });
            var end = function () { dragState = null; };
            scroller.addEventListener('pointerup', end);
            scroller.addEventListener('pointercancel', end);
            scroller.addEventListener('click', function (e) {
                if (dragState && dragState.moved) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            }, true);
        });
    }

    /* ---------------- Boot ---------------- */

    function boot() {
        Array.prototype.forEach.call(document.querySelectorAll('.pf-hero-flow'), initFlow);
        initReveals();
        initStats();
        initMap();
        initLightbox();
        initStrips();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();
