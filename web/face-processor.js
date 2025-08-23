/**
 * 面部处理核心算法库
 * 提供面部自动裁切、对齐、变换等功能
 */

import { globalFaceDetector } from './libs/mediapipe-face-detection.js';

class FaceProcessor {
    constructor(options = {}) {
        this.detector = globalFaceDetector;
        this.defaultOptions = {
            cropPadding: 0.2,
            minFaceSize: 300,
            alignmentMode: 'eyes', // 'eyes', 'face', 'nose'
            outputFormat: 'dataurl', // 'dataurl', 'canvas', 'blob'
            quality: 1.0
        };
        this.options = { ...this.defaultOptions, ...options };
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
    }

    /**
     * 自动面部裁切
     * @param {string|HTMLImageElement} input 输入图像
     * @param {Object} options 裁切选项
     * @return {Promise<string|HTMLCanvasElement|Blob>} 裁切后的图像
     */
    async autoFaceCrop(input, options = {}) {
        const config = { ...this.options, ...options };
        
        try {
            const image = await this._loadImage(input);
            const faces = await this.detector.detectFaces(image);
            
            if (faces.length === 0) {
                throw new Error('未检测到人脸');
            }

            // 选择最大的人脸作为主要人脸
            const primaryFace = this._selectPrimaryFace(faces);
            
            // 扩展边界框
            const expandedBbox = this._expandBoundingBox(
                primaryFace.boundingBox, 
                image, 
                config.cropPadding
            );

            // 确保最小尺寸
            const finalBbox = this._ensureMinimumSize(expandedBbox, config.minFaceSize);
            
            // 执行裁切
            return this._cropImage(image, finalBbox, config);
            
        } catch (error) {
            console.error('面部裁切失败:', error);
            throw error;
        }
    }

    /**
     * 自动面部对齐
     * @param {string|HTMLImageElement} input 输入图像
     * @param {Object} options 对齐选项
     * @return {Promise<string|HTMLCanvasElement|Blob>} 对齐后的图像
     */
    async autoFaceAlign(input, options = {}) {
        const config = { ...this.options, ...options };
        
        try {
            const image = await this._loadImage(input);
            const meshes = await this.detector.getFaceMesh(image);
            
            if (meshes.length === 0) {
                throw new Error('未检测到面部关键点');
            }

            const primaryMesh = meshes[0];
            const alignment = this._calculateAlignment(primaryMesh, config);
            
            return this._applyAlignment(image, alignment, config);
            
        } catch (error) {
            console.error('面部对齐失败:', error);
            throw error;
        }
    }

    /**
     * 批量处理面部图像
     * @param {Array} inputs 输入图像数组
     * @param {string} operation 操作类型 'crop' | 'align' | 'both'
     * @param {Object} options 处理选项
     * @return {Promise<Array>} 处理结果数组
     */
    async batchProcess(inputs, operation = 'crop', options = {}) {
        const results = [];
        const config = { ...this.options, ...options };
        
        for (let i = 0; i < inputs.length; i++) {
            try {
                let result;
                switch (operation) {
                    case 'crop':
                        result = await this.autoFaceCrop(inputs[i], config);
                        break;
                    case 'align':
                        result = await this.autoFaceAlign(inputs[i], config);
                        break;
                    case 'both':
                        const cropped = await this.autoFaceCrop(inputs[i], config);
                        result = await this.autoFaceAlign(cropped, config);
                        break;
                    default:
                        throw new Error(`不支持的操作类型: ${operation}`);
                }
                results.push({ success: true, data: result, index: i });
            } catch (error) {
                results.push({ success: false, error: error.message, index: i });
            }
        }
        
        return results;
    }

    /**
     * 获取面部分析信息
     * @param {string|HTMLImageElement} input 输入图像
     * @return {Promise<Object>} 面部分析结果
     */
    async analyzeFace(input) {
        try {
            const image = await this._loadImage(input);
            const [faces, meshes] = await Promise.all([
                this.detector.detectFaces(image),
                this.detector.getFaceMesh(image)
            ]);

            if (faces.length === 0) {
                return { hasFace: false, analysis: null };
            }

            const primaryFace = faces[0];
            const primaryMesh = meshes.length > 0 ? meshes[0] : null;
            
            return {
                hasFace: true,
                faceCount: faces.length,
                confidence: primaryFace.confidence,
                boundingBox: primaryFace.boundingBox,
                analysis: {
                    faceSize: this._calculateFaceSize(primaryFace.boundingBox),
                    faceAngle: primaryMesh ? this._calculateFaceAngle(primaryMesh) : 0,
                    eyeDistance: primaryMesh ? this._calculateEyeDistance(primaryMesh) : 0,
                    facePosition: this._calculateFacePosition(primaryFace.boundingBox, image),
                    recommendedCrop: this._recommendCropSettings(primaryFace, image),
                    qualityScore: this._assessImageQuality(image, primaryFace)
                }
            };
        } catch (error) {
            console.error('面部分析失败:', error);
            throw error;
        }
    }

    // ==================== 私有方法 ====================

    /**
     * 加载图像
     * @private
     */
    async _loadImage(input) {
        if (input instanceof HTMLImageElement) {
            return input;
        }
        
        if (typeof input === 'string') {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = input;
            });
        }
        
        throw new Error('不支持的输入类型');
    }

    /**
     * 选择主要人脸（面积最大的）
     * @private
     */
    _selectPrimaryFace(faces) {
        return faces.reduce((primary, current) => {
            const primaryArea = primary.boundingBox.width * primary.boundingBox.height;
            const currentArea = current.boundingBox.width * current.boundingBox.height;
            return currentArea > primaryArea ? current : primary;
        });
    }

    /**
     * 扩展边界框
     * @private
     */
    _expandBoundingBox(bbox, image, padding) {
        const padX = bbox.width * padding;
        const padY = bbox.height * padding;
        
        return {
            x: Math.max(0, bbox.x - padX),
            y: Math.max(0, bbox.y - padY),
            width: Math.min(image.width - bbox.x + padX, bbox.width + 2 * padX),
            height: Math.min(image.height - bbox.y + padY, bbox.height + 2 * padY)
        };
    }

    /**
     * 确保最小尺寸
     * @private
     */
    _ensureMinimumSize(bbox, minSize) {
        if (bbox.width >= minSize && bbox.height >= minSize) {
            return bbox;
        }
        
        const scale = minSize / Math.min(bbox.width, bbox.height);
        const newWidth = bbox.width * scale;
        const newHeight = bbox.height * scale;
        
        return {
            x: bbox.x - (newWidth - bbox.width) / 2,
            y: bbox.y - (newHeight - bbox.height) / 2,
            width: newWidth,
            height: newHeight
        };
    }

    /**
     * 裁切图像
     * @private
     */
    _cropImage(image, bbox, config) {
        this.canvas.width = bbox.width;
        this.canvas.height = bbox.height;
        
        this.ctx.drawImage(
            image,
            bbox.x, bbox.y, bbox.width, bbox.height,
            0, 0, bbox.width, bbox.height
        );
        
        return this._outputResult(this.canvas, config);
    }

    /**
     * 计算对齐参数
     * @private
     */
    _calculateAlignment(mesh, config) {
        const keypoints = mesh.keypoints;
        
        if (!keypoints || !keypoints.leftEye || !keypoints.rightEye) {
            throw new Error('无法获取眼部关键点');
        }
        
        // 计算眼部中心点
        const leftEye = this._getAveragePoint(keypoints.leftEye);
        const rightEye = this._getAveragePoint(keypoints.rightEye);
        
        // 计算旋转角度
        const angle = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x);
        
        // 计算中心点
        const centerX = (leftEye.x + rightEye.x) / 2;
        const centerY = (leftEye.y + rightEye.y) / 2;
        
        // 计算缩放比例
        const eyeDistance = Math.sqrt(
            Math.pow(rightEye.x - leftEye.x, 2) + 
            Math.pow(rightEye.y - leftEye.y, 2)
        );
        
        return {
            angle: -angle, // 负角度表示逆时针旋转
            centerX,
            centerY,
            scale: config.targetEyeDistance ? config.targetEyeDistance / eyeDistance : 1,
            eyeDistance
        };
    }

    /**
     * 应用对齐变换
     * @private
     */
    _applyAlignment(image, alignment, config) {
        this.canvas.width = image.width;
        this.canvas.height = image.height;
        
        this.ctx.save();
        
        // 应用变换
        this.ctx.translate(alignment.centerX, alignment.centerY);
        this.ctx.rotate(alignment.angle);
        this.ctx.scale(alignment.scale, alignment.scale);
        this.ctx.translate(-alignment.centerX, -alignment.centerY);
        
        // 绘制图像
        this.ctx.drawImage(image, 0, 0);
        
        this.ctx.restore();
        
        return this._outputResult(this.canvas, config);
    }

    /**
     * 获取点集的平均坐标
     * @private
     */
    _getAveragePoint(points) {
        // 处理单个点的情况
        if (!Array.isArray(points)) {
            if (points && typeof points.x === 'number' && typeof points.y === 'number') {
                return { x: points.x, y: points.y };
            }
            return { x: 0, y: 0 };
        }
        
        // 处理点数组的情况
        if (points.length === 0) {
            return { x: 0, y: 0 };
        }
        
        const sum = points.reduce(
            (acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }),
            { x: 0, y: 0 }
        );
        return { x: sum.x / points.length, y: sum.y / points.length };
    }

    /**
     * 输出处理结果
     * @private
     */
    _outputResult(canvas, config) {
        switch (config.outputFormat) {
            case 'canvas':
                return canvas;
            case 'blob':
                return new Promise(resolve => {
                    canvas.toBlob(resolve, 'image/jpeg', config.quality);
                });
            case 'dataurl':
            default:
                return canvas.toDataURL('image/jpeg', config.quality);
        }
    }

    /**
     * 计算人脸尺寸
     * @private
     */
    _calculateFaceSize(bbox) {
        return {
            width: Math.round(bbox.width),
            height: Math.round(bbox.height),
            area: Math.round(bbox.width * bbox.height)
        };
    }

    /**
     * 计算人脸角度
     * @private
     */
    _calculateFaceAngle(mesh) {
        try {
            if (!mesh || !mesh.keypoints) return 0;
            
            const { leftEye, rightEye } = mesh.keypoints;
            if (!leftEye || !rightEye) return 0;
            
            const leftEyeCenter = this._getAveragePoint(leftEye);
            const rightEyeCenter = this._getAveragePoint(rightEye);
            
            // 检查点是否有效
            if (!leftEyeCenter || !rightEyeCenter || 
                typeof leftEyeCenter.x !== 'number' || typeof rightEyeCenter.x !== 'number') {
                return 0;
            }
            
            return Math.atan2(
                rightEyeCenter.y - leftEyeCenter.y,
                rightEyeCenter.x - leftEyeCenter.x
            ) * 180 / Math.PI;
        } catch (error) {
            console.warn('计算人脸角度失败:', error);
            return 0;
        }
    }

    /**
     * 计算双眼距离
     * @private
     */
    _calculateEyeDistance(mesh) {
        try {
            if (!mesh || !mesh.keypoints) return 0;
            
            const { leftEye, rightEye } = mesh.keypoints;
            if (!leftEye || !rightEye) return 0;
            
            const leftEyeCenter = this._getAveragePoint(leftEye);
            const rightEyeCenter = this._getAveragePoint(rightEye);
            
            // 检查点是否有效
            if (!leftEyeCenter || !rightEyeCenter || 
                typeof leftEyeCenter.x !== 'number' || typeof rightEyeCenter.x !== 'number') {
                return 0;
            }
            
            return Math.sqrt(
                Math.pow(rightEyeCenter.x - leftEyeCenter.x, 2) +
                Math.pow(rightEyeCenter.y - leftEyeCenter.y, 2)
            );
        } catch (error) {
            console.warn('计算双眼距离失败:', error);
            return 0;
        }
    }

    /**
     * 计算人脸在图像中的位置
     * @private
     */
    _calculateFacePosition(bbox, image) {
        return {
            centerX: (bbox.x + bbox.width / 2) / image.width,
            centerY: (bbox.y + bbox.height / 2) / image.height,
            relativeSize: (bbox.width * bbox.height) / (image.width * image.height)
        };
    }

    /**
     * 推荐裁切设置
     * @private
     */
    _recommendCropSettings(face, image) {
        const bbox = face.boundingBox;
        const faceArea = bbox.width * bbox.height;
        const imageArea = image.width * image.height;
        const faceRatio = faceArea / imageArea;
        
        if (faceRatio < 0.1) {
            return { padding: 0.5, reason: '人脸较小，建议增加边距' };
        } else if (faceRatio > 0.8) {
            return { padding: 0.1, reason: '人脸较大，建议减少边距' };
        } else {
            return { padding: 0.2, reason: '标准尺寸，使用默认边距' };
        }
    }

    /**
     * 评估图像质量
     * @private
     */
    _assessImageQuality(image, face) {
        const factors = {
            resolution: image.width * image.height > 500000 ? 1 : 0.7,
            faceSize: face.boundingBox.width > 200 ? 1 : 0.8,
            confidence: face.confidence,
            sharpness: 1 // 简化实现，实际应用中可以添加更复杂的锐度检测
        };
        
        const totalScore = Object.values(factors).reduce((sum, score) => sum + score, 0) / Object.keys(factors).length;
        
        return {
            score: Math.round(totalScore * 100),
            factors,
            recommendation: totalScore > 0.8 ? '图像质量良好' : '建议使用更高质量的图像'
        };
    }
}

// 预设配置
export const FaceProcessorPresets = {
    portrait: {
        cropPadding: 0.3,
        minFaceSize: 200,
        alignmentMode: 'eyes',
        quality: 0.95
    },
    
    avatar: {
        cropPadding: 0.2,
        minFaceSize: 300,
        alignmentMode: 'eyes',
        quality: 1.0
    },
    
    idPhoto: {
        cropPadding: 0.1,
        minFaceSize: 300,
        alignmentMode: 'face',
        quality: 0.98
    },
    
    artistic: {
        cropPadding: 0.5,
        minFaceSize: 100,
        alignmentMode: 'nose',
        quality: 0.85
    }
};

export default FaceProcessor;