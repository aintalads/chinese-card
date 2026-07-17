import { GestureRecognizer, FilesetResolver } from './vision_bundle.mjs';

let gestureRecognizer = null;
let runningMode = "VIDEO";
let webcamRunning = false;
let lastVideoTime = -1;
let lastGestureTime = 0;

window.initGestures = async function() {
    try {
        const vision = await FilesetResolver.forVisionTasks("./wasm");
        gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: "./gesture_recognizer.task",
                delegate: "GPU"
            },
            runningMode: runningMode,
            numHands: 1
        });
        return true;
    } catch (e) {
        console.error("Failed to initialize gesture recognizer:", e);
        return false;
    }
}

window.isGesturesReady = function() {
    return gestureRecognizer !== null;
}

window.startPredictingFromStream = function(videoElement, onGesture) {
    if (!gestureRecognizer) {
        console.error("Gesture recognizer not initialized.");
        return;
    }
    
    const startPredicting = () => {
        webcamRunning = true;
        predictWebcam(videoElement, onGesture);
    };

    if (videoElement.readyState >= 2) {
        startPredicting();
    } else {
        videoElement.addEventListener("loadeddata", startPredicting);
    }
}

window.checkModelDownloadProgress = async function(onProgress) {
    const filesToTrack = [
        { url: '/gesture_recognizer.task', size: 8373440 },
        { url: '/wasm/vision_wasm_internal.wasm', size: 2300193 },
        { url: '/wasm/vision_wasm_nosimd_internal.wasm', size: 2298124 },
        { url: '/wasm/vision_wasm_module_internal.wasm', size: 2300193 }
    ];
    
    const CACHE_NAME = 'mandarin-cache-v14';
    let totalSize = filesToTrack.reduce((acc, f) => acc + f.size, 0);
    
    try {
        const cache = await caches.open(CACHE_NAME);
        
        const getCachedBytes = async () => {
            let downloaded = 0;
            const cachedStatuses = await Promise.all(filesToTrack.map(f => cache.match(f.url)));
            for (let i=0; i<filesToTrack.length; i++) {
                if (cachedStatuses[i]) {
                    downloaded += filesToTrack[i].size;
                }
            }
            return downloaded;
        };

        let initialDownloaded = await getCachedBytes();
        if (initialDownloaded === totalSize) {
            onProgress(100);
            return;
        }

        let totalDownloaded = 0;
        onProgress(0);

        for (let file of filesToTrack) {
            const cachedRes = await cache.match(file.url);
            if (cachedRes) {
                totalDownloaded += file.size;
                onProgress((totalDownloaded / totalSize) * 100);
                continue;
            }

            try {
                const response = await fetch(file.url);
                if (!response.ok) throw new Error("Network error");
                
                let loaded = 0;
                const reader = response.body.getReader();
                const chunks = [];
                
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    
                    chunks.push(value);
                    loaded += value.byteLength;
                    
                    const currentProgress = totalDownloaded + loaded;
                    onProgress(Math.min((currentProgress / totalSize) * 100, 100));
                }
                
                totalDownloaded += file.size;
                onProgress((totalDownloaded / totalSize) * 100);
                
                const blob = new Blob(chunks, { type: response.headers.get('content-type') || 'application/octet-stream' });
                const cacheResponse = new Response(blob, {
                    status: 200,
                    statusText: 'OK',
                    headers: response.headers
                });
                await cache.put(file.url, cacheResponse);
            } catch(e) {
                console.warn("Error caching " + file.url, e);
            }
        }
    } catch(e) {
        console.error("Cache API not available", e);
        onProgress(-1);
    }
}

window.stopWebcam = function(videoElement) {
    webcamRunning = false;
    if (videoElement.srcObject) {
        const tracks = videoElement.srcObject.getTracks();
        tracks.forEach(track => track.stop());
        videoElement.srcObject = null;
    }
}

async function predictWebcam(videoElement, onGesture) {
    if (!webcamRunning) {
        return;
    }
    
    // Play video
    if (videoElement.paused) {
        videoElement.play().catch(e => console.error(e));
    }

    let nowInMs = Date.now();
    
    if (videoElement.currentTime !== lastVideoTime) {
        lastVideoTime = videoElement.currentTime;
        if (gestureRecognizer) {
            const results = gestureRecognizer.recognizeForVideo(videoElement, nowInMs);
            if (results.gestures && results.gestures.length > 0) {
                const categoryName = results.gestures[0][0].categoryName;
                const categoryScore = results.gestures[0][0].score;
                
                // Debounce gestures
                if (categoryScore > 0.6 && (nowInMs - lastGestureTime > 1000)) {
                    if (categoryName === "Closed_Fist" || categoryName === "Thumb_Down" || categoryName === "Pointing_Up") {
                        // Let's use Open_Palm and Closed_Fist for simple left/right
                        // Pointing_Up, Thumb_Down, Thumb_Up, Closed_Fist, Open_Palm, ILoveYou, Victory
                        console.log("Gesture recognized:", categoryName, "Score:", categoryScore);
                    }
                    
                    if (categoryName === "Closed_Fist" || categoryName === "Thumb_Down") {
                         onGesture("left");
                         lastGestureTime = nowInMs;
                    } else if (categoryName === "Open_Palm" || categoryName === "Thumb_Up") {
                         onGesture("right");
                         lastGestureTime = nowInMs;
                    }
                }
            }
        }
    }

    // Call this function again to keep predicting when the browser is ready
    if (webcamRunning) {
        window.requestAnimationFrame(() => predictWebcam(videoElement, onGesture));
    }
}
