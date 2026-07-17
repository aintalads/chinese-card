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

window.startCameraAndRecognize = async function(videoElement, onGesture) {
    if (!gestureRecognizer) {
        console.error("Gesture recognizer not initialized.");
        return false;
    }

    try {
        const constraints = {
            video: true
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        videoElement.srcObject = stream;
        videoElement.addEventListener("loadeddata", () => {
            webcamRunning = true;
            predictWebcam(videoElement, onGesture);
        });
        return true;
    } catch (err) {
        console.error("Error accessing webcam:", err);
        return false;
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
