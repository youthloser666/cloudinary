/**
 * GALLERY & CRUD ENGINE (Supabase Direct Integration)
 */
const GalleryEngine = {
    async load() {
        try {
            const res = await fetch(APP_CONFIG.endpoints.photos);
            const data = await res.json();
            if (data.success && Array.isArray(data.photos)) {
                STATE.allPhotos = data.photos;
                this.render();
            } else {
                console.error("Failed to load gallery from DB:", data.error);
            }
        } catch (err) {
            console.error("Could not fetch photos from DB:", err);
        }
    },

    render() {
        DOM.galleryGrid.innerHTML = '';
        DOM.galleryCount.textContent = STATE.allPhotos.length;

        if (STATE.allPhotos.length === 0) {
            DOM.galleryEmpty.style.display = 'block';
            return;
        }
        DOM.galleryEmpty.style.display = 'none';

        STATE.allPhotos.forEach((photo, i) => {
            const card = document.createElement('div');
            card.className = 'photo-card';
            card.style.animationDelay = `${i * 0.05}s`;

            const filterShort = this.getFilterShortName(photo.filterName);
            const timeAgo = this.getTimeAgo(photo.createdAt);

            card.innerHTML = `
                <img class="photo-card-img" src="${photo.finalUrl}" alt="Photo" loading="lazy" onclick="GalleryEngine.openDetail('${photo.id}')">
                <div class="photo-card-info">
                    <div class="photo-card-user">@${photo.username}</div>
                    <div class="photo-card-meta">
                        <span class="photo-card-filter">${filterShort} · ${timeAgo}</span>
                        <div class="photo-card-actions">
                            <button class="photo-card-btn" onclick="GalleryEngine.openDetail('${photo.id}')" title="View/Edit">
                                <svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                            </button>
                            <button class="photo-card-btn danger" onclick="GalleryEngine.deletePhoto('${photo.id}')" title="Delete">
                                <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            DOM.galleryGrid.appendChild(card);
        });
    },

    openDetail(photoId) {
        const photo = STATE.allPhotos.find(p => p.id === photoId);
        if (!photo) return;

        STATE.currentDetailPhotoId = photoId;
        DOM.detailImage.src = photo.finalUrl;
        DOM.detailUsername.value = photo.username;
        DOM.detailFilter.value = photo.filterName;

        DOM.photoDetailModal.classList.add('active');
    },

    closeDetail() {
        DOM.photoDetailModal.classList.remove('active');
        STATE.currentDetailPhotoId = null;
    },

    async updateUsername() {
        if (!STATE.currentDetailPhotoId) return;
        const newUsername = DOM.detailUsername.value.trim();
        if (!newUsername) return;

        try {
            const res = await fetch(`${APP_CONFIG.endpoints.photos}/${STATE.currentDetailPhotoId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: newUsername })
            });
            const data = await res.json();
            if (data.success) {
                const photo = STATE.allPhotos.find(p => p.id === STATE.currentDetailPhotoId);
                if (photo) photo.username = newUsername;
                this.render();
                this.closeDetail();
                UI.showToast('✅ Username updated in Database!');
            } else {
                alert(`Failed to update: ${data.error}`);
            }
        } catch (err) {
            alert('Server error updating photo username.');
        }
    },

    async deletePhoto(photoId) {
        const targetId = photoId || STATE.currentDetailPhotoId;
        if (!targetId) return;
        if (!confirm('Delete this photo permanently from Database?')) return;

        try {
            const res = await fetch(`${APP_CONFIG.endpoints.photos}/${targetId}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                STATE.allPhotos = STATE.allPhotos.filter(p => p.id !== targetId);
                this.render();
                if (STATE.currentDetailPhotoId === targetId) this.closeDetail();
                UI.showToast('🗑 Photo deleted from Database!');
            } else {
                alert(`Failed to delete: ${data.error}`);
            }
        } catch (err) {
            alert('Server error deleting photo.');
        }
    },

    getFilterShortName(f) {
        if (!f) return '—';
        if (f.includes('fuji')) return 'FUJI';
        if (f.includes('doc')) return 'KODAK';
        if (f.includes('gru2')) return 'GRU2';
        if (f.includes('gru')) return 'GRU1';
        if (f.includes('blau')) return 'BLAU';
        if (f.includes('dashcam')) return 'DCAM';
        return f.replace('.cube', '').toUpperCase().substring(0, 6);
    },

    getTimeAgo(dateStr) {
        if (!dateStr) return 'now';
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'now';
        if (mins < 60) return `${mins}m`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h`;
        const days = Math.floor(hrs / 24);
        return `${days}d`;
    }
};
