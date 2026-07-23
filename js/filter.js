/**
 * CLOUDINARY FILTER & TRANSFORMATION ENGINE
 */
const FilterEngine = {
    EFFECT_FILTERS: {
        'dashcam_grunge': {
            base: { sepia: 40, contrast: 25, brightness: -5, vignette: 40 },
            build(intensity) {
                const s = intensity / 100;
                let effects = '';
                const sep = Math.round(this.base.sepia * s);
                const con = Math.round(this.base.contrast * s);
                const bri = Math.round(this.base.brightness * s);
                const vig = Math.round(this.base.vignette * s);
                if (sep > 0) effects += `e_sepia:${sep}/`;
                if (con !== 0) effects += `e_contrast:${con}/`;
                if (bri !== 0) effects += `e_brightness:${bri}/`;
                if (vig > 0) effects += `e_vignette:${vig}/`;
                return effects;
            }
        }
    },

    buildUrl(filter, intensity) {
        if (!STATE.baseUrl || !STATE.restOfUrl) return '';
        if (!filter) return `${STATE.baseUrl}/upload/${STATE.restOfUrl}`;

        if (filter.startsWith('effect:')) {
            const effectName = filter.split(':')[1];
            const effectDef = this.EFFECT_FILTERS[effectName];
            if (effectDef) {
                let effects = effectDef.build(intensity);
                if (effectName === 'dashcam_grunge') {
                    const now = new Date();
                    const pad = (n) => String(n).padStart(2, '0');
                    const ts = `${pad(now.getDate())}.${pad(now.getMonth()+1)}.${now.getFullYear()} ${pad(now.getHours())}${encodeURIComponent(':')}${pad(now.getMinutes())}`;
                    effects += `l_text:courier_new_14_bold:${ts},g_south_east,x_15,y_15,co_rgb:ffaa00,o_80/fl_layer_apply/`;
                }
                return `${STATE.baseUrl}/upload/${effects}${STATE.restOfUrl}`;
            }
            return `${STATE.baseUrl}/upload/${STATE.restOfUrl}`;
        } else {
            // LUT filter (.cube) opacity qualifier o_${intensity}
            return `${STATE.baseUrl}/upload/l_lut:${filter},o_${intensity}/fl_layer_apply/${STATE.restOfUrl}`;
        }
    },

    applyFilterAndAutoSave() {
        if (!STATE.baseUrl || !STATE.restOfUrl) return;
        UI.setCameraState('busy', 'DEVELOPING...');

        const filter = DOM.pilihFilter.value;
        const intensity = parseInt(DOM.sliderIntensitas.value);

        STATE.currentFinalUrl = this.buildUrl(filter, intensity);

        DOM.hasilFoto.src = STATE.currentFinalUrl;
        DOM.placeholderView.style.display = 'none';
        DOM.cameraFeed.style.display = 'none';
        DOM.cameraErrorView.style.display = 'none';
    },

    updateLivePreview() {
        if (STATE.baseUrl && STATE.restOfUrl && DOM.hasilFoto.style.display === 'block') {
            const filter = DOM.pilihFilter.value;
            const intensity = parseInt(DOM.sliderIntensitas.value);
            STATE.currentFinalUrl = this.buildUrl(filter, intensity);
            DOM.hasilFoto.src = STATE.currentFinalUrl;
        }
    }
};
