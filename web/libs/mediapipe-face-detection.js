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
     * 检测图像中的人脸（改进的降级方案）
     * @param {HTMLImageElement|HTMLCanvasElement|HTMLVideoElement} input 输入图像
     * @return {Promise<Array>} 检测结果数组
     */
    async detectFacesFallback(input) {
        const width = input.width || input.videoWidth || input.naturalWidth;
        const height = input.height || input.videoHeight || input.naturalHeight;
        
        
        // 尝试基于图像内容的简单启发式检测
        const faces = await this._heuristicFaceDetection(input);
        
        if (faces.length > 0) {
            return faces;
        }
        
        // 如果启发式检测失败，使用改进的中心估计
        const aspectRatio = width / height;
        let faceWidth, faceHeight;
        
        // 根据图像宽高比调整面部区域估计
        if (aspectRatio > 1.5) {
            // 宽图像，可能是横向肖像
            faceWidth = Math.min(width, height) * 0.3;
            faceHeight = faceWidth * 1.2; // 面部通常略高
        } else if (aspectRatio < 0.7) {
            // 高图像，可能是竖向肖像
            faceHeight = Math.min(width, height) * 0.4;
            faceWidth = faceHeight * 0.85; // 面部宽度略小于高度
        } else {
            // 接近正方形的图像
            const faceSize = Math.min(width, height) * 0.35;
            faceWidth = faceSize;
            faceHeight = faceSize * 1.1;
        }
        
        // 面部中心点（稍微偏上）
        const centerX = width / 2;
        const centerY = height * 0.45; // 面部通常在图像上半部分
        
        // 计算更准确的面部特征点位置
        const eyeY = centerY - faceHeight * 0.15;
        const eyeDistance = faceWidth * 0.25;
        const noseY = centerY - faceHeight * 0.05;
        const mouthY = centerY + faceHeight * 0.2;
        
        return [{
            id: 0,
            boundingBox: {
                x: centerX - faceWidth / 2,
                y: centerY - faceHeight / 2,
                width: faceWidth,
                height: faceHeight
            },
            landmarks: [],
            confidence: 0.3, // 降低置信度，表明这是估计值
            keypoints: {
                leftEye: { x: centerX - eyeDistance, y: eyeY },
                rightEye: { x: centerX + eyeDistance, y: eyeY },
                nose: { x: centerX, y: noseY },
                mouth: { x: centerX, y: mouthY },
                leftEar: { x: centerX - faceWidth * 0.4, y: centerY },
                rightEar: { x: centerX + faceWidth * 0.4, y: centerY }
            }
        }];
    }
    
    /**
     * 基于简单图像分析的启发式人脸检测
     * @param {HTMLImageElement|HTMLCanvasElement|HTMLVideoElement} input 输入图像
     * @return {Promise<Array>} 检测结果数组
     * @private
     */
    async _heuristicFaceDetection(input) {
        try {
            // 创建canvas分析图像
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // 缩小图像进行快速分析
            const analysisSize = 64;
            canvas.width = analysisSize;
            canvas.height = analysisSize;
            
            ctx.drawImage(input, 0, 0, analysisSize, analysisSize);
            const imageData = ctx.getImageData(0, 0, analysisSize, analysisSize);
            const data = imageData.data;
            
            // 寻找肤色区域（简单的颜色空间分析）
            const skinRegions = this._findSkinColorRegions(data, analysisSize, analysisSize);
            
            if (skinRegions.length > 0) {
                // 选择最大的肤色区域作为面部
                const largestRegion = skinRegions.reduce((max, region) => 
                    region.area > max.area ? region : max
                );
                
                // 将分析结果缩放回原始图像尺寸
                const width = input.width || input.videoWidth || input.naturalWidth;
                const height = input.height || input.videoHeight || input.naturalHeight;
                
                const scaleX = width / analysisSize;
                const scaleY = height / analysisSize;
                
                const faceX = largestRegion.centerX * scaleX;
                const faceY = largestRegion.centerY * scaleY;
                const faceWidth = Math.sqrt(largestRegion.area) * scaleX * 2;
                const faceHeight = faceWidth * 1.2;
                
                return [{
                    id: 0,
                    boundingBox: {
                        x: faceX - faceWidth / 2,
                        y: faceY - faceHeight / 2,
                        width: faceWidth,
                        height: faceHeight
                    },
                    landmarks: [],
                    confidence: 0.4,
                    keypoints: {
                        leftEye: { x: faceX - faceWidth * 0.2, y: faceY - faceHeight * 0.15 },
                        rightEye: { x: faceX + faceWidth * 0.2, y: faceY - faceHeight * 0.15 },
                        nose: { x: faceX, y: faceY },
                        mouth: { x: faceX, y: faceY + faceHeight * 0.2 },
                        leftEar: { x: faceX - faceWidth * 0.4, y: faceY },
                        rightEar: { x: faceX + faceWidth * 0.4, y: faceY }
                    }
                }];
            }
        } catch (error) {
            console.warn('启发式人脸检测失败:', error);
        }
        
        return [];
    }
    
    /**
     * 简单的肤色检测
     * @param {Uint8ClampedArray} data 图像数据
     * @param {number} width 图像宽度
     * @param {number} height 图像高度
     * @return {Array} 肤色区域数组
     * @private
     */
    _findSkinColorRegions(data, width, height) {
        const skinPixels = [];
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const index = (y * width + x) * 4;
                const r = data[index];
                const g = data[index + 1];
                const b = data[index + 2];
                
                // 简单的肤色检测（改进的RGB范围）
                if (this._isSkinColor(r, g, b)) {
                    skinPixels.push({ x, y });
                }
            }
        }
        
        // 聚类肤色像素形成区域
        return this._clusterSkinPixels(skinPixels);
    }
    
    /**
     * 判断是否为肤色
     * @param {number} r 红色值
     * @param {number} g 绿色值
     * @param {number} b 蓝色值
     * @return {boolean} 是否为肤色
     * @private
     */
    _isSkinColor(r, g, b) {
        // 改进的肤色检测算法
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        
        // 排除过暗或过亮的像素
        if (max < 50 || min > 230) return false;
        
        // 肤色通常满足以下条件
        return (r > 95 && g > 40 && b > 20 && 
                max - min > 15 && 
                Math.abs(r - g) > 15 && 
                r > g && r > b);
    }
    
    /**
     * 聚类肤色像素
     * @param {Array} pixels 像素数组
     * @return {Array} 区域数组
     * @private
     */
    _clusterSkinPixels(pixels) {
        if (pixels.length < 5) return [];
        
        // 简单的连通组件分析
        const regions = [];
        const visited = new Set();
        
        for (const pixel of pixels) {
            const key = `${pixel.x},${pixel.y}`;
            if (visited.has(key)) continue;
            
            const region = this._floodFill(pixels, pixel, visited);
            if (region.length > 3) { // 至少3个像素才算一个区域
                const centerX = region.reduce((sum, p) => sum + p.x, 0) / region.length;
                const centerY = region.reduce((sum, p) => sum + p.y, 0) / region.length;
                
                regions.push({
                    centerX,
                    centerY,
                    area: region.length,
                    pixels: region
                });
            }
        }
        
        return regions.sort((a, b) => b.area - a.area);
    }
    
    /**
     * 泛洪填充算法
     * @param {Array} allPixels 所有像素
     * @param {Object} startPixel 起始像素
     * @param {Set} visited 已访问集合
     * @return {Array} 连通区域
     * @private
     */
    _floodFill(allPixels, startPixel, visited) {
        const region = [];
        const stack = [startPixel];
        const pixelSet = new Set(allPixels.map(p => `${p.x},${p.y}`));
        
        while (stack.length > 0) {
            const pixel = stack.pop();
            const key = `${pixel.x},${pixel.y}`;
            
            if (visited.has(key)) continue;
            visited.add(key);
            region.push(pixel);
            
            // 检查邻近像素
            for (const [dx, dy] of [[-1,0], [1,0], [0,-1], [0,1]]) {
                const nx = pixel.x + dx;
                const ny = pixel.y + dy;
                const nkey = `${nx},${ny}`;
                
                if (!visited.has(nkey) && pixelSet.has(nkey)) {
                    stack.push({ x: nx, y: ny });
                }
            }
        }
        
        return region;
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