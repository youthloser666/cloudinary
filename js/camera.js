/**
 * CAMERA HARDWARE & CAPTURE ENGINE
 */
const CameraEngine = {
    async start() {
        try {
            if (STATE.currentStream) {
                STATE.currentStream.getTracks().forEach(t => t.stop());
                STATE.currentStream = null;
            }

            let stream;
            try {
                // Request camera with zoom capability enabled
                stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: STATE.currentFacingMode,
                        width: { ideal: 1920 },
                        height: { ideal: 1080 },
                        zoom: true
                    },
                    audio: false
                });
            } catch (e) {
                // Fallback standard constraints
                stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: STATE.currentFacingMode,
                        width: { ideal: 1920 },
                        height: { ideal: 1080 }
                    },
                    audio: false
                });
            }

            STATE.currentStream = stream;
            DOM.cameraFeed.srcObject = stream;
            DOM.cameraFeed.style.display = 'block';
            DOM.placeholderView.style.display = 'none';
            DOM.cameraErrorView.style.display = 'none';
            DOM.hasilFoto.style.display = 'none';
            STATE.cameraAvailable = true;
            UI.setCameraState('ready', 'LIVE');

            // Detect real hardware zoom capabilities from active camera track
            this.detectZoomCapabilities();
            await this.applyZoom(1);
            this.bindPinchZoom();
        } catch (err) {
            console.error('Camera initialization error:', err);
            STATE.cameraAvailable = false;
            DOM.cameraFeed.style.display = 'none';
            DOM.placeholderView.style.display = 'none';
            DOM.cameraErrorView.style.display = 'flex';
            UI.setCameraState('ready', 'NO CAMERA');
        }
    },

    detectZoomCapabilities() {
        if (!DOM.zoomControlsOverlay) return;

        let min = 1;
        let max = 5;

        if (STATE.currentStream) {
            const track = STATE.currentStream.getVideoTracks()[0];
            if (track) {
                const caps = typeof track.getCapabilities === 'function' ? track.getCapabilities() : {};
                const settings = typeof track.getSettings === 'function' ? track.getSettings() : {};

                if (caps.zoom) {
                    STATE.zoomCapabilities = caps.zoom;
                    min = caps.zoom.min || 1;
                    max = caps.zoom.max || 5;
                    console.log(`[Hardware Zoom Capabilities] min: ${min}, max: ${max}, current: ${settings.zoom}`);
                } else {
                    STATE.zoomCapabilities = null;
                }
            }
        }

        // Dynamically build presets matching hardware lens limits
        let presets = [];
        if (min < 0.95) presets.push(Math.round(min * 10) / 10);
        presets.push(1);
        if (max >= 2) presets.push(2);
        if (max >= 3) presets.push(3);
        if (max >= 5) presets.push(5);
        if (max >= 10) presets.push(10);
        if (max > 1 && max < 5 && !presets.includes(max)) {
            presets.push(Math.round(max * 10) / 10);
        }

        // Clean & sort presets
        presets = [...new Set(presets)].filter(z => z >= min && z <= max).sort((a, b) => a - b);

        DOM.zoomControlsOverlay.innerHTML = presets.map(z => 
            `<button type="button" class="zoom-btn-pill ${z === 1 ? 'active' : ''}" data-zoom="${z}">${z}x</button>`
        ).join('');
    },

    async applyZoom(zoomValue) {
        const targetZoom = Math.round((parseFloat(zoomValue) || 1) * 10) / 10;
        STATE.currentZoom = targetZoom;

        let hardwareSuccess = false;

        // 1. Attempt hardware WebRTC track zoom
        if (STATE.currentStream) {
            const track = STATE.currentStream.getVideoTracks()[0];
            if (track && typeof track.getCapabilities === 'function') {
                const caps = track.getCapabilities();
                if (caps.zoom) {
                    const min = caps.zoom.min || 1;
                    const max = caps.zoom.max || 5;
                    const clamped = Math.min(Math.max(targetZoom, min), max);
                    try {
                        await track.applyConstraints({
                            advanced: [{ zoom: clamped }]
                        });
                        hardwareSuccess = true;
                    } catch (err) {
                        console.warn("Hardware zoom applyConstraints error:", err);
                    }
                }
            }
        }

        STATE.hardwareZoomActive = hardwareSuccess;

        // 2. CSS Transform scaling fallback for live feed
        const mirror = STATE.currentFacingMode === 'user' ? 'scaleX(-1)' : 'scaleX(1)';
        if (!hardwareSuccess && targetZoom > 1) {
            DOM.cameraFeed.style.transform = `${mirror} scale(${targetZoom})`;
            DOM.cameraFeed.style.transformOrigin = 'center center';
        } else {
            DOM.cameraFeed.style.transform = mirror;
        }

        // 3. Update real-time zoom badge display
        if (DOM.zoomBadge) {
            DOM.zoomBadge.textContent = `${targetZoom.toFixed(1)}x`;
        }

        // 4. Highlight active pill button
        if (DOM.zoomControlsOverlay) {
            DOM.zoomControlsOverlay.querySelectorAll('.zoom-btn-pill').forEach(btn => {
                const z = parseFloat(btn.dataset.zoom);
                btn.classList.toggle('active', Math.abs(z - targetZoom) < 0.15);
            });
        }
    },

    bindPinchZoom() {
        if (!DOM.viewfinder || this._pinchBound) return;
        this._pinchBound = true;

        let startDist = 0;
        let startZoom = 1;

        DOM.viewfinder.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                startDist = Math.hypot(
                    e.touches[0].pageX - e.touches[1].pageX,
                    e.touches[0].pageY - e.touches[1].pageY
                );
                startZoom = STATE.currentZoom || 1;
            }
        }, { passive: true });

        DOM.viewfinder.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2 && startDist > 0) {
                const currentDist = Math.hypot(
                    e.touches[0].pageX - e.touches[1].pageX,
                    e.touches[0].pageY - e.touches[1].pageY
                );
                const factor = currentDist / startDist;
                let minZoom = 1;
                let maxZoom = 5;
                if (STATE.zoomCapabilities) {
                    minZoom = STATE.zoomCapabilities.min || 1;
                    maxZoom = STATE.zoomCapabilities.max || 5;
                }
                let newZoom = Math.min(Math.max(startZoom * factor, minZoom), maxZoom);
                newZoom = Math.round(newZoom * 10) / 10;
                this.applyZoom(newZoom);
            }
        }, { passive: true });

        DOM.viewfinder.addEventListener('touchend', () => {
            startDist = 0;
        });
    },

    async flip() {
        STATE.currentFacingMode = STATE.currentFacingMode === 'environment' ? 'user' : 'environment';
        await this.start();
    },

    triggerFlash() {
        const flash = document.createElement('div');
        flash.className = 'shutter-flash';
        DOM.viewfinder.appendChild(flash);
        flash.addEventListener('animationend', () => flash.remove());
    },

    async capture() {
        if (!STATE.cameraAvailable || !DOM.cameraFeed.srcObject) {
            alert('Kamera tidak tersedia. Gunakan tombol Galeri.');
            return;
        }
        this.triggerFlash();
        await new Promise(r => setTimeout(r, 150));

        const vW = DOM.cameraFeed.videoWidth;
        const vH = DOM.cameraFeed.videoHeight;
        DOM.captureCanvas.width = vW;
        DOM.captureCanvas.height = vH;
        const ctx = DOM.captureCanvas.getContext('2d');

        if (STATE.currentFacingMode === 'user') {
            ctx.translate(DOM.captureCanvas.width, 0);
            ctx.scale(-1, 1);
        }

        const zoom = STATE.currentZoom || 1;
        if (STATE.hardwareZoomActive || zoom === 1) {
            ctx.drawImage(DOM.cameraFeed, 0, 0, vW, vH);
        } else {
            // Software crop digital zoom
            const cropW = vW / zoom;
            const cropH = vH / zoom;
            const cropX = (vW - cropW) / 2;
            const cropY = (vH - cropH) / 2;
            ctx.drawImage(DOM.cameraFeed, cropX, cropY, cropW, cropH, 0, 0, vW, vH);
        }

        ctx.setTransform(1, 0, 0, 1, 0, 0);

        DOM.captureCanvas.toBlob(async (blob) => {
            if (!blob) return;
            await this.uploadToCloudinary(blob);
        }, 'image/jpeg', 0.92);
    },

    async uploadToCloudinary(fileOrBlob) {
        UI.setCameraState('busy', 'WINDING FILM...');
        DOM.cameraFeed.style.display = 'none';

        const formData = new FormData();
        formData.append('file', fileOrBlob, 'dispo_photo.jpg');
        formData.append('upload_preset', APP_CONFIG.uploadPreset);

        try {
            const response = await fetch(`https://api.cloudinary.com/v1_1/${APP_CONFIG.cloudName}/image/upload`, {
                method: 'POST', body: formData
            });
            const data = await response.json();

            if (data.error) {
                alert(`Cloudinary Error: ${data.error.message}`);
                this.showFeed();
                return;
            }

            if (data.secure_url) {
                STATE.originalUrl = data.secure_url;
                const parts = STATE.originalUrl.split('/upload/');
                if (parts.length === 2) {
                    STATE.baseUrl = parts[0];
                    STATE.restOfUrl = parts[1];
                    FilterEngine.applyFilterAndAutoSave();
                } else {
                    this.showFeed();
                }
            }
        } catch (error) {
            console.error("Upload network error:", error);
            alert("Network error during photo upload.");
            this.showFeed();
        }
    },

    showFeed() {
        if (STATE.cameraAvailable) {
            DOM.cameraFeed.style.display = 'block';
            DOM.hasilFoto.style.display = 'none';
            DOM.placeholderView.style.display = 'none';
            UI.setCameraState('ready', 'LIVE');
        } else {
            DOM.cameraErrorView.style.display = 'flex';
            UI.setCameraState('ready', 'NO CAMERA');
        }
    }
};
