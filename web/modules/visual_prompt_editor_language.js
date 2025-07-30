/**
 * Visual Prompt Editor - 语言切换事件处理模块
 * 负责处理语言切换相关的事件和初始化
 */

import { t, getCurrentLanguage, toggleLanguage, updateAllUITexts, loadLanguageFromStorage } from './visual_prompt_editor_i18n.js';

/**
 * 初始化语言系统
 */
export function initializeLanguageSystem(modal) {
    // 加载保存的语言设置
    loadLanguageFromStorage();
    
    // 初始化语言切换按钮
    const languageToggle = modal.querySelector('#vpe-language-toggle');
    if (languageToggle) {
        // 绑定点击事件
        languageToggle.addEventListener('click', () => {
            const newLang = toggleLanguage();
            
            // 强制更新所有UI文本
            updateAllUITexts(modal);
            
            // 强制重新生成动态内容
            forceDynamicContentRefresh(modal);
            
            
            // 显示切换提示
            showLanguageChangeNotification(newLang);
        });
        
        // 添加悬停效果
        languageToggle.addEventListener('mouseenter', () => {
            languageToggle.style.transform = 'translateY(-1px)';
            languageToggle.style.boxShadow = '0 4px 8px rgba(33, 150, 243, 0.3)';
        });
        
        languageToggle.addEventListener('mouseleave', () => {
            languageToggle.style.transform = 'translateY(0)';
            languageToggle.style.boxShadow = 'none';
        });
    }
    
    // 初始化UI文本
    updateAllUITexts(modal);
}

/**
 * 显示语言切换通知
 */
function showLanguageChangeNotification(language) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #2196F3;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        z-index: 30000;
        box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
        animation: slideInRight 0.3s ease-out;
    `;
    
    const langText = language === 'en' ? 'English' : '中文';
    notification.textContent = `🌐 Language switched to ${langText}`;
    
    // 添加动画样式
    if (!document.getElementById('language-notification-styles')) {
        const style = document.createElement('style');
        style.id = 'language-notification-styles';
        style.textContent = `
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes slideOutRight {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // 3秒后自动移除
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

/**
 * 更新语言切换按钮文本
 */
export function updateLanguageToggleButton(modal) {
    const languageToggle = modal.querySelector('#vpe-language-toggle');
    if (languageToggle) {
        const currentLang = getCurrentLanguage();
        languageToggle.textContent = t('language_switch');
        languageToggle.title = currentLang === 'en' ? 'Switch to Chinese' : '切换到英文';
    }
}

/**
 * 获取当前语言的占位符文本
 */
export function getPlaceholderText(key) {
    return t(key);
}

/**
 * 更新下拉选项文本
 */
export function updateSelectOptions(modal) {
    // 更新操作类型选项
    const operationSelect = modal.querySelector('#current-layer-operation');
    if (operationSelect) {
        const options = operationSelect.querySelectorAll('option');
        options.forEach(option => {
            const value = option.value;
            const textKey = `op_${value}`;
            const translatedText = t(textKey);
            if (translatedText !== textKey) {
                option.textContent = translatedText;
            }
        });
    }
    
    // 更新模板分类选项
    const templateSelect = modal.querySelector('#template-category');
    if (templateSelect) {
        const options = templateSelect.querySelectorAll('option');
        options.forEach(option => {
            const value = option.value;
            const textKey = `template_${value}`;
            const translatedText = t(textKey);
            if (translatedText !== textKey) {
                option.textContent = translatedText;
            }
        });
    }
    
    // 更新AI增强器编辑意图选项
    const editIntentSelect = modal.querySelector('#edit-intent');
    if (editIntentSelect) {
        const options = editIntentSelect.querySelectorAll('option');
        options.forEach(option => {
            const value = option.value;
            const textKey = `ai_intent_${value}`;
            const translatedText = t(textKey);
            if (translatedText !== textKey) {
                option.textContent = translatedText;
            }
        });
    }
    
    // 更新AI增强器处理风格选项
    const processingStyleSelect = modal.querySelector('#processing-style');
    if (processingStyleSelect) {
        const options = processingStyleSelect.querySelectorAll('option');
        options.forEach(option => {
            const value = option.value;
            const textKey = `ai_style_${value}`;
            const translatedText = t(textKey);
            if (translatedText !== textKey) {
                option.textContent = translatedText;
            }
        });
    }
    
    // 更新AI增强器Temperature选项
    const temperatureSelect = modal.querySelector('#temperature');
    if (temperatureSelect) {
        const options = temperatureSelect.querySelectorAll('option');
        options.forEach(option => {
            const dataI18n = option.getAttribute('data-i18n');
            if (dataI18n) {
                const translatedText = t(dataI18n);
                if (translatedText !== dataI18n) {
                    option.textContent = translatedText;
                }
            }
        });
    }
    
    // 更新AI增强器随机种子选项
    const seedSelect = modal.querySelector('#seed');
    if (seedSelect) {
        const options = seedSelect.querySelectorAll('option');
        options.forEach(option => {
            const dataI18n = option.getAttribute('data-i18n');
            if (dataI18n) {
                const translatedText = t(dataI18n);
                if (translatedText !== dataI18n) {
                    option.textContent = translatedText;
                }
            }
        });
    }
}

/**
 * 更新动态文本内容
 */
export function updateDynamicTexts(modal) {
    // 更新选择计数
    const selectionCount = modal.querySelector('#selection-count');
    if (selectionCount) {
        const count = selectionCount.textContent.match(/\d+/);
        if (count) {
            selectionCount.textContent = `${count[0]} ${t('selection_count')}`;
        }
    }
    
    // 更新占位符文本
    const placeholderElements = [
        { selector: '#dropdown-text', key: 'placeholder_select_layers' },
        { selector: '#current-layer-description', key: 'placeholder_layer_description' },
        { selector: '#target-input', key: 'placeholder_target_input' },
        { selector: '#generated-description', key: 'placeholder_generated_description' }
    ];
    
    placeholderElements.forEach(({ selector, key }) => {
        const element = modal.querySelector(selector);
        if (element) {
            const placeholderText = t(key);
            if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
                element.placeholder = placeholderText;
            } else {
                element.textContent = placeholderText;
            }
        }
    });
}

/**
 * 强制刷新动态内容
 */
function forceDynamicContentRefresh(modal) {
    
    // 重新生成图层列表以使用新的翻译
    try {
        // 导入必要的函数（在运行时导入避免循环依赖）
        if (window.updateObjectSelector && typeof window.updateObjectSelector === 'function') {
            window.updateObjectSelector(modal);
        } else {
        }
    } catch (e) {
        console.warn('Error updating layer list:', e);
    }
    
    // 更新下拉选项
    updateSelectOptions(modal);
    
    // 更新动态文本
    updateDynamicTexts(modal);
    
    // 强制更新所有带有计数的元素
    const countElements = modal.querySelectorAll('[id*="count"], [class*="count"]');
    countElements.forEach(element => {
        const text = element.textContent;
        const numberMatch = text.match(/(\d+)/);
        if (numberMatch) {
            const number = numberMatch[1];
            const translatedText = `${number} ${t('selected_count')}`;
            element.textContent = translatedText;
        }
    });
    
}

/**
 * 完整的UI更新函数
 */
export function updateCompleteUI(modal) {
    updateAllUITexts(modal);
    updateLanguageToggleButton(modal);
    updateSelectOptions(modal);
    updateDynamicTexts(modal);
}

// 所有函数已通过单独的export语句导出