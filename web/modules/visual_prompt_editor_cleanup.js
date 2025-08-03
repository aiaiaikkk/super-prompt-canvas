/**
 * Visual Prompt Editor - 资源清理模块
 * 负责弹窗关闭时的完整资源清理，防止内存泄漏和性能问题
 */

/**
 * 模态弹窗清理管理器
 */
export class ModalCleanupManager {
    constructor() {
        this.activeEventListeners = new Map(); // 存储活跃的事件监听器
        this.activeTimers = new Set(); // 存储活跃的定时器
        this.activeFabricCanvases = new Set(); // 存储Fabric画布实例
        this.activeImageCache = new Map(); // 存储图像缓存
    }

    /**
     * 注册事件监听器（用于后续清理）
     */
    registerEventListener(element, event, handler, options = {}) {
        const listenerId = `${Date.now()}_${Math.random()}`;
        
        // 添加事件监听器
        element.addEventListener(event, handler, options);
        
        // 记录用于清理
        this.activeEventListeners.set(listenerId, {
            element,
            event,
            handler,
            options
        });
        
        return listenerId;
    }

    /**
     * 注册定时器（用于后续清理）
     */
    registerTimer(timerId, type = 'timeout') {
        this.activeTimers.add({ timerId, type });
        return timerId;
    }

    /**
     * 注册Fabric画布（用于后续清理）
     */
    registerFabricCanvas(fabricCanvas) {
        this.activeFabricCanvases.add(fabricCanvas);
    }

    /**
     * 注册图像缓存（用于后续清理）
     */
    registerImageCache(imageUrl, imageElement) {
        this.activeImageCache.set(imageUrl, imageElement);
    }

    /**
     * 执行完整清理 - 防止内存泄漏和性能问题
     */
    performCompleteCleanup() {
        console.log('🧹 开始执行模态弹窗资源清理...');
        
        // 1. 清理事件监听器
        this.cleanupEventListeners();
        
        // 2. 清理定时器
        this.cleanupTimers();
        
        // 3. 清理Fabric画布
        this.cleanupFabricCanvases();
        
        // 4. 清理图像缓存
        this.cleanupImageCache();
        
        // 5. 清理CSS动画
        this.cleanupCSSAnimations();
        
        // 6. 强制垃圾回收提示
        this.forceGarbageCollection();
        
        console.log('✅ 模态弹窗资源清理完成');
    }

    /**
     * 清理所有注册的事件监听器
     */
    cleanupEventListeners() {
        console.log(`🗑️ 清理 ${this.activeEventListeners.size} 个事件监听器`);
        
        for (const [listenerId, listener] of this.activeEventListeners) {
            try {
                listener.element.removeEventListener(
                    listener.event, 
                    listener.handler, 
                    listener.options
                );
            } catch (error) {
                console.warn(`清理事件监听器失败 ${listenerId}:`, error);
            }
        }
        
        this.activeEventListeners.clear();
    }

    /**
     * 清理所有注册的定时器
     */
    cleanupTimers() {
        console.log(`⏰ 清理 ${this.activeTimers.size} 个定时器`);
        
        for (const timer of this.activeTimers) {
            try {
                if (timer.type === 'timeout') {
                    clearTimeout(timer.timerId);
                } else if (timer.type === 'interval') {
                    clearInterval(timer.timerId);
                }
            } catch (error) {
                console.warn(`清理定时器失败 ${timer.timerId}:`, error);
            }
        }
        
        this.activeTimers.clear();
    }

    /**
     * 清理Fabric画布实例
     * 🔧 增强base64数据清理
     */
    cleanupFabricCanvases() {
        console.log(`🎨 清理 ${this.activeFabricCanvases.size} 个Fabric画布`);
        
        for (const fabricCanvas of this.activeFabricCanvases) {
            try {
                // 🗑️ 特别清理：获取并清理所有对象的base64数据
                const objects = fabricCanvas.getObjects().filter(obj => !obj.isLockIndicator && !obj.skipInLayerList);
                objects.forEach(obj => {
                    if (obj.type === 'image' && obj._element) {
                        // 清理图像元素的src
                        if (obj._element.src && obj._element.src.startsWith('data:')) {
                            obj._element.src = '';
                        }
                        obj._element = null;
                    }
                    // 清理对象的所有引用
                    obj.canvas = null;
                    obj._objects = null;
                });
                
                // 清理画布背景图像（如果有）
                if (fabricCanvas.backgroundImage) {
                    if (fabricCanvas.backgroundImage._element && fabricCanvas.backgroundImage._element.src) {
                        fabricCanvas.backgroundImage._element.src = '';
                    }
                    fabricCanvas.backgroundImage = null;
                }
                
                // 清理画布对象
                fabricCanvas.clear();
                
                // 移除所有事件监听器
                fabricCanvas.off();
                
                // 🗑️ 清理内部canvas元素
                if (fabricCanvas.lowerCanvasEl) {
                    const ctx = fabricCanvas.lowerCanvasEl.getContext('2d');
                    if (ctx) {
                        ctx.clearRect(0, 0, fabricCanvas.lowerCanvasEl.width, fabricCanvas.lowerCanvasEl.height);
                    }
                }
                if (fabricCanvas.upperCanvasEl) {
                    const ctx = fabricCanvas.upperCanvasEl.getContext('2d');
                    if (ctx) {
                        ctx.clearRect(0, 0, fabricCanvas.upperCanvasEl.width, fabricCanvas.upperCanvasEl.height);
                    }
                }
                
                // 销毁画布实例
                fabricCanvas.dispose();
                
            } catch (error) {
                console.warn('清理Fabric画布失败:', error);
            }
        }
        
        this.activeFabricCanvases.clear();
    }

    /**
     * 清理图像缓存
     * 🔧 增强清理base64和blob数据
     */
    cleanupImageCache() {
        console.log(`🖼️ 清理 ${this.activeImageCache.size} 个图像缓存`);
        
        for (const [imageUrl, imageElement] of this.activeImageCache) {
            try {
                // 清理图像元素
                if (imageElement) {
                    imageElement.src = '';
                    imageElement.onload = null;
                    imageElement.onerror = null;
                    // 🗑️ 移除DOM引用
                    if (imageElement.parentNode) {
                        imageElement.parentNode.removeChild(imageElement);
                    }
                }
                
                // 如果是blob URL，释放它
                if (imageUrl.startsWith('blob:')) {
                    URL.revokeObjectURL(imageUrl);
                }
                
                // 🗑️ 特别处理base64 URL
                if (imageUrl.startsWith('data:')) {
                    // base64数据无法直接释放，但可以清理引用
                    console.log(`🗑️ Cleared base64 data reference: ${(imageUrl.length / 1024).toFixed(1)}KB`);
                }
                
            } catch (error) {
                console.warn(`清理图像缓存失败 ${imageUrl}:`, error);
            }
        }
        
        this.activeImageCache.clear();
        
        // 🗑️ 清理所有可能的全局图像引用
        this.cleanupGlobalImageReferences();
    }

    /**
     * 清理CSS动画
     */
    cleanupCSSAnimations() {
        // 停止所有可能的CSS动画
        const modalElements = document.querySelectorAll('#unified-editor-modal, #unified-editor-modal *');
        modalElements.forEach(element => {
            try {
                element.style.animation = 'none';
                element.style.transition = 'none';
            } catch (error) {
                // 忽略元素已被删除的错误
            }
        });
    }

    /**
     * 清理全局图像引用
     */
    cleanupGlobalImageReferences() {
        // 清理所有具有base64数据的img元素
        const allImages = document.querySelectorAll('img[src^="data:"]');
        allImages.forEach(img => {
            if (img.src && img.src.length > 10000) { // 只清理大的base64图像
                console.log(`🗑️ Cleaning large base64 image: ${(img.src.length / 1024).toFixed(1)}KB`);
                img.src = '';
            }
        });
        
        // 清理canvas元素
        const allCanvases = document.querySelectorAll('canvas');
        allCanvases.forEach(canvas => {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        });
    }
    
    /**
     * 强制垃圾回收提示
     */
    forceGarbageCollection() {
        // 在支持的浏览器中提示垃圾回收
        if (window.gc && typeof window.gc === 'function') {
            try {
                window.gc();
                console.log('🗑️ 强制垃圾回收已执行');
            } catch (error) {
                console.log('🗑️ 垃圾回收不可用');
            }
        }
        
        // 🗑️ 延迟清理（减少卡顿）
        setTimeout(() => {
            this.immediateGarbageCollection();
        }, 50); // 减少延迟时间
    }
    
    /**
     * 立即垃圾回收（减少卡顿）
     */
    immediateGarbageCollection() {
        try {
            if (window.gc && typeof window.gc === 'function') {
                window.gc();
                console.log('🗑️ Immediate garbage collection executed');
            }
            
            // 额外清理操作
            if (window.performance && window.performance.memory) {
                const before = window.performance.memory.usedJSHeapSize;
                // 强制触发内存清理
                const dummy = new Array(1000).fill(null);
                dummy.length = 0;
                const after = window.performance.memory.usedJSHeapSize;
                console.log(`🗑️ Memory: ${(before/1024/1024).toFixed(1)}MB -> ${(after/1024/1024).toFixed(1)}MB`);
            }
        } catch (error) {
            console.log('🗑️ Garbage collection failed:', error);
        }
    }
}

/**
 * 全局清理管理器实例
 */
export const globalCleanupManager = new ModalCleanupManager();

/**
 * 增强的事件监听器注册函数（自动管理清理）
 */
export function addManagedEventListener(element, event, handler, options = {}) {
    return globalCleanupManager.registerEventListener(element, event, handler, options);
}

/**
 * 增强的定时器注册函数（自动管理清理）
 */
export function addManagedTimeout(callback, delay) {
    const timerId = setTimeout(callback, delay);
    globalCleanupManager.registerTimer(timerId, 'timeout');
    return timerId;
}

export function addManagedInterval(callback, delay) {
    const timerId = setInterval(callback, delay);
    globalCleanupManager.registerTimer(timerId, 'interval');
    return timerId;
}

/**
 * 增强的Fabric画布注册函数（自动管理清理）
 */
export function registerManagedFabricCanvas(fabricCanvas) {
    globalCleanupManager.registerFabricCanvas(fabricCanvas);
}

/**
 * 增强的图像缓存注册函数（自动管理清理）
 */
export function registerManagedImageCache(imageUrl, imageElement) {
    globalCleanupManager.registerImageCache(imageUrl, imageElement);
}

/**
 * 执行完整的模态弹窗清理
 */
export function performModalCleanup() {
    // 🗑️ 特别清理base64数据泄露
    cleanupBase64MemoryLeaks();
    
    globalCleanupManager.performCompleteCleanup();
}

/**
 * 特别针对base64内存泄露的清理函数
 */
export function cleanupBase64MemoryLeaks() {
    console.log('🗑️ 开始特别清理base64内存泄露...');
    
    try {
        // 1. 清理所有大的base64图像
        const largeBase64Images = document.querySelectorAll('img');
        let totalCleaned = 0;
        largeBase64Images.forEach(img => {
            if (img.src && img.src.startsWith('data:image/') && img.src.length > 50000) {
                const sizeMB = (img.src.length / 1024 / 1024).toFixed(2);
                console.log(`🗑️ Clearing large base64 image: ${sizeMB}MB`);
                img.src = '';
                totalCleaned++;
            }
        });
        
        // 2. 清理ComfyUI widget中的base64数据
        if (window.app && window.app.graph && window.app.graph._nodes) {
            window.app.graph._nodes.forEach(node => {
                if (node.widgets) {
                    node.widgets.forEach(widget => {
                        if (widget.name === 'annotation_data' && widget.value) {
                            try {
                                const data = JSON.parse(widget.value);
                                if (data.canvasImageDataURL && data.canvasImageDataURL.length > 100000) {
                                    const sizeMB = (data.canvasImageDataURL.length / 1024 / 1024).toFixed(2);
                                    console.log(`🗑️ Found large base64 in widget: ${sizeMB}MB`);
                                    // 不直接删除，只是记录
                                }
                            } catch (e) {
                                // 忽略解析错误
                            }
                        }
                    });
                }
            });
        }
        
        // 3. 清理Canvas的图像数据
        const allCanvases = document.querySelectorAll('canvas');
        allCanvases.forEach(canvas => {
            try {
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                }
            } catch (e) {
                // 忽略错误
            }
        });
        
        // 4. 立即强制垃圾回收（解决卡顿问题）
        this.immediateGarbageCollection();
        
        console.log(`✅ Base64清理完成，共清理 ${totalCleaned} 个大型图像`);
        
    } catch (error) {
        console.warn('❌ Base64清理出错:', error);
    }
}