/**
 * Visual Prompt Editor - 统一通知系统
 * 整合和增强现有的通知功能
 * 
 * 版本: v1.0.0 - 初始版本
 * 日期: 2025-07-22
 */

import { COLORS, TIMING, MESSAGES } from './visual_prompt_editor_constants.js';
import { KontextUtils } from './visual_prompt_editor_utils.js';

/**
 * 统一通知管理器
 * 基于现有KontextUtils.showNotification的增强版本
 */
export class NotificationManager {
    constructor() {
        this.activeNotifications = new Set();
        this.defaultDuration = TIMING.NOTIFICATION_DURATION;
    }

    /**
     * 显示通知 (委托给现有系统)
     * @param {string} message - 通知消息
     * @param {string} type - 通知类型 ('info'|'success'|'error'|'warning')
     * @param {number} duration - 显示时长
     */
    show(message, type = 'info', duration = null) {
        const actualDuration = duration || this.defaultDuration;
        
        // 使用现有的KontextUtils.showNotification
        KontextUtils.showNotification(message, type, actualDuration);
        
        // 记录活动通知
        const notificationId = Date.now() + Math.random();
        this.activeNotifications.add(notificationId);
        
        // 定时移除记录
        setTimeout(() => {
            this.activeNotifications.delete(notificationId);
        }, actualDuration);
        
        return notificationId;
    }

    /**
     * 显示成功通知
     * @param {string} message - 消息
     */
    success(message) {
        return this.show(message, 'success');
    }

    /**
     * 显示错误通知
     * @param {string} message - 消息
     */
    error(message) {
        return this.show(message, 'error');
    }

    /**
     * 显示警告通知
     * @param {string} message - 消息
     */
    warning(message) {
        return this.show(message, 'warning');
    }

    /**
     * 显示信息通知
     * @param {string} message - 消息
     */
    info(message) {
        return this.show(message, 'info');
    }

    /**
     * 显示操作结果通知
     * @param {boolean} success - 操作是否成功
     * @param {string} successMsg - 成功消息
     * @param {string} errorMsg - 失败消息
     */
    result(success, successMsg, errorMsg) {
        return success ? this.success(successMsg) : this.error(errorMsg);
    }

    /**
     * 批量显示通知 (有延迟)
     * @param {Array} messages - 消息数组 [{message, type, duration?}]
     * @param {number} delay - 间隔延迟
     */
    batch(messages, delay = 500) {
        messages.forEach((msg, index) => {
            setTimeout(() => {
                this.show(msg.message, msg.type, msg.duration);
            }, index * delay);
        });
    }

    /**
     * 获取活动通知数量
     * @returns {number}
     */
    getActiveCount() {
        return this.activeNotifications.size;
    }

    /**
     * 清空活动通知记录
     */
    clear() {
        this.activeNotifications.clear();
    }
}

// 创建全局通知管理器实例
export const notificationManager = new NotificationManager();

// 便捷函数导出
export const showNotification = (msg, type, duration) => notificationManager.show(msg, type, duration);
export const showSuccess = (msg) => notificationManager.success(msg);
export const showError = (msg) => notificationManager.error(msg);
export const showWarning = (msg) => notificationManager.warning(msg);
export const showInfo = (msg) => notificationManager.info(msg);

// 预定义常用消息的快捷方法
export const Notifications = {
    // 成功消息
    annotationCreated: () => showSuccess(MESSAGES.SUCCESS.ANNOTATION_CREATED),
    layerToggled: () => showSuccess(MESSAGES.SUCCESS.LAYER_TOGGLED),
    dataExported: () => showSuccess(MESSAGES.SUCCESS.DATA_EXPORTED),
    
    // 错误消息
    genericError: () => showError(MESSAGES.ERRORS.GENERIC),
    imageLoadError: () => showError(MESSAGES.ERRORS.IMAGE_LOAD),
    annotationCreateError: () => showError(MESSAGES.ERRORS.ANNOTATION_CREATE),
    layerToggleError: () => showError(MESSAGES.ERRORS.LAYER_TOGGLE)
};