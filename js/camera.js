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
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: STATE.currentFacingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
                audio: false
            });
            STATE.currentStream = stream;
            DOM.cameraFeed.srcObject = stream;
            DOM.cameraFeed.style.display = 'block';
            DOM.placeholderView.style.display = 'none';
            DOM.cameraErrorView.style.display = 'none';
            DOM.hasilFoto.style.display = 'none';
            STATE.cameraAvailable = true;
            UI.setCameraState('ready', 'LIVE');
        } catch (err) {
            console.error('Camera initialization error:', err);
            STATE.cameraAvailable = false;
            DOM.cameraFeed.style.display = 'none';
            DOM.placeholderView.style.display = 'none';
            DOM.cameraErrorView.style.display = 'flex';
            UI.setCameraState('ready', 'NO CAMERA');
        }
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

        DOM.captureCanvas.width = DOM.cameraFeed.videoWidth;
        DOM.captureCanvas.height = DOM.cameraFeed.videoHeight;
        const ctx = DOM.captureCanvas.getContext('2d');
        if (STATE.currentFacingMode === 'user') {
            ctx.translate(DOM.captureCanvas.width, 0);
            ctx.scale(-1, 1);
        }
        ctx.drawImage(DOM.cameraFeed, 0, 0);
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
