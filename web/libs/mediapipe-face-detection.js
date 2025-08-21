/**
 * MediaPipe Face Detection 封装库
 * 为面部检测和关键点检测提供统一的API接口
 */

class MediaPipeFaceDetector {
    constructor() {
        this.isInitialized = false;
        this.faceDetection = null;
        this.faceMesh = null;
        this.loadingPromise = null;
    }

    /**
     * 初始化MediaPipe模型
     * @param {Object} options 配置选项
     */
    async initialize(options = {}) {
        if (this.isInitialized) return;
        if (this.loadingPromise) return this.loadingPromise;

        this.loadingPromise = this._loadModels(options);
        await this.loadingPromise;
        this.isInitialized = true;
    }

    /**
     * 加载MediaPipe模型
     * @private
     */
    async _loadModels(options) {
        try {
            // 确保MediaPipe脚本已加载
            await this._ensureMediaPipeLoaded();
            
            // 等待全局对象可用
            await this._waitForGlobalObjects();
            
            // 初始化面部检测
            if (window.FaceDetection) {
                this.faceDetection = new window.FaceDetection({
                    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection@0.4/${file}`
                });

                this.faceDetection.setOptions({
                    model: options.model || 'short',
                    minDetectionConfidence: options.minDetectionConfidence || 0.5,
                });
                
                console.log('MediaPipe Face Detection initialized successfully');
            } else {
                console.warn('FaceDetection not available, using fallback');
                this.useFallbackDetection = true;
            }

            // 初始化面部网格
            if (window.FaceMesh) {
                this.faceMesh = new window.FaceMesh({
                    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4/${file}`
                });

                this.faceMesh.setOptions({
                    maxNumFaces: options.maxNumFaces || 1,
                    refineLandmarks: options.refineLandmarks || true,
                    minDetectionConfidence: options.minDetectionConfidence || 0.5,
                    minTrackingConfidence: options.minTrackingConfidence || 0.5
                });
                
                console.log('MediaPipe Face Mesh initialized successfully');
            }

            if (!this.faceDetection && !this.faceMesh) {
                console.warn('No MediaPipe models available, using fallback detection');
                this.useFallbackDetection = true;
            }
        } catch (error) {
            console.error('Failed to load MediaPipe models:', error);
            console.warn('Using fallback detection');
            this.useFallbackDetection = true;
        }
    }

    /**
     * 等待全局MediaPipe对象可用
     * @private
     */
    async _waitForGlobalObjects() {
        let attempts = 0;
        const maxAttempts = 30; // 最多等待3秒
        
        while (attempts < maxAttempts) {
            if (window.FaceDetection || window.FaceMesh) {
                return;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        console.warn('MediaPipe global objects not found after waiting');
    }

    /**
     * 确保MediaPipe库已加载
     * @private
     */
    async _ensureMediaPipeLoaded() {
        // 检查是否已经有脚本标签
        const existingFaceDetectionScript = document.querySelector('script[src*="face_detection"]');
        const existingFaceMeshScript = document.querySelector('script[src*="face_mesh"]');
        
        if (existingFaceDetectionScript && existingFaceMeshScript) {
            console.log('MediaPipe scripts already present');
            return;
        }

        // 动态加载必要的MediaPipe脚本
        const scripts = [
            // 先加载工具库
            { 
                src: 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js',
                check: () => window.Camera
            },
            { 
                src: 'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js',
                check: () => window.drawingUtils || window.drawConnectors
            },
            // 然后加载检测库
            { 
                src: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/face_detection.js',
                check: () => window.FaceDetection
            },
            { 
                src: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js',
                check: () => window.FaceMesh
            }
        ];

        for (const scriptInfo of scripts) {
            // 检查是否已经加载
            if (!document.querySelector(`script[src="${scriptInfo.src}"]`)) {
                await this._loadScript(scriptInfo.src);
                // 等待对象可用
                await this._waitForObject(scriptInfo.check);
            }
        }
    }

    /**
     * 等待特定对象可用
     * @private
     */
    async _waitForObject(checkFn, maxAttempts = 20) {
        let attempts = 0;
        while (attempts < maxAttempts) {
            if (checkFn()) {
                return true;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        return false;
    }

    /**
     * 动态加载脚本
     * @private
     */
    _loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.type = 'text/javascript';
            script.crossOrigin = 'anonymous';
            script.onload = () => {
                console.log(`Loaded script: ${src}`);
                resolve();
            };
            script.onerror = () => {
                console.error(`Failed to load script: ${src}`);
                resolve(); // 继续执行，使用降级方案
            };
            document.head.appendChild(script);
        });
    }

    /**
     * 检测图像中的人脸（降级方案）
     * @param {HTMLImageElement|HTMLCanvasElement|HTMLVideoElement} input 输入图像
     * @return {Promise<Array>} 检测结果数组
     */
    async detectFacesFallback(input) {
        // 简单的降级方案：返回整个图像作为一个面部区域
        const width = input.width || input.videoWidth || input.naturalWidth;
        const height = input.height || input.videoHeight || input.naturalHeight;
        
        // 假设面部在图像中心，占图像的30-40%
        const faceSize = Math.min(width, height) * 0.35;
        const centerX = width / 2;
        const centerY = height / 2;
        
        return [{
            id: 0,
            boundingBox: {
                x: centerX - faceSize / 2,
                y: centerY - faceSize / 2,
                width: faceSize,
                height: faceSize
            },
            landmarks: [],
            confidence: 0.5,
            keypoints: {
                leftEye: { x: centerX - faceSize * 0.15, y: centerY - faceSize * 0.1 },
                rightEye: { x: centerX + faceSize * 0.15, y: centerY - faceSize * 0.1 },
                nose: { x: centerX, y: centerY },
                mouth: { x: centerX, y: centerY + faceSize * 0.15 },
                leftEar: { x: centerX - faceSize * 0.35, y: centerY },
                rightEar: { x: centerX + faceSize * 0.35, y: centerY }
            }
        }];
    }

    /**
     * 检测图像中的人脸
     * @param {HTMLImageElement|HTMLCanvasElement|HTMLVideoElement} input 输入图像
     * @return {Promise<Array>} 检测结果数组
     */
    async detectFaces(input) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        // 如果使用降级方案
        if (this.useFallbackDetection || !this.faceDetection) {
            return this.detectFacesFallback(input);
        }

        return new Promise((resolve, reject) => {
            try {
                // 设置结果回调
                const onResults = (results) => {
                    if (!results || !results.detections) {
                        resolve([]);
                        return;
                    }
                    
                    const faces = results.detections.map((detection, index) => ({
                        id: index,
                        boundingBox: this._normalizeBoundingBox(detection.boundingBox, input),
                        landmarks: detection.landmarks ? detection.landmarks.map(landmark => 
                            this._normalizePoint(landmark, input)
                        ) : [],
                        confidence: detection.score || detection.confidence || 0.5,
                        keypoints: detection.landmarks ? this._extractKeyPoints(detection.landmarks, input) : null
                    }));
                    resolve(faces);
                };

                this.faceDetection.onResults(onResults);
                this.faceDetection.send({ image: input });
            } catch (error) {
                // 如果MediaPipe失败，使用降级方案
                console.warn('MediaPipe detection failed, using fallback:', error);
                resolve(this.detectFacesFallback(input));
            }
        });
    }

    /**
     * 获取详细的面部关键点（468个点）
     * @param {HTMLImageElement|HTMLCanvasElement|HTMLVideoElement} input 输入图像
     * @return {Promise<Array>} 面部网格结果
     */
    async getFaceMesh(input) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        // 如果使用降级方案或Face Mesh不可用
        if (this.useFallbackDetection || !this.faceMesh) {
            const faces = await this.detectFacesFallback(input);
            return faces.map(face => ({
                id: face.id,
                landmarks: [],
                keypoints: face.keypoints
            }));
        }

        return new Promise((resolve, reject) => {
            try {
                const onResults = (results) => {
                    if (!results || !results.multiFaceLandmarks) {
                        resolve([]);
                        return;
                    }
                    
                    const meshes = results.multiFaceLandmarks.map((landmarks, index) => ({
                        id: index,
                        landmarks: landmarks.map(landmark => 
                            this._normalizePoint(landmark, input)
                        ),
                        keypoints: this._extractDetailedKeyPoints(landmarks, input)
                    }));
                    resolve(meshes);
                };

                this.faceMesh.onResults(onResults);
                this.faceMesh.send({ image: input });
            } catch (error) {
                // 使用降级方案
                console.warn('MediaPipe mesh failed, using fallback:', error);
                this.detectFacesFallback(input).then(faces => {
                    resolve(faces.map(face => ({
                        id: face.id,
                        landmarks: [],
                        keypoints: face.keypoints
                    })));
                });
            }
        });
    }

    /**
     * 规范化边界框坐标
     * @private
     */
    _normalizeBoundingBox(boundingBox, input) {
        const width = input.width || input.videoWidth || input.naturalWidth;
        const height = input.height || input.videoHeight || input.naturalHeight;
        
        // MediaPipe返回的格式可能有两种
        if (boundingBox.xCenter !== undefined) {
            // 格式1: xCenter, yCenter, width, height
            return {
                x: boundingBox.xCenter * width - (boundingBox.width * width / 2),
                y: boundingBox.yCenter * height - (boundingBox.height * height / 2),
                width: boundingBox.width * width,
                height: boundingBox.height * height
            };
        } else if (boundingBox.xmin !== undefined) {
            // 格式2: xmin, ymin, width, height
            return {
                x: boundingBox.xmin * width,
                y: boundingBox.ymin * height,
                width: boundingBox.width * width,
                height: boundingBox.height * height
            };
        } else {
            // 未知格式，返回默认值
            return {
                x: 0,
                y: 0,
                width: width,
                height: height
            };
        }
    }

    /**
     * 规范化点坐标
     * @private
     */
    _normalizePoint(point, input) {
        const width = input.width || input.videoWidth || input.naturalWidth;
        const height = input.height || input.videoHeight || input.naturalHeight;
        
        return {
            x: point.x * width,
            y: point.y * height,
            z: point.z || 0
        };
    }

    /**
     * 提取关键点
     * @private
     */
    _extractKeyPoints(landmarks, input) {
        // MediaPipe Face Detection 提供6个关键点
        const keyIndices = {
            leftEye: 0,
            rightEye: 1,
            nose: 2,
            mouth: 3,
            leftEar: 4,
            rightEar: 5
        };

        const keypoints = {};
        for (const [name, index] of Object.entries(keyIndices)) {
            if (landmarks[index]) {
                keypoints[name] = this._normalizePoint(landmarks[index], input);
            }
        }

        return keypoints;
    }

    /**
     * 提取详细关键点
     * @private
     */
    _extractDetailedKeyPoints(landmarks, input) {
        // MediaPipe Face Mesh 468个点中的重要关键点索引
        const keyIndices = {
            leftEye: 33,
            rightEye: 263,
            nose: 1,
            mouth: 13,
            leftEar: 234,
            rightEar: 454,
            chin: 152,
            forehead: 10
        };

        const keypoints = {};
        for (const [name, index] of Object.entries(keyIndices)) {
            if (landmarks[index]) {
                keypoints[name] = this._normalizePoint(landmarks[index], input);
            }
        }

        return keypoints;
    }

    /**
     * 销毁检测器，释放资源
     */
    destroy() {
        if (this.faceDetection) {
            try {
                this.faceDetection.close();
            } catch (e) {
                console.warn('Error closing face detection:', e);
            }
            this.faceDetection = null;
        }
        
        if (this.faceMesh) {
            try {
                this.faceMesh.close();
            } catch (e) {
                console.warn('Error closing face mesh:', e);
            }
            this.faceMesh = null;
        }
        
        this.isInitialized = false;
    }
}

// 创建全局实例
const globalFaceDetector = new MediaPipeFaceDetector();

// 导出类和全局实例
export { MediaPipeFaceDetector, globalFaceDetector };
export default MediaPipeFaceDetector;