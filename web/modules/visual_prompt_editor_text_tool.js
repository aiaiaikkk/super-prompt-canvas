/**
 * Visual Prompt Editor - 文字工具模块
 * 基于Fabric.js的专业文字标注工具，支持中文和自定义字体
 */

import { generateId } from './visual_prompt_editor_utils.js';

/**
 * 文字工具管理器
 */
export class TextToolManager {
    constructor(fabricCanvas, modal) {
        this.fabricCanvas = fabricCanvas;
        this.modal = modal;
        
        // 文字工具属性
        this.textColor = '#ff0000';  // 默认红色
        this.fontSize = 24;
        this.fontFamily = 'Arial';
        this.textBold = false;
        this.textItalic = false;
        this.availableFonts = ['Arial', 'Times New Roman', 'SimSun', 'Microsoft YaHei', 'PingFang SC'];
        this.customFonts = new Map(); // 存储用户上传的自定义字体
        
    }
    
    /**
     * 初始化文字工具
     */
    initialize() {
        this.setupFontUpload();
        this.setupTextControls();
    }
    
    /**
     * 设置字体上传功能
     */
    setupFontUpload() {
        
        const uploadFontBtn = this.modal.querySelector('#upload-font-btn');
        const fontUploadInput = this.modal.querySelector('#font-upload-input');
        
        if (!uploadFontBtn || !fontUploadInput) {
            console.warn('Font upload elements not found');
            return;
        }
        
        // 点击按钮触发文件选择
        uploadFontBtn.addEventListener('click', () => {
            fontUploadInput.click();
        });
        
        // 字体文件选择处理
        fontUploadInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file && this.isValidFontFile(file)) {
                this.loadFontFile(file);
            } else {
                alert('请选择有效的字体文件（.ttf, .otf, .woff, .woff2）');
            }
        });
        
    }
    
    /**
     * 验证字体文件类型
     */
    isValidFontFile(file) {
        const validExtensions = ['.ttf', '.otf', '.woff', '.woff2'];
        const fileName = file.name.toLowerCase();
        return validExtensions.some(ext => fileName.endsWith(ext));
    }
    
    /**
     * 加载字体文件
     */
    async loadFontFile(file) {
        
        try {
            // 创建字体名称（去除扩展名）
            const fontName = file.name.replace(/\.(ttf|otf|woff|woff2)$/i, '');
            
            // 创建字体URL
            const fontUrl = URL.createObjectURL(file);
            
            // 创建FontFace对象
            const fontFace = new FontFace(fontName, `url(${fontUrl})`);
            
            // 加载字体
            await fontFace.load();
            
            // 添加到document.fonts
            document.fonts.add(fontFace);
            
            // 存储到自定义字体集合
            this.customFonts.set(fontName, {
                name: fontName,
                url: fontUrl,
                file: file
            });
            
            // 更新字体选择器
            this.updateFontSelector(fontName);
            
            alert(`字体 "${fontName}" 上传成功！`);
            
        } catch (error) {
            console.error('Font loading failed:', error);
            alert('字体加载失败，请检查文件格式是否正确');
        }
    }
    
    /**
     * 更新字体选择器
     */
    updateFontSelector(newFontName) {
        const fontSelector = this.modal.querySelector('#font-family-select');
        if (fontSelector) {
            // 检查是否已存在该字体选项
            const existingOption = Array.from(fontSelector.options).find(
                option => option.value === newFontName
            );
            
            if (!existingOption) {
                const option = document.createElement('option');
                option.value = newFontName;
                option.textContent = `${newFontName} (自定义)`;
                fontSelector.appendChild(option);
                
                // 自动选择新上传的字体
                fontSelector.value = newFontName;
                this.fontFamily = newFontName;
            }
        }
    }
    
    /**
     * 设置文字工具控件
     */
    setupTextControls() {
        
        // 字体选择器
        const fontFamilySelect = this.modal.querySelector('#font-family-select');
        if (fontFamilySelect) {
            fontFamilySelect.addEventListener('change', (e) => {
                this.fontFamily = e.target.value;
                this.updateSelectedTextObjects();
            });
        }
        
        // 字体大小滑块
        const fontSizeSlider = this.modal.querySelector('#font-size-slider');
        const fontSizeDisplay = this.modal.querySelector('#font-size-display');
        if (fontSizeSlider && fontSizeDisplay) {
            fontSizeSlider.addEventListener('input', (e) => {
                this.fontSize = parseInt(e.target.value);
                fontSizeDisplay.textContent = `${this.fontSize}px`;
                this.updateSelectedTextObjects();
            });
        }
        
        // 文字颜色选择器
        const textColorPicker = this.modal.querySelector('#text-color-picker');
        if (textColorPicker) {
            textColorPicker.addEventListener('change', (e) => {
                this.textColor = e.target.value;
                this.updateSelectedTextObjects();
            });
        }
        
        // 粗体按钮
        const textBoldBtn = this.modal.querySelector('#text-bold-btn');
        if (textBoldBtn) {
            textBoldBtn.addEventListener('click', () => {
                this.textBold = !this.textBold;
                textBoldBtn.style.background = this.textBold ? '#4CAF50' : '#555';
                this.updateSelectedTextObjects();
            });
        }
        
        // 斜体按钮
        const textItalicBtn = this.modal.querySelector('#text-italic-btn');
        if (textItalicBtn) {
            textItalicBtn.addEventListener('click', () => {
                this.textItalic = !this.textItalic;
                textItalicBtn.style.background = this.textItalic ? '#4CAF50' : '#555';
                this.updateSelectedTextObjects();
            });
        }
        
    }
    
    /**
     * 更新选中的文字对象样式
     */
    updateSelectedTextObjects() {
        const activeObjects = this.fabricCanvas.getActiveObjects();
        let updated = false;
        
        activeObjects.forEach(obj => {
            if (obj.type === 'text') {
                obj.set({
                    fontFamily: this.fontFamily,
                    fontSize: this.fontSize,
                    fill: this.textColor,
                    fontWeight: this.textBold ? 'bold' : 'normal',
                    fontStyle: this.textItalic ? 'italic' : 'normal'
                });
                updated = true;
            }
        });
        
        if (updated) {
            this.fabricCanvas.renderAll();
        }
    }
    
    /**
     * 创建文字对象
     */
    createTextObject(e) {
        if (!window.fabric) {
            console.error('Fabric.js not loaded');
            return null;
        }
        
        const pointer = this.fabricCanvas.getPointer(e.e);
        
        // 创建可编辑文字对象（使用IText而不是Text）
        const text = new window.fabric.IText('双击编辑文字', {
            left: pointer.x,
            top: pointer.y,
            fontFamily: this.fontFamily,
            fontSize: this.fontSize,
            fill: this.textColor,
            fontWeight: this.textBold ? 'bold' : 'normal',
            fontStyle: this.textItalic ? 'italic' : 'normal',
            id: generateId(),
            hasControls: true,
            hasBorders: true,
            editable: true,
            selectable: true,
            lockMovementX: false,
            lockMovementY: false
        });
        
        // 添加到画布
        this.fabricCanvas.add(text);
        this.fabricCanvas.setActiveObject(text);
        this.fabricCanvas.renderAll();
        
        // 立即进入编辑模式（IText支持enterEditing）
        setTimeout(() => {
            if (text && this.fabricCanvas.getActiveObject() === text) {
                text.enterEditing();
                text.selectAll();
            }
        }, 50);
        
        return text;
    }
    
    /**
     * 显示文字工具控制面板
     */
    showTextControlPanel() {
        const textControls = this.modal.querySelector('#text-controls');
        if (textControls) {
            textControls.style.display = 'block';
        }
    }
    
    /**
     * 隐藏文字工具控制面板
     */
    hideTextControlPanel() {
        const textControls = this.modal.querySelector('#text-controls');
        if (textControls) {
            textControls.style.display = 'none';
        }
    }
    
    /**
     * 获取字体属性（供外部调用）
     */
    getTextProperties() {
        return {
            fontFamily: this.fontFamily,
            fontSize: this.fontSize,
            textColor: this.textColor,
            textBold: this.textBold,
            textItalic: this.textItalic
        };
    }
    
    /**
     * 设置字体属性（供外部调用）
     */
    setTextProperties(properties) {
        if (properties.fontFamily) this.fontFamily = properties.fontFamily;
        if (properties.fontSize) this.fontSize = properties.fontSize;
        if (properties.textColor) this.textColor = properties.textColor;
        if (typeof properties.textBold !== 'undefined') this.textBold = properties.textBold;
        if (typeof properties.textItalic !== 'undefined') this.textItalic = properties.textItalic;
        
        // 更新UI控件状态
        this.updateUIControls();
    }
    
    /**
     * 更新UI控件状态
     */
    updateUIControls() {
        const fontFamilySelect = this.modal.querySelector('#font-family-select');
        const fontSizeSlider = this.modal.querySelector('#font-size-slider');
        const fontSizeDisplay = this.modal.querySelector('#font-size-display');
        const textColorPicker = this.modal.querySelector('#text-color-picker');
        const textBoldBtn = this.modal.querySelector('#text-bold-btn');
        const textItalicBtn = this.modal.querySelector('#text-italic-btn');
        
        if (fontFamilySelect) fontFamilySelect.value = this.fontFamily;
        if (fontSizeSlider) fontSizeSlider.value = this.fontSize;
        if (fontSizeDisplay) fontSizeDisplay.textContent = `${this.fontSize}px`;
        if (textColorPicker) textColorPicker.value = this.textColor;
        if (textBoldBtn) textBoldBtn.style.background = this.textBold ? '#4CAF50' : '#555';
        if (textItalicBtn) textItalicBtn.style.background = this.textItalic ? '#4CAF50' : '#555';
    }
    
    /**
     * 清理资源
     */
    cleanup() {
        // 清理自定义字体的URL对象
        this.customFonts.forEach(font => {
            if (font.url && font.url.startsWith('blob:')) {
                URL.revokeObjectURL(font.url);
            }
        });
        this.customFonts.clear();
        
    }
}

/**
 * 创建文字工具管理器
 */
export function createTextToolManager(fabricCanvas, modal) {
    return new TextToolManager(fabricCanvas, modal);
}

/**
 * 获取文字工具管理器实例
 */
export function getTextToolManager(modal) {
    if (!modal._textToolManager) {
        console.warn('Text tool manager not initialized');
        return null;
    }
    return modal._textToolManager;
}