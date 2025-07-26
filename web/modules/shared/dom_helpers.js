/**
 * DOM Helper Utilities
 * 统一DOM操作工具 - 消除重复的DOM查询和操作
 */

// DOM查询缓存
const domCache = new Map();

/**
 * 缓存DOM查询结果
 * @param {string} key - 缓存键
 * @param {function} queryFn - 查询函数
 * @returns {Element} DOM元素
 */
export const cachedQuery = (key, queryFn) => {
    if (!domCache.has(key)) {
        domCache.set(key, queryFn());
    }
    return domCache.get(key);
};

/**
 * 清除DOM缓存 
 */
export const clearDOMCache = () => {
    domCache.clear();
};

/**
 * 统一模态框元素查询器
 * @param {Element} modal - 模态框元素
 * @returns {Object} 常用元素查询器对象
 */
export const createModalElementsCache = (modal) => {
    if (!modal) return null;
    
    const cache = {
        // 画布相关
        zoomContainer: () => modal.querySelector('#zoom-container'),
        canvasContainer: () => modal.querySelector('#canvas-container'),
        imageCanvas: () => modal.querySelector('#image-canvas'),
        drawingLayer: () => modal.querySelector('#drawing-layer'),
        
        // 图层相关
        layersList: () => modal.querySelector('#layers-list'),
        layersContainer: () => modal.querySelector('#layers-display-container'),
        
        // 工具栏相关
        toolbar: () => modal.querySelector('.toolbar'),
        toolButtons: () => modal.querySelectorAll('.tool-button'),
        
        // 提示词相关
        promptArea: () => modal.querySelector('#prompt-area'),
        constraintPromptsContainer: () => modal.querySelector('#layer-constraint-prompts-container'),
        decorativePromptsContainer: () => modal.querySelector('#layer-decorative-prompts-container'),
        
        // 通用查询方法
        querySelector: (selector) => modal.querySelector(selector),
        querySelectorAll: (selector) => modal.querySelectorAll(selector)
    };
    
    // 缓存到modal对象上
    modal.cachedElements = cache;
    return cache;
};

/**
 * 统一样式设置工具
 * @param {Element} element - 目标元素
 * @param {Object} styles - 样式对象或CSS字符串
 */
export const setElementStyles = (element, styles) => {
    if (!element) return;
    
    if (typeof styles === 'string') {
        element.style.cssText = styles;
    } else if (typeof styles === 'object') {
        Object.entries(styles).forEach(([property, value]) => {
            element.style[property] = value;
        });
    }
};

/**
 * 常用样式预设
 */
export const COMMON_STYLES = {
    layerItem: `
        display: flex !important;
        align-items: center !important;
        padding: 8px !important;
        margin-bottom: 4px !important;
        background: #2b2b2b !important;
        border-radius: 4px !important;
        cursor: pointer !important;
        border: 1px solid #444 !important;
        transition: all 0.2s ease !important;
    `,
    
    layerItemHover: `
        background: #333 !important;
    `,
    
    flexCenter: `
        display: flex;
        align-items: center;
        justify-content: center;
    `,
    
    absoluteOverlay: `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
    `,
    
    hidden: `
        display: none !important;
    `,
    
    visible: `
        display: block !important;
    `
};

/**
 * 统一事件绑定工具
 * @param {Element} element - 目标元素
 * @param {string} eventType - 事件类型
 * @param {function} handler - 事件处理函数
 * @param {Object} options - 事件选项
 */
export const bindEvent = (element, eventType, handler, options = {}) => {
    if (!element || !handler) return;
    
    const wrappedHandler = (e) => {
        if (options.preventDefault) e.preventDefault();
        if (options.stopPropagation) e.stopPropagation();
        return handler(e);
    };
    
    element.addEventListener(eventType, wrappedHandler);
    
    // 返回清理函数
    return () => element.removeEventListener(eventType, wrappedHandler);
};

/**
 * 批量事件绑定
 * @param {Element} element - 目标元素
 * @param {Object} events - 事件配置对象 {eventType: handler}
 * @param {Object} globalOptions - 全局事件选项
 */
export const bindEvents = (element, events, globalOptions = {}) => {
    if (!element || !events) return [];
    
    const cleanupFunctions = [];
    
    Object.entries(events).forEach(([eventType, handler]) => {
        const cleanup = bindEvent(element, eventType, handler, globalOptions);
        if (cleanup) cleanupFunctions.push(cleanup);
    });
    
    // 返回批量清理函数
    return () => cleanupFunctions.forEach(cleanup => cleanup());
};

/**
 * 创建DOM元素的便捷方法
 * @param {string} tagName - 标签名
 * @param {Object} attributes - 属性对象
 * @param {string|Element|Array} children - 子元素
 * @returns {Element} 创建的元素
 */
export const createElement = (tagName, attributes = {}, children = null) => {
    const element = document.createElement(tagName);
    
    // 设置属性
    Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'style') {
            setElementStyles(element, value);
        } else if (key === 'className') {
            element.className = value;
        } else {
            element.setAttribute(key, value);
        }
    });
    
    // 添加子元素
    if (children) {
        if (typeof children === 'string') {
            element.textContent = children;
        } else if (Array.isArray(children)) {
            children.forEach(child => {
                if (typeof child === 'string') {
                    element.appendChild(document.createTextNode(child));
                } else if (child instanceof Element) {
                    element.appendChild(child);
                }
            });
        } else if (children instanceof Element) {
            element.appendChild(children);
        }
    }
    
    return element;
};

/**
 * 安全的DOM操作 - 带错误处理
 * @param {function} operation - DOM操作函数
 * @param {*} fallbackValue - 失败时返回值
 */
export const safeDOMOperation = (operation, fallbackValue = null) => {
    try {
        return operation();
    } catch (error) {
        console.warn('DOM operation failed:', error);
        return fallbackValue;
    }
};

/**
 * 等待元素出现
 * @param {string} selector - 选择器
 * @param {Element} parent - 父元素
 * @param {number} timeout - 超时时间(ms)
 * @returns {Promise<Element>} 找到的元素
 */
export const waitForElement = (selector, parent = document, timeout = 5000) => {
    return new Promise((resolve, reject) => {
        const element = parent.querySelector(selector);
        if (element) {
            resolve(element);
            return;
        }
        
        const observer = new MutationObserver((mutations) => {
            const element = parent.querySelector(selector);
            if (element) {
                observer.disconnect();
                resolve(element);
            }
        });
        
        observer.observe(parent, {
            childList: true,
            subtree: true
        });
        
        setTimeout(() => {
            observer.disconnect();
            reject(new Error(`Element ${selector} not found within ${timeout}ms`));
        }, timeout);
    });
};

/**
 * DOM工厂 - 针对主文件常用元素的快速创建
 */
export const DOMFactory = {
    /**
     * 创建图层容器
     * @param {string} id - 容器ID
     * @param {Object} extraStyles - 额外样式
     * @returns {Element} 图层容器元素
     */
    createLayerContainer(id, extraStyles = {}) {
        return createElement('div', {
            id,
            className: 'layers-display-container',
            style: {
                position: 'absolute',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                ...extraStyles
            }
        });
    },

    /**
     * 创建图层元素
     * @param {Object} layer - 图层数据
     * @param {Object} options - 配置选项
     * @returns {Element} 图层元素
     */
    createLayerElement(layer, options = {}) {
        const { finalScale = 1, zIndex = 1 } = options;
        
        return createElement('div', {
            className: 'canvas-layer-display',
            id: `canvas-layer-${layer.id}`,
            style: {
                position: 'absolute',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                opacity: layer.opacity || 1,
                transform: `scale(${finalScale}) translate(${layer.transform?.x || 0}px, ${layer.transform?.y || 0}px)`,
                zIndex: zIndex,
                pointerEvents: 'none'
            }
        });
    },

    /**
     * 创建按钮元素
     * @param {string} text - 按钮文本
     * @param {function} onClick - 点击事件处理器
     * @param {Object} options - 配置选项
     * @returns {Element} 按钮元素
     */
    createButton(text, onClick, options = {}) {
        const {
            className = '',
            style = {},
            id = null,
            type = 'button'
        } = options;

        const button = createElement('button', {
            type,
            className,
            id,
            style: {
                padding: '8px 16px',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                transition: 'all 0.2s ease',
                ...style
            }
        }, text);

        if (onClick) {
            bindEvent(button, 'click', onClick);
        }

        return button;
    },

    /**
     * 创建输入框元素
     * @param {Object} options - 配置选项
     * @returns {Element} 输入框元素
     */
    createInput(options = {}) {
        const {
            type = 'text',
            className = '',
            style = {},
            placeholder = '',
            value = '',
            onChange = null,
            id = null
        } = options;

        const input = createElement('input', {
            type,
            className,
            id,
            placeholder,
            value,
            style: {
                padding: '6px 8px',
                border: '1px solid #444',
                borderRadius: '4px',
                background: '#2b2b2b',
                color: 'white',
                fontSize: '12px',
                ...style
            }
        });

        if (onChange) {
            bindEvent(input, 'change', onChange);
        }

        return input;
    },

    /**
     * 创建样式元素
     * @param {string} id - 样式ID
     * @param {string} cssText - CSS内容
     * @returns {Element} 样式元素
     */
    createStyle(id, cssText) {
        const existingStyle = document.getElementById(id);
        if (existingStyle) {
            existingStyle.textContent = cssText;
            return existingStyle;
        }

        const style = createElement('style', { id }, cssText);
        document.head.appendChild(style);
        return style;
    },

    /**
     * 创建变换控制器
     * @param {Object} options - 配置选项
     * @returns {Element} 控制器元素
     */
    createTransformController(options = {}) {
        const {
            id = 'transform-controller',
            size = 8,
            position = { top: 0, left: 0 }
        } = options;

        const controller = createElement('div', {
            id,
            className: 'transform-controller',
            style: {
                position: 'absolute',
                top: `${position.top}px`,
                left: `${position.left}px`,
                width: `${size}px`,
                height: `${size}px`,
                background: '#10b981',
                border: '2px solid white',
                borderRadius: '50%',
                cursor: 'move',
                zIndex: 1000,
                pointerEvents: 'auto'
            }
        });

        return controller;
    }
};

/**
 * 样式管理器 - 扩展的样式预设和管理
 */
export const StyleManager = {
    // 扩展样式预设
    presets: {
        ...COMMON_STYLES,
        
        // 图层相关样式
        layerContainer: {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            pointerEvents: 'none'
        },

        // 按钮样式
        primaryButton: {
            background: '#10b981',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
        },

        secondaryButton: {
            background: '#374151',
            color: 'white',
            border: '1px solid #6b7280',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
        },

        // 输入框样式
        textInput: {
            padding: '6px 8px',
            border: '1px solid #444',
            borderRadius: '4px',
            background: '#2b2b2b',
            color: 'white',
            fontSize: '12px'
        },

        // 变换控制器样式
        transformHandle: {
            position: 'absolute',
            width: '8px',
            height: '8px',
            background: '#10b981',
            border: '2px solid white',
            borderRadius: '50%',
            cursor: 'move',
            zIndex: 1000,
            pointerEvents: 'auto'
        },

        transformHandleHover: {
            background: '#059669',
            transform: 'scale(1.2)'
        },

        // 下拉框文本样式
        dropdownTextPlaceholder: {
            color: '#aaa',
            fontSize: '12px'
        },

        dropdownTextSelected: {
            color: 'white',
            fontSize: '12px'
        }
    },

    /**
     * 应用样式预设
     * @param {Element} element - 目标元素
     * @param {string} presetName - 预设名称
     * @param {Object} overrides - 覆盖样式
     */
    applyPreset(element, presetName, overrides = {}) {
        if (!element || !this.presets[presetName]) return;
        
        const preset = this.presets[presetName];
        const finalStyles = { ...preset, ...overrides };
        setElementStyles(element, finalStyles);
    },

    /**
     * 切换样式类
     * @param {Element} element - 目标元素
     * @param {string} className - 类名
     * @param {boolean} force - 强制添加/移除
     */
    toggleClass(element, className, force = null) {
        if (!element) return;
        
        if (force === null) {
            element.classList.toggle(className);
        } else {
            element.classList.toggle(className, force);
        }
    },

    /**
     * 添加悬停效果
     * @param {Element} element - 目标元素
     * @param {Object} hoverStyles - 悬停样式
     * @param {Object} normalStyles - 正常样式
     */
    addHoverEffect(element, hoverStyles, normalStyles = {}) {
        if (!element) return;

        const cleanup = bindEvents(element, {
            mouseenter: () => setElementStyles(element, hoverStyles),
            mouseleave: () => setElementStyles(element, normalStyles)
        });

        return cleanup;
    }
};

/**
 * 事件管理器 - 扩展的事件处理功能
 */
export const EventManager = {
    /**
     * 事件委托
     * @param {Element} container - 容器元素
     * @param {string} selector - 目标选择器
     * @param {string} eventType - 事件类型
     * @param {function} handler - 事件处理器
     * @param {Object} options - 事件选项
     */
    delegate(container, selector, eventType, handler, options = {}) {
        if (!container || !selector || !handler) return;

        const delegateHandler = (e) => {
            const target = e.target.closest(selector);
            if (target && container.contains(target)) {
                if (options.preventDefault) e.preventDefault();
                if (options.stopPropagation) e.stopPropagation();
                handler.call(target, e);
            }
        };

        bindEvent(container, eventType, delegateHandler);
        
        return () => container.removeEventListener(eventType, delegateHandler);
    },

    /**
     * 一次性事件绑定
     * @param {Element} element - 目标元素
     * @param {string} eventType - 事件类型
     * @param {function} handler - 事件处理器
     */
    once(element, eventType, handler) {
        if (!element || !handler) return;

        const onceHandler = (e) => {
            handler(e);
            element.removeEventListener(eventType, onceHandler);
        };

        element.addEventListener(eventType, onceHandler);
        
        return () => element.removeEventListener(eventType, onceHandler);
    },

    /**
     * 防抖事件处理
     * @param {function} handler - 事件处理器
     * @param {number} delay - 延迟时间(ms)
     */
    debounce(handler, delay = 300) {
        let timeoutId;
        
        return function(...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => handler.apply(this, args), delay);
        };
    },

    /**
     * 节流事件处理
     * @param {function} handler - 事件处理器
     * @param {number} interval - 间隔时间(ms)
     */
    throttle(handler, interval = 100) {
        let lastCall = 0;
        
        return function(...args) {
            const now = Date.now();
            if (now - lastCall >= interval) {
                lastCall = now;
                handler.apply(this, args);
            }
        };
    }
};