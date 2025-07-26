/**
 * Visual Prompt Editor - 翻译工具函数
 * 从annotations模块拆分出的安全翻译工具
 * 
 * 版本: v1.0.0 - 从annotations.js拆分
 * 日期: 2025-07-23
 * 拆分来源: visual_prompt_editor_annotations.js 行13-36
 */

import { t } from './visual_prompt_editor_i18n.js';

/**
 * 安全的翻译函数包装器
 * 提供错误处理和回退机制
 * @param {string} key - 翻译键
 * @param {string} fallback - 回退文本
 * @returns {string} 翻译后的文本或回退文本
 */
export const safeT = (key, fallback) => {
    try {
        if (typeof t === 'function') {
            const result = t(key);
            return result !== key ? result : (fallback || key);
        }
        return fallback || key;
    } catch (e) {
        console.warn('Translation error for key:', key, e);
        return fallback || key;
    }
};

/**
 * 翻译操作类型
 * @param {string} operationType - 操作类型
 * @returns {string} 翻译后的操作类型
 */
export const translateOperationType = (operationType) => {
    const operationKey = `op_${operationType}`;
    return safeT(operationKey, operationType);
};

/**
 * 翻译形状类型  
 * @param {string} shapeType - 形状类型
 * @returns {string} 翻译后的形状类型
 */
export const translateShapeType = (shapeType) => {
    const shapeKey = `shape_${shapeType}`;
    return safeT(shapeKey, shapeType);
};