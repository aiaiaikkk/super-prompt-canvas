/**
 * Background Removal Library 封装
 * 使用 @imgly/background-removal 提供浏览器端背景移除功能
 * 
 * 特性：
 * - 浏览器端处理，无需服务器
 * - 保护隐私，数据不离开用户设备
 * - 支持多种图像格式
 * - 基于先进的AI模型
 */

class BackgroundRemovalLibrary {
    constructor() {
        this.isLoaded = false;
        this.isLoading = false;
        this.loadingPromise = null;
        this.imglyRemoveBackground = null;
    }

    /**
     * 动态加载背景移除库
     */
    async loadLibrary() {
        if (this.isLoaded) {
            return this.imglyRemoveBackground;
        }

        if (this.isLoading) {
            return this.loadingPromise;
        }

        this.isLoading = true;

        this.loadingPromise = this._loadFromCDN();
        
        try {
            await this.loadingPromise;
            this.isLoaded = true;
            this.isLoading = false;
            return this.imglyRemoveBackground;
        } catch (error) {
            this.isLoading = false;
            console.error('❌ 背景移除库加载失败:', error);
            throw error;
        }
    }

    /**
     * 从CDN加载库文件
     * @private
     */
    async _loadFromCDN() {
        try {
            // 尝试加载现代WebAssembly背景移除方案
            await this._loadModernWebBgRemoval();
        } catch (error) {
            // Debug: 现代Web背景移除加载失败
            await this._loadFallback();
        }
    }

    /**
     * 加载现代WebAssembly背景移除方案
     * @private
     */
    async _loadModernWebBgRemoval() {
        // Debug: 正在加载现代Web背景移除方案
        
        // 方案1：尝试加载MediaPipe Selfie Segmentation
        try {
            await this._loadMediaPipeSegmentation();
            // Debug: MediaPipe背景分割加载成功
            return;
        } catch (error) {
            // Debug: MediaPipe不可用
        }
        
        // 方案2：尝试加载TensorFlow.js BodyPix模型
        try {
            await this._loadTensorFlowBodyPix();
            // Debug: TensorFlow.js BodyPix加载成功
            return;
        } catch (error) {
            // Debug: TensorFlow.js BodyPix不可用
        }
        
        // 方案3：尝试加载@imgly/background-removal
        try {
            await this._loadImglyBackgroundRemoval();
            // Debug: @imgly/background-removal加载成功
            return;
        } catch (error) {
            // Debug: @imgly/background-removal不可用
        }
        
        throw new Error('所有现代Web背景移除方案都不可用');
    }
    
    /**
     * 加载MediaPipe Selfie Segmentation
     * @private
     */
    async _loadMediaPipeSegmentation() {
        // 加载MediaPipe脚本
        await Promise.all([
            this._loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js'),
            this._loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js'),
            this._loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/selfie_segmentation.js')
        ]);
        
        // 等待MediaPipe全局对象可用
        await this._waitForGlobal('SelfieSegmentation');
        
        // 初始化MediaPipe Selfie Segmentation
        const selfieSegmentation = new SelfieSegmentation({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`
        });
        
        selfieSegmentation.setOptions({
            modelSelection: 1, // 0 = general, 1 = landscape
        });
        
        // 创建包装器函数
        this.imglyRemoveBackground = async (imageSource) => {
            return this._removeBackgroundWithMediaPipe(imageSource, selfieSegmentation);
        };
    }
    
    /**
     * 加载TensorFlow.js BodyPix
     * @private
     */
    async _loadTensorFlowBodyPix() {
        // 加载TensorFlow.js和BodyPix
        await Promise.all([
            this._loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.x/dist/tf.min.js'),
            this._loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/body-pix@2.x/dist/body-pix.min.js')
        ]);
        
        // 等待全局对象可用
        await Promise.all([
            this._waitForGlobal('tf'),
            this._waitForGlobal('bodyPix')
        ]);
        
        // 加载BodyPix模型
        const net = await bodyPix.load({
            architecture: 'MobileNetV1',
            outputStride: 16,
            multiplier: 0.75,
            quantBytes: 2
        });
        
        // 创建包装器函数
        this.imglyRemoveBackground = async (imageSource) => {
            return this._removeBackgroundWithBodyPix(imageSource, net);
        };
    }
    
    /**
     * 加载@imgly/background-removal
     * @private
     */
    async _loadImglyBackgroundRemoval() {
        // 尝试从CDN加载
        await this._loadScript('https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.4.11/dist/bundle.umd.js');
        
        // 等待全局对象可用
        await this._waitForGlobal('removeBackground');
        
        // 直接使用库函数
        this.imglyRemoveBackground = window.removeBackground;
    }
    
    /**
     * 使用MediaPipe进行背景移除
     * @private
     */
    async _removeBackgroundWithMediaPipe(imageSource, selfieSegmentation) {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            this._loadImageToCanvas(imageSource, canvas, ctx).then(() => {
                // MediaPipe处理
                selfieSegmentation.onResults((results) => {
                    if (results.segmentationMask) {
                        const outputCanvas = this._applySegmentationMask(canvas, results.segmentationMask);
                        outputCanvas.toBlob((blob) => {
                            resolve(blob);
                        }, 'image/png');
                    } else {
                        reject(new Error('MediaPipe分割失败'));
                    }
                });
                
                // 发送图像到MediaPipe
                selfieSegmentation.send({image: canvas});
            }).catch(reject);
        });
    }
    
    /**
     * 使用BodyPix进行背景移除
     * @private
     */
    async _removeBackgroundWithBodyPix(imageSource, net) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        await this._loadImageToCanvas(imageSource, canvas, ctx);
        
        // 使用BodyPix进行人体分割
        const segmentation = await net.segmentPerson(canvas, {
            flipHorizontal: false,
            internalResolution: 'medium',
            segmentationThreshold: 0.7,
            maxDetections: 10,
            scoreThreshold: 0.2,
            nmsRadius: 20
        });
        
        // 应用分割结果
        const outputCanvas = this._applyBodyPixSegmentation(canvas, segmentation);
        
        return new Promise((resolve) => {
            outputCanvas.toBlob((blob) => {
                resolve(blob);
            }, 'image/png');
        });
    }
    
    /**
     * 应用MediaPipe分割掩膜
     * @private
     */
    _applySegmentationMask(sourceCanvas, segmentationMask) {
        const canvas = document.createElement('canvas');
        canvas.width = sourceCanvas.width;
        canvas.height = sourceCanvas.height;
        const ctx = canvas.getContext('2d');
        
        // 绘制原图
        ctx.drawImage(sourceCanvas, 0, 0);
        
        // 获取图像数据
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // 应用分割掩膜
        const maskCanvas = document.createElement('canvas');
        const maskCtx = maskCanvas.getContext('2d');
        maskCanvas.width = canvas.width;
        maskCanvas.height = canvas.height;
        maskCtx.drawImage(segmentationMask, 0, 0, canvas.width, canvas.height);
        
        const maskData = maskCtx.getImageData(0, 0, canvas.width, canvas.height);
        const mask = maskData.data;
        
        // 根据掩膜设置alpha通道
        for (let i = 0; i < data.length; i += 4) {
            const maskValue = mask[i]; // MediaPipe输出灰度掩膜
            data[i + 3] = maskValue; // 设置alpha通道
        }
        
        ctx.putImageData(imageData, 0, 0);
        return canvas;
    }
    
    /**
     * 应用BodyPix分割结果
     * @private
     */
    _applyBodyPixSegmentation(sourceCanvas, segmentation) {
        const canvas = document.createElement('canvas');
        canvas.width = sourceCanvas.width;
        canvas.height = sourceCanvas.height;
        const ctx = canvas.getContext('2d');
        
        // 绘制原图
        ctx.drawImage(sourceCanvas, 0, 0);
        
        // 获取图像数据
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // 应用分割结果
        const maskData = segmentation.data;
        for (let i = 0; i < data.length; i += 4) {
            const pixelIndex = Math.floor(i / 4);
            const isPersonPixel = maskData[pixelIndex] === 1;
            
            // 如果不是人体像素，设置为透明
            if (!isPersonPixel) {
                data[i + 3] = 0;
            } else {
                // 对人体边缘进行轻微羽化
                const edgeAlpha = this._calculateEdgeAlphaForBodyPix(
                    maskData, pixelIndex, canvas.width, canvas.height
                );
                data[i + 3] = Math.round(data[i + 3] * edgeAlpha);
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        return canvas;
    }
    
    /**
     * 计算BodyPix边缘透明度
     * @private
     */
    _calculateEdgeAlphaForBodyPix(maskData, pixelIndex, width, height) {
        const y = Math.floor(pixelIndex / width);
        const x = pixelIndex % width;
        
        let neighborCount = 0;
        let personCount = 0;
        
        // 检查3x3邻域
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const nx = x + dx;
                const ny = y + dy;
                
                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                    const nIdx = ny * width + nx;
                    neighborCount++;
                    if (maskData[nIdx] === 1) {
                        personCount++;
                    }
                }
            }
        }
        
        const ratio = personCount / neighborCount;
        
        // 平滑边缘过渡
        if (ratio < 0.3) return 0.1;
        if (ratio < 0.7) return ratio;
        return 1.0;
    }

    /**
     * 备用加载方案 - 使用服务端rembg或客户端算法
     * @private
     */
    async _loadFallback() {
        
        // 优先使用服务端rembg API，失败时回退到客户端算法
        this.imglyRemoveBackground = async (imageSource) => {
            try {
                // 尝试使用服务端rembg API
                const result = await this._useServerRemBG(imageSource);
                if (result) {
                    return result;
                }
            } catch (error) {
                // Debug: 服务端背景移除不可用
            }
            
            // 回退到客户端算法
            return new Promise((resolve, reject) => {
                try {
                    // 创建canvas
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    // 加载图像
                    this._loadImageToCanvas(imageSource, canvas, ctx).then(() => {
                        // 应用改进的背景移除算法
                        this._applyAdvancedBackgroundRemoval(canvas, ctx);
                        
                        // 转换为blob
                        canvas.toBlob((blob) => {
                            resolve(blob);
                        }, 'image/png');
                    }).catch(reject);
                } catch (error) {
                    reject(error);
                }
            });
        };
        
    }

    /**
     * 使用服务端rembg API进行背景移除
     * @private
     */
    async _useServerRemBG(imageSource) {
        let imageBlob;
        
        // 将图像源转换为blob
        if (imageSource instanceof Blob) {
            imageBlob = imageSource;
        } else if (imageSource instanceof HTMLImageElement) {
            const canvas = document.createElement('canvas');
            canvas.width = imageSource.width;
            canvas.height = imageSource.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(imageSource, 0, 0);
            imageBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        } else if (typeof imageSource === 'string') {
            const response = await fetch(imageSource);
            imageBlob = await response.blob();
        } else {
            throw new Error('不支持的图像格式');
        }
        
        // 创建FormData
        const formData = new FormData();
        formData.append('image', imageBlob);
        formData.append('model', 'u2net'); // 默认使用u2net模型
        
        // 尝试多个可能的rembg API端点
        const apiEndpoints = [
            '/api/rembg/remove',           // ComfyUI插件内部API
            'http://localhost:7860/rembg', // 本地rembg服务
            'http://localhost:8000/remove-bg', // 另一个本地服务
        ];
        
        for (const endpoint of apiEndpoints) {
            try {
                const response = await fetch(endpoint, {
                    method: 'POST',
                    body: formData,
                    timeout: 30000, // 30秒超时
                });
                
                if (response.ok) {
                    const resultBlob = await response.blob();
                    // Debug: 使用服务端rembg成功移除背景
                    return resultBlob;
                }
            } catch (error) {
                // 继续尝试下一个端点
                continue;
            }
        }
        
        throw new Error('所有rembg API端点都不可用');
    }

    /**
     * 加载脚本文件
     * @private
     */
    _loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * 等待全局对象可用
     * @private
     */
    _waitForGlobal(globalName, maxAttempts = 50) {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const check = () => {
                if (window[globalName]) {
                    resolve();
                } else if (attempts < maxAttempts) {
                    attempts++;
                    setTimeout(check, 100);
                } else {
                    reject(new Error(`全局对象 ${globalName} 未找到`));
                }
            };
            check();
        });
    }

    /**
     * 将图像加载到Canvas
     * @private
     */
    async _loadImageToCanvas(imageSource, canvas, ctx) {
        let img;
        
        if (imageSource instanceof HTMLImageElement) {
            img = imageSource;
        } else if (imageSource instanceof Blob) {
            img = new Image();
            img.src = URL.createObjectURL(imageSource);
            await new Promise((resolve) => { img.onload = resolve; });
        } else if (typeof imageSource === 'string') {
            img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = imageSource;
            await new Promise((resolve) => { img.onload = resolve; });
        } else {
            throw new Error('不支持的图像格式');
        }
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
    }

    /**
     * 应用超强化背景移除算法
     * @private
     */
    _applyAdvancedBackgroundRemoval(canvas, ctx) {
        // Debug: 使用增强客户端背景移除算法
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const width = canvas.width;
        const height = canvas.height;
        
        // === 增强算法流程 ===
        
        // 1. 智能背景分析（多区域采样）
        const backgroundAnalysis = this._intelligentBackgroundAnalysis(data, width, height);
        
        // 2. 多模型主体检测
        const subjectMask = this._multiModelSubjectDetection(data, width, height);
        
        // 3. 高精度边缘检测
        const edgeMask = this._precisionEdgeDetection(data, width, height);
        
        // 4. 色彩空间分析
        const colorSpaceMask = this._colorSpaceAnalysis(data, width, height, backgroundAnalysis);
        
        // 5. 纹理分析
        const textureMask = this._textureAnalysis(data, width, height);
        
        // 6. 智能融合多种检测结果
        const finalMask = this._intelligentMaskFusion([
            subjectMask, edgeMask, colorSpaceMask, textureMask
        ], width, height);
        
        // 7. 应用智能Alpha混合
        for (let i = 0; i < data.length; i += 4) {
            const pixelIndex = Math.floor(i / 4);
            const confidence = finalMask[pixelIndex];
            
            if (confidence < 0.1) {
                // 强背景：完全透明
                data[i + 3] = 0;
            } else if (confidence > 0.9) {
                // 强前景：保持不透明，但应用轻微羽化
                const edgeAlpha = this._calculateAdvancedEdgeAlpha(
                    pixelIndex, finalMask, width, height
                );
                data[i + 3] = Math.round(data[i + 3] * edgeAlpha);
            } else {
                // 不确定区域：使用渐变透明
                const smoothAlpha = this._smoothTransition(confidence);
                data[i + 3] = Math.round(data[i + 3] * smoothAlpha);
            }
        }
        
        // 8. 高级后处理
        this._advancedPostProcessing(data, width, height, finalMask);
        
        ctx.putImageData(imageData, 0, 0);
        // Debug: 增强客户端背景移除完成
    }
    
    /**
     * 超级智能背景分析 - 更精确的背景检测
     * @private
     */
    _intelligentBackgroundAnalysis(data, width, height) {
        // Debug: 执行超级智能背景分析
        
        // 1. 多层次区域采样
        const backgroundAnalysis = this._multiTierBackgroundSampling(data, width, height);
        
        // 2. 纹理一致性分析
        const textureAnalysis = this._analyzeBackgroundTexture(data, width, height);
        
        // 3. 颜色连续性分析
        const continuityAnalysis = this._analyzeColorContinuity(data, width, height);
        
        // 4. 融合分析结果
        const finalBackgroundColors = this._fuseBackgroundAnalysis(
            backgroundAnalysis, textureAnalysis, continuityAnalysis
        );
        
        // Debug: 检测到背景色
        
        return {
            colors: finalBackgroundColors,
            texturePatterns: textureAnalysis.patterns,
            continuityMap: continuityAnalysis.map,
            confidence: backgroundAnalysis.confidence
        };
    }
    
    /**
     * 多层次区域采样
     * @private
     */
    _multiTierBackgroundSampling(data, width, height) {
        const samplingRegions = [
            // 第一层：边缘采样（最高权重）
            { type: 'edge', regions: this._generateEdgeRegions(width, height), weight: 8.0 },
            // 第二层：角落采样（高权重）
            { type: 'corner', regions: this._generateCornerRegions(width, height), weight: 6.0 },
            // 第三层：中心外围采样（中等权重）
            { type: 'periphery', regions: this._generatePeripheryRegions(width, height), weight: 4.0 },
            // 第四层：连通区域采样（验证权重）
            { type: 'connected', regions: this._generateConnectedRegions(data, width, height), weight: 2.0 }
        ];
        
        const allBackgroundColors = [];
        let totalConfidence = 0;
        
        for (const tier of samplingRegions) {
            for (const region of tier.regions) {
                const regionColors = this._sampleRegionColors(data, region, width, height);
                const regionClusters = this._clusterColors(regionColors, 2);
                const regionConfidence = this._calculateRegionConfidence(regionColors, regionClusters);
                
                // 根据权重和置信度添加颜色
                const effectiveWeight = tier.weight * regionConfidence;
                for (let i = 0; i < Math.ceil(effectiveWeight); i++) {
                    allBackgroundColors.push(...regionClusters);
                }
                
                totalConfidence += regionConfidence;
            }
        }
        
        // 最终聚类
        const finalColors = this._advancedColorClustering(allBackgroundColors, 8);
        const avgConfidence = totalConfidence / samplingRegions.reduce((sum, tier) => sum + tier.regions.length, 0);
        
        return {
            colors: finalColors,
            confidence: avgConfidence
        };
    }
    
    /**
     * 生成边缘区域
     * @private
     */
    _generateEdgeRegions(width, height) {
        const borderSize = Math.min(Math.floor(width * 0.08), Math.floor(height * 0.08), 20);
        
        return [
            // 上边缘
            { x: 0, y: 0, w: width, h: borderSize },
            // 下边缘
            { x: 0, y: height - borderSize, w: width, h: borderSize },
            // 左边缘
            { x: 0, y: 0, w: borderSize, h: height },
            // 右边缘
            { x: width - borderSize, y: 0, w: borderSize, h: height }
        ];
    }
    
    /**
     * 生成角落区域
     * @private
     */
    _generateCornerRegions(width, height) {
        const cornerSize = Math.min(Math.floor(width * 0.12), Math.floor(height * 0.12), 30);
        
        return [
            // 四个角落
            { x: 0, y: 0, w: cornerSize, h: cornerSize },
            { x: width - cornerSize, y: 0, w: cornerSize, h: cornerSize },
            { x: 0, y: height - cornerSize, w: cornerSize, h: cornerSize },
            { x: width - cornerSize, y: height - cornerSize, w: cornerSize, h: cornerSize }
        ];
    }
    
    /**
     * 生成外围区域
     * @private
     */
    _generatePeripheryRegions(width, height) {
        const margin = Math.floor(Math.min(width, height) * 0.25);
        const stripWidth = Math.floor(Math.min(width, height) * 0.15);
        
        return [
            // 外围条带
            { x: margin, y: 0, w: width - 2 * margin, h: stripWidth },
            { x: margin, y: height - stripWidth, w: width - 2 * margin, h: stripWidth },
            { x: 0, y: margin, w: stripWidth, h: height - 2 * margin },
            { x: width - stripWidth, y: margin, w: stripWidth, h: height - 2 * margin }
        ];
    }
    
    /**
     * 生成连通区域
     * @private
     */
    _generateConnectedRegions(data, width, height) {
        const regions = [];
        const visited = new Array(width * height).fill(false);
        const minRegionSize = Math.floor(width * height * 0.05); // 至少5%的像素
        
        // 从边缘开始flood fill，找到大的连通背景区域
        const edgePoints = [
            ...Array.from({length: width}, (_, x) => ({x, y: 0})), // 上边
            ...Array.from({length: width}, (_, x) => ({x, y: height - 1})), // 下边
            ...Array.from({length: height}, (_, y) => ({x: 0, y})), // 左边
            ...Array.from({length: height}, (_, y) => ({x: width - 1, y})) // 右边
        ];
        
        for (const point of edgePoints) {
            const pixelIndex = point.y * width + point.x;
            if (!visited[pixelIndex]) {
                const region = this._floodFillBackground(data, point.x, point.y, width, height, visited);
                if (region.pixels.length > minRegionSize) {
                    regions.push({
                        x: region.bounds.minX,
                        y: region.bounds.minY,
                        w: region.bounds.maxX - region.bounds.minX + 1,
                        h: region.bounds.maxY - region.bounds.minY + 1,
                        pixels: region.pixels
                    });
                }
            }
        }
        
        return regions.slice(0, 5); // 最多返回5个最大的连通区域
    }
    
    /**
     * 背景洪水填充
     * @private
     */
    _floodFillBackground(data, startX, startY, width, height, visited) {
        const stack = [{x: startX, y: startY}];
        const region = {
            pixels: [],
            bounds: {minX: startX, maxX: startX, minY: startY, maxY: startY}
        };
        
        const startIdx = startY * width + startX;
        const startColor = [
            data[startIdx * 4],
            data[startIdx * 4 + 1],
            data[startIdx * 4 + 2]
        ];
        
        while (stack.length > 0) {
            const {x, y} = stack.pop();
            const pixelIndex = y * width + x;
            
            if (x < 0 || x >= width || y < 0 || y >= height || visited[pixelIndex]) {
                continue;
            }
            
            const currentColor = [
                data[pixelIndex * 4],
                data[pixelIndex * 4 + 1],
                data[pixelIndex * 4 + 2]
            ];
            
            // 更严格的颜色相似性判断
            if (this._colorDistance(currentColor, startColor) > 25) {
                continue;
            }
            
            visited[pixelIndex] = true;
            region.pixels.push(pixelIndex);
            
            // 更新边界
            region.bounds.minX = Math.min(region.bounds.minX, x);
            region.bounds.maxX = Math.max(region.bounds.maxX, x);
            region.bounds.minY = Math.min(region.bounds.minY, y);
            region.bounds.maxY = Math.max(region.bounds.maxY, y);
            
            // 添加4邻域
            stack.push({x: x-1, y}, {x: x+1, y}, {x, y: y-1}, {x, y: y+1});
            
            // 防止区域过大
            if (region.pixels.length > width * height * 0.3) break;
        }
        
        return region;
    }
    
    /**
     * 采样区域颜色
     * @private
     */
    _sampleRegionColors(data, region, width, height) {
        const colors = [];
        const sampleStep = Math.max(1, Math.floor(Math.sqrt(region.w * region.h) / 20)); // 自适应采样步长
        
        for (let y = region.y; y < region.y + region.h && y < height; y += sampleStep) {
            for (let x = region.x; x < region.x + region.w && x < width; x += sampleStep) {
                const idx = (y * width + x) * 4;
                colors.push([data[idx], data[idx + 1], data[idx + 2]]);
            }
        }
        
        return colors;
    }
    
    /**
     * 计算区域置信度
     * @private
     */
    _calculateRegionConfidence(regionColors, clusters) {
        if (regionColors.length === 0 || clusters.length === 0) return 0;
        
        // 计算颜色一致性
        let totalDistance = 0;
        for (const color of regionColors) {
            let minDistance = Infinity;
            for (const cluster of clusters) {
                const distance = this._colorDistance(color, cluster);
                minDistance = Math.min(minDistance, distance);
            }
            totalDistance += minDistance;
        }
        
        const avgDistance = totalDistance / regionColors.length;
        const consistency = Math.max(0, 1 - avgDistance / 100); // 归一化到0-1
        
        return consistency;
    }
    
    /**
     * 高级颜色聚类
     * @private
     */
    _advancedColorClustering(colors, maxClusters) {
        if (colors.length === 0) return [[255, 255, 255]];
        
        // 使用改进的K-means++初始化
        const clusters = this._kmeansPlusPlusInit(colors, Math.min(maxClusters, colors.length));
        
        // 迭代优化
        for (let iter = 0; iter < 15; iter++) {
            const assignments = colors.map(color => {
                let minDist = Infinity;
                let bestCluster = 0;
                
                for (let c = 0; c < clusters.length; c++) {
                    const dist = this._perceptualColorDistance(color, clusters[c]);
                    if (dist < minDist) {
                        minDist = dist;
                        bestCluster = c;
                    }
                }
                return bestCluster;
            });
            
            // 更新聚类中心
            const oldClusters = clusters.map(c => [...c]);
            for (let c = 0; c < clusters.length; c++) {
                const clusterColors = colors.filter((_, i) => assignments[i] === c);
                if (clusterColors.length > 0) {
                    clusters[c] = this._averageColor(clusterColors);
                }
            }
            
            // 检查收敛
            let converged = true;
            for (let c = 0; c < clusters.length; c++) {
                if (this._colorDistance(clusters[c], oldClusters[c]) > 5) {
                    converged = false;
                    break;
                }
            }
            if (converged) break;
        }
        
        // 按出现频率排序
        const clusterSizes = new Array(clusters.length).fill(0);
        colors.forEach(color => {
            let bestCluster = 0;
            let minDist = Infinity;
            for (let c = 0; c < clusters.length; c++) {
                const dist = this._perceptualColorDistance(color, clusters[c]);
                if (dist < minDist) {
                    minDist = dist;
                    bestCluster = c;
                }
            }
            clusterSizes[bestCluster]++;
        });
        
        // 按大小排序返回
        const sortedIndices = clusterSizes
            .map((size, index) => ({size, index}))
            .sort((a, b) => b.size - a.size)
            .map(item => item.index);
        
        return sortedIndices.map(i => clusters[i]);
    }
    
    /**
     * K-means++初始化
     * @private
     */
    _kmeansPlusPlusInit(colors, k) {
        if (k <= 0 || colors.length === 0) return [];
        
        const clusters = [];
        
        // 随机选择第一个中心
        clusters.push([...colors[Math.floor(Math.random() * colors.length)]]);
        
        // 选择剩余的中心
        for (let i = 1; i < k; i++) {
            const distances = colors.map(color => {
                let minDist = Infinity;
                for (const center of clusters) {
                    const dist = this._perceptualColorDistance(color, center);
                    minDist = Math.min(minDist, dist);
                }
                return minDist * minDist; // 距离的平方
            });
            
            const totalDist = distances.reduce((sum, d) => sum + d, 0);
            if (totalDist === 0) break;
            
            let random = Math.random() * totalDist;
            let selectedIndex = 0;
            
            for (let j = 0; j < distances.length; j++) {
                random -= distances[j];
                if (random <= 0) {
                    selectedIndex = j;
                    break;
                }
            }
            
            clusters.push([...colors[selectedIndex]]);
        }
        
        return clusters;
    }
    
    /**
     * 感知颜色距离（更接近人眼感知）
     * @private
     */
    _perceptualColorDistance(color1, color2) {
        const [r1, g1, b1] = color1;
        const [r2, g2, b2] = color2;
        
        // 使用改进的欧几里得距离，考虑人眼对绿色更敏感
        const dr = r1 - r2;
        const dg = g1 - g2;
        const db = b1 - b2;
        
        // 权重：红2，绿4，蓝3
        return Math.sqrt(2 * dr * dr + 4 * dg * dg + 3 * db * db);
    }
    
    /**
     * 分析背景纹理
     * @private
     */
    _analyzeBackgroundTexture(data, width, height) {
        const patterns = [];
        const blockSize = 16; // 16x16块进行纹理分析
        
        for (let y = 0; y < height - blockSize; y += blockSize) {
            for (let x = 0; x < width - blockSize; x += blockSize) {
                // 只分析边缘区域的纹理
                const isEdgeBlock = x < blockSize * 2 || x > width - blockSize * 3 ||
                                  y < blockSize * 2 || y > height - blockSize * 3;
                
                if (isEdgeBlock) {
                    const textureInfo = this._analyzeBlockTexture(data, x, y, blockSize, width);
                    if (textureInfo.isBackground) {
                        patterns.push(textureInfo);
                    }
                }
            }
        }
        
        return { patterns };
    }
    
    /**
     * 分析块纹理
     * @private
     */
    _analyzeBlockTexture(data, startX, startY, blockSize, width) {
        const colors = [];
        let totalVariance = 0;
        
        // 采集块内颜色
        for (let y = startY; y < startY + blockSize; y++) {
            for (let x = startX; x < startX + blockSize; x++) {
                const idx = (y * width + x) * 4;
                colors.push([data[idx], data[idx + 1], data[idx + 2]]);
            }
        }
        
        // 计算颜色方差
        const avgColor = this._averageColor(colors);
        for (const color of colors) {
            totalVariance += this._colorDistance(color, avgColor);
        }
        const variance = totalVariance / colors.length;
        
        // 判断是否为背景纹理（低方差通常是背景）
        const isBackground = variance < 30;
        
        return {
            x: startX,
            y: startY,
            size: blockSize,
            avgColor,
            variance,
            isBackground,
            colors: colors.slice(0, 10) // 保存少量代表色
        };
    }
    
    /**
     * 分析颜色连续性
     * @private
     */
    _analyzeColorContinuity(data, width, height) {
        const continuityMap = new Array(width * height).fill(0);
        const windowSize = 5;
        
        for (let y = windowSize; y < height - windowSize; y++) {
            for (let x = windowSize; x < width - windowSize; x++) {
                const centerIdx = (y * width + x) * 4;
                const centerColor = [data[centerIdx], data[centerIdx + 1], data[centerIdx + 2]];
                
                // 计算窗口内的颜色连续性
                let continuity = this._calculateLocalContinuity(data, x, y, windowSize, width, centerColor);
                
                const pixelIdx = y * width + x;
                continuityMap[pixelIdx] = continuity;
            }
        }
        
        return { map: continuityMap };
    }
    
    /**
     * 计算局部连续性
     * @private
     */
    _calculateLocalContinuity(data, centerX, centerY, windowSize, width, centerColor) {
        let totalSimilarity = 0;
        let count = 0;
        
        for (let dy = -windowSize; dy <= windowSize; dy++) {
            for (let dx = -windowSize; dx <= windowSize; dx++) {
                if (dx === 0 && dy === 0) continue;
                
                const x = centerX + dx;
                const y = centerY + dy;
                const idx = (y * width + x) * 4;
                const neighborColor = [data[idx], data[idx + 1], data[idx + 2]];
                
                const distance = this._perceptualColorDistance(centerColor, neighborColor);
                const similarity = Math.max(0, 1 - distance / 100);
                
                totalSimilarity += similarity;
                count++;
            }
        }
        
        return count > 0 ? totalSimilarity / count : 0;
    }
    
    /**
     * 融合背景分析结果
     * @private
     */
    _fuseBackgroundAnalysis(backgroundAnalysis, textureAnalysis, continuityAnalysis) {
        const baseColors = backgroundAnalysis.colors;
        const textureColors = textureAnalysis.patterns
            .filter(p => p.isBackground)
            .map(p => p.avgColor);
        
        // 合并所有背景色候选
        const allColors = [...baseColors, ...textureColors];
        
        if (allColors.length === 0) {
            return [[255, 255, 255]]; // 默认白色背景
        }
        
        // 最终聚类，减少颜色数量
        return this._advancedColorClustering(allColors, 6);
    }
    
    /**
     * 多模型主体检测
     * @private
     */
    _multiModelSubjectDetection(data, width, height) {
        const mask = new Array(width * height).fill(0);
        
        // 1. 增强肤色检测
        const skinMask = this._enhancedSkinDetection(data, width, height);
        
        // 2. 发色检测
        const hairMask = this._enhancedHairDetection(data, width, height);
        
        // 3. 衣物检测
        const clothingMask = this._enhancedClothingDetection(data, width, height);
        
        // 4. 物体形状检测
        const shapeMask = this._objectShapeDetection(data, width, height);
        
        // 融合所有检测结果
        for (let i = 0; i < mask.length; i++) {
            mask[i] = Math.max(
                skinMask[i] * 1.0,      // 肤色权重最高
                hairMask[i] * 0.8,      // 发色权重较高
                clothingMask[i] * 0.6,  // 衣物权重中等
                shapeMask[i] * 0.4      // 形状权重较低
            );
        }
        
        // 形态学处理
        return this._morphologyOperations(mask, width, height);
    }
    
    /**
     * 增强肤色检测
     * @private
     */
    _enhancedSkinDetection(data, width, height) {
        const mask = new Array(width * height).fill(0);
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const pixelIndex = Math.floor(i / 4);
            
            // 多种肤色检测方法的组合
            const methods = [
                this._isYCbCrSkin(r, g, b),
                this._isRGBSkin(r, g, b),
                this._isHSVSkin(r, g, b),
                this._isLabSkin(r, g, b)  // 新增Lab色彩空间检测
            ];
            
            // 计算置信度
            const confidence = methods.reduce((sum, result) => sum + (result ? 1 : 0), 0) / methods.length;
            mask[pixelIndex] = confidence;
        }
        
        return mask;
    }
    
    /**
     * Lab色彩空间肤色检测
     * @private
     */
    _isLabSkin(r, g, b) {
        // RGB转Lab
        const [l, a, lab_b] = this._rgbToLab(r, g, b);
        
        // Lab空间的肤色范围
        return (
            l > 20 && l < 95 &&
            a > -10 && a < 25 &&
            lab_b > -15 && lab_b < 20 &&
            a > lab_b  // a通道通常大于b通道
        );
    }
    
    /**
     * RGB转Lab色彩空间
     * @private
     */
    _rgbToLab(r, g, b) {
        // 简化的RGB到Lab转换
        // 先转到XYZ
        r = r / 255;
        g = g / 255;
        b = b / 255;
        
        // 应用gamma校正
        r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
        g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
        b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;
        
        // 转到XYZ (D65标准光源)
        let x = r * 0.4124 + g * 0.3576 + b * 0.1805;
        let y = r * 0.2126 + g * 0.7152 + b * 0.0722;
        let z = r * 0.0193 + g * 0.1192 + b * 0.9505;
        
        // 归一化
        x = x / 0.95047;
        y = y / 1.00000;
        z = z / 1.08883;
        
        // 转到Lab
        x = x > 0.008856 ? Math.pow(x, 1/3) : (7.787 * x + 16/116);
        y = y > 0.008856 ? Math.pow(y, 1/3) : (7.787 * y + 16/116);
        z = z > 0.008856 ? Math.pow(z, 1/3) : (7.787 * z + 16/116);
        
        const l = 116 * y - 16;
        const a = 500 * (x - y);
        const lab_b = 200 * (y - z);
        
        return [l, a, lab_b];
    }
    
    /**
     * 纹理分析
     * @private
     */
    _textureAnalysis(data, width, height) {
        const mask = new Array(width * height).fill(0);
        
        // 使用局部二值模式(LBP)进行纹理分析
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const centerIdx = (y * width + x) * 4;
                const centerGray = (data[centerIdx] + data[centerIdx + 1] + data[centerIdx + 2]) / 3;
                
                let lbpCode = 0;
                const neighbors = [
                    [-1, -1], [-1, 0], [-1, 1],
                    [0, 1], [1, 1], [1, 0], [1, -1], [0, -1]
                ];
                
                for (let i = 0; i < neighbors.length; i++) {
                    const [dx, dy] = neighbors[i];
                    const nIdx = ((y + dy) * width + (x + dx)) * 4;
                    const nGray = (data[nIdx] + data[nIdx + 1] + data[nIdx + 2]) / 3;
                    
                    if (nGray > centerGray) {
                        lbpCode |= (1 << i);
                    }
                }
                
                // 基于LBP码判断是否为前景纹理
                const pixelIndex = y * width + x;
                mask[pixelIndex] = this._isSubjectTexture(lbpCode) ? 0.7 : 0.1;
            }
        }
        
        return mask;
    }
    
    /**
     * 判断是否为主体纹理
     * @private
     */
    _isSubjectTexture(lbpCode) {
        // 均匀纹理模式通常是背景
        const uniformPatterns = [0, 1, 3, 7, 15, 31, 63, 127, 255];
        return !uniformPatterns.includes(lbpCode);
    }
    
    /**
     * 智能掩膜融合
     * @private
     */
    _intelligentMaskFusion(masks, width, height) {
        const finalMask = new Array(width * height).fill(0);
        const weights = [0.4, 0.3, 0.2, 0.1]; // 权重分配
        
        for (let i = 0; i < finalMask.length; i++) {
            let weightedSum = 0;
            let totalWeight = 0;
            
            for (let j = 0; j < masks.length; j++) {
                if (masks[j] && i < masks[j].length) {
                    weightedSum += masks[j][i] * weights[j];
                    totalWeight += weights[j];
                }
            }
            
            finalMask[i] = totalWeight > 0 ? weightedSum / totalWeight : 0;
        }
        
        // 应用非线性增强
        for (let i = 0; i < finalMask.length; i++) {
            const value = finalMask[i];
            // S曲线增强对比度
            finalMask[i] = this._applySCurve(value);
        }
        
        return finalMask;
    }
    
    /**
     * 应用S曲线增强对比度
     * @private
     */
    _applySCurve(value) {
        // 使用sigmoid函数创建S曲线
        const k = 8; // 控制曲线陡度
        const shifted = value - 0.5;
        const enhanced = 1 / (1 + Math.exp(-k * shifted));
        return enhanced;
    }
    
    /**
     * 超级高级后处理 - 针对锯齿和细节优化
     * @private
     */
    _advancedPostProcessing(data, width, height, mask) {
        // Debug: 开始超级后处理优化
        
        // 1. 多级抗锯齿处理
        this._multiLevelAntiAliasing(data, width, height, mask);
        
        // 2. 边缘细节增强
        this._edgeDetailEnhancement(data, width, height, mask);
        
        // 3. 自适应羽化
        this._smartFeathering(data, width, height, mask);
        
        // 4. 细节恢复
        this._detailRecovery(data, width, height, mask);
        
        // 5. 最终优化
        this._finalOptimization(data, width, height);
        
        // Debug: 超级后处理完成
    }
    
    /**
     * 多级抗锯齿处理
     * @private
     */
    _multiLevelAntiAliasing(data, width, height, mask) {
        const tempAlpha = new Array(width * height);
        
        // 提取alpha通道
        for (let i = 0; i < width * height; i++) {
            tempAlpha[i] = data[i * 4 + 3];
        }
        
        // 检测并处理锯齿
        for (let y = 2; y < height - 2; y++) {
            for (let x = 2; x < width - 2; x++) {
                const idx = y * width + x;
                const jaggedLevel = this._detectJaggedLevel(tempAlpha, x, y, width);
                
                if (jaggedLevel > 0.3) {
                    const smoothed = this._applyAdaptiveSmoothing(
                        tempAlpha, x, y, width, height, jaggedLevel, mask[idx]
                    );
                    data[idx * 4 + 3] = smoothed;
                }
            }
        }
    }
    
    /**
     * 检测锯齿程度
     * @private
     */
    _detectJaggedLevel(alphaData, x, y, width) {
        const centerIdx = y * width + x;
        const center = alphaData[centerIdx];
        
        // 检查周围像素的急剧变化
        let totalVariation = 0;
        let count = 0;
        
        // 3x3邻域
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                
                const nIdx = (y + dy) * width + (x + dx);
                const neighbor = alphaData[nIdx];
                const variation = Math.abs(center - neighbor);
                
                totalVariation += variation;
                count++;
            }
        }
        
        const avgVariation = totalVariation / count;
        
        // 检查方向性锯齿
        const horizontalVar = Math.abs(alphaData[centerIdx - 1] - alphaData[centerIdx + 1]);
        const verticalVar = Math.abs(alphaData[centerIdx - width] - alphaData[centerIdx + width]);
        const maxDirectionalVar = Math.max(horizontalVar, verticalVar);
        
        // 锯齿指数：平均变化 + 方向性变化
        const jaggedIndex = (avgVariation + maxDirectionalVar * 0.5) / 255;
        
        return Math.min(1, jaggedIndex);
    }
    
    /**
     * 应用自适应平滑
     * @private
     */
    _applyAdaptiveSmoothing(alphaData, centerX, centerY, width, height, jaggedLevel, confidence) {
        const centerIdx = centerY * width + centerX;
        const centerAlpha = alphaData[centerIdx];
        
        // 根据锯齿程度和置信度决定平滑强度
        const smoothingRadius = Math.ceil(jaggedLevel * 2 + (1 - confidence));
        const maxRadius = Math.min(3, smoothingRadius);
        
        let weightedSum = 0;
        let totalWeight = 0;
        
        // 自适应核大小
        for (let dy = -maxRadius; dy <= maxRadius; dy++) {
            for (let dx = -maxRadius; dx <= maxRadius; dx++) {
                const x = centerX + dx;
                const y = centerY + dy;
                
                if (x >= 0 && x < width && y >= 0 && y < height) {
                    const idx = y * width + x;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance <= maxRadius) {
                        // 空间权重
                        const spatialWeight = Math.exp(-distance * distance / (2 * maxRadius * maxRadius));
                        
                        // 颜色相似性权重
                        const alphaDiff = Math.abs(alphaData[idx] - centerAlpha);
                        const colorWeight = Math.exp(-alphaDiff * alphaDiff / (2 * 40 * 40));
                        
                        // 边缘保护权重
                        const edgeProtection = 1 - jaggedLevel * 0.3;
                        
                        const finalWeight = spatialWeight * colorWeight * edgeProtection;
                        weightedSum += alphaData[idx] * finalWeight;
                        totalWeight += finalWeight;
                    }
                }
            }
        }
        
        const smoothed = totalWeight > 0 ? weightedSum / totalWeight : centerAlpha;
        
        // 与原值混合，保持一定的锐度
        const blendRatio = Math.min(0.8, jaggedLevel + (1 - confidence) * 0.3);
        return Math.round(centerAlpha * (1 - blendRatio) + smoothed * blendRatio);
    }
    
    /**
     * 边缘细节增强
     * @private
     */
    _edgeDetailEnhancement(data, width, height, mask) {
        // 创建细节增强滤波器
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = (y * width + x) * 4 + 3;
                const pixelIdx = y * width + x;
                const confidence = mask[pixelIdx];
                
                if (confidence > 0.6) {
                    // 只对高置信度区域进行细节增强
                    const enhanced = this._enhanceEdgeDetail(data, x, y, width, height, confidence);
                    data[idx] = enhanced;
                }
            }
        }
    }
    
    /**
     * 增强边缘细节
     * @private
     */
    _enhanceEdgeDetail(data, x, y, width, height, confidence) {
        const centerIdx = (y * width + x) * 4 + 3;
        const center = data[centerIdx];
        
        // 计算拉普拉斯算子
        const laplacian = 
            -data[((y-1) * width + (x-1)) * 4 + 3] - data[((y-1) * width + x) * 4 + 3] - data[((y-1) * width + (x+1)) * 4 + 3] +
            -data[(y * width + (x-1)) * 4 + 3] + 8 * center - data[(y * width + (x+1)) * 4 + 3] +
            -data[((y+1) * width + (x-1)) * 4 + 3] - data[((y+1) * width + x) * 4 + 3] - data[((y+1) * width + (x+1)) * 4 + 3];
        
        // 根据置信度调整增强强度
        const enhanceStrength = confidence * 0.15;
        const enhanced = center + laplacian * enhanceStrength;
        
        return Math.max(0, Math.min(255, Math.round(enhanced)));
    }
    
    /**
     * 智能羽化
     * @private
     */
    _smartFeathering(data, width, height, mask) {
        const tempAlpha = new Array(width * height);
        
        // 提取alpha通道
        for (let i = 0; i < width * height; i++) {
            tempAlpha[i] = data[i * 4 + 3];
        }
        
        // 对边缘区域应用智能羽化
        for (let y = 3; y < height - 3; y++) {
            for (let x = 3; x < width - 3; x++) {
                const idx = y * width + x;
                const isEdge = this._isEdgePixel(tempAlpha, x, y, width);
                const confidence = mask[idx];
                
                if (isEdge && confidence < 0.8) {
                    // 边缘像素且置信度不高，需要羽化
                    const featherRadius = this._calculateSmartFeatherRadius(tempAlpha, x, y, width, confidence);
                    const feathered = this._applySmartFeather(tempAlpha, x, y, width, height, featherRadius);
                    data[idx * 4 + 3] = feathered;
                }
            }
        }
    }
    
    /**
     * 判断是否为边缘像素
     * @private
     */
    _isEdgePixel(alphaData, x, y, width) {
        const centerIdx = y * width + x;
        const center = alphaData[centerIdx];
        
        // 检查4邻域的alpha变化
        const neighbors = [
            alphaData[centerIdx - 1],     // 左
            alphaData[centerIdx + 1],     // 右
            alphaData[centerIdx - width], // 上
            alphaData[centerIdx + width]  // 下
        ];
        
        let maxDiff = 0;
        for (const neighbor of neighbors) {
            maxDiff = Math.max(maxDiff, Math.abs(center - neighbor));
        }
        
        return maxDiff > 30; // 阈值可调
    }
    
    /**
     * 计算智能羽化半径
     * @private
     */
    _calculateSmartFeatherRadius(alphaData, x, y, width, confidence) {
        const centerIdx = y * width + x;
        const center = alphaData[centerIdx];
        
        // 检查周围的梯度强度
        let maxGradient = 0;
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                
                const nIdx = (y + dy) * width + (x + dx);
                const gradient = Math.abs(center - alphaData[nIdx]);
                maxGradient = Math.max(maxGradient, gradient);
            }
        }
        
        // 根据梯度和置信度计算羽化半径
        const gradientFactor = Math.min(1, maxGradient / 100);
        const confidenceFactor = 1 - confidence;
        
        return Math.ceil((gradientFactor + confidenceFactor) * 2);
    }
    
    /**
     * 应用智能羽化
     * @private
     */
    _applySmartFeather(alphaData, centerX, centerY, width, height, radius) {
        const centerIdx = centerY * width + centerX;
        const centerAlpha = alphaData[centerIdx];
        
        let weightedSum = 0;
        let totalWeight = 0;
        
        // 应用高斯权重，但考虑alpha相似性
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const x = centerX + dx;
                const y = centerY + dy;
                
                if (x >= 0 && x < width && y >= 0 && y < height) {
                    const idx = y * width + x;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance <= radius) {
                        // 空间高斯权重
                        const spatialWeight = Math.exp(-distance * distance / (2 * radius * radius));
                        
                        // alpha相似性权重
                        const alphaDiff = Math.abs(alphaData[idx] - centerAlpha);
                        const similarityWeight = Math.exp(-alphaDiff * alphaDiff / (2 * 50 * 50));
                        
                        const finalWeight = spatialWeight * similarityWeight;
                        weightedSum += alphaData[idx] * finalWeight;
                        totalWeight += finalWeight;
                    }
                }
            }
        }
        
        return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : centerAlpha;
    }
    
    /**
     * 细节恢复
     * @private
     */
    _detailRecovery(data, width, height, mask) {
        // 使用非锐化掩膜技术恢复丢失的细节
        const originalAlpha = new Array(width * height);
        for (let i = 0; i < width * height; i++) {
            originalAlpha[i] = data[i * 4 + 3];
        }
        
        // 创建轻微模糊版本
        const blurred = this._createGaussianBlur(originalAlpha, width, height, 1.0);
        
        // 计算细节差异并恢复
        for (let i = 0; i < width * height; i++) {
            const confidence = mask[i];
            
            if (confidence > 0.7) {
                const original = originalAlpha[i];
                const blur = blurred[i];
                const detail = original - blur;
                
                // 增强细节
                const enhancementStrength = confidence * 0.4;
                const recovered = original + detail * enhancementStrength;
                
                data[i * 4 + 3] = Math.max(0, Math.min(255, Math.round(recovered)));
            }
        }
    }
    
    /**
     * 创建高斯模糊
     * @private
     */
    _createGaussianBlur(data, width, height, sigma) {
        const radius = Math.ceil(sigma * 2);
        const kernel = [];
        let sum = 0;
        
        // 生成1D高斯核
        for (let i = -radius; i <= radius; i++) {
            const value = Math.exp(-(i * i) / (2 * sigma * sigma));
            kernel.push(value);
            sum += value;
        }
        
        // 归一化
        for (let i = 0; i < kernel.length; i++) {
            kernel[i] /= sum;
        }
        
        // 水平模糊
        const temp = new Array(data.length);
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let blurredValue = 0;
                let weightSum = 0;
                
                for (let i = -radius; i <= radius; i++) {
                    const nx = x + i;
                    if (nx >= 0 && nx < width) {
                        blurredValue += data[y * width + nx] * kernel[i + radius];
                        weightSum += kernel[i + radius];
                    }
                }
                
                temp[y * width + x] = blurredValue / weightSum;
            }
        }
        
        // 垂直模糊
        const result = new Array(data.length);
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let blurredValue = 0;
                let weightSum = 0;
                
                for (let i = -radius; i <= radius; i++) {
                    const ny = y + i;
                    if (ny >= 0 && ny < height) {
                        blurredValue += temp[ny * width + x] * kernel[i + radius];
                        weightSum += kernel[i + radius];
                    }
                }
                
                result[y * width + x] = Math.round(blurredValue / weightSum);
            }
        }
        
        return result;
    }
    
    /**
     * 最终优化
     * @private
     */
    _finalOptimization(data, width, height) {
        // 最后一遍优化，确保整体质量
        const tempData = new Uint8ClampedArray(data);
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = (y * width + x) * 4 + 3;
                
                // 检查局部一致性
                const consistency = this._calculateLocalConsistency(tempData, x, y, width);
                
                if (consistency < 0.6) {
                    // 应用最终平滑
                    const optimized = this._applyFinalSmooth(tempData, x, y, width);
                    data[idx] = optimized;
                }
            }
        }
    }
    
    /**
     * 计算局部一致性
     * @private
     */
    _calculateLocalConsistency(data, x, y, width) {
        const centerIdx = (y * width + x) * 4 + 3;
        const center = data[centerIdx];
        
        let similaritySum = 0;
        let count = 0;
        
        // 检查3x3邻域
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                
                const nIdx = ((y + dy) * width + (x + dx)) * 4 + 3;
                const neighbor = data[nIdx];
                const similarity = 1 - Math.abs(center - neighbor) / 255;
                
                similaritySum += similarity;
                count++;
            }
        }
        
        return similaritySum / count;
    }
    
    /**
     * 应用最终平滑
     * @private
     */
    _applyFinalSmooth(data, x, y, width) {
        const centerIdx = (y * width + x) * 4 + 3;
        const current = data[centerIdx];
        
        let weightedSum = current * 0.6; // 保留较多原值
        let totalWeight = 0.6;
        
        // 3x3邻域加权平均
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                
                const nIdx = ((y + dy) * width + (x + dx)) * 4 + 3;
                const neighbor = data[nIdx];
                const similarity = 1 - Math.abs(current - neighbor) / 255;
                const weight = similarity * 0.4;
                
                weightedSum += neighbor * weight;
                totalWeight += weight;
            }
        }
        
        return Math.round(weightedSum / totalWeight);
    }
    
    /**
     * 双边滤波
     * @private
     */
    _bilateralFilterAlpha(data, width, height, radius, sigmaSpace, sigmaColor) {
        const alphaChannel = [];
        for (let i = 3; i < data.length; i += 4) {
            alphaChannel.push(data[i]);
        }
        
        const filteredAlpha = this._applyBilateralFilter(
            alphaChannel, width, height, radius, sigmaSpace, sigmaColor
        );
        
        for (let i = 0; i < filteredAlpha.length; i++) {
            data[i * 4 + 3] = filteredAlpha[i];
        }
    }
    
    /**
     * 简化双边滤波实现
     * @private
     */
    _applyBilateralFilter(channel, width, height, radius, sigmaSpace, sigmaColor) {
        const filtered = [...channel];
        
        for (let y = radius; y < height - radius; y++) {
            for (let x = radius; x < width - radius; x++) {
                const centerIdx = y * width + x;
                const centerValue = channel[centerIdx];
                
                let weightSum = 0;
                let valueSum = 0;
                
                for (let dy = -radius; dy <= radius; dy++) {
                    for (let dx = -radius; dx <= radius; dx++) {
                        const nIdx = (y + dy) * width + (x + dx);
                        const nValue = channel[nIdx];
                        
                        // 空间距离权重
                        const spatialWeight = Math.exp(-(dx*dx + dy*dy) / (2 * sigmaSpace * sigmaSpace));
                        
                        // 颜色差异权重
                        const colorDiff = Math.abs(centerValue - nValue);
                        const colorWeight = Math.exp(-(colorDiff*colorDiff) / (2 * sigmaColor * sigmaColor));
                        
                        const weight = spatialWeight * colorWeight;
                        weightSum += weight;
                        valueSum += nValue * weight;
                    }
                }
                
                filtered[centerIdx] = Math.round(valueSum / weightSum);
            }
        }
        
        return filtered;
    }
    
    /**
     * 高精度边缘检测
     * @private
     */
    _precisionEdgeDetection(data, width, height) {
        const mask = new Array(width * height).fill(0);
        
        // 多尺度边缘检测
        const scales = [1, 2, 3];
        const edgeMasks = [];
        
        for (const scale of scales) {
            const scaleMask = this._detectEdgesAtScale(data, width, height, scale);
            edgeMasks.push(scaleMask);
        }
        
        // 融合多尺度结果
        for (let i = 0; i < mask.length; i++) {
            let maxEdge = 0;
            for (const edgeMask of edgeMasks) {
                maxEdge = Math.max(maxEdge, edgeMask[i]);
            }
            mask[i] = maxEdge;
        }
        
        return mask;
    }
    
    /**
     * 特定尺度边缘检测
     * @private
     */
    _detectEdgesAtScale(data, width, height, scale) {
        const mask = new Array(width * height).fill(0);
        
        for (let y = scale; y < height - scale; y++) {
            for (let x = scale; x < width - scale; x++) {
                const gradient = this._calculateGradientAtScale(data, x, y, width, scale);
                const pixelIndex = y * width + x;
                mask[pixelIndex] = Math.min(1, gradient / 100); // 归一化
            }
        }
        
        return mask;
    }
    
    /**
     * 特定尺度梯度计算
     * @private
     */
    _calculateGradientAtScale(data, x, y, width, scale) {
        const getGray = (px, py) => {
            const idx = (py * width + px) * 4;
            return (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        };
        
        // Sobel算子，按尺度缩放
        const gx = (
            -getGray(x-scale, y-scale) + getGray(x+scale, y-scale) +
            -2*getGray(x-scale, y) + 2*getGray(x+scale, y) +
            -getGray(x-scale, y+scale) + getGray(x+scale, y+scale)
        );
        
        const gy = (
            -getGray(x-scale, y-scale) - 2*getGray(x, y-scale) - getGray(x+scale, y-scale) +
            getGray(x-scale, y+scale) + 2*getGray(x, y+scale) + getGray(x+scale, y+scale)
        );
        
        return Math.sqrt(gx * gx + gy * gy);
    }
    
    /**
     * 色彩空间分析
     * @private
     */
    _colorSpaceAnalysis(data, width, height, backgroundAnalysis) {
        const mask = new Array(width * height).fill(0);
        const bgColors = backgroundAnalysis.colors;
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const pixelIndex = Math.floor(i / 4);
            
            let minDistance = Infinity;
            for (const bgColor of bgColors) {
                const distance = this._colorDistance([r, g, b], bgColor);
                minDistance = Math.min(minDistance, distance);
            }
            
            // 距离背景色越远，越可能是前景
            const maxDistance = Math.sqrt(255*255 + 255*255 + 255*255);
            mask[pixelIndex] = Math.min(1, minDistance / maxDistance);
        }
        
        return mask;
    }
    
    /**
     * 增强发色检测
     * @private
     */
    _enhancedHairDetection(data, width, height) {
        const mask = new Array(width * height).fill(0);
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const pixelIndex = Math.floor(i / 4);
            
            // 多种发色检测
            const confidence = Math.max(
                this._isBlackHair(r, g, b) ? 0.8 : 0,
                this._isBrownHair(r, g, b) ? 0.7 : 0,
                this._isBlondHair(r, g, b) ? 0.6 : 0,
                this._isRedHair(r, g, b) ? 0.7 : 0,
                this._isGrayHair(r, g, b) ? 0.5 : 0
            );
            
            mask[pixelIndex] = confidence;
        }
        
        return mask;
    }
    
    /**
     * 黑发检测
     * @private
     */
    _isBlackHair(r, g, b) {
        const brightness = (r + g + b) / 3;
        const variance = Math.max(r, g, b) - Math.min(r, g, b);
        return brightness < 60 && variance < 20;
    }
    
    /**
     * 棕发检测
     * @private
     */
    _isBrownHair(r, g, b) {
        return r > 40 && r < 120 && 
               g > 25 && g < 80 && 
               b > 10 && b < 60 && 
               r > g && g > b;
    }
    
    /**
     * 金发检测
     * @private
     */
    _isBlondHair(r, g, b) {
        return r > 120 && g > 100 && b < 80 && 
               r > g && g > b && (r - b) > 40;
    }
    
    /**
     * 红发检测
     * @private
     */
    _isRedHair(r, g, b) {
        return r > 100 && g < 80 && b < 60 && 
               r > (g + b) * 1.2;
    }
    
    /**
     * 灰发检测
     * @private
     */
    _isGrayHair(r, g, b) {
        const brightness = (r + g + b) / 3;
        const variance = Math.max(r, g, b) - Math.min(r, g, b);
        return brightness > 80 && brightness < 180 && variance < 30;
    }
    
    /**
     * 增强衣物检测
     * @private
     */
    _enhancedClothingDetection(data, width, height) {
        const mask = new Array(width * height).fill(0);
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const pixelIndex = Math.floor(i / 4);
            
            // 衣物特征检测
            const saturation = Math.max(r, g, b) - Math.min(r, g, b);
            const brightness = (r + g + b) / 3;
            
            // 具有一定饱和度和适中亮度的颜色更可能是衣物
            const isFabricLike = (
                saturation > 15 && 
                brightness > 20 && 
                brightness < 230 &&
                !this._isPureBgColor(r, g, b)
            );
            
            mask[pixelIndex] = isFabricLike ? 0.6 : 0.1;
        }
        
        return mask;
    }
    
    /**
     * 物体形状检测
     * @private
     */
    _objectShapeDetection(data, width, height) {
        const mask = new Array(width * height).fill(0);
        
        // 基于连通区域的形状分析
        const visited = new Array(width * height).fill(false);
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const pixelIndex = y * width + x;
                if (!visited[pixelIndex]) {
                    const region = this._floodFillRegion(data, x, y, width, height, visited);
                    
                    // 分析区域形状特征
                    const shapeScore = this._analyzeRegionShape(region, width, height);
                    
                    // 为该区域的所有像素设置置信度
                    for (const idx of region.pixels) {
                        mask[idx] = shapeScore;
                    }
                }
            }
        }
        
        return mask;
    }
    
    /**
     * 洪水填充区域
     * @private
     */
    _floodFillRegion(data, startX, startY, width, height, visited) {
        const stack = [{x: startX, y: startY}];
        const region = {
            pixels: [],
            bounds: {minX: startX, maxX: startX, minY: startY, maxY: startY}
        };
        
        const startIdx = startY * width + startX;
        const startColor = [
            data[startIdx * 4],
            data[startIdx * 4 + 1], 
            data[startIdx * 4 + 2]
        ];
        
        while (stack.length > 0) {
            const {x, y} = stack.pop();
            const pixelIndex = y * width + x;
            
            if (x < 0 || x >= width || y < 0 || y >= height || visited[pixelIndex]) {
                continue;
            }
            
            const currentColor = [
                data[pixelIndex * 4],
                data[pixelIndex * 4 + 1],
                data[pixelIndex * 4 + 2]
            ];
            
            // 颜色相似性判断
            if (this._colorDistance(currentColor, startColor) > 30) {
                continue;
            }
            
            visited[pixelIndex] = true;
            region.pixels.push(pixelIndex);
            
            // 更新边界
            region.bounds.minX = Math.min(region.bounds.minX, x);
            region.bounds.maxX = Math.max(region.bounds.maxX, x);
            region.bounds.minY = Math.min(region.bounds.minY, y);
            region.bounds.maxY = Math.max(region.bounds.maxY, y);
            
            // 添加邻居
            stack.push({x: x-1, y}, {x: x+1, y}, {x, y: y-1}, {x, y: y+1});
            
            // 限制区域大小以避免性能问题
            if (region.pixels.length > 1000) break;
        }
        
        return region;
    }
    
    /**
     * 分析区域形状
     * @private
     */
    _analyzeRegionShape(region, width, height) {
        if (region.pixels.length < 50) return 0.1; // 太小的区域
        
        const bounds = region.bounds;
        const regionWidth = bounds.maxX - bounds.minX + 1;
        const regionHeight = bounds.maxY - bounds.minY + 1;
        
        // 计算形状特征
        const aspectRatio = regionWidth / regionHeight;
        const fillRatio = region.pixels.length / (regionWidth * regionHeight);
        
        // 人像物体通常有特定的长宽比和填充率
        const isPortraitLike = (
            aspectRatio > 0.3 && aspectRatio < 2.5 && // 合理长宽比
            fillRatio > 0.3 && // 相对紧密的形状
            region.pixels.length > 200 // 足够大的区域
        );
        
        return isPortraitLike ? 0.7 : 0.2;
    }
    
    /**
     * 判断是否为纯背景色
     * @private
     */
    _isPureBgColor(r, g, b) {
        // 纯白、纯黑、纯灰等背景色
        const isWhite = r > 240 && g > 240 && b > 240;
        const isBlack = r < 15 && g < 15 && b < 15;
        const isGray = Math.abs(r - g) < 10 && Math.abs(g - b) < 10 && Math.abs(r - b) < 10;
        
        return isWhite || isBlack || isGray;
    }
    
    /**
     * 计算高级边缘Alpha
     * @private
     */
    _calculateAdvancedEdgeAlpha(pixelIndex, mask, width, height) {
        const y = Math.floor(pixelIndex / width);
        const x = pixelIndex % width;
        
        // 多层次检查，使用不同的半径
        const radii = [1, 2, 3];
        const weights = [0.5, 0.3, 0.2];
        
        let totalAlpha = 0;
        let totalWeight = 0;
        
        for (let r = 0; r < radii.length; r++) {
            const radius = radii[r];
            const weight = weights[r];
            
            let localSum = 0;
            let localCount = 0;
            
            for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                    const nx = x + dx;
                    const ny = y + dy;
                    
                    if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                        const nIdx = ny * width + nx;
                        localSum += mask[nIdx];
                        localCount++;
                    }
                }
            }
            
            if (localCount > 0) {
                const localAlpha = localSum / localCount;
                totalAlpha += localAlpha * weight;
                totalWeight += weight;
            }
        }
        
        const finalAlpha = totalWeight > 0 ? totalAlpha / totalWeight : mask[pixelIndex];
        return this._smoothTransition(finalAlpha);
    }
    
    /**
     * 平滑过渡函数
     * @private
     */
    _smoothTransition(value) {
        // 使用平滑阶跃函数
        if (value < 0.1) return 0;
        if (value > 0.9) return 1;
        
        // 平滑S曲线
        const smoothed = 3 * value * value - 2 * value * value * value;
        return Math.max(0.05, Math.min(0.95, smoothed));
    }
    
    /**
     * 边缘锐化
     * @private
     */
    _sharpenEdges(data, width, height, mask) {
        // 对alpha通道进行轻微锐化
        const tempData = new Uint8ClampedArray(data);
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = (y * width + x) * 4 + 3; // alpha通道
                const pixelIndex = y * width + x;
                
                // 只对边缘区域进行锐化
                if (mask[pixelIndex] > 0.3 && mask[pixelIndex] < 0.7) {
                    const current = tempData[idx];
                    const neighbors = [
                        tempData[idx - 4], tempData[idx + 4], // 左右
                        tempData[idx - width * 4], tempData[idx + width * 4] // 上下
                    ];
                    
                    const avgNeighbor = neighbors.reduce((sum, val) => sum + val, 0) / 4;
                    const sharpened = current + 0.3 * (current - avgNeighbor);
                    
                    data[idx] = Math.max(0, Math.min(255, Math.round(sharpened)));
                }
            }
        }
    }
    
    /**
     * 最终平滑
     * @private
     */
    _finalSmoothing(data, width, height) {
        // 对alpha通道进行最终的轻微平滑
        const tempAlpha = [];
        for (let i = 3; i < data.length; i += 4) {
            tempAlpha.push(data[i]);
        }
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const pixelIndex = y * width + x;
                const dataIndex = pixelIndex * 4 + 3;
                
                // 3x3均值滤波
                let sum = 0;
                let count = 0;
                
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        const nIdx = (y + dy) * width + (x + dx);
                        if (nIdx >= 0 && nIdx < tempAlpha.length) {
                            sum += tempAlpha[nIdx];
                            count++;
                        }
                    }
                }
                
                const smoothed = sum / count;
                // 与原值混合
                data[dataIndex] = Math.round(0.7 * data[dataIndex] + 0.3 * smoothed);
            }
        }
    }
    
    /**
     * YCbCr肤色检测
     * @private
     */
    _isYCbCrSkin(r, g, b) {
        const y = 0.299 * r + 0.587 * g + 0.114 * b;
        const cb = -0.169 * r - 0.331 * g + 0.5 * b + 128;
        const cr = 0.5 * r - 0.419 * g - 0.081 * b + 128;
        
        return (
            y > 60 && y < 240 &&
            cb > 80 && cb < 130 &&
            cr > 130 && cr < 180
        );
    }
    
    /**
     * RGB肤色检测
     * @private
     */
    _isRGBSkin(r, g, b) {
        return (
            r > 60 && g > 40 && b > 20 &&
            r > g && r > b &&
            Math.abs(r - g) > 10 &&
            Math.max(r, g, b) - Math.min(r, g, b) > 15
        );
    }

    /**
     * 检测多个背景色
     * @private
     */
    _detectMultipleBackgroundColors(data, width, height) {
        const edgeColors = [];
        const cornerColors = [];
        const borderWidth = Math.min(30, Math.floor(Math.min(width, height) * 0.15));
        
        // 1. 采样边缘区域（增大采样范围）
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (x < borderWidth || x >= width - borderWidth || 
                    y < borderWidth || y >= height - borderWidth) {
                    const idx = (y * width + x) * 4;
                    edgeColors.push([data[idx], data[idx + 1], data[idx + 2]]);
                }
            }
        }
        
        // 2. 重点采样四个角落区域
        const cornerSize = Math.min(60, Math.floor(Math.min(width, height) * 0.25));
        const corners = [
            {x: 0, y: 0}, 
            {x: Math.max(0, width - cornerSize), y: 0},
            {x: 0, y: Math.max(0, height - cornerSize)}, 
            {x: Math.max(0, width - cornerSize), y: Math.max(0, height - cornerSize)}
        ];
        
        corners.forEach(corner => {
            for (let y = corner.y; y < Math.min(corner.y + cornerSize, height); y++) {
                for (let x = corner.x; x < Math.min(corner.x + cornerSize, width); x++) {
                    const idx = (y * width + x) * 4;
                    const color = [data[idx], data[idx + 1], data[idx + 2]];
                    cornerColors.push(color);
                    cornerColors.push(color); // 增加权重
                }
            }
        });
        
        // 3. 合并并聚类
        const allColors = [...edgeColors, ...cornerColors];
        return this._clusterColors(allColors, 4); // 增加到4个主要背景色
    }

    /**
     * 颜色聚类分析
     * @private
     */
    _clusterColors(colors, numClusters) {
        if (colors.length === 0) return [[255, 255, 255]];
        
        // 简化的K-means聚类
        const clusters = [];
        
        // 初始化聚类中心
        for (let i = 0; i < numClusters; i++) {
            const randomIndex = Math.floor(Math.random() * colors.length);
            clusters.push([...colors[randomIndex]]);
        }
        
        // 迭代优化
        for (let iter = 0; iter < 10; iter++) {
            const assignments = colors.map(color => {
                let minDist = Infinity;
                let bestCluster = 0;
                
                for (let c = 0; c < clusters.length; c++) {
                    const dist = this._colorDistance(color, clusters[c]);
                    if (dist < minDist) {
                        minDist = dist;
                        bestCluster = c;
                    }
                }
                return bestCluster;
            });
            
            // 更新聚类中心
            for (let c = 0; c < clusters.length; c++) {
                const clusterColors = colors.filter((_, i) => assignments[i] === c);
                if (clusterColors.length > 0) {
                    clusters[c] = this._averageColor(clusterColors);
                }
            }
        }
        
        return clusters;
    }

    /**
     * 颜色距离计算
     * @private
     */
    _colorDistance(color1, color2) {
        const dr = color1[0] - color2[0];
        const dg = color1[1] - color2[1];
        const db = color1[2] - color2[2];
        return Math.sqrt(dr * dr + dg * dg + db * db);
    }

    /**
     * 平均颜色计算
     * @private
     */
    _averageColor(colors) {
        const sum = colors.reduce((acc, color) => [
            acc[0] + color[0],
            acc[1] + color[1],
            acc[2] + color[2]
        ], [0, 0, 0]);
        
        return [
            Math.round(sum[0] / colors.length),
            Math.round(sum[1] / colors.length),
            Math.round(sum[2] / colors.length)
        ];
    }

    /**
     * 检测人体区域（增强版）
     * @private
     */
    _detectHumanRegions(data, width, height) {
        const humanMask = new Array(width * height).fill(false);
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const pixelIndex = Math.floor(i / 4);
            
            // 增强的人体检测（包括肤色、头发、衣物等）
            humanMask[pixelIndex] = this._isHumanColor(r, g, b);
        }
        
        // 形态学操作：膨胀和腐蚀
        return this._morphologyOperations(humanMask, width, height);
    }

    /**
     * 判断是否为人体相关颜色
     * @private
     */
    _isHumanColor(r, g, b) {
        // 肤色检测（更宽泛的范围）
        if (this._isSkinColor(r, g, b)) {
            return true;
        }
        
        // 头发颜色检测
        if (this._isHairColor(r, g, b)) {
            return true;
        }
        
        // 常见衣物颜色（排除明显的背景色）
        if (this._isClothingColor(r, g, b)) {
            return true;
        }
        
        return false;
    }

    /**
     * 头发颜色检测
     * @private
     */
    _isHairColor(r, g, b) {
        // 黑色到棕色头发
        const brightness = (r + g + b) / 3;
        if (brightness < 100 && Math.max(r, g, b) - Math.min(r, g, b) < 30) {
            return true;
        }
        
        // 金发
        if (r > 150 && g > 120 && b < 100 && r > g && g > b) {
            return true;
        }
        
        return false;
    }

    /**
     * 衣物颜色检测
     * @private
     */
    _isClothingColor(r, g, b) {
        // 避免纯白、纯灰背景色
        const brightness = (r + g + b) / 3;
        const saturation = Math.max(r, g, b) - Math.min(r, g, b);
        
        // 有一定饱和度的颜色更可能是衣物
        return saturation > 20 && brightness > 30 && brightness < 220;
    }

    /**
     * 基于边缘检测前景
     * @private
     */
    _detectForegroundByEdges(data, width, height) {
        const edgeMask = new Array(width * height).fill(false);
        
        // Sobel边缘检测
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = y * width + x;
                const dataIdx = idx * 4;
                
                // 计算梯度强度
                const gradientStrength = this._calculateGradient(data, x, y, width);
                
                // 动态阈值：根据局部梯度强度调整
                const localThreshold = this._calculateLocalThreshold(data, x, y, width, height);
                
                if (gradientStrength > localThreshold) {
                    edgeMask[idx] = true;
                    // 根据梯度强度决定扩展半径
                    const expandRadius = Math.min(3, Math.floor(gradientStrength / 20));
                    this._expandRegion(edgeMask, idx, width, height, expandRadius);
                }
            }
        }
        
        return edgeMask;
    }

    /**
     * 计算梯度强度
     * @private
     */
    _calculateGradient(data, x, y, width) {
        const getPixel = (px, py) => {
            const idx = (py * width + px) * 4;
            return (data[idx] + data[idx + 1] + data[idx + 2]) / 3; // 灰度值
        };
        
        // Sobel算子
        const gx = -getPixel(x-1, y-1) + getPixel(x+1, y-1) +
                   -2*getPixel(x-1, y) + 2*getPixel(x+1, y) +
                   -getPixel(x-1, y+1) + getPixel(x+1, y+1);
        
        const gy = -getPixel(x-1, y-1) - 2*getPixel(x, y-1) - getPixel(x+1, y-1) +
                   getPixel(x-1, y+1) + 2*getPixel(x, y+1) + getPixel(x+1, y+1);
        
        return Math.sqrt(gx * gx + gy * gy);
    }
    
    /**
     * 计算局部自适应阈值
     * @private
     */
    _calculateLocalThreshold(data, x, y, width, height) {
        let sum = 0;
        let count = 0;
        const radius = 5;
        
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const nx = x + dx;
                const ny = y + dy;
                
                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                    const gradientStrength = this._calculateGradient(data, nx, ny, width);
                    sum += gradientStrength;
                    count++;
                }
            }
        }
        
        const localMean = sum / count;
        return Math.max(20, localMean * 0.8); // 自适应阈值
    }
    
    /**
     * 形态学处理：开运算和闭运算
     * @private
     */
    _morphologicalProcessing(mask, width, height) {
        // 先做开运算（腐蚀+膨胀）去除噪点
        const erodedMask = this._erode(mask, width, height, 1);
        const openedMask = this._dilate(erodedMask, width, height, 1);
        
        // 再做闭运算（膨胀+腐蚀）连接断裂区域
        const dilatedMask = this._dilate(openedMask, width, height, 2);
        const closedMask = this._erode(dilatedMask, width, height, 2);
        
        // 将结果复制回原数组
        for (let i = 0; i < mask.length; i++) {
            mask[i] = closedMask[i];
        }
    }
    
    /**
     * 腐蚀操作
     * @private
     */
    _erode(mask, width, height, radius) {
        const result = new Array(mask.length).fill(false);
        
        for (let y = radius; y < height - radius; y++) {
            for (let x = radius; x < width - radius; x++) {
                const idx = y * width + x;
                let allTrue = true;
                
                for (let dy = -radius; dy <= radius && allTrue; dy++) {
                    for (let dx = -radius; dx <= radius && allTrue; dx++) {
                        const nIdx = (y + dy) * width + (x + dx);
                        if (!mask[nIdx]) {
                            allTrue = false;
                        }
                    }
                }
                
                result[idx] = allTrue;
            }
        }
        
        return result;
    }
    
    /**
     * 膨胀操作
     * @private
     */
    _dilate(mask, width, height, radius) {
        const result = new Array(mask.length).fill(false);
        
        for (let y = radius; y < height - radius; y++) {
            for (let x = radius; x < width - radius; x++) {
                const idx = y * width + x;
                let anyTrue = false;
                
                for (let dy = -radius; dy <= radius && !anyTrue; dy++) {
                    for (let dx = -radius; dx <= radius && !anyTrue; dx++) {
                        const nIdx = (y + dy) * width + (x + dx);
                        if (mask[nIdx]) {
                            anyTrue = true;
                        }
                    }
                }
                
                result[idx] = anyTrue;
            }
        }
        
        return result;
    }

    /**
     * 融合多个蒙版
     * @private
     */
    _combineMasks(humanMask, edgeMask, width, height) {
        const combinedMask = new Array(width * height).fill(false);
        
        for (let i = 0; i < combinedMask.length; i++) {
            // 任一蒙版标记为前景都认为是前景
            combinedMask[i] = humanMask[i] || edgeMask[i];
        }
        
        // 连通性分析，移除小区域
        this._removeSmallRegions(combinedMask, width, height, 200);
        
        return combinedMask;
    }

    /**
     * 计算边缘透明度（增强版羽化）
     * @private
     */
    _calculateEdgeAlpha(pixelIndex, mask, width, height) {
        const y = Math.floor(pixelIndex / width);
        const x = pixelIndex % width;
        
        // 多层次检查周围像素
        let totalAlpha = 0;
        let weightSum = 0;
        
        // 使用不同半径的圆形核
        const radii = [1, 2, 3, 4];
        const weights = [0.4, 0.3, 0.2, 0.1];
        
        for (let r = 0; r < radii.length; r++) {
            const radius = radii[r];
            const weight = weights[r];
            let foregroundCount = 0;
            let totalCount = 0;
            
            for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance <= radius) {
                        const nx = x + dx;
                        const ny = y + dy;
                        
                        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                            const nIdx = ny * width + nx;
                            if (mask[nIdx]) foregroundCount++;
                            totalCount++;
                        }
                    }
                }
            }
            
            if (totalCount > 0) {
                const ratio = foregroundCount / totalCount;
                totalAlpha += ratio * weight;
                weightSum += weight;
            }
        }
        
        const finalAlpha = weightSum > 0 ? totalAlpha / weightSum : 0;
        
        // 应用平滑曲线，使边缘过渡更自然
        return this._smoothAlpha(finalAlpha);
    }
    
    /**
     * 平滑透明度曲线
     * @private
     */
    _smoothAlpha(alpha) {
        // 使用S曲线使过渡更平滑
        if (alpha < 0.1) return 0;
        if (alpha > 0.9) return 1;
        
        // 应用平滑函数
        const smoothed = 0.5 * (1 + Math.tanh(6 * (alpha - 0.5)));
        return Math.max(0.05, Math.min(0.95, smoothed));
    }

    /**
     * 计算背景置信度
     * @private
     */
    _calculateBackgroundConfidence(color, backgroundColors) {
        let maxSimilarity = 0;
        
        for (const bgColor of backgroundColors) {
            const similarity = this._colorSimilarity(color, bgColor);
            maxSimilarity = Math.max(maxSimilarity, similarity);
        }
        
        return maxSimilarity;
    }

    /**
     * 形态学操作
     * @private
     */
    _morphologyOperations(mask, width, height) {
        // 膨胀操作
        const dilated = this._dilate(mask, width, height, 2);
        // 腐蚀操作
        return this._erode(dilated, width, height, 1);
    }

    /**
     * 膨胀操作
     * @private
     */
    _dilate(mask, width, height, radius) {
        const result = [...mask];
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = y * width + x;
                
                if (mask[idx]) {
                    for (let dy = -radius; dy <= radius; dy++) {
                        for (let dx = -radius; dx <= radius; dx++) {
                            const nx = x + dx;
                            const ny = y + dy;
                            
                            if (nx >= 0 && nx < width && ny >= 0 && ny < height &&
                                dx * dx + dy * dy <= radius * radius) {
                                const nIdx = ny * width + nx;
                                result[nIdx] = true;
                            }
                        }
                    }
                }
            }
        }
        
        return result;
    }

    /**
     * 腐蚀操作
     * @private
     */
    _erode(mask, width, height, radius) {
        const result = new Array(mask.length).fill(false);
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = y * width + x;
                
                if (mask[idx]) {
                    let allNeighborsTrue = true;
                    
                    for (let dy = -radius; dy <= radius && allNeighborsTrue; dy++) {
                        for (let dx = -radius; dx <= radius && allNeighborsTrue; dx++) {
                            const nx = x + dx;
                            const ny = y + dy;
                            
                            if (nx >= 0 && nx < width && ny >= 0 && ny < height &&
                                dx * dx + dy * dy <= radius * radius) {
                                const nIdx = ny * width + nx;
                                if (!mask[nIdx]) {
                                    allNeighborsTrue = false;
                                }
                            }
                        }
                    }
                    
                    result[idx] = allNeighborsTrue;
                }
            }
        }
        
        return result;
    }

    /**
     * 后处理优化
     * @private
     */
    _postProcessing(data, width, height) {
        // 高斯模糊边缘以减少锯齿
        this._gaussianBlurAlpha(data, width, height, 1);
    }

    /**
     * 对Alpha通道应用高斯模糊
     * @private
     */
    _gaussianBlurAlpha(data, width, height, radius) {
        const alphaChannel = new Array(width * height);
        
        // 提取Alpha通道
        for (let i = 0; i < data.length; i += 4) {
            alphaChannel[Math.floor(i / 4)] = data[i + 3];
        }
        
        // 应用高斯模糊
        const blurred = this._gaussianBlur1D(alphaChannel, width, height, radius);
        
        // 写回Alpha通道
        for (let i = 0; i < data.length; i += 4) {
            data[i + 3] = blurred[Math.floor(i / 4)];
        }
    }

    /**
     * 一维高斯模糊
     * @private
     */
    _gaussianBlur1D(data, width, height, radius) {
        const result = new Array(data.length);
        const kernel = this._generateGaussianKernel(radius);
        
        // 水平模糊
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let sum = 0;
                let weightSum = 0;
                
                for (let i = -radius; i <= radius; i++) {
                    const nx = x + i;
                    if (nx >= 0 && nx < width) {
                        const weight = kernel[i + radius];
                        sum += data[y * width + nx] * weight;
                        weightSum += weight;
                    }
                }
                
                result[y * width + x] = Math.round(sum / weightSum);
            }
        }
        
        return result;
    }

    /**
     * 生成高斯核
     * @private
     */
    _generateGaussianKernel(radius) {
        const kernel = new Array(radius * 2 + 1);
        const sigma = radius / 3;
        let sum = 0;
        
        for (let i = 0; i <= radius * 2; i++) {
            const x = i - radius;
            kernel[i] = Math.exp(-(x * x) / (2 * sigma * sigma));
            sum += kernel[i];
        }
        
        // 归一化
        for (let i = 0; i < kernel.length; i++) {
            kernel[i] /= sum;
        }
        
        return kernel;
    }

    /**
     * 检测肤色区域
     * @private
     */
    _detectSkinRegions(data, width, height) {
        const skinMask = new Array(width * height).fill(false);
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const pixelIndex = Math.floor(i / 4);
            
            // 改进的肤色检测算法
            skinMask[pixelIndex] = this._isSkinColor(r, g, b);
        }
        
        return skinMask;
    }

    /**
     * 判断是否为肤色
     * @private
     */
    _isSkinColor(r, g, b) {
        // 方法1：YCbCr色彩空间检测
        const y = 0.299 * r + 0.587 * g + 0.114 * b;
        const cb = -0.169 * r - 0.331 * g + 0.5 * b + 128;
        const cr = 0.5 * r - 0.419 * g - 0.081 * b + 128;
        
        const ycbcrSkin = (
            y > 80 && y < 230 &&
            cb > 77 && cb < 127 &&
            cr > 133 && cr < 173
        );
        
        // 方法2：RGB空间检测（增强版）
        const rgbSkin = (
            r > 95 && g > 40 && b > 20 &&
            r > g && r > b &&
            Math.abs(r - g) > 15 &&
            Math.max(r, g, b) - Math.min(r, g, b) > 15
        );
        
        // 方法3：HSV空间检测
        const hsvSkin = this._isHSVSkin(r, g, b);
        
        // 方法4：扩展的RGB检测（覆盖更多肤色范围）
        const extendedRgbSkin = (
            (r > 60 && r < 255) &&
            (g > 40 && g < 200) &&
            (b > 20 && b < 150) &&
            r >= g && g >= b &&
            (r - g) >= 10 && (g - b) >= 5
        );
        
        // 组合判断：任一方法检测为肤色即认为是肤色
        return ycbcrSkin || rgbSkin || hsvSkin || extendedRgbSkin;
    }
    
    /**
     * HSV空间肤色检测
     * @private
     */
    _isHSVSkin(r, g, b) {
        // RGB转HSV
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const delta = max - min;
        
        if (delta === 0) return false;
        
        let h;
        if (max === r) {
            h = ((g - b) / delta) % 6;
        } else if (max === g) {
            h = (b - r) / delta + 2;
        } else {
            h = (r - g) / delta + 4;
        }
        h = h * 60;
        if (h < 0) h += 360;
        
        const s = max === 0 ? 0 : delta / max;
        const v = max / 255;
        
        // 肤色在HSV空间的范围
        return (
            ((h >= 0 && h <= 50) || (h >= 340 && h <= 360)) &&
            s >= 0.23 && s <= 0.68 &&
            v >= 0.35 && v <= 0.95
        );
    }

    /**
     * 创建前景蒙版
     * @private
     */
    _createForegroundMask(data, width, height, skinMask, backgroundColor) {
        const mask = new Array(width * height).fill(false);
        
        // 1. 肤色区域标记为前景
        for (let i = 0; i < mask.length; i++) {
            if (skinMask[i]) {
                mask[i] = true;
                // 扩展肤色周围区域
                this._expandRegion(mask, i, width, height, 3);
            }
        }
        
        // 2. 基于颜色相似度标记背景
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const pixelIndex = Math.floor(i / 4);
            
            const similarity = this._colorSimilarity([r, g, b], backgroundColor);
            
            // 如果与背景色非常相似且不是肤色，标记为背景
            if (similarity > 0.8 && !skinMask[pixelIndex]) {
                mask[pixelIndex] = false;
            }
        }
        
        // 3. 连通性分析，移除小的前景区域
        this._removeSmallRegions(mask, width, height, 100);
        
        return mask;
    }

    /**
     * 扩展区域
     * @private
     */
    _expandRegion(mask, centerIndex, width, height, radius) {
        const centerY = Math.floor(centerIndex / width);
        const centerX = centerIndex % width;
        
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const newX = centerX + dx;
                const newY = centerY + dy;
                
                if (newX >= 0 && newX < width && newY >= 0 && newY < height) {
                    const newIndex = newY * width + newX;
                    if (dx * dx + dy * dy <= radius * radius) {
                        mask[newIndex] = true;
                    }
                }
            }
        }
    }

    /**
     * 移除小区域
     * @private
     */
    _removeSmallRegions(mask, width, height, minSize) {
        const visited = new Array(mask.length).fill(false);
        
        for (let i = 0; i < mask.length; i++) {
            if (mask[i] && !visited[i]) {
                const regionSize = this._floodFill(mask, visited, i, width, height);
                if (regionSize < minSize) {
                    // 移除小区域
                    this._removeRegion(mask, i, width, height);
                }
            }
        }
    }

    /**
     * 洪水填充算法
     * @private
     */
    _floodFill(mask, visited, startIndex, width, height) {
        const stack = [startIndex];
        let size = 0;
        
        while (stack.length > 0) {
            const index = stack.pop();
            if (visited[index] || !mask[index]) continue;
            
            visited[index] = true;
            size++;
            
            const y = Math.floor(index / width);
            const x = index % width;
            
            // 检查4个邻接像素
            const neighbors = [
                [x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]
            ];
            
            for (const [nx, ny] of neighbors) {
                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                    const neighborIndex = ny * width + nx;
                    if (!visited[neighborIndex] && mask[neighborIndex]) {
                        stack.push(neighborIndex);
                    }
                }
            }
        }
        
        return size;
    }

    /**
     * 移除区域
     * @private
     */
    _removeRegion(mask, startIndex, width, height) {
        const stack = [startIndex];
        const processed = new Set();
        
        while (stack.length > 0) {
            const index = stack.pop();
            if (processed.has(index) || !mask[index]) continue;
            
            processed.add(index);
            mask[index] = false;
            
            const y = Math.floor(index / width);
            const x = index % width;
            
            const neighbors = [
                [x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]
            ];
            
            for (const [nx, ny] of neighbors) {
                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                    const neighborIndex = ny * width + nx;
                    if (!processed.has(neighborIndex) && mask[neighborIndex]) {
                        stack.push(neighborIndex);
                    }
                }
            }
        }
    }

    /**
     * 计算像素置信度
     * @private
     */
    _calculatePixelConfidence(data, pixelOffset, skinMask, pixelIndex, backgroundColor) {
        const r = data[pixelOffset];
        const g = data[pixelOffset + 1];
        const b = data[pixelOffset + 2];
        
        // 肤色像素高置信度
        if (skinMask[pixelIndex]) {
            return 1.0;
        }
        
        // 基于与背景色的差异计算置信度
        const bgSimilarity = this._colorSimilarity([r, g, b], backgroundColor);
        return Math.max(0.1, 1 - bgSimilarity);
    }

    /**
     * 边缘平滑处理
     * @private
     */
    _smoothEdges(data, width, height, mask) {
        const smoothedData = new Uint8ClampedArray(data);
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const index = y * width + x;
                const dataIndex = index * 4;
                
                if (mask[index]) {
                    // 检查边缘像素
                    const neighbors = [
                        mask[index - 1], mask[index + 1],
                        mask[index - width], mask[index + width]
                    ];
                    
                    const edgePixels = neighbors.filter(n => !n).length;
                    
                    if (edgePixels > 0) {
                        // 边缘像素，应用轻微的透明度
                        const alpha = Math.max(0.3, 1 - (edgePixels / 4) * 0.7);
                        smoothedData[dataIndex + 3] = Math.round(data[dataIndex + 3] * alpha);
                    }
                }
            }
        }
        
        // 复制平滑后的数据
        for (let i = 0; i < data.length; i++) {
            data[i] = smoothedData[i];
        }
    }

    /**
     * 检测背景颜色（基于边缘区域分析）
     * @private
     */
    _detectBackgroundColor(data, width, height) {
        const edgeColors = [];
        const borderWidth = Math.min(10, Math.floor(width * 0.05));
        
        // 采样边缘像素
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                // 只检查边缘区域
                if (x < borderWidth || x >= width - borderWidth || 
                    y < borderWidth || y >= height - borderWidth) {
                    const idx = (y * width + x) * 4;
                    edgeColors.push([data[idx], data[idx + 1], data[idx + 2]]);
                }
            }
        }
        
        // 找到最常见的颜色
        return this._findMostCommonColor(edgeColors);
    }

    /**
     * 找到最常见的颜色
     * @private
     */
    _findMostCommonColor(colors) {
        const colorMap = new Map();
        
        // 将颜色量化以减少变化
        for (const [r, g, b] of colors) {
            const quantizedR = Math.floor(r / 16) * 16;
            const quantizedG = Math.floor(g / 16) * 16;
            const quantizedB = Math.floor(b / 16) * 16;
            const key = `${quantizedR},${quantizedG},${quantizedB}`;
            
            colorMap.set(key, (colorMap.get(key) || 0) + 1);
        }
        
        // 找到出现次数最多的颜色
        let maxCount = 0;
        let mostCommonColor = [255, 255, 255]; // 默认白色
        
        for (const [colorKey, count] of colorMap.entries()) {
            if (count > maxCount) {
                maxCount = count;
                mostCommonColor = colorKey.split(',').map(Number);
            }
        }
        
        return mostCommonColor;
    }

    /**
     * 计算颜色相似度
     * @private
     */
    _colorSimilarity(color1, color2) {
        const rDiff = Math.abs(color1[0] - color2[0]);
        const gDiff = Math.abs(color1[1] - color2[1]);
        const bDiff = Math.abs(color1[2] - color2[2]);
        
        // 使用欧几里得距离计算相似度
        const distance = Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
        const maxDistance = Math.sqrt(255 * 255 * 3); // 最大可能距离
        
        return 1 - (distance / maxDistance);
    }

    /**
     * 移除图像背景
     * @param {HTMLImageElement|Blob|string} imageSource 图像源
     * @param {Object} config 配置选项
     * @returns {Promise<Blob>} 处理后的图像blob
     */
    async removeBackground(imageSource, config = {}) {
        if (!this.isLoaded) {
            await this.loadLibrary();
        }

        
        try {
            const blob = await this.imglyRemoveBackground(imageSource, config);
            return blob;
        } catch (error) {
            console.error('❌ 背景移除失败:', error);
            throw error;
        }
    }

    /**
     * 预加载模型文件（可选）
     */
    async preloadModel() {
        if (!this.isLoaded) {
            await this.loadLibrary();
        }
        
        // 创建一个小的测试图像来触发模型下载
        const testCanvas = document.createElement('canvas');
        testCanvas.width = 32;
        testCanvas.height = 32;
        const ctx = testCanvas.getContext('2d');
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(0, 0, 32, 32);
        
        testCanvas.toBlob(async (blob) => {
            try {
                await this.removeBackground(blob);
            } catch (error) {
                // 预加载失败是正常的，使用时再加载
            }
        });
    }

    /**
     * 检查库是否可用
     */
    isAvailable() {
        return this.isLoaded && this.imglyRemoveBackground !== null;
    }
}

// 创建全局实例
const globalBackgroundRemoval = new BackgroundRemovalLibrary();

// 导出类和全局实例
export { BackgroundRemovalLibrary, globalBackgroundRemoval };
export default BackgroundRemovalLibrary;