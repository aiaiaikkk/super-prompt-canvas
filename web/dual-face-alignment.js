/**
 * 双人脸对齐功能 - 超简化版实现
 * 用于将前景图人脸调整以匹配背景图人脸的眼部位置
 * 为换脸节点提供基础的预处理
 * 
 * 🎯 超简化核心理念："眼部中心对齐"
 * - 只对齐双眼中心位置，不做旋转和缩放
 * - 面部检测基于画布上当前的视觉状态
 * - 计算简单的位移偏移量
 * - 直接应用位置偏移，保持其他变换不变
 * 
 * 📋 技术要点：
 * 1. _renderObjectCurrentState(): 将Fabric对象渲染到临时Canvas进行检测
 * 2. 计算双眼中心的直接偏移量
 * 3. 只调整图像位置，不改变角度、缩放等
 * 4. 简单直观，减少复杂变换带来的问题
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
        
        // 修复重复执行问题：保存源图像的初始状态
        this.sourceImageInitialState = null;  // 源图像初始变换状态
        this.isFirstAlignment = true;         // 是否首次对齐
    }

    /**
     * 设置参考人脸（背景图中的目标脸）
     * @param {fabric.Image} imageObject 背景图对象
     * @param {number} faceIndex 人脸索引（如果有多个人脸）
     */
    async setReferenceFace(imageObject, faceIndex = 0) {
        try {
            
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
            
            this.sourceImage = imageObject;
            
            // 修复重复执行问题：保存源图像的初始状态
            if (!this.sourceImageInitialState) {
                this.sourceImageInitialState = {
                    left: imageObject.left,
                    top: imageObject.top,
                    scaleX: imageObject.scaleX,
                    scaleY: imageObject.scaleY,
                    angle: imageObject.angle || 0,
                    flipX: imageObject.flipX || false,
                    flipY: imageObject.flipY || false
                };
            }
            
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
     * 计算双人脸对齐参数 - 改进版：基于眼部优先的对齐策略
     */
    calculateAlignment() {
        if (!this.referenceFace || !this.sourceFace) {
            throw new Error('请先设置参考人脸和源人脸');
        }

        // 获取关键点
        const refKeypoints = this.referenceFace.keypoints;
        const srcKeypoints = this.sourceFace.keypoints;

        if (!refKeypoints || !srcKeypoints) {
            throw new Error('无法获取人脸关键点');
        }
        
        // 检查必要关键点是否存在
        if (!refKeypoints.leftEye || !refKeypoints.rightEye || !srcKeypoints.leftEye || !srcKeypoints.rightEye) {
            throw new Error('缺少必要的双眼关键点');
        }

        // 获取画布坐标系中的关键点位置
        const refCanvasKeypoints = this._mapKeypointsToCanvas(refKeypoints, this.referenceImage);
        const srcCanvasKeypoints = this._mapKeypointsToCanvas(srcKeypoints, this.sourceImage);
        
        // 使用新的眼部优先对齐策略
        const alignmentResult = this._calculateEyesFirstAlignment(refCanvasKeypoints, srcCanvasKeypoints);
        
        // 保存对齐数据
        this.alignmentData = {
            // 完整变换参数
            rotation: alignmentResult.rotation,
            scale: alignmentResult.scale,
            offsetX: alignmentResult.offsetX,
            offsetY: alignmentResult.offsetY,
            
            // 特征点数据
            reference: {
                keypoints: refCanvasKeypoints,
                eyeCenter: alignmentResult.refEyeCenter,
                eyeAngle: alignmentResult.refEyeAngle,
                eyeDistance: alignmentResult.refEyeDistance
            },
            source: {
                keypoints: srcCanvasKeypoints,
                eyeCenter: alignmentResult.srcEyeCenter,
                eyeAngle: alignmentResult.srcEyeAngle,
                eyeDistance: alignmentResult.srcEyeDistance
            },
            
            // 变换中心点（源脸眼部中心）
            transformCenter: alignmentResult.srcEyeCenter,
            
            // 调试信息
            debug: alignmentResult.debug
        };

        
        return this.alignmentData;
    }

    /**
     * 执行人脸对齐 - 修复版：正确处理变换中心和平移
     * @param {Object} options 对齐选项
     */
    async performAlignment(options = {}) {
        // 修复重复执行问题：非首次对齐时先恢复初始状态
        if (!this.isFirstAlignment && this.sourceImageInitialState) {
            this.sourceImage.set(this.sourceImageInitialState);
            this.sourceImage.setCoords();
            
            // 重新检测人脸（基于恢复后的状态）
            const currentStateImage = await this._renderObjectCurrentState(this.sourceImage);
            const faces = await this.detector.detectFaces(currentStateImage);
            if (faces.length > 0) {
                this.sourceFace = faces[0];
            }
        }
        
        if (!this.alignmentData) {
            this.calculateAlignment();
        }

        try {
            const { rotation, scale, offsetX, offsetY } = this.alignmentData;
            const refEyeCenter = this.alignmentData.reference.eyeCenter;
            const srcEyeCenter = this.alignmentData.source.eyeCenter;
            
            
            // 获取当前图像状态
            const currentAngle = this.sourceImage.angle || 0;
            const currentScaleX = this.sourceImage.scaleX || 1;
            const currentScaleY = this.sourceImage.scaleY || 1;
            
            
            // 新方法：分两步应用变换
            // 步骤1：先应用旋转和缩放，但保持眼部中心位置不变
            const newAngle = currentAngle + rotation;
            const newScaleX = currentScaleX * scale;
            const newScaleY = currentScaleY * scale;
            
            
            // 应用旋转和缩放
            this.sourceImage.set({
                angle: newAngle,
                scaleX: newScaleX,
                scaleY: newScaleY
            });
            this.sourceImage.setCoords();
            
            // 步骤2：重新检测眼部位置，然后调整位置
            
            // 重新渲染和检测
            const newStateImage = await this._renderObjectCurrentState(this.sourceImage);
            const newFaces = await this.detector.detectFaces(newStateImage);
            
            if (newFaces.length > 0) {
                const newKeypoints = this._mapKeypointsToCanvas(newFaces[0].keypoints, this.sourceImage);
                const newEyeCenter = this._calculateEyeCenter(newKeypoints);
                
                // 计算需要的位置调整
                const positionAdjustX = refEyeCenter.x - newEyeCenter.x;
                const positionAdjustY = refEyeCenter.y - newEyeCenter.y;
                
                // 应用位置调整
                const finalLeft = this.sourceImage.left + positionAdjustX;
                const finalTop = this.sourceImage.top + positionAdjustY;
                
                this.sourceImage.set({
                    left: finalLeft,
                    top: finalTop
                });
                this.sourceImage.setCoords();
            } else {
                console.warn('变换后无法检测到人脸，使用计算的偏移量');
                // 如果检测失败，使用原来的偏移量
                this.sourceImage.set({
                    left: this.sourceImage.left + offsetX,
                    top: this.sourceImage.top + offsetY
                });
                this.sourceImage.setCoords();
            }
            
            
            // 标记已完成首次对齐
            this.isFirstAlignment = false;
            
            return {
                success: true,
                appliedTransform: {
                    rotation: rotation,
                    scale: scale,
                    offsetX: offsetX,
                    offsetY: offsetY
                },
                newTransform: {
                    angle: this.sourceImage.angle,
                    scaleX: this.sourceImage.scaleX,
                    scaleY: this.sourceImage.scaleY,
                    left: this.sourceImage.left,
                    top: this.sourceImage.top
                }
            };

        } catch (error) {
            console.error('❌ 完整面部对齐失败:', error);
            throw error;
        }
    }

    /**
     * 获取人脸匹配度评分（简化版）
     */
    getMatchingScore() {
        if (!this.alignmentData) {
            return null;
        }

        const { reference, source } = this.alignmentData;

        // 计算双眼距离（简化版匹配度）
        const refEyeDistance = this._calculateEyeDistance(reference.keypoints);
        const srcEyeDistance = this._calculateEyeDistance(source.keypoints);
        
        // 双眼距离相似度 (0-1)
        const eyeDistanceRatio = Math.min(refEyeDistance, srcEyeDistance) / 
                                Math.max(refEyeDistance, srcEyeDistance);

        // 位置偏移评分（偏移越小评分越高）
        const offsetDistance = Math.sqrt(this.alignmentData.offsetX * this.alignmentData.offsetX + 
                                        this.alignmentData.offsetY * this.alignmentData.offsetY);
        const positionScore = Math.max(0, 1 - offsetDistance / 200); // 200像素偏移为0分

        // 综合评分（简化版：主要看双眼距离匹配度）
        const overallScore = eyeDistanceRatio * 0.8 + positionScore * 0.2;

        return {
            overall: Math.round(overallScore * 100),
            eyeDistance: Math.round(eyeDistanceRatio * 100),
            position: Math.round(positionScore * 100),
            offsetDistance: Math.round(offsetDistance),
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
        this.referenceImage = null;
        this.sourceImage = null;
        this.alignmentData = null;
        
        // 重置首次对齐标记和初始状态
        this.sourceImageInitialState = null;
        this.isFirstAlignment = true;
        
    }

    /**
     * 重置对齐（别名方法，保持API兼容性）
     */
    reset() {
        this.resetAlignment();
    }

    // ==================== 私有方法 ====================

    /**
     * 渲染Fabric对象的当前状态到临时Canvas（修复版本）
     * @param {fabric.Image} imageObject Fabric图像对象
     * @returns {Promise<HTMLCanvasElement>} 渲染后的canvas元素
     * @private
     */
    async _renderObjectCurrentState(imageObject) {
        // 获取对象的边界框，但确保尺寸合理
        const bounds = imageObject.getBoundingRect();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // 确保canvas尺寸至少为1像素，避免零尺寸canvas
        canvas.width = Math.max(1, Math.ceil(bounds.width));
        canvas.height = Math.max(1, Math.ceil(bounds.height));
        
        // 获取原始图像
        const originalImage = imageObject.getElement();
        if (!originalImage) {
            console.error('无法获取图像元素');
            return canvas;
        }
        
        const imgWidth = originalImage.naturalWidth || originalImage.width || 1;
        const imgHeight = originalImage.naturalHeight || originalImage.height || 1;
        
        // 保存当前变换
        ctx.save();
        
        // 清除画布，确保背景透明
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 计算图像在边界框中的实际位置
        const objectCenter = imageObject.getCenterPoint();
        const canvasCenter = {
            x: canvas.width / 2,
            y: canvas.height / 2
        };
        
        // 移动到画布中心
        ctx.translate(canvasCenter.x, canvasCenter.y);
        
        // 应用对象的变换（角度转弧度）
        const angleRad = (imageObject.angle || 0) * Math.PI / 180;
        ctx.rotate(angleRad);
        
        // 应用缩放
        const scaleX = imageObject.scaleX || 1;
        const scaleY = imageObject.scaleY || 1;
        ctx.scale(scaleX, scaleY);
        
        // 应用翻转
        if (imageObject.flipX) ctx.scale(-1, 1);
        if (imageObject.flipY) ctx.scale(1, -1);
        
        // 绘制图像（以变换中心为原点）
        const drawWidth = imgWidth;
        const drawHeight = imgHeight;
        
        try {
            ctx.drawImage(
                originalImage, 
                -drawWidth / 2, 
                -drawHeight / 2, 
                drawWidth, 
                drawHeight
            );
        } catch (error) {
            console.error('绘制图像失败:', error);
        }
        
        ctx.restore();
        
        return canvas;
    }

    /**
     * 将检测到的关键点映射到画布坐标系（重新设计版本）
     * @param {Object} keypoints 检测到的关键点（基于渲染图像的像素坐标）
     * @param {fabric.Image} imageObject 对应的Fabric对象
     * @returns {Object} 画布坐标系中的关键点
     * @private
     */
    _mapKeypointsToCanvas(keypoints, imageObject) {
        const canvasKeypoints = {};
        
        // 获取原始图像尺寸
        const originalImage = imageObject.getElement();
        const imgWidth = originalImage.naturalWidth || originalImage.width || 1;
        const imgHeight = originalImage.naturalHeight || originalImage.height || 1;
        
        for (const [name, point] of Object.entries(keypoints)) {
            if (point && point.x !== undefined && point.y !== undefined) {
                // 步骤1: 将渲染图像坐标转换为相对于图像中心的坐标
                // 渲染图像的尺寸等于边界框尺寸
                const bounds = imageObject.getBoundingRect();
                const renderCenterX = bounds.width / 2;
                const renderCenterY = bounds.height / 2;
                
                // 相对于渲染图像中心的坐标
                const relativeX = point.x - renderCenterX;
                const relativeY = point.y - renderCenterY;
                
                
                // 步骤2: 将相对坐标缩放回原始图像比例
                // 渲染图像是原始图像经过对象缩放后的结果
                const originalRelativeX = relativeX / (imageObject.scaleX || 1);
                const originalRelativeY = relativeY / (imageObject.scaleY || 1);
                
                // 步骤3: 应用对象的旋转（逆变换）
                const angleRad = -(imageObject.angle || 0) * Math.PI / 180;
                const cosAngle = Math.cos(angleRad);
                const sinAngle = Math.sin(angleRad);
                
                const unrotatedX = originalRelativeX * cosAngle - originalRelativeY * sinAngle;
                const unrotatedY = originalRelativeX * sinAngle + originalRelativeY * cosAngle;
                
                // 步骤4: 转换为画布坐标（加上对象中心位置）
                const objectCenter = imageObject.getCenterPoint();
                
                canvasKeypoints[name] = {
                    x: objectCenter.x + unrotatedX * (imageObject.scaleX || 1),
                    y: objectCenter.y + unrotatedY * (imageObject.scaleY || 1)
                };
                
            }
        }
        
        return canvasKeypoints;
    }

    /**
     * 提取关键对齐点（双眼、鼻子、嘴巴）
     * @param {Object} keypoints 画布坐标系中的关键点
     * @returns {Array} 关键对齐点数组
     * @private
     */
    _extractAlignmentPoints(keypoints) {
        const alignPoints = [];
        
        
        // 添加双眼（最重要的对齐点）
        if (keypoints.leftEye && keypoints.rightEye) {
            alignPoints.push(keypoints.leftEye);
            alignPoints.push(keypoints.rightEye);
        }
        
        // 添加鼻子（MediaPipe中是nose，不是noseTip）
        if (keypoints.nose) {
            alignPoints.push(keypoints.nose);
        }
        
        // 添加嘴巴（MediaPipe中mouth已经是单个点）
        if (keypoints.mouth) {
            alignPoints.push(keypoints.mouth);
        }
        
        
        if (alignPoints.length < 2) {
            throw new Error('关键点数量不足，无法进行对齐');
        }
        
        return alignPoints;
    }

    /**
     * 计算嘴巴中心点
     * @param {Object} keypoints 关键点对象
     * @returns {Object} {x, y} 嘴巴中心点
     * @private
     */
    _calculateMouthCenter(keypoints) {
        if (keypoints.mouth && keypoints.mouth.length > 0) {
            let sumX = 0, sumY = 0;
            keypoints.mouth.forEach(point => {
                sumX += point.x;
                sumY += point.y;
            });
            return {
                x: sumX / keypoints.mouth.length,
                y: sumY / keypoints.mouth.length
            };
        }
        // 如果没有mouth数组，尝试使用其他嘴部关键点
        if (keypoints.lips) {
            return keypoints.lips;
        }
        return null;
    }

    /**
     * 执行Procrustes分析
     * @param {Array} sourcePoints 源点集
     * @param {Array} targetPoints 目标点集
     * @returns {Object} Procrustes分析结果
     * @private
     */
    _performProcrustesAnalysis(sourcePoints, targetPoints) {
        if (sourcePoints.length !== targetPoints.length || sourcePoints.length < 2) {
            throw new Error('点集数量不匹配或点数不足');
        }

        // 计算质心
        const sourceCentroid = this._calculateCentroid(sourcePoints);
        const targetCentroid = this._calculateCentroid(targetPoints);

        // 中心化点集
        const centeredSource = sourcePoints.map(p => ({
            x: p.x - sourceCentroid.x,
            y: p.y - sourceCentroid.y
        }));
        
        const centeredTarget = targetPoints.map(p => ({
            x: p.x - targetCentroid.x,
            y: p.y - targetCentroid.y
        }));

        // 计算缩放因子
        const sourceScale = this._calculateScale(centeredSource);
        const targetScale = this._calculateScale(centeredTarget);
        const scale = targetScale / sourceScale;

        // 应用缩放到源点集
        const scaledSource = centeredSource.map(p => ({
            x: p.x * scale,
            y: p.y * scale
        }));

        // 计算旋转角度
        const rotation = this._calculateOptimalRotation(scaledSource, centeredTarget);

        return {
            sourceCentroid,
            targetCentroid,
            scale,
            rotation,
            centeredSource,
            centeredTarget,
            scaledSource
        };
    }

    /**
     * 计算点集质心
     * @param {Array} points 点集
     * @returns {Object} {x, y} 质心坐标
     * @private
     */
    _calculateCentroid(points) {
        const sum = points.reduce((acc, p) => ({
            x: acc.x + p.x,
            y: acc.y + p.y
        }), { x: 0, y: 0 });
        
        return {
            x: sum.x / points.length,
            y: sum.y / points.length
        };
    }

    /**
     * 计算点集的尺度
     * @param {Array} points 中心化后的点集
     * @returns {number} 尺度值
     * @private
     */
    _calculateScale(points) {
        const sumSquares = points.reduce((sum, p) => 
            sum + p.x * p.x + p.y * p.y, 0);
        return Math.sqrt(sumSquares / points.length);
    }

    /**
     * 计算最优旋转角度
     * @param {Array} sourcePoints 源点集（已缩放和中心化）
     * @param {Array} targetPoints 目标点集（已中心化）
     * @returns {number} 旋转角度（弧度）
     * @private
     */
    _calculateOptimalRotation(sourcePoints, targetPoints) {
        let numerator = 0;
        let denominator = 0;

        for (let i = 0; i < sourcePoints.length; i++) {
            const src = sourcePoints[i];
            const tgt = targetPoints[i];
            
            numerator += src.x * tgt.y - src.y * tgt.x;
            denominator += src.x * tgt.x + src.y * tgt.y;
        }

        return Math.atan2(numerator, denominator);
    }

    /**
     * 计算变换矩阵
     * @param {Object} procrustesResult Procrustes分析结果
     * @returns {Object} 变换参数
     * @private
     */
    _calculateTransformMatrix(procrustesResult) {
        const { sourceCentroid, targetCentroid, scale, rotation } = procrustesResult;
        
        return {
            scale: scale,
            rotation: rotation,
            translationX: targetCentroid.x - sourceCentroid.x,
            translationY: targetCentroid.y - sourceCentroid.y
        };
    }

    /**
     * 多点对齐分析 - 分析眼部、鼻子、嘴巴的相对位置偏差
     * @param {Object} refKeypoints 参考人脸关键点
     * @param {Object} srcKeypoints 源人脸关键点
     * @returns {Object} 多点分析结果
     * @private
     */
    _analyzeMultiPointAlignment(refKeypoints, srcKeypoints) {
        // 计算各关键点的相对偏差
        const analysis = {
            eyeDeviation: this._calculatePointDeviation(refKeypoints.leftEye, refKeypoints.rightEye, srcKeypoints.leftEye, srcKeypoints.rightEye),
            noseDeviation: null,
            mouthDeviation: null,
            offsetAdjustmentX: 0,
            offsetAdjustmentY: 0
        };

        // 鼻子偏差分析
        if (refKeypoints.nose && srcKeypoints.nose) {
            const refEyeCenter = this._calculateEyeCenter(refKeypoints);
            const srcEyeCenter = this._calculateEyeCenter(srcKeypoints);
            
            analysis.noseDeviation = {
                ref: {
                    x: refKeypoints.nose.x - refEyeCenter.x,
                    y: refKeypoints.nose.y - refEyeCenter.y
                },
                src: {
                    x: srcKeypoints.nose.x - srcEyeCenter.x,
                    y: srcKeypoints.nose.y - srcEyeCenter.y
                }
            };
            
            // 鼻子位置微调
            const noseDiffX = analysis.noseDeviation.ref.x - analysis.noseDeviation.src.x;
            const noseDiffY = analysis.noseDeviation.ref.y - analysis.noseDeviation.src.y;
            
            analysis.offsetAdjustmentX += noseDiffX * 0.3; // 30%权重
            analysis.offsetAdjustmentY += noseDiffY * 0.3;
        }

        // 嘴巴偏差分析
        if (refKeypoints.mouth && srcKeypoints.mouth) {
            const refEyeCenter = this._calculateEyeCenter(refKeypoints);
            const srcEyeCenter = this._calculateEyeCenter(srcKeypoints);
            
            analysis.mouthDeviation = {
                ref: {
                    x: refKeypoints.mouth.x - refEyeCenter.x,
                    y: refKeypoints.mouth.y - refEyeCenter.y
                },
                src: {
                    x: srcKeypoints.mouth.x - srcEyeCenter.x,
                    y: srcKeypoints.mouth.y - srcEyeCenter.y
                }
            };
            
            // 嘴巴位置微调
            const mouthDiffX = analysis.mouthDeviation.ref.x - analysis.mouthDeviation.src.x;
            const mouthDiffY = analysis.mouthDeviation.ref.y - analysis.mouthDeviation.src.y;
            
            analysis.offsetAdjustmentX += mouthDiffX * 0.2; // 20%权重
            analysis.offsetAdjustmentY += mouthDiffY * 0.2;
        }

        
        return analysis;
    }

    /**
     * 计算点对之间的偏差
     * @param {Object} refP1 参考点1
     * @param {Object} refP2 参考点2
     * @param {Object} srcP1 源点1
     * @param {Object} srcP2 源点2
     * @returns {Object} 偏差信息
     * @private
     */
    _calculatePointDeviation(refP1, refP2, srcP1, srcP2) {
        const refDistance = Math.sqrt(Math.pow(refP2.x - refP1.x, 2) + Math.pow(refP2.y - refP1.y, 2));
        const srcDistance = Math.sqrt(Math.pow(srcP2.x - srcP1.x, 2) + Math.pow(srcP2.y - srcP1.y, 2));
        
        return {
            distanceRatio: refDistance / srcDistance,
            angleDiff: Math.atan2(refP2.y - refP1.y, refP2.x - refP1.x) - Math.atan2(srcP2.y - srcP1.y, srcP2.x - srcP1.x)
        };
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
    
    /**
     * 计算面部特征点（新增方法）
     * @param {Object} keypoints 面部关键点
     * @returns {Object} 面部特征数据
     * @private
     */
    _calculateFaceFeatures(keypoints) {
        // 计算眼部中心和角度
        const eyeCenter = this._calculateEyeCenter(keypoints);
        const eyeAngle = this._calculateEyeAngle(keypoints);
        const eyeDistance = this._calculateEyeDistance(keypoints);
        
        // 计算面部中心（综合多个特征点）
        const center = this._calculateEnhancedFaceCenter(keypoints);
        
        // 计算面部尺寸（使用关键点而不是边界框）
        const faceSize = this._calculateFaceSizeFromKeypoints(keypoints);
        
        return {
            center: center,
            eyeCenter: eyeCenter,
            eyeAngle: eyeAngle,
            eyeDistance: eyeDistance,
            faceSize: faceSize,
            nose: keypoints.nose || null,
            mouth: keypoints.mouth || null
        };
    }
    
    /**
     * 计算眼部角度
     * @param {Object} keypoints 关键点
     * @returns {number} 角度（度）
     * @private
     */
    _calculateEyeAngle(keypoints) {
        if (!keypoints.leftEye || !keypoints.rightEye) {
            return 0;
        }
        
        const deltaX = keypoints.rightEye.x - keypoints.leftEye.x;
        const deltaY = keypoints.rightEye.y - keypoints.leftEye.y;
        
        return Math.atan2(deltaY, deltaX) * 180 / Math.PI;
    }
    
    /**
     * 计算面部中心（增强版，更精确的几何中心）
     * @param {Object} keypoints 关键点
     * @returns {Object} {x, y} 面部中心
     * @private
     */
    _calculateEnhancedFaceCenter(keypoints) {
        // 优先使用眼部中心作为基准
        const eyeCenter = this._calculateEyeCenter(keypoints);
        
        if (!keypoints.nose && !keypoints.mouth) {
            return eyeCenter;
        }
        
        // 如果有鼻子和嘴巴，计算更精确的面部几何中心
        let facePoints = [eyeCenter];
        let weights = [0.4]; // 眼部中心40%权重
        
        if (keypoints.nose) {
            facePoints.push(keypoints.nose);
            weights.push(0.35); // 鼻子35%权重
        }
        
        if (keypoints.mouth) {
            facePoints.push(keypoints.mouth);
            weights.push(0.25); // 嘴巴25%权重
        }
        
        // 归一化权重
        const totalWeight = weights.reduce((sum, w) => sum + w, 0);
        const normalizedWeights = weights.map(w => w / totalWeight);
        
        // 计算加权中心
        let totalX = 0, totalY = 0;
        
        for (let i = 0; i < facePoints.length; i++) {
            totalX += facePoints[i].x * normalizedWeights[i];
            totalY += facePoints[i].y * normalizedWeights[i];
        }
        
        return { x: totalX, y: totalY };
    }
    
    /**
     * 计算面部尺寸（增强版，更科学的尺寸度量）
     * @param {Object} keypoints 关键点
     * @returns {number} 面部特征尺寸
     * @private
     */
    _calculateFaceSizeFromKeypoints(keypoints) {
        const eyeDistance = this._calculateEyeDistance(keypoints);
        
        // 如果只有眼部信息，使用眼距作为基准
        if (!keypoints.nose && !keypoints.mouth) {
            return eyeDistance * 2.5; // 经验比例
        }
        
        const measurements = [];
        
        // 1. 基于眼距的面部宽度估算
        if (eyeDistance > 0) {
            measurements.push(eyeDistance * 2.5);
        }
        
        // 2. 如果有鼻子，计算眼-鼻的垂直距离
        if (keypoints.nose) {
            const eyeCenter = this._calculateEyeCenter(keypoints);
            const eyeNoseDistance = this._calculateDistance(eyeCenter, keypoints.nose);
            measurements.push(eyeNoseDistance * 4); // 垂直尺寸转换为面部尺寸
        }
        
        // 3. 如果有嘴巴，计算眼-嘴的垂直距离
        if (keypoints.mouth) {
            const eyeCenter = this._calculateEyeCenter(keypoints);
            const eyeMouthDistance = this._calculateDistance(eyeCenter, keypoints.mouth);
            measurements.push(eyeMouthDistance * 2.5); // 垂直尺寸转换
        }
        
        // 4. 如果有鼻子和嘴巴，计算鼻-嘴距离
        if (keypoints.nose && keypoints.mouth) {
            const noseMouthDistance = this._calculateDistance(keypoints.nose, keypoints.mouth);
            measurements.push(noseMouthDistance * 5); // 下半脸转换为整脸
        }
        
        if (measurements.length === 0) {
            return eyeDistance * 2;
        }
        
        // 使用中位数作为最终尺寸，避免异常值影响
        measurements.sort((a, b) => a - b);
        const mid = Math.floor(measurements.length / 2);
        
        if (measurements.length % 2 === 0) {
            return (measurements[mid - 1] + measurements[mid]) / 2;
        } else {
            return measurements[mid];
        }
    }
    
    /**
     * 计算最优缩放比例
     * @param {Object} refFeatures 参考面部特征
     * @param {Object} srcFeatures 源面部特征
     * @returns {number} 缩放比例
     * @private
     */
    _calculateOptimalScale(refFeatures, srcFeatures) {
        const weights = {
            eyeDistance: 0.6,
            faceSize: 0.4
        };
        
        let totalScale = 0;
        let totalWeight = 0;
        
        // 基于眼部距离的缩放
        if (refFeatures.eyeDistance > 0 && srcFeatures.eyeDistance > 0) {
            const eyeScale = refFeatures.eyeDistance / srcFeatures.eyeDistance;
            totalScale += eyeScale * weights.eyeDistance;
            totalWeight += weights.eyeDistance;
        }
        
        // 基于面部整体尺寸的缩放
        if (refFeatures.faceSize > 0 && srcFeatures.faceSize > 0) {
            const faceScale = refFeatures.faceSize / srcFeatures.faceSize;
            totalScale += faceScale * weights.faceSize;
            totalWeight += weights.faceSize;
        }
        
        if (totalWeight === 0) {
            return 1.0; // 默认不缩放
        }
        
        const finalScale = totalScale / totalWeight;
        
        // 限制缩放范围，避免过度缩放
        return Math.max(0.5, Math.min(2.0, finalScale));
    }
    
    /**
     * 计算最终位置偏移
     * @param {Object} refFeatures 参考面部特征
     * @param {Object} srcFeatures 源面部特征
     * @param {number} rotation 旋转角度
     * @param {number} scale 缩放比例
     * @returns {Object} {offsetX, offsetY} 位置偏移
     * @private
     */
    _calculateFinalOffset(refFeatures, srcFeatures, rotation, scale) {
        // 主要基于眼部中心对齐
        let targetX = refFeatures.eyeCenter.x;
        let targetY = refFeatures.eyeCenter.y;
        let sourceX = srcFeatures.eyeCenter.x;
        let sourceY = srcFeatures.eyeCenter.y;
        
        // 如果有鼻子和嘴巴，进行微调
        if (refFeatures.nose && srcFeatures.nose && refFeatures.mouth && srcFeatures.mouth) {
            // 计算鼻子相对于眼部的偏移
            const refNoseOffset = {
                x: refFeatures.nose.x - refFeatures.eyeCenter.x,
                y: refFeatures.nose.y - refFeatures.eyeCenter.y
            };
            const srcNoseOffset = {
                x: srcFeatures.nose.x - srcFeatures.eyeCenter.x,
                y: srcFeatures.nose.y - srcFeatures.eyeCenter.y
            };
            
            // 计算嘴巴相对于眼部的偏移
            const refMouthOffset = {
                x: refFeatures.mouth.x - refFeatures.eyeCenter.x,
                y: refFeatures.mouth.y - refFeatures.eyeCenter.y
            };
            const srcMouthOffset = {
                x: srcFeatures.mouth.x - srcFeatures.eyeCenter.x,
                y: srcFeatures.mouth.y - srcFeatures.eyeCenter.y
            };
            
            // 微调目标位置（25%权重给鼻子和嘴巴的平均位置）
            const noseAdjustX = (refNoseOffset.x - srcNoseOffset.x) * 0.15;
            const noseAdjustY = (refNoseOffset.y - srcNoseOffset.y) * 0.15;
            const mouthAdjustX = (refMouthOffset.x - srcMouthOffset.x) * 0.1;
            const mouthAdjustY = (refMouthOffset.y - srcMouthOffset.y) * 0.1;
            
            targetX += noseAdjustX + mouthAdjustX;
            targetY += noseAdjustY + mouthAdjustY;
        }
        
        return {
            offsetX: targetX - sourceX,
            offsetY: targetY - sourceY
        };
    }
    
    /**
     * 计算增强的旋转角度（考虑多个面部特征）
     * @param {Object} refFeatures 参考面部特征
     * @param {Object} srcFeatures 源面部特征
     * @returns {number} 旋转角度（度）
     * @private
     */
    _calculateEnhancedRotation(refFeatures, srcFeatures) {
        const rotations = [];
        const weights = [];
        
        // 1. 基于眼部连线的旋转角度（主要依据）
        const eyeRotation = this._normalizeAngle(refFeatures.eyeAngle - srcFeatures.eyeAngle);
        rotations.push(eyeRotation);
        weights.push(0.6); // 降低眼部权重到60%
        
        // 2. 如果有鼻子和嘴巴，计算面部中线角度
        if (refFeatures.nose && srcFeatures.nose && refFeatures.mouth && srcFeatures.mouth) {
            const refNoseToMouth = this._calculateLineAngle(refFeatures.nose, refFeatures.mouth);
            const srcNoseToMouth = this._calculateLineAngle(srcFeatures.nose, srcFeatures.mouth);
            const facialRotation = this._normalizeAngle(refNoseToMouth - srcNoseToMouth);
            
            rotations.push(facialRotation);
            weights.push(0.25); // 面部中线25%权重
        }
        
        // 3. 如果有鼻子，计算眼-鼻连线角度作为垂直参考
        if (refFeatures.nose && srcFeatures.nose) {
            const refEyeToNose = this._calculateLineAngle(refFeatures.eyeCenter, refFeatures.nose);
            const srcEyeToNose = this._calculateLineAngle(srcFeatures.eyeCenter, srcFeatures.nose);
            const eyeNoseRotation = this._normalizeAngle(refEyeToNose - srcEyeToNose);
            
            rotations.push(eyeNoseRotation);
            weights.push(0.15); // 眼-鼻角度15%权重
        }
        
        // 4. 稳定性检查：如果角度差异过大，降低权重
        const stableRotations = [];
        const stableWeights = [];
        
        for (let i = 0; i < rotations.length; i++) {
            const rotation = rotations[i];
            // 如果单个角度超过45度，认为可能是检测误差，降低权重
            if (Math.abs(rotation) > 45) {
                stableWeights.push(weights[i] * 0.3); // 大角度降权到30%
            } else {
                stableWeights.push(weights[i]);
            }
            stableRotations.push(rotation);
        }
        
        // 加权平均计算最终旋转角度
        let totalRotation = 0;
        let totalWeight = 0;
        
        for (let i = 0; i < stableRotations.length; i++) {
            totalRotation += stableRotations[i] * stableWeights[i];
            totalWeight += stableWeights[i];
        }
        
        if (totalWeight === 0) {
            return 0; // 如果没有有效权重，不进行旋转
        }
        
        const finalRotation = totalRotation / totalWeight;
        
        // 限制旋转角度范围，避免过度旋转
        return Math.max(-25, Math.min(25, finalRotation));
    }
    
    /**
     * 计算增强的缩放比例（多重检验）
     * @param {Object} refFeatures 参考面部特征
     * @param {Object} srcFeatures 源面部特征
     * @returns {number} 缩放比例
     * @private
     */
    _calculateEnhancedScale(refFeatures, srcFeatures) {
        const scales = [];
        const weights = [];
        const confidences = []; // 置信度数组
        
        // 1. 基于眼部距离的缩放（最重要且最可靠）
        if (refFeatures.eyeDistance > 0 && srcFeatures.eyeDistance > 0) {
            const eyeScale = refFeatures.eyeDistance / srcFeatures.eyeDistance;
            scales.push(eyeScale);
            weights.push(0.5);
            confidences.push(1.0); // 眼部距离置信度最高
        }
        
        // 2. 基于面部整体尺寸的缩放
        if (refFeatures.faceSize > 0 && srcFeatures.faceSize > 0) {
            const faceScale = refFeatures.faceSize / srcFeatures.faceSize;
            scales.push(faceScale);
            weights.push(0.25);
            confidences.push(0.8); // 面部尺寸置信度较高
        }
        
        // 3. 如果有鼻子，基于眼-鼻距离的缩放
        if (refFeatures.nose && srcFeatures.nose) {
            const refEyeNoseDistance = this._calculateDistance(refFeatures.eyeCenter, refFeatures.nose);
            const srcEyeNoseDistance = this._calculateDistance(srcFeatures.eyeCenter, srcFeatures.nose);
            
            if (refEyeNoseDistance > 5 && srcEyeNoseDistance > 5) { // 确保距离足够大
                const eyeNoseScale = refEyeNoseDistance / srcEyeNoseDistance;
                scales.push(eyeNoseScale);
                weights.push(0.15);
                confidences.push(0.7); // 眼-鼻距离置信度中等
            }
        }
        
        // 4. 如果有嘴巴，基于眼-嘴距离的缩放
        if (refFeatures.mouth && srcFeatures.mouth) {
            const refEyeMouthDistance = this._calculateDistance(refFeatures.eyeCenter, refFeatures.mouth);
            const srcEyeMouthDistance = this._calculateDistance(srcFeatures.eyeCenter, srcFeatures.mouth);
            
            if (refEyeMouthDistance > 5 && srcEyeMouthDistance > 5) { // 确保距离足够大
                const eyeMouthScale = refEyeMouthDistance / srcEyeMouthDistance;
                scales.push(eyeMouthScale);
                weights.push(0.1);
                confidences.push(0.6); // 眼-嘴距离置信度较低
            }
        }
        
        if (scales.length === 0) {
            return 1.0;
        }
        
        // 稳定性检查：过滤异常缩放值
        const stableScales = [];
        const stableWeights = [];
        
        for (let i = 0; i < scales.length; i++) {
            const scale = scales[i];
            // 如果缩放比例过于极端，降低权重或排除
            if (scale < 0.3 || scale > 3.0) {
                // 极端值，跳过
                continue;
            } else if (scale < 0.5 || scale > 2.0) {
                // 异常值，降低权重
                stableScales.push(scale);
                stableWeights.push(weights[i] * 0.3 * confidences[i]);
            } else {
                // 正常值，保持权重
                stableScales.push(scale);
                stableWeights.push(weights[i] * confidences[i]);
            }
        }
        
        if (stableScales.length === 0) {
            return 1.0; // 如果没有稳定的缩放值，不进行缩放
        }
        
        // 加权平均计算最终缩放
        let totalScale = 0;
        let totalWeight = 0;
        
        for (let i = 0; i < stableScales.length; i++) {
            totalScale += stableScales[i] * stableWeights[i];
            totalWeight += stableWeights[i];
        }
        
        const finalScale = totalScale / totalWeight;
        
        // 更保守的缩放范围限制
        return Math.max(0.8, Math.min(1.3, finalScale));
    }
    
    /**
     * 计算精确位置偏移（多点对齐增强版）
     * @param {Object} refFeatures 参考面部特征
     * @param {Object} srcFeatures 源面部特征
     * @param {number} rotation 旋转角度
     * @param {number} scale 缩放比例
     * @returns {Object} {offsetX, offsetY} 位置偏移
     * @private
     */
    _calculatePreciseOffset(refFeatures, srcFeatures, rotation, scale) {
        // 主要对齐点：眼部中心
        let targetX = refFeatures.eyeCenter.x;
        let targetY = refFeatures.eyeCenter.y;
        let sourceX = srcFeatures.eyeCenter.x;
        let sourceY = srcFeatures.eyeCenter.y;
        
        // 精确的多点对齐计算
        const adjustments = [];
        const adjustmentWeights = [];
        
        // 1. 鼻子位置微调（如果可用）
        if (refFeatures.nose && srcFeatures.nose) {
            const refNoseRelative = {
                x: refFeatures.nose.x - refFeatures.eyeCenter.x,
                y: refFeatures.nose.y - refFeatures.eyeCenter.y
            };
            const srcNoseRelative = {
                x: srcFeatures.nose.x - srcFeatures.eyeCenter.x,
                y: srcFeatures.nose.y - srcFeatures.eyeCenter.y
            };
            
            // 应用旋转和缩放变换到源脸鼻子位置
            const transformedSrcNose = this._transformPoint(srcNoseRelative, rotation, scale);
            
            adjustments.push({
                x: refNoseRelative.x - transformedSrcNose.x,
                y: refNoseRelative.y - transformedSrcNose.y
            });
            adjustmentWeights.push(0.4); // 鼻子权重40%
        }
        
        // 2. 嘴巴位置微调（如果可用）
        if (refFeatures.mouth && srcFeatures.mouth) {
            const refMouthRelative = {
                x: refFeatures.mouth.x - refFeatures.eyeCenter.x,
                y: refFeatures.mouth.y - refFeatures.eyeCenter.y
            };
            const srcMouthRelative = {
                x: srcFeatures.mouth.x - srcFeatures.eyeCenter.x,
                y: srcFeatures.mouth.y - srcFeatures.eyeCenter.y
            };
            
            // 应用旋转和缩放变换到源脸嘴巴位置
            const transformedSrcMouth = this._transformPoint(srcMouthRelative, rotation, scale);
            
            adjustments.push({
                x: refMouthRelative.x - transformedSrcMouth.x,
                y: refMouthRelative.y - transformedSrcMouth.y
            });
            adjustmentWeights.push(0.3); // 嘴巴权重30%
        }
        
        // 应用加权微调
        if (adjustments.length > 0) {
            let totalAdjustX = 0;
            let totalAdjustY = 0;
            let totalWeight = 0;
            
            for (let i = 0; i < adjustments.length; i++) {
                totalAdjustX += adjustments[i].x * adjustmentWeights[i];
                totalAdjustY += adjustments[i].y * adjustmentWeights[i];
                totalWeight += adjustmentWeights[i];
            }
            
            if (totalWeight > 0) {
                targetX += totalAdjustX / totalWeight;
                targetY += totalAdjustY / totalWeight;
            }
        }
        
        return {
            offsetX: targetX - sourceX,
            offsetY: targetY - sourceY
        };
    }
    
    /**
     * 计算两点之间的角度
     * @param {Object} point1 起点
     * @param {Object} point2 终点
     * @returns {number} 角度（度）
     * @private
     */
    _calculateLineAngle(point1, point2) {
        const deltaX = point2.x - point1.x;
        const deltaY = point2.y - point1.y;
        return Math.atan2(deltaY, deltaX) * 180 / Math.PI;
    }
    
    /**
     * 计算两点之间的距离
     * @param {Object} point1 点1
     * @param {Object} point2 点2
     * @returns {number} 距离
     * @private
     */
    _calculateDistance(point1, point2) {
        const deltaX = point2.x - point1.x;
        const deltaY = point2.y - point1.y;
        return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    }
    
    /**
     * 对点应用旋转和缩放变换
     * @param {Object} point 要变换的点
     * @param {number} rotation 旋转角度（度）
     * @param {number} scale 缩放比例
     * @returns {Object} 变换后的点
     * @private
     */
    _transformPoint(point, rotation, scale) {
        const radian = rotation * Math.PI / 180;
        const cosR = Math.cos(radian);
        const sinR = Math.sin(radian);
        
        return {
            x: (point.x * cosR - point.y * sinR) * scale,
            y: (point.x * sinR + point.y * cosR) * scale
        };
    }
    
    /**
     * 规范化角度到 [-180, 180] 度范围
     * @param {number} angle 角度（度）
     * @returns {number} 规范化后的角度
     * @private
     */
    _normalizeAngle(angle) {
        while (angle > 180) angle -= 360;
        while (angle < -180) angle += 360;
        return angle;
    }
    
    /**
     * 眼部优先对齐算法 - 核心实现
     * 策略：
     * 1. 首先基于双眼对齐确定旋转和缩放
     * 2. 然后使用鼻子或嘴巴进行精细调整
     * @param {Object} refKeypoints 参考脸关键点
     * @param {Object} srcKeypoints 源脸关键点
     * @returns {Object} 对齐参数
     * @private
     */
    _calculateEyesFirstAlignment(refKeypoints, srcKeypoints) {
        // 第一步：计算眼部基本信息
        const refEyeCenter = this._calculateEyeCenter(refKeypoints);
        const srcEyeCenter = this._calculateEyeCenter(srcKeypoints);
        
        const refEyeDistance = this._calculateEyeDistance(refKeypoints);
        const srcEyeDistance = this._calculateEyeDistance(srcKeypoints);
        
        const refEyeAngle = this._calculateEyeAngle(refKeypoints);
        const srcEyeAngle = this._calculateEyeAngle(srcKeypoints);
        
        
        // 第二步：基于眼部计算初始旋转和缩放
        let initialRotation = this._normalizeAngle(refEyeAngle - srcEyeAngle);
        let initialScale = refEyeDistance / srcEyeDistance;
        
        // 限制初始变换范围，避免极端值
        initialRotation = Math.max(-30, Math.min(30, initialRotation));
        initialScale = Math.max(0.5, Math.min(2.0, initialScale));
        
        
        // 第三步：使用第三个特征点进行精细调整
        let finalRotation = initialRotation;
        let finalScale = initialScale;
        
        // 尝试使用鼻子进行精细调整
        if (refKeypoints.nose && srcKeypoints.nose) {
            const noseAdjustment = this._calculateNoseBasedAdjustment(
                refKeypoints, srcKeypoints, 
                refEyeCenter, srcEyeCenter,
                initialRotation, initialScale
            );
            
            finalRotation = this._blendAngles(initialRotation, noseAdjustment.rotation, 0.3);
            finalScale = this._blendScales(initialScale, noseAdjustment.scale, 0.2);
            
        }
        // 如果没有鼻子，尝试使用嘴巴
        else if (refKeypoints.mouth && srcKeypoints.mouth) {
            const mouthAdjustment = this._calculateMouthBasedAdjustment(
                refKeypoints, srcKeypoints,
                refEyeCenter, srcEyeCenter,
                initialRotation, initialScale
            );
            
            finalRotation = this._blendAngles(initialRotation, mouthAdjustment.rotation, 0.2);
            finalScale = this._blendScales(initialScale, mouthAdjustment.scale, 0.15);
            
        }
        
        // 第四步：计算位置偏移（考虑旋转和缩放后的眼部中心位置）
        // 我们需要计算应用旋转和缩放后，源眼部中心应该移动到哪里才能与参考眼部中心对齐
        
        // 预测应用旋转和缩放后，源眼部中心的新位置
        // 这里我们假设变换是围绕当前源眼部中心进行的
        const predictedSrcEyeCenter = {
            x: srcEyeCenter.x,  // 如果以眼部中心为变换中心，眼部中心位置不变
            y: srcEyeCenter.y
        };
        
        // 计算需要的偏移量，使变换后的源眼部中心对齐到参考眼部中心
        const offsetX = refEyeCenter.x - predictedSrcEyeCenter.x;
        const offsetY = refEyeCenter.y - predictedSrcEyeCenter.y;
        
        
        return {
            rotation: finalRotation,
            scale: finalScale,
            offsetX: offsetX,
            offsetY: offsetY,
            
            // 返回眼部信息用于调试
            refEyeCenter: refEyeCenter,
            srcEyeCenter: srcEyeCenter,
            refEyeAngle: refEyeAngle,
            srcEyeAngle: srcEyeAngle,
            refEyeDistance: refEyeDistance,
            srcEyeDistance: srcEyeDistance,
            
            debug: {
                initialRotation: initialRotation,
                initialScale: initialScale,
                hasNose: !!(refKeypoints.nose && srcKeypoints.nose),
                hasMouth: !!(refKeypoints.mouth && srcKeypoints.mouth)
            }
        };
    }
    
    /**
     * 基于鼻子位置计算精细调整
     * @param {Object} refKeypoints 参考脸关键点
     * @param {Object} srcKeypoints 源脸关键点
     * @param {Object} refEyeCenter 参考脸眼部中心
     * @param {Object} srcEyeCenter 源脸眼部中心
     * @param {number} baseRotation 基础旋转角度
     * @param {number} baseScale 基础缩放比例
     * @returns {Object} 调整参数
     * @private
     */
    _calculateNoseBasedAdjustment(refKeypoints, srcKeypoints, refEyeCenter, srcEyeCenter, baseRotation, baseScale) {
        // 计算鼻子相对于眼部中心的位置
        const refNoseVector = {
            x: refKeypoints.nose.x - refEyeCenter.x,
            y: refKeypoints.nose.y - refEyeCenter.y
        };
        
        const srcNoseVector = {
            x: srcKeypoints.nose.x - srcEyeCenter.x,
            y: srcKeypoints.nose.y - srcEyeCenter.y
        };
        
        // 计算鼻子向量的角度和长度
        const refNoseAngle = Math.atan2(refNoseVector.y, refNoseVector.x) * 180 / Math.PI;
        const srcNoseAngle = Math.atan2(srcNoseVector.y, srcNoseVector.x) * 180 / Math.PI;
        
        const refNoseDistance = Math.sqrt(refNoseVector.x * refNoseVector.x + refNoseVector.y * refNoseVector.y);
        const srcNoseDistance = Math.sqrt(srcNoseVector.x * srcNoseVector.x + srcNoseVector.y * srcNoseVector.y);
        
        // 基于鼻子计算调整
        const noseRotationAdjust = this._normalizeAngle(refNoseAngle - srcNoseAngle);
        const noseScaleAdjust = refNoseDistance > 0 && srcNoseDistance > 0 ? refNoseDistance / srcNoseDistance : 1.0;
        
        return {
            rotation: noseRotationAdjust,
            scale: Math.max(0.7, Math.min(1.5, noseScaleAdjust))
        };
    }
    
    /**
     * 基于嘴巴位置计算精细调整
     * @param {Object} refKeypoints 参考脸关键点
     * @param {Object} srcKeypoints 源脸关键点
     * @param {Object} refEyeCenter 参考脸眼部中心
     * @param {Object} srcEyeCenter 源脸眼部中心
     * @param {number} baseRotation 基础旋转角度
     * @param {number} baseScale 基础缩放比例
     * @returns {Object} 调整参数
     * @private
     */
    _calculateMouthBasedAdjustment(refKeypoints, srcKeypoints, refEyeCenter, srcEyeCenter, baseRotation, baseScale) {
        // 计算嘴巴相对于眼部中心的位置
        const refMouthVector = {
            x: refKeypoints.mouth.x - refEyeCenter.x,
            y: refKeypoints.mouth.y - refEyeCenter.y
        };
        
        const srcMouthVector = {
            x: srcKeypoints.mouth.x - srcEyeCenter.x,
            y: srcKeypoints.mouth.y - srcEyeCenter.y
        };
        
        // 计算嘴巴向量的角度和长度
        const refMouthAngle = Math.atan2(refMouthVector.y, refMouthVector.x) * 180 / Math.PI;
        const srcMouthAngle = Math.atan2(srcMouthVector.y, srcMouthVector.x) * 180 / Math.PI;
        
        const refMouthDistance = Math.sqrt(refMouthVector.x * refMouthVector.x + refMouthVector.y * refMouthVector.y);
        const srcMouthDistance = Math.sqrt(srcMouthVector.x * srcMouthVector.x + srcMouthVector.y * srcMouthVector.y);
        
        // 基于嘴巴计算调整
        const mouthRotationAdjust = this._normalizeAngle(refMouthAngle - srcMouthAngle);
        const mouthScaleAdjust = refMouthDistance > 0 && srcMouthDistance > 0 ? refMouthDistance / srcMouthDistance : 1.0;
        
        return {
            rotation: mouthRotationAdjust,
            scale: Math.max(0.7, Math.min(1.5, mouthScaleAdjust))
        };
    }
    
    /**
     * 混合两个角度
     * @param {number} angle1 角度1
     * @param {number} angle2 角度2
     * @param {number} weight 角度2的权重(0-1)
     * @returns {number} 混合后的角度
     * @private
     */
    _blendAngles(angle1, angle2, weight) {
        // 处理角度环绕问题
        let diff = angle2 - angle1;
        if (diff > 180) diff -= 360;
        if (diff < -180) diff += 360;
        
        return angle1 + diff * weight;
    }
    
    /**
     * 混合两个缩放比例
     * @param {number} scale1 缩放1
     * @param {number} scale2 缩放2
     * @param {number} weight 缩放2的权重(0-1)
     * @returns {number} 混合后的缩放
     * @private
     */
    _blendScales(scale1, scale2, weight) {
        return scale1 * (1 - weight) + scale2 * weight;
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