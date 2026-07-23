/**
 * UI HELPER & FEEDBACK UTILITIES
 */
const UI = {
    setCameraState(state, vfText) {
        if (state === 'busy') {
            DOM.statusLed.className = 'status-led busy';
            DOM.loadingOverlayText.innerText = vfText;
            DOM.loadingOverlay.style.display = 'flex';
            DOM.vfStatusText.innerText = vfText;
        } else {
            DOM.statusLed.className = 'status-led ready';
            DOM.loadingOverlay.style.display = 'none';
            DOM.vfStatusText.innerText = vfText;
        }
    },

    updateSliderFill(slider) {
        const val = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
        slider.style.background = `linear-gradient(to right, var(--camera-accent) 0%, var(--camera-accent) ${val}%, #333 ${val}%, #333 100%)`;
    },

    showToast(message) {
        DOM.toast.innerText = message || '✅ Done!';
        DOM.toast.classList.add('show');
        setTimeout(() => DOM.toast.classList.remove('show'), 3000);
    }
};
