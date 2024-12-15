const video = document.getElementById("webcam");
const overlay = document.getElementById("overlay");
const emotionDisplay = document.getElementById("emotion");
const ctx = overlay.getContext("2d");

// Initialize webcam
async function setupCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
        return new Promise((resolve) => {
            video.onloadedmetadata = () => {
                video.play();
                resolve(video);
            };
        });
    } catch (error) {
        console.error("Error accessing webcam:", error);
        alert("Unable to access webcam. Please check permissions and try again.");
        throw error;
    }
}

// Load models and start detection
async function loadModels() {
    try {
        await faceapi.nets.tinyFaceDetector.loadFromUri("./models");
        await faceapi.nets.faceExpressionNet.loadFromUri("./models");
        console.log("Models loaded successfully");
    } catch (error) {
        console.error("Error loading models:", error);
        alert("Failed to load emotion detection models. Please check your internet connection.");
        throw error;
    }
}

async function detectEmotions() {
    try {
        const detections = await faceapi
            .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceExpressions();

        ctx.clearRect(0, 0, overlay.width, overlay.height);
        overlay.width = video.videoWidth;
        overlay.height = video.videoHeight;

        if (detections.length > 0) {
            detections.forEach((detection) => {
                const { x, y, width, height } = detection.detection.box;
                const expressions = detection.expressions;
                const maxEmotion = Object.keys(expressions).reduce((a, b) =>
                    expressions[a] > expressions[b] ? a : b
                );

                // Draw bounding box
                ctx.strokeStyle = "#00FF00";
                ctx.lineWidth = 2;
                ctx.strokeRect(x, y, width, height);

                // Display emotion
                emotionDisplay.innerText = maxEmotion;
                updateChart(maxEmotion);
            });
        } else {
            emotionDisplay.innerText = "No face detected";
        }

        // Continue detection
        requestAnimationFrame(detectEmotions);
    } catch (error) {
        console.error("Emotion detection error:", error);
    }
}

// Setup emotion trends chart
const emotionCounts = { happy: 0, sad: 0, angry: 0, neutral: 0, surprised: 0 };
let chart;

function updateChart(emotion) {
    if (emotionCounts.hasOwnProperty(emotion)) {
        emotionCounts[emotion]++;
    }

    if (chart) {
        chart.data.datasets[0].data = Object.values(emotionCounts);
        chart.update();
    }
}

// Main initialization function
async function initializeApp() {
    try {
        await loadModels();
        await setupCamera();
        
        // Initialize chart
        const ctx = document.getElementById("emotion-chart").getContext("2d");
        chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(emotionCounts),
                datasets: [{
                    label: 'Emotion Trends',
                    data: Object.values(emotionCounts),
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.6)',
                        'rgba(54, 162, 235, 0.6)',
                        'rgba(255, 206, 86, 0.6)',
                        'rgba(75, 192, 192, 0.6)',
                        'rgba(153, 102, 255, 0.6)'
                    ]
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });

        // Start emotion detection
        detectEmotions();
    } catch (error) {
        console.error("Initialization failed:", error);
        alert("Failed to start emotion detection. Please check console for details.");
    }
}

// Run initialization when page loads
window.addEventListener('load', initializeApp);
