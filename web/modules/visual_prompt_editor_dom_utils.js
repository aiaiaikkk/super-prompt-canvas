/**
 * Visual Prompt Editor - DOM操作工具类
 * 提供统一的DOM操作接口，减少重复代码
 * 
 * 版本: v1.0.0 - 初始版本  
 * 日期: 2025-07-22
 */

import { SELECTORS, CSS_CLASSES } from './visual_prompt_editor_constants.js';

/**
 * DOM查询管理器
 * 提供缓存的DOM查询功能
 */
export class DOMManager {
    constructor() {
        this.cache = new Map();
    }

    /**
     * 查询单个元素 (带缓存)
     * @param {Element|Document} root - 查询根元素
     * @param {string} selector - CSS选择器
     * @param {boolean} useCache - 是否使用缓存
     * @returns {Element|null}
     */
    query(root, selector, useCache = false) {
        const cacheKey = `${root.constructor.name}:${selector}`;
        
        if (useCache && this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        
        const element = root.querySelector(selector);
        
        if (useCache && element) {
            this.cache.set(cacheKey, element);
        }
        
        return element;
    }

    /**
     * 查询多个元素
     * @param {Element|Document} root - 查询根元素
     * @param {string} selector - CSS选择器  
     * @returns {NodeList}
     */
    queryAll(root, selector) {
        return root.querySelectorAll(selector);
    }

    /**
     * 创建元素
     * @param {string} tagName - 标签名
     * @param {Object} attributes - 属性对象
     * @param {Element} parent - 父元素
     * @returns {Element}
     */
    create(tagName, attributes = {}, parent = null) {
        const element = document.createElement(tagName);
        
        // 设置属性
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'textContent') {
                element.textContent = value;
            } else if (key === 'innerHTML') {
                element.innerHTML = value;
            } else if (key === 'style' && typeof value === 'object') {
                Object.assign(element.style, value);
            } else {
                element.setAttribute(key, value);
            }
        });
        
        // 添加到父元素
        if (parent) {
            parent.appendChild(element);
        }
        
        return element;
    }

    /**
     * 创建SVG元素
     * @param {string} tagName - SVG标签名
     * @param {Object} attributes - 属性对象
     * @returns {SVGElement}
     */
    createSVG(tagName, attributes = {}) {
        const element = document.createElementNS('http://www.w3.org/2000/svg', tagName);
        
        Object.entries(attributes).forEach(([key, value]) => {
            element.setAttribute(key, value);
        });
        
        return element;
    }

    /**
     * 安全移除元素
     * @param {Element} element - 要移除的元素
     */
    remove(element) {
        if (element && element.parentNode) {
            element.parentNode.removeChild(element);
        }
    }

    /**
     * 清空缓存
     */
    clearCache() {
        this.cache.clear();
    }
}

/**
 * 事件绑定管理器
 * 提供统一的事件绑定和解绑功能
 */
export class EventManager {
    constructor() {
        this.listeners = new WeakMap();
    }

    /**
     * 绑定事件
     * @param {Element} element - 目标元素
     * @param {string} event - 事件名  
     * @param {Function} handler - 事件处理器
     * @param {Object} options - 事件选项
     */
    bind(element, event, handler, options = {}) {
        const wrappedHandler = (e) => {
            if (options.preventDefault) e.preventDefault();
            if (options.stopPropagation) e.stopPropagation();
            handler.call(element, e);
        };

        element.addEventListener(event, wrappedHandler, options);

        // 存储处理器引用以便后续移除
        if (!this.listeners.has(element)) {
            this.listeners.set(element, new Map());
        }
        this.listeners.get(element).set(`${event}:${handler.name}`, wrappedHandler);

        return wrappedHandler;
    }

    /**
     * 解绑事件
     * @param {Element} element - 目标元素
     * @param {string} event - 事件名
     * @param {Function} handler - 事件处理器
     */
    unbind(element, event, handler) {
        const elementListeners = this.listeners.get(element);
        if (elementListeners) {
            const wrappedHandler = elementListeners.get(`${event}:${handler.name}`);
            if (wrappedHandler) {
                element.removeEventListener(event, wrappedHandler);
                elementListeners.delete(`${event}:${handler.name}`);
            }
        }
    }

    /**
     * 解绑元素的所有事件
     * @param {Element} element - 目标元素
     */
    unbindAll(element) {
        const elementListeners = this.listeners.get(element);
        if (elementListeners) {
            elementListeners.clear();
            this.listeners.delete(element);
        }
    }
}

/**
 * CSS类管理器
 * 提供便捷的CSS类操作
 */
export class CSSManager {
    /**
     * 添加类
     * @param {Element} element - 目标元素
     * @param {...string} classNames - 类名列表
     */
    static addClass(element, ...classNames) {
        element.classList.add(...classNames);
    }

    /**
     * 移除类
     * @param {Element} element - 目标元素
     * @param {...string} classNames - 类名列表
     */
    static removeClass(element, ...classNames) {
        element.classList.remove(...classNames);
    }

    /**
     * 切换类
     * @param {Element} element - 目标元素
     * @param {string} className - 类名
     * @returns {boolean} - 是否添加了类
     */
    static toggleClass(element, className) {
        return element.classList.toggle(className);
    }

    /**
     * 检查是否包含类
     * @param {Element} element - 目标元素
     * @param {string} className - 类名
     * @returns {boolean}
     */
    static hasClass(element, className) {
        return element.classList.contains(className);
    }
}

// 创建全局实例
export const domManager = new DOMManager();
export const eventManager = new EventManager();

// 便捷函数导出
export const $ = (selector, root = document) => domManager.query(root, selector);
export const $$ = (selector, root = document) => domManager.queryAll(root, selector);
export const create = (tagName, attrs, parent) => domManager.create(tagName, attrs, parent);
export const createSVG = (tagName, attrs) => domManager.createSVG(tagName, attrs);