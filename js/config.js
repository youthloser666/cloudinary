/**
 * APP CONFIGURATION & ENDPOINTS
 */
const APP_CONFIG = {
    cloudName: 'dqjrd00yu',
    uploadPreset: 'mfwcupload',
    endpoints: {
        config: '/api/config/cloudinary',
        photos: '/api/photos',
        cubes: '/api/cubes'
    }
};

/**
 * GLOBAL DOM ELEMENTS CACHE
 */
const DOM = {
    shutterBtn: document.getElementById('shutterBtn'),
    galleryBtn: document.getElementById('galleryBtn'),
    flipCameraBtn: document.getElementById('flipCameraBtn'),
    inputKamera: document.getElementById('inputKamera'),
    usernameInput: document.getElementById('usernameInput'),
    pilihFilter: document.getElementById('pilihFilter'),
    sliderIntensitas: document.getElementById('sliderIntensitas'),
    nilaiKetebalan: document.getElementById('nilaiKetebalan'),
    cameraFeed: document.getElementById('cameraFeed'),
    captureCanvas: document.getElementById('captureCanvas'),
    cameraErrorView: document.getElementById('cameraErrorView'),
    hasilFoto: document.getElementById('hasilFoto'),
    placeholderView: document.getElementById('placeholderView'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    loadingOverlayText: document.getElementById('loadingOverlayText'),
    vfStatusText: document.getElementById('vfStatusText'),
    viewfinder: document.getElementById('viewfinder'),
    zoomControlsOverlay: document.getElementById('zoomControlsOverlay'),
    zoomBadge: document.getElementById('zoomBadge'),
    toast: document.getElementById('toast'),
    statusLed: document.getElementById('statusLed'),
    galleryGrid: document.getElementById('galleryGrid'),
    galleryEmpty: document.getElementById('galleryEmpty'),
    galleryCount: document.getElementById('galleryCount'),
    // Add/Manage Cube Modal
    addCubeBtn: document.getElementById('addCubeBtn'),
    deleteCubeBtn: document.getElementById('deleteCubeBtn'),
    addCubeModal: document.getElementById('addCubeModal'),
    modalCloseBtn: document.getElementById('modalCloseBtn'),
    modalCancelBtn: document.getElementById('modalCancelBtn'),
    cubeNameInput: document.getElementById('cubeNameInput'),
    cubeFileInput: document.getElementById('cubeFileInput'),
    cubeDropZone: document.getElementById('cubeDropZone'),
    cubeDropText: document.getElementById('cubeDropText'),
    cubeUploadBtn: document.getElementById('cubeUploadBtn'),
    cubeProgress: document.getElementById('cubeProgress'),
    cubeProgressBar: document.getElementById('cubeProgressBar'),
    emojiPicker: document.getElementById('emojiPicker'),
    // Photo Detail Modal
    photoDetailModal: document.getElementById('photoDetailModal'),
    detailImage: document.getElementById('detailImage'),
    detailUsername: document.getElementById('detailUsername'),
    detailFilter: document.getElementById('detailFilter'),
    detailCloseBtn: document.getElementById('detailCloseBtn'),
    detailDownloadBtn: document.getElementById('detailDownloadBtn'),
    detailSaveBtn: document.getElementById('detailSaveBtn'),
    detailDeleteBtn: document.getElementById('detailDeleteBtn')
};

/**
 * GLOBAL APPLICATION STATE MANAGEMENT
 */
const STATE = {
    baseUrl: '',
    restOfUrl: '',
    originalUrl: '',
    currentFinalUrl: '',
    currentStream: null,
    currentFacingMode: 'environment',
    cameraAvailable: false,
    allPhotos: [],
    currentDetailPhotoId: null,
    selectedEmoji: '🎨',
    selectedCubeFile: null,
    currentZoom: 1,
    hardwareZoomActive: false,
    zoomCapabilities: null
};
