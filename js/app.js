/**
 * MAIN APPLICATION LIFECYCLE & EVENT BINDINGS
 */
const App = {
    async fetchCloudinaryConfig() {
        try {
            const res = await fetch(APP_CONFIG.endpoints.config);
            if (res.ok) {
                const data = await res.json();
                APP_CONFIG.cloudName = data.cloudName;
                APP_CONFIG.uploadPreset = data.uploadPreset;
            }
        } catch (e) {
            console.warn("Using default Cloudinary configuration.");
        }
    },

    bindEvents() {
        // Shutter & Camera Controls
        DOM.shutterBtn.addEventListener('click', () => CameraEngine.capture());
        DOM.galleryBtn.addEventListener('click', () => DOM.inputKamera.click());
        DOM.flipCameraBtn.addEventListener('click', () => CameraEngine.flip());

        if (DOM.zoomControlsOverlay) {
            DOM.zoomControlsOverlay.addEventListener('click', (e) => {
                const btn = e.target.closest('.zoom-btn-pill');
                if (!btn) return;
                const zoomVal = parseFloat(btn.dataset.zoom);
                CameraEngine.applyZoom(zoomVal);
            });
        }

        DOM.inputKamera.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                await CameraEngine.uploadToCloudinary(file);
                DOM.inputKamera.value = '';
            }
        });

        // Filter & Intensity Controls
        DOM.sliderIntensitas.addEventListener('input', (e) => {
            DOM.nilaiKetebalan.innerText = `${e.target.value}%`;
            UI.updateSliderFill(DOM.sliderIntensitas);
            FilterEngine.updateLivePreview();
        });

        DOM.pilihFilter.addEventListener('change', () => {
            FilterEngine.updateLivePreview();
        });

        // Image Load & Auto-Save Handler
        DOM.hasilFoto.addEventListener('load', async () => {
            DOM.hasilFoto.style.display = 'block';
            UI.setCameraState('ready', 'FILM PRINTED');

            const username = DOM.usernameInput.value.trim() || 'Anonymous';

            try {
                const response = await fetch(APP_CONFIG.endpoints.photos, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username,
                        originalUrl: STATE.originalUrl,
                        finalUrl: STATE.currentFinalUrl,
                        filterName: DOM.pilihFilter.value
                    })
                });
                const data = await response.json();
                if (data.success && data.photo) {
                    STATE.allPhotos.unshift(data.photo);
                    GalleryEngine.render();
                    UI.showToast('📸 Photo saved to Database!');
                } else {
                    console.error("DB Save Error:", data.error);
                    UI.showToast('❌ Failed to save photo to DB');
                }
            } catch (err) {
                console.error("Server connection error during photo save:", err);
            }

            setTimeout(() => {
                STATE.baseUrl = '';
                STATE.restOfUrl = '';
                STATE.originalUrl = '';
                STATE.currentFinalUrl = '';
                CameraEngine.showFeed();
            }, 2000);
        });

        DOM.hasilFoto.addEventListener('error', () => {
            UI.setCameraState('ready', 'RENDER ERROR');
            alert("Gagal render filter.");
            CameraEngine.showFeed();
        });

        // Add & Delete Cube Events
        DOM.addCubeBtn.addEventListener('click', () => CubeManager.openModal());
        if (DOM.deleteCubeBtn) {
            DOM.deleteCubeBtn.addEventListener('click', () => CubeManager.removeSelectedCube());
        }
        DOM.modalCloseBtn.addEventListener('click', () => CubeManager.closeModal());
        DOM.modalCancelBtn.addEventListener('click', () => CubeManager.closeModal());
        DOM.addCubeModal.addEventListener('click', (e) => {
            if (e.target === DOM.addCubeModal) CubeManager.closeModal();
        });

        DOM.emojiPicker.addEventListener('click', (e) => {
            const btn = e.target.closest('.emoji-option');
            if (!btn) return;
            STATE.selectedEmoji = btn.dataset.emoji;
            DOM.emojiPicker.querySelectorAll('.emoji-option').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
        });

        DOM.cubeDropZone.addEventListener('click', () => DOM.cubeFileInput.click());
        DOM.cubeDropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            DOM.cubeDropZone.style.borderColor = 'var(--lcd-glow)';
        });
        DOM.cubeDropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            if (!STATE.selectedCubeFile) DOM.cubeDropZone.style.borderColor = '';
        });
        DOM.cubeDropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            DOM.cubeDropZone.style.borderColor = '';
            if (e.dataTransfer.files[0]) CubeManager.handleFile(e.dataTransfer.files[0]);
        });
        DOM.cubeFileInput.addEventListener('change', (e) => {
            if (e.target.files[0]) CubeManager.handleFile(e.target.files[0]);
            DOM.cubeFileInput.value = '';
        });
        DOM.cubeNameInput.addEventListener('input', () => CubeManager.validateForm());
        DOM.cubeUploadBtn.addEventListener('click', () => CubeManager.uploadAndSave());

        // Detail Modal Events
        DOM.detailCloseBtn.addEventListener('click', () => GalleryEngine.closeDetail());
        DOM.photoDetailModal.addEventListener('click', (e) => {
            if (e.target === DOM.photoDetailModal) GalleryEngine.closeDetail();
        });
        if (DOM.detailDownloadBtn) {
            DOM.detailDownloadBtn.addEventListener('click', () => GalleryEngine.downloadPhoto());
        }
        DOM.detailSaveBtn.addEventListener('click', () => GalleryEngine.updateUsername());
        DOM.detailDeleteBtn.addEventListener('click', () => GalleryEngine.deletePhoto());
    },

    async init() {
        UI.updateSliderFill(DOM.sliderIntensitas);
        await this.fetchCloudinaryConfig();
        await CameraEngine.start();
        this.bindEvents();
        await CubeManager.loadPersistentCubes();
        await GalleryEngine.load();
    }
};

// Initialize App on DOM Ready
document.addEventListener('DOMContentLoaded', () => App.init());
