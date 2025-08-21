/**
 * 双人脸对齐功能 - 方案A实现
 * 用于将前景图人脸调整以匹配背景图人脸的朝向和轮廓
 * 为换脸节点提供完美的预处理
 * 
 * 🎯 方案A核心理念："所见即所得"
 * - 用户的操作全部都是基于他看到的进行的
 * - 面部检测基于画布上当前的视觉状态（包含用户的所有变换）
 * - 对齐计算基于用户当前看到的人脸位置和朝向
 * - 变换应用是增量式的，不会覆盖用户已做的调整
 * 
 * 📋 技术要点：
 * 1. _renderObjectCurrentState(): 将Fabric对象渲染到临时Canvas进行检测
 * 2. 基于视觉坐标系计算对齐参数
 * 3. 增量式应用变换，保持用户操作的连贯性
 * 4. 添加变换范围限制，避免极端效果
 */

import { globalFaceDetector } from './libs/mediapipe-face-detection.js';

class DualFaceAlignment {
    constructor() {
        this.detector = globalFaceDetector;
        this.referenceFace = null;  // 背景图中的参考人脸
        this.sourceFace = null;     // 前景图中要调整的人脸
        this.referenceImage = null; // 背景图对象
        this.sourceImage = null;    // 前景图对象
        this.alignmentData = null;  // 对齐计算数据
    }

    /**
     * 设置参考人脸（背景图中的目标脸）
     * @param {fabric.Image} imageObject 背景图对象
     * @param {number} faceIndex 人脸索引（如果有多个人脸）
     */
    async setReferenceFace(imageObject, faceIndex = 0) {
        try {
            console.log('🎯 设置参考人脸（基于当前视觉状态）...');
            
            this.referenceImage = imageObject;
            // 方案A：基于当前画布上的视觉状态进行检测
            const currentStateImage = await this._renderObjectCurrentState(imageObject);
            const faces = await this.detector.detectFaces(currentStateImage);
            
            if (faces.length === 0) {
                throw new Error('背景图中未检测到人脸');
            }
            
            if (faceIndex >= faces.length) {
                throw new Error(`背景图中只有${faces.length}个人脸，索引${faceIndex}无效`);
            }
            
            this.referenceFace = faces[faceIndex];
            console.log('✅ 参考人脸设置成功');
            
            return {
                success: true,
                faceCount: faces.length,
                selectedFace: faceIndex,
                confidence: this.referenceFace.confidence
            };
            
        } catch (error) {
            console.error('❌ 设置参考人脸失败:', error);
            throw error;
        }
    }

    /**
     * 设置源人脸（前景图中要调整的脸）- 方案A：基于当前视觉状态
     * @param {fabric.Image} imageObject 前景图对象
     * @param {number} faceIndex 人脸索引
     */
    async setSourceFace(imageObject, faceIndex = 0) {
        try {
            console.log('📷 设置源人脸（基于当前视觉状态）...');
            
            this.sourceImage = imageObject;
            // 方案A：基于当前画布上的视觉状态进行检测
            const currentStateImage = await this._renderObjectCurrentState(imageObject);
            const faces = await this.detector.detectFaces(currentStateImage);
            
            if (faces.length === 0) {
                throw new Error('前景图中未检测到人脸');
            }
            
            if (faceIndex >= faces.length) {
                throw new Error(`前景图中只有${faces.length}个人脸，索引${faceIndex}无效`);
            }
            
            this.sourceFace = faces[faceIndex];
            console.log('✅ 源人脸设置成功');
            
            return {
                success: true,
                faceCount: faces.length,
                selectedFace: faceIndex,
                confidence: this.sourceFace.confidence
            };
            
        } catch (error) {
            console.error('❌ 设置源人脸失败:', error);
            throw error;
        }
    }

    /**
     * 计算双人脸对齐参数 - 方案A：基于画布坐标系
     */
    calculateAlignment() {
        if (!this.referenceFace || !this.sourceFace) {
            throw new Error('请先设置参考人脸和源人脸');
        }

        console.log('🧮 计算对齐参数（方案A：画布坐标系）...');

        // 获取关键点
        const refKeypoints = this.referenceFace.keypoints;
        const srcKeypoints = this.sourceFace.keypoints;

        if (!refKeypoints || !srcKeypoints) {
            throw new Error('无法获取人脸关键点');
        }

        // 方案A：基于关键点的精确对齐（眼睛、鼻子、嘴巴匹配）
        console.log('🎯 使用关键点精确对齐算法...');
        
        // 获取画布坐标系中的关键点位置
        const refCanvasKeypoints = this._mapKeypointsToCanvas(refKeypoints, this.referenceImage);
        const srcCanvasKeypoints = this._mapKeypointsToCanvas(srcKeypoints, this.sourceImage);
        
        // 基于双眼中心点进行对齐（最重要的参考点）
        const refEyeCenter = this._calculateEyeCenter(refCanvasKeypoints);
        const srcEyeCenter = this._calculateEyeCenter(srcCanvasKeypoints);
        
        // 计算双眼连线的角度
        const refAngle = this._calculateEyeAngle(refKeypoints);
        const srcAngle = this._calculateEyeAngle(srcKeypoints);

        // 基于双眼距离计算精确缩放比例
        const refEyeDistance = this._calculateEyeDistance(refCanvasKeypoints);
        const srcEyeDistance = this._calculateEyeDistance(srcCanvasKeypoints);
        const eyeScaleRatio = refEyeDistance / srcEyeDistance;

        // 计算对齐变换
        this.alignmentData = {
            // 旋转：基于双眼连线角度
            rotation: refAngle - srcAngle,
            
            // 缩放：基于双眼距离比例（更精确）
            scaleX: eyeScaleRatio,
            scaleY: eyeScaleRatio,
            scale: eyeScaleRatio,
            
            // 位移：基于双眼中心对齐
            offsetX: refEyeCenter.x - srcEyeCenter.x,
            offsetY: refEyeCenter.y - srcEyeCenter.y,
            
            // 原始数据
            reference: {
                center: refEyeCenter,
                angle: refAngle,
                eyeDistance: refEyeDistance,
                keypoints: refCanvasKeypoints
            },
            source: {
                center: srcEyeCenter,
                angle: srcAngle,
                eyeDistance: srcEyeDistance,
                keypoints: srcCanvasKeypoints
            }
        };

        console.log('✅ 对齐参数计算完成:', this.alignmentData);
        return this.alignmentData;
    }

    /**
     * 执行人脸对齐 - 方案A：基于视觉增量调整
     * @param {Object} options 对齐选项
     */
    async performAlignment(options = {}) {
        if (!this.alignmentData) {
            this.calculateAlignment();
        }

        const {
            useRotation = true,
            useScale = true,
            usePosition = true,
            smoothness = 1.0  // 0-1，调整强度
        } = options;

        console.log('🔄 执行人脸对齐（方案A：基于视觉增量调整）...');

        try {
            // 获取当前前景图的变换属性
            const currentTransform = {
                left: this.sourceImage.left,
                top: this.sourceImage.top,
                scaleX: this.sourceImage.scaleX,
                scaleY: this.sourceImage.scaleY,
                angle: this.sourceImage.angle || 0
            };

            // 方案A：基于当前视觉状态的相对调整，而不是绝对变换
            const newTransform = { ...currentTransform };

            if (useRotation) {
                // 相对旋转调整（基于视觉角度差异）
                const visualRotationAdjustment = this.alignmentData.rotation * 180 / Math.PI * smoothness;
                newTransform.angle = currentTransform.angle + visualRotationAdjustment;
                console.log(`🔄 角度调整: ${currentTransform.angle.toFixed(2)}° + ${visualRotationAdjustment.toFixed(2)}° = ${newTransform.angle.toFixed(2)}°`);
            }

            if (useScale) {
                // 相对缩放调整（基于视觉大小比例）
                const scaleAdjustment = this.alignmentData.scale;
                // 限制缩放范围，避免极端变换
                const clampedScaleX = Math.max(0.1, Math.min(5.0, scaleAdjustment));
                const clampedScaleY = Math.max(0.1, Math.min(5.0, scaleAdjustment));
                
                newTransform.scaleX = currentTransform.scaleX * (1 + (clampedScaleX - 1) * smoothness);
                newTransform.scaleY = currentTransform.scaleY * (1 + (clampedScaleY - 1) * smoothness);
                console.log(`📏 缩放调整: X: ${currentTransform.scaleX.toFixed(2)} * ${clampedScaleX.toFixed(2)} = ${newTransform.scaleX.toFixed(2)}`);
            }

            if (usePosition) {
                // 方案A：直接移动到目标位置，而不是限制移动范围
                const offsetX = this.alignmentData.offsetX * smoothness;
                const offsetY = this.alignmentData.offsetY * smoothness;
                
                newTransform.left = currentTransform.left + offsetX;
                newTransform.top = currentTransform.top + offsetY;
                
                console.log(`📍 位置调整: 从 (${currentTransform.left.toFixed(1)}, ${currentTransform.top.toFixed(1)}) 移动 (${offsetX.toFixed(1)}, ${offsetY.toFixed(1)}) 到 (${newTransform.left.toFixed(1)}, ${newTransform.top.toFixed(1)})`);
            }

            // 应用变换
            this.sourceImage.set(newTransform);
            this.sourceImage.setCoords();

            console.log('✅ 人脸对齐完成（方案A）');
            console.log('📊 应用的变换:', {
                原始状态: currentTransform,
                新状态: newTransform,
                变化量: {
                    角度: newTransform.angle - currentTransform.angle,
                    缩放X: newTransform.scaleX / currentTransform.scaleX,
                    缩放Y: newTransform.scaleY / currentTransform.scaleY,
                    位置: [newTransform.left - currentTransform.left, newTransform.top - currentTransform.top]
                }
            });
            
            return {
                success: true,
                transform: newTransform,
                originalTransform: currentTransform,
                appliedChanges: {
                    angle: newTransform.angle - currentTransform.angle,
                    scale: { x: newTransform.scaleX / currentTransform.scaleX, y: newTransform.scaleY / currentTransform.scaleY },
                    position: { x: newTransform.left - currentTransform.left, y: newTransform.top - currentTransform.top }
                }
            };

        } catch (error) {
            console.error('❌ 人脸对齐失败:', error);
            throw error;
        }
    }

    /**
     * 获取人脸匹配度评分
     */
    getMatchingScore() {
        if (!this.alignmentData) {
            return null;
        }

        const { reference, source } = this.alignmentData;

        // 角度相似度 (0-1)
        const angleDiff = Math.abs(reference.angle - source.angle);
        const angleScore = Math.max(0, 1 - angleDiff / 90); // 90度差异为0分

        // 尺寸相似度 (0-1)
        const sizeRatio = Math.min(reference.size.area, source.size.area) / 
                         Math.max(reference.size.area, source.size.area);

        // 综合评分
        const overallScore = (angleScore * 0.6 + sizeRatio * 0.4);

        return {
            overall: Math.round(overallScore * 100),
            angle: Math.round(angleScore * 100),
            size: Math.round(sizeRatio * 100),
            recommendation: this._getRecommendation(overallScore)
        };
    }

    /**
     * 手动微调对齐
     * @param {Object} adjustments 微调参数
     */
    manualAdjust(adjustments = {}) {
        if (!this.sourceImage) {
            throw new Error('未设置源图像');
        }

        const {
            rotationDelta = 0,    // 旋转调整（度）
            scaleDelta = 0,       // 缩放调整（倍数）
            offsetXDelta = 0,     // X位移调整（像素）
            offsetYDelta = 0      // Y位移调整（像素）
        } = adjustments;

        // 应用微调
        this.sourceImage.set({
            angle: (this.sourceImage.angle || 0) + rotationDelta,
            scaleX: this.sourceImage.scaleX * (1 + scaleDelta),
            scaleY: this.sourceImage.scaleY * (1 + scaleDelta),
            left: this.sourceImage.left + offsetXDelta,
            top: this.sourceImage.top + offsetYDelta
        });

        this.sourceImage.setCoords();

        return {
            success: true,
            appliedAdjustments: adjustments
        };
    }

    /**
     * 重置对齐
     */
    resetAlignment() {
        this.referenceFace = null;
        this.sourceFace = null;
        this.alignmentData = null;
        console.log('🔄 对齐数据已重置');
    }

    // ==================== 私有方法 ====================

    /**
     * 渲染Fabric对象的当前状态到临时Canvas（方案A核心方法）
     * @param {fabric.Image} imageObject Fabric图像对象
     * @returns {Promise<HTMLCanvasElement>} 渲染后的canvas元素
     * @private
     */
    async _renderObjectCurrentState(imageObject) {
        // 创建临时canvas，尺寸基于对象当前的变换状态
        const bounds = imageObject.getBoundingRect();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // 设置canvas尺寸为对象当前边界
        canvas.width = Math.ceil(bounds.width);
        canvas.height = Math.ceil(bounds.height);
        
        // 保存当前变换
        ctx.save();
        
        // 移动到对象中心
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        ctx.translate(centerX, centerY);
        
        // 应用对象的变换
        ctx.rotate(imageObject.angle * Math.PI / 180);
        ctx.scale(imageObject.scaleX, imageObject.scaleY);
        
        // 获取原始图像
        const originalImage = imageObject.getElement();
        const imgWidth = originalImage.naturalWidth || originalImage.width;
        const imgHeight = originalImage.naturalHeight || originalImage.height;
        
        // 绘制图像（以中心为原点）
        ctx.drawImage(originalImage, -imgWidth/2, -imgHeight/2, imgWidth, imgHeight);
        
        ctx.restore();
        
        console.log(`✅ 渲染对象当前状态: ${canvas.width}x${canvas.height}, 角度: ${imageObject.angle}°, 缩放: ${imageObject.scaleX.toFixed(2)}x${imageObject.scaleY.toFixed(2)}`);
        return canvas;
    }

    /**
     * 将检测到的关键点映射到画布坐标系
     * @param {Object} keypoints 检测到的关键点（基于渲染图像）
     * @param {fabric.Image} imageObject 对应的Fabric对象
     * @returns {Object} 画布坐标系中的关键点
     * @private
     */
    _mapKeypointsToCanvas(keypoints, imageObject) {
        const bounds = imageObject.getBoundingRect();
        const canvasKeypoints = {};
        
        // 将每个关键点从检测坐标直接映射到画布坐标
        for (const [name, point] of Object.entries(keypoints)) {
            if (point && point.x !== undefined && point.y !== undefined) {
                // 关键点已经是基于渲染后图像的坐标，直接映射到画布边界内
                canvasKeypoints[name] = {
                    x: bounds.left + point.x,
                    y: bounds.top + point.y
                };
            }
        }
        
        console.log('📍 关键点映射完成:', Object.keys(canvasKeypoints));
        return canvasKeypoints;
    }

    /**
     * 计算双眼中心点
     * @param {Object} keypoints 画布坐标系中的关键点
     * @returns {Object} {x, y} 双眼中心坐标
     * @private
     */
    _calculateEyeCenter(keypoints) {
        if (!keypoints.leftEye || !keypoints.rightEye) {
            throw new Error('缺少眼部关键点');
        }
        
        const centerX = (keypoints.leftEye.x + keypoints.rightEye.x) / 2;
        const centerY = (keypoints.leftEye.y + keypoints.rightEye.y) / 2;
        
        return { x: centerX, y: centerY };
    }

    /**
     * 计算双眼距离
     * @param {Object} keypoints 画布坐标系中的关键点
     * @returns {number} 双眼之间的距离（像素）
     * @private
     */
    _calculateEyeDistance(keypoints) {
        if (!keypoints.leftEye || !keypoints.rightEye) {
            throw new Error('缺少眼部关键点');
        }
        
        const dx = keypoints.rightEye.x - keypoints.leftEye.x;
        const dy = keypoints.rightEye.y - keypoints.leftEye.y;
        
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * 获取Fabric对象在画布中的中心坐标（方案A关键方法）
     * @param {fabric.Image} imageObject Fabric图像对象
     * @returns {Object} {x, y} 画布坐标系中的中心点
     * @private
     */
    _getObjectCanvasCenter(imageObject) {
        // 使用Fabric.js的内置方法获取精确的中心坐标（考虑所有变换）
        const center = imageObject.getCenterPoint();
        
        console.log(`📍 对象画布中心: (${center.x.toFixed(1)}, ${center.y.toFixed(1)})`);
        
        return {
            x: center.x,
            y: center.y
        };
    }

    /**
     * 获取图像URL
     * @private
     */
    _getImageUrl(imageObject) {
        return imageObject.getSrc ? imageObject.getSrc() : imageObject._element.src;
    }

    /**
     * 加载图像元素
     * @private
     */
    async _loadImageElement(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = url;
        });
    }

    /**
     * 计算人脸中心点
     * @private
     */
    _calculateFaceCenter(bbox) {
        return {
            x: bbox.x + bbox.width / 2,
            y: bbox.y + bbox.height / 2
        };
    }

    /**
     * 计算双眼角度
     * @private
     */
    _calculateEyeAngle(keypoints) {
        const leftEye = keypoints.leftEye;
        const rightEye = keypoints.rightEye;
        
        if (!leftEye || !rightEye) {
            return 0;
        }

        const dx = rightEye.x - leftEye.x;
        const dy = rightEye.y - leftEye.y;
        
        // 统一使用弧度值，避免双重转换
        return Math.atan2(dy, dx);
    }

    /**
     * 计算人脸尺寸
     * @private
     */
    _calculateFaceSize(bbox) {
        return {
            width: bbox.width,
            height: bbox.height,
            area: bbox.width * bbox.height
        };
    }

    /**
     * 获取匹配建议
     * @private
     */
    _getRecommendation(score) {
        if (score > 0.8) return '匹配度优秀，建议直接使用';
        if (score > 0.6) return '匹配度良好，可进行微调';
        if (score > 0.4) return '匹配度一般，建议手动调整';
        return '匹配度较低，建议选择相似角度的照片';
    }
}

// 预设对齐配置
export const AlignmentPresets = {
    // 精确对齐：完全匹配参考脸
    precise: {
        useRotation: true,
        useScale: true,
        usePosition: true,
        smoothness: 1.0
    },
    
    // 保守对齐：保持部分原始特征
    conservative: {
        useRotation: true,
        useScale: true,
        usePosition: false,
        smoothness: 0.7
    },
    
    // 仅角度对齐：只调整朝向
    angleOnly: {
        useRotation: true,
        useScale: false,
        usePosition: false,
        smoothness: 1.0
    },
    
    // 尺寸对齐：只调整大小
    sizeOnly: {
        useRotation: false,
        useScale: true,
        usePosition: false,
        smoothness: 1.0
    }
};

export default DualFaceAlignment;