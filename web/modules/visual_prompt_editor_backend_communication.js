/**
 * Visual Prompt Editor - 后端通信模块
 * 参考comfyui_lg_tools项目的前后端数据传递机制
 */

import { api } from "../../../scripts/api.js";

/**
 * 后端通信管理器
 */
export class BackendCommunicationManager {
    constructor(nodeInstance) {
        this.nodeInstance = nodeInstance;
        this.isWaitingResponse = false;
        this.lastSentData = null;
        
    }
    
    /**
     * 发送变换数据到后端（参考comfyui_lg_tools的sendCanvasState）
     */
    async sendTransformData(transformData, imageData = null, maskData = null) {
        if (this.isWaitingResponse) {
            return null;
        }
        
        try {
            this.isWaitingResponse = true;
            const timestamp = Date.now();
            
            
            // 构建发送数据（参考comfyui_lg_tools格式）
            const requestData = {
                node_id: this.nodeInstance.id.toString(),
                timestamp: timestamp.toString(),
                type: 'visual_prompt_editor',
                transform_data: transformData
            };
            
            // 如果有图像数据，添加到请求中
            if (imageData) {
                requestData.main_image = this.convertImageToArray(imageData);
            }
            
            // 如果有掩码数据，添加到请求中
            if (maskData) {
                requestData.main_mask = this.convertImageToArray(maskData);
            }
            
            // 发送POST请求到后端
            const response = await api.fetchApi('/visual_prompt_editor_data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });
            
            if (response.ok) {
                const result = await response.json();
                this.lastSentData = requestData;
                return result;
            } else {
                console.error('Backend response error:', response.status, response.statusText);
                return null;
            }
            
        } catch (error) {
            console.error('Error sending transform data:', error);
            return null;
        } finally {
            this.isWaitingResponse = false;
        }
    }
    
    /**
     * 将图像数据转换为数组格式（参考comfyui_lg_tools）
     */
    convertImageToArray(imageData) {
        try {
            if (imageData instanceof HTMLCanvasElement) {
                // 从canvas获取图像数据
                return this.canvasToArray(imageData);
            } else if (imageData instanceof HTMLImageElement) {
                // 从image元素获取图像数据
                return this.imageElementToArray(imageData);
            } else if (typeof imageData === 'string') {
                // 假设是base64数据
                return this.base64ToArray(imageData);
            } else {
                console.warn('Unknown image data format:', typeof imageData);
                return null;
            }
        } catch (error) {
            console.error('Error converting image data:', error);
            return null;
        }
    }
    
    /**
     * Canvas转换为数组
     */
    canvasToArray(canvas) {
        return new Promise((resolve, reject) => {
            try {
                canvas.toBlob(async (blob) => {
                    if (blob) {
                        const arrayBuffer = await blob.arrayBuffer();
                        const uint8Array = new Uint8Array(arrayBuffer);
                        resolve(Array.from(uint8Array));
                    } else {
                        reject(new Error('Canvas转换为Blob失败'));
                    }
                }, 'image/png', 1.0);
            } catch (error) {
                reject(error);
            }
        });
    }
    
    /**
     * Image元素转换为数组
     */
    async imageElementToArray(img) {
        // 创建临时canvas
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        return await this.canvasToArray(canvas);
    }
    
    /**
     * Base64转换为数组
     */
    base64ToArray(base64String) {
        try {
            // 移除data URL前缀
            if (base64String.includes(',')) {
                base64String = base64String.split(',')[1];
            }
            
            // 解码base64
            const binaryString = atob(base64String);
            const uint8Array = new Uint8Array(binaryString.length);
            
            for (let i = 0; i < binaryString.length; i++) {
                uint8Array[i] = binaryString.charCodeAt(i);
            }
            
            return Array.from(uint8Array);
        } catch (error) {
            console.error('Base64 decode failed:', error);
            return null;
        }
    }
    
    /**
     * 获取当前画布状态并发送到后端
     */
    async sendCurrentCanvasState() {
        if (!this.nodeInstance.transformDataManager) {
            console.warn('Transform data manager not initialized');
            return null;
        }
        
        try {
            // 获取所有变换数据
            const transformData = this.nodeInstance.transformDataManager.getAllTransformData();
            
            // 获取当前图像（如果有的话）
            const modal = this.nodeInstance.modal;
            const mainImage = modal?.querySelector('#vpe-main-image');
            
            // 创建合成图像
            let compositeImageData = null;
            if (modal && mainImage) {
                compositeImageData = await this.createCompositeImage(modal);
            }
            
            // 发送数据到后端
            return await this.sendTransformData(transformData, compositeImageData);
            
        } catch (error) {
            console.error('Error sending canvas state:', error);
            return null;
        }
    }
    
    /**
     * 创建合成图像（参考comfyui_lg_tools的处理方式）
     */
    async createCompositeImage(modal) {
        try {
            const mainImage = modal.querySelector('#vpe-main-image');
            if (!mainImage) {
                console.warn('Main image element not found');
                return null;
            }
            
            // 创建临时canvas
            const canvas = document.createElement('canvas');
            canvas.width = mainImage.naturalWidth;
            canvas.height = mainImage.naturalHeight;
            const ctx = canvas.getContext('2d');
            
            // 绘制主图像
            ctx.drawImage(mainImage, 0, 0);
            
            // 获取标注层（如果有的话）
            const drawingLayer = modal.querySelector('#drawing-layer');
            if (drawingLayer) {
                // 这里可以添加将标注绘制到canvas的逻辑
            }
            
            return canvas;
            
        } catch (error) {
            console.error('Error creating composite image:', error);
            return null;
        }
    }
    
    /**
     * 监听统一画布系统事件
     */
    setupUnifiedCanvasEventListeners(modal) {
        if (!modal) return;
        
        // 监听统一画布准备就绪事件
        modal.addEventListener('unifiedCanvasReady', async (event) => {
            
            const unifiedCanvas = event.detail.unifiedCanvas;
            if (unifiedCanvas) {
                // 监听变换事件
                modal.addEventListener('unifiedCanvasTransform', (transformEvent) => {
                    // 可以在这里添加自动同步逻辑
                    // this.sendCurrentCanvasState();
                });
            }
        });
        
    }
    
    /**
     * 清理资源
     */
    cleanup() {
        this.isWaitingResponse = false;
        this.lastSentData = null;
    }
}

/**
 * 创建后端通信管理器
 */
export function createBackendCommunicationManager(nodeInstance) {
    return new BackendCommunicationManager(nodeInstance);
}

/**
 * 工具函数：检查后端API是否可用
 */
export async function checkBackendAPI() {
    try {
        const response = await api.fetchApi('/visual_prompt_editor_status', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            return true;
        } else {
            console.warn('Backend API unavailable:', response.status);
            return false;
        }
    } catch (error) {
        console.warn('Cannot connect to backend API:', error.message);
        return false;
    }
}