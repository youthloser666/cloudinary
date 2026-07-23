/**
 * CUBE FILTER UPLOAD MANAGER
 */
const CubeManager = {
    async loadPersistentCubes() {
        try {
            const res = await fetch(APP_CONFIG.endpoints.cubes);
            const data = await res.json();
            DOM.pilihFilter.innerHTML = '';
            if (data.success && Array.isArray(data.cubes) && data.cubes.length > 0) {
                data.cubes.forEach((cube, index) => {
                    const opt = document.createElement('option');
                    opt.value = cube.fileName;
                    opt.textContent = `${cube.emoji || '🎨'} ${cube.name}`;
                    if (index === 0) opt.selected = true;
                    DOM.pilihFilter.appendChild(opt);
                });
            } else {
                const opt = document.createElement('option');
                opt.value = '';
                opt.textContent = '⚠️ Belum ada filter yang di-upload';
                opt.disabled = true;
                opt.selected = true;
                DOM.pilihFilter.appendChild(opt);
            }
        } catch (err) {
            console.error("Could not load cubes from server DB:", err);
            DOM.pilihFilter.innerHTML = '<option value="" disabled selected>⚠️ Belum ada filter yang di-upload</option>';
        }
    },

    openModal() {
        DOM.addCubeModal.classList.add('active');
    },

    closeModal() {
        DOM.addCubeModal.classList.remove('active');
        setTimeout(() => {
            DOM.cubeNameInput.value = '';
            STATE.selectedCubeFile = null;
            DOM.cubeDropZone.classList.remove('has-file');
            DOM.cubeDropText.innerText = 'Click or drag .cube file';
            DOM.cubeUploadBtn.disabled = true;
            DOM.cubeProgress.classList.remove('active');
            DOM.cubeProgressBar.style.width = '0%';
            STATE.selectedEmoji = '🎨';
            DOM.emojiPicker.querySelectorAll('.emoji-option').forEach(b => b.classList.toggle('selected', b.dataset.emoji === '🎨'));
        }, 300);
    },

    handleFile(file) {
        if (!file || !file.name.endsWith('.cube')) {
            alert('Only .cube files are supported!');
            return;
        }
        STATE.selectedCubeFile = file;
        DOM.cubeDropZone.classList.add('has-file');
        DOM.cubeDropText.innerText = file.name;
        this.validateForm();
    },

    validateForm() {
        DOM.cubeUploadBtn.disabled = !(DOM.cubeNameInput.value.trim() && STATE.selectedCubeFile);
    },

    async uploadAndSave() {
        if (!STATE.selectedCubeFile || !DOM.cubeNameInput.value.trim()) return;

        const filmName = DOM.cubeNameInput.value.trim();
        const publicId = STATE.selectedCubeFile.name.replace(/\.cube$/i, '').replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
        const cubeFileName = publicId + '.cube';

        DOM.cubeUploadBtn.disabled = true;
        DOM.cubeUploadBtn.innerText = 'Uploading...';
        DOM.cubeProgress.classList.add('active');
        DOM.cubeProgressBar.style.width = '20%';

        try {
            const formData = new FormData();
            formData.append('file', STATE.selectedCubeFile, cubeFileName);
            formData.append('upload_preset', APP_CONFIG.uploadPreset);
            formData.append('resource_type', 'raw');
            formData.append('public_id', publicId);

            DOM.cubeProgressBar.style.width = '50%';

            const response = await fetch(`https://api.cloudinary.com/v1_1/${APP_CONFIG.cloudName}/raw/upload`, {
                method: 'POST', body: formData
            });

            DOM.cubeProgressBar.style.width = '80%';
            const data = await response.json();
            if (data.error) throw new Error(data.error.message);

            // Persist to Supabase DB via backend API
            await fetch(APP_CONFIG.endpoints.cubes, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: filmName,
                    emoji: STATE.selectedEmoji,
                    fileName: cubeFileName,
                    cloudUrl: data.secure_url
                })
            });

            DOM.cubeProgressBar.style.width = '100%';

            // Clear placeholder option if present
            if (DOM.pilihFilter.options.length === 1 && DOM.pilihFilter.options[0].value === '') {
                DOM.pilihFilter.innerHTML = '';
            }

            const exists = Array.from(DOM.pilihFilter.options).some(o => o.value === cubeFileName);
            if (!exists) {
                const newOpt = document.createElement('option');
                newOpt.value = cubeFileName;
                newOpt.textContent = `${STATE.selectedEmoji} ${filmName}`;
                DOM.pilihFilter.appendChild(newOpt);
            }
            DOM.pilihFilter.value = cubeFileName;

            this.closeModal();
            UI.showToast(`🎞️ "${filmName}" saved to Database!`);
        } catch (error) {
            alert(`Upload failed: ${error.message}`);
            DOM.cubeProgress.classList.remove('active');
            DOM.cubeProgressBar.style.width = '0%';
        } finally {
            DOM.cubeUploadBtn.disabled = false;
            DOM.cubeUploadBtn.innerText = 'Upload & Add';
            this.validateForm();
        }
    }
};
