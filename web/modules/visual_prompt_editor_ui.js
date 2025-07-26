/**
 * Visual Prompt Editor - UI组件模块
 * 负责创建和管理UI界面组件
 */

import { t, getCurrentLanguage, toggleLanguage, updateAllUITexts, loadLanguageFromStorage } from './visual_prompt_editor_i18n.js';

/**
 * 创建主模态弹窗
 */
export function createMainModal() {
    const modal = document.createElement('div');
    modal.id = 'unified-editor-modal'; // 使用与原始版本相同的ID
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.95); z-index: 25000;
        display: flex; justify-content: center; align-items: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    
    // 添加CSS重置和隔离 (与原始版本一致)
    const globalStyle = document.createElement('style');
    globalStyle.textContent = `
        #unified-editor-modal * {
            box-sizing: border-box !important;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        }
        #unified-editor-modal button {
            border: none !important;
            outline: none !important;
            cursor: pointer !important;
        }
        #unified-editor-modal button:focus {
            outline: none !important;
        }
    `;
    document.head.appendChild(globalStyle);
    
    const content = document.createElement('div');
    content.style.cssText = `
        width: 98%; height: 95%; background: #1a1a1a;
        border-radius: 12px; display: flex; flex-direction: column;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.1);
        overflow: hidden;
    `;
    
    modal.appendChild(content);
    return { modal, content };
}

/**
 * 创建顶部标题栏
 */
export function createTitleBar() {
    const titleBar = document.createElement('div');
    titleBar.style.cssText = `
        background: linear-gradient(135deg, #673AB7, #9C27B0);
        color: white; padding: 16px 24px; display: flex;
        justify-content: space-between; align-items: center;
        border-top-left-radius: 12px; border-top-right-radius: 12px;
    `;
    
    titleBar.innerHTML = `
        <div style="display: flex; align-items: center; gap: 16px;">
            <span style="font-size: 24px;">🎨</span>
            <span style="font-weight: 700; font-size: 20px;" data-i18n="title">Visual Prompt Editor</span>
            <span style="background: rgba(255, 255, 255, 0.15); padding: 4px 12px; border-radius: 20px; font-size: 11px; opacity: 0.9;" data-i18n="subtitle">
                Unified Annotation & Prompt Generation
            </span>
        </div>
        <div style="display: flex; gap: 12px;">
            <button id="vpe-language-toggle" style="background: #2196F3; border: none; color: white; padding: 10px 16px; border-radius: 6px; cursor: pointer; font-weight: 600; transition: all 0.2s;" data-i18n="language_switch">
                🌐 中文
            </button>
            <button id="vpe-save" style="background: #4CAF50; border: none; color: white; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600; transition: all 0.2s;" data-i18n="save_apply">
                💾 Save & Apply
            </button>
            <button id="vpe-close" style="background: #f44336; border: none; color: white; padding: 10px 16px; border-radius: 6px; cursor: pointer; font-weight: 600; transition: all 0.2s;" data-i18n="close">
                ✕ Close
            </button>
        </div>
    `;
    
    return titleBar;
}

/**
 * 创建工具栏
 */
export function createToolbar() {
    const toolbar = document.createElement('div');
    toolbar.style.cssText = `
        background: #333; border-bottom: 1px solid #404040; padding: 12px 16px;
        display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
    `;
    
    toolbar.innerHTML = `
        <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap; min-height: 32px; width: 100%;">
            <!-- 绘制工具组 -->
            <div style="display: flex; gap: 4px; align-items: center; border-right: 1px solid #555; padding-right: 8px;">
                <span style="color: #ccc; font-size: 11px;" data-i18n="tools">Tools:</span>
                <button class="vpe-tool" data-tool="rectangle" title="Rectangle" data-i18n-title="tooltip_rectangle">📐</button>
                <button class="vpe-tool" data-tool="circle" title="Circle (Shift=Perfect Circle)" data-i18n-title="tooltip_circle">⭕</button>
                <button class="vpe-tool" data-tool="arrow" title="Arrow" data-i18n-title="tooltip_arrow">➡️</button>
                <button class="vpe-tool" data-tool="freehand" title="Freehand Drawing (Left-click to add anchor points, right-click to close)" data-i18n-title="tooltip_freehand">🔗</button>
                <button class="vpe-tool" data-tool="brush" title="Brush (Adjustable size and feather)" data-i18n-title="tooltip_brush">🖌️</button>
                <button class="vpe-tool" data-tool="eraser" title="Eraser" data-i18n-title="tooltip_eraser">🗑️</button>
            </div>
            
            <!-- 颜色选择组 -->
            <div style="display: flex; gap: 4px; align-items: center; border-right: 1px solid #555; padding-right: 8px;">
                <span style="color: #ccc; font-size: 11px;" data-i18n="colors">Colors:</span>
                <button class="vpe-color" data-color="#ff0000" style="background: linear-gradient(135deg, #ff0000, #cc0000); border: 2px solid #fff; box-shadow: 0 2px 4px rgba(255,0,0,0.3);"></button>
                <button class="vpe-color" data-color="#00ff00" style="background: linear-gradient(135deg, #00ff00, #00cc00); border: 2px solid #fff; box-shadow: 0 2px 4px rgba(0,255,0,0.3);"></button>
                <button class="vpe-color" data-color="#ffff00" style="background: linear-gradient(135deg, #ffff00, #cccc00); border: 2px solid #fff; box-shadow: 0 2px 4px rgba(255,255,0,0.3);"></button>
                <button class="vpe-color" data-color="#0000ff" style="background: linear-gradient(135deg, #0000ff, #0000cc); border: 2px solid #fff; box-shadow: 0 2px 4px rgba(0,0,255,0.3);"></button>
            </div>
            
            <!-- 编辑操作组 -->
            <div style="display: flex; gap: 4px; align-items: center; border-right: 1px solid #555; padding-right: 8px;">
                <span style="color: #ccc; font-size: 11px;" data-i18n="edit">Edit:</span>
                <button id="vpe-transform-mode" style="font-size: 11px; padding: 4px 8px; background: #444; border: 1px solid #666;" title="Toggle Transform Mode (Click layers to transform)" data-i18n="btn_transform" data-i18n-title="tooltip_transform">🔄 Transform</button>
                <button id="vpe-undo" style="font-size: 11px; padding: 4px 8px;" title="Undo" data-i18n="btn_undo" data-i18n-title="tooltip_undo">↶ Undo</button>
                <button id="vpe-clear" style="font-size: 11px; padding: 4px 8px;" title="Clear All" data-i18n="btn_clear" data-i18n-title="tooltip_clear">🗂️ Clear</button>
            </div>
            
            <!-- 填充样式组 -->
            <div style="display: flex; gap: 4px; align-items: center; border-right: 1px solid #555; padding-right: 8px;">
                <span style="color: #ccc; font-size: 11px;" data-i18n="fill">Fill:</span>
                <button id="vpe-fill-toggle" style="font-size: 11px; padding: 4px 8px;" title="Toggle between filled and outline annotations" data-i18n="btn_filled" data-i18n-title="tooltip_fill_toggle">🔴 Filled</button>
            </div>
            
            <!-- 不透明度控制组 -->
            <div style="display: flex; gap: 6px; align-items: center; border-right: 1px solid #555; padding-right: 8px;">
                <span style="color: #ccc; font-size: 11px;" data-i18n="opacity">Opacity:</span>
                <input type="range" id="vpe-opacity-slider" min="10" max="100" value="50" 
                       style="width: 80px; height: 20px; background: #333; outline: none; cursor: pointer;" 
                       title="Adjust annotation opacity (10-100%)" data-i18n-title="tooltip_opacity">
                <span id="vpe-opacity-value" style="color: #aaa; font-size: 10px; min-width: 30px; text-align: center;">50%</span>
            </div>
            
            <!-- 画笔控制组 -->
            <div id="vpe-brush-controls" style="display: none; gap: 6px; align-items: center; border-right: 1px solid #555; padding-right: 8px;">
                <span style="color: #ccc; font-size: 11px;" data-i18n="brush">Brush:</span>
                <span style="color: #aaa; font-size: 10px;" data-i18n="size">Size:</span>
                <input type="range" id="vpe-brush-size" min="5" max="50" value="20" 
                       style="width: 60px; height: 20px; background: #333; outline: none; cursor: pointer;" 
                       title="Adjust brush size (5-50px)" data-i18n-title="tooltip_brush_size">
                <span id="vpe-brush-size-value" style="color: #aaa; font-size: 10px; min-width: 25px; text-align: center;">20px</span>
                <span style="color: #aaa; font-size: 10px;" data-i18n="feather">Feather:</span>
                <input type="range" id="vpe-brush-feather" min="0" max="20" value="5" 
                       style="width: 60px; height: 20px; background: #333; outline: none; cursor: pointer;" 
                       title="Adjust brush feather/softness (0-20px)" data-i18n-title="tooltip_brush_feather">
                <span id="vpe-brush-feather-value" style="color: #aaa; font-size: 10px; min-width: 25px; text-align: center;">5px</span>
            </div>
            
            <!-- 视图控制组 -->
            <div style="display: flex; gap: 4px; align-items: center;">
                <span style="color: #ccc; font-size: 11px;" data-i18n="view">View:</span>
                <button id="vpe-zoom-fit" style="font-size: 11px; padding: 4px 8px;" title="Fit to Screen" data-i18n="btn_fit" data-i18n-title="tooltip_zoom_fit">Fit</button>
                <button id="vpe-zoom-100" style="font-size: 11px; padding: 4px 8px;" title="100% Zoom" data-i18n="btn_zoom_100" data-i18n-title="tooltip_zoom_100">1:1</button>
                <button id="vpe-zoom-in" style="font-size: 11px; padding: 4px 6px;" title="Zoom In" data-i18n="btn_zoom_in" data-i18n-title="tooltip_zoom_in">+</button>
                <button id="vpe-zoom-out" style="font-size: 11px; padding: 4px 6px;" title="Zoom Out" data-i18n="btn_zoom_out" data-i18n-title="tooltip_zoom_out">-</button>
                <span id="vpe-zoom-level" style="color: #aaa; font-size: 10px; min-width: 40px; text-align: center;">100%</span>
            </div>
        </div>
    `;
    
    // 添加工具栏样式
    const style = document.createElement('style');
    style.textContent = `
        /* 基础按钮样式 */
        .vpe-tool, #vpe-undo, #vpe-clear, #vpe-fill-toggle, #vpe-zoom-fit, #vpe-zoom-100, #vpe-zoom-in, #vpe-zoom-out {
            background: #555 !important;
            border: none !important;
            color: white !important;
            border-radius: 3px !important;
            cursor: pointer !important;
            transition: all 0.2s !important;
            white-space: nowrap !important;
        }
        
        /* 工具按钮 */
        .vpe-tool {
            padding: 4px 8px !important;
            font-size: 11px !important;
            height: 24px !important;
        }
        
        /* 编辑操作按钮 */
        #vpe-undo, #vpe-clear, #vpe-fill-toggle {
            padding: 4px 8px !important;
            font-size: 11px !important;
            height: 26px !important;
        }
        
        /* 视图控制按钮 */
        #vpe-zoom-fit, #vpe-zoom-100 {
            padding: 4px 8px !important;
            font-size: 11px !important;
            height: 26px !important;
        }
        
        #vpe-zoom-in, #vpe-zoom-out {
            padding: 4px 6px !important;
            font-size: 11px !important;
            height: 26px !important;
            min-width: 26px !important;
        }
        
        
        /* 颜色按钮 */
        .vpe-color {
            width: 22px !important;
            height: 22px !important;
            border-radius: 50% !important;
            cursor: pointer !important;
            transition: all 0.2s !important;
            position: relative !important;
            overflow: hidden !important;
            padding: 0 !important;
            border: 2px solid #666 !important;
        }
        
        /* 悬停效果 */
        .vpe-tool:hover, #vpe-undo:hover, #vpe-clear:hover, #vpe-fill-toggle:hover, #vpe-zoom-fit:hover, #vpe-zoom-100:hover, #vpe-zoom-in:hover, #vpe-zoom-out:hover {
            background: #666 !important;
            transform: translateY(-1px) !important;
        }
        
        .vpe-color:hover {
            transform: scale(1.1) !important;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3) !important;
        }
        
        /* 激活状态 */
        .vpe-tool.active {
            background: #673AB7 !important;
            box-shadow: 0 0 4px rgba(103, 58, 183, 0.5) !important;
        }
        
        /* 填充切换按钮激活状态 */
        #vpe-fill-toggle.outline {
            background: #FF9800 !important;
            box-shadow: 0 0 4px rgba(255, 152, 0, 0.5) !important;
        }
        
        /* 不透明度滑块样式 */
        #vpe-opacity-slider {
            -webkit-appearance: none !important;
            appearance: none !important;
            background: #444 !important;
            border-radius: 10px !important;
            height: 4px !important;
            width: 80px !important;
            outline: none !important;
            cursor: pointer !important;
        }
        
        #vpe-opacity-slider::-webkit-slider-thumb {
            -webkit-appearance: none !important;
            appearance: none !important;
            width: 14px !important;
            height: 14px !important;
            border-radius: 50% !important;
            background: #4CAF50 !important;
            cursor: pointer !important;
            box-shadow: 0 0 4px rgba(76, 175, 80, 0.5) !important;
        }
        
        #vpe-opacity-slider::-moz-range-thumb {
            width: 14px !important;
            height: 14px !important;
            border-radius: 50% !important;
            background: #4CAF50 !important;
            cursor: pointer !important;
            border: none !important;
            box-shadow: 0 0 4px rgba(76, 175, 80, 0.5) !important;
        }
        
        #vpe-opacity-value {
            color: #aaa !important;
            font-size: 10px !important;
            min-width: 30px !important;
            text-align: center !important;
            font-weight: 500 !important;
        }
        
        .vpe-color.active {
            border-color: #fff !important;
            box-shadow: 0 0 6px rgba(255, 255, 255, 0.5) !important;
            transform: scale(1.1) !important;
        }
        
        
        /* 缩放级别显示 */
        #vpe-zoom-level {
            color: #aaa !important;
            background: transparent !important;
            min-width: 40px !important;
            text-align: center !important;
            padding: 2px 4px !important;
            font-weight: 500 !important;
        }
        
        /* 工具栏分组边框 */
        .toolbar-group {
            border-right: 1px solid #555 !important;
            padding-right: 8px !important;
        }
    `;
    document.head.appendChild(style);
    
    return toolbar;
}

/**
 * 创建主体区域
 */
export function createMainArea() {
    const mainArea = document.createElement('div');
    mainArea.style.cssText = `
        flex: 1; display: flex; background: #1e1e1e;
        overflow: hidden; min-height: 0;
    `;
    
    return mainArea;
}

/**
 * 创建左侧画布区域
 */
export function createCanvasArea() {
    const canvasArea = document.createElement('div');
    canvasArea.style.cssText = `
        flex: 1; background: #2a2a2a; display: flex; flex-direction: column;
        border-right: 1px solid #404040;
        min-width: 0; /* 确保flex item能够收缩 */
    `;
    
    // 画布容器
    const canvasContainer = document.createElement('div');
    canvasContainer.id = 'canvas-container';
    canvasContainer.style.cssText = `
        flex: 1; position: relative; overflow: hidden; background: #1a1a1a;
        display: flex; align-items: center; justify-content: center;
    `;
    
    // 缩放容器
    const zoomContainer = document.createElement('div');
    zoomContainer.id = 'zoom-container';
    zoomContainer.style.cssText = `
        position: absolute; top: 50%; left: 50%; transform-origin: center center;
        transform: translate(-50%, -50%) scale(1.0);
        transition: transform 0.3s ease;
    `;
    
    canvasContainer.appendChild(zoomContainer);
    canvasArea.appendChild(canvasContainer);
    
    return { canvasArea, canvasContainer, zoomContainer };
}


/**
 * 创建右侧提示词编辑区域
 */
export function createPromptArea() {
    const promptArea = document.createElement('div');
    promptArea.style.cssText = `
        width: 380px; background: #2b2b2b; display: flex; flex-direction: column;
        border-left: 1px solid #404040;
        flex-shrink: 0; /* 防止右侧面板被压缩 */
    `;
    
    // 创建标签页标题栏
    const tabHeader = document.createElement('div');
    tabHeader.style.cssText = `
        display: flex; background: #333; border-bottom: 1px solid #404040;
    `;
    
    // 标签页按钮
    const tabs = [
        { id: 'layers-tab', text: '🔴 图层', key: 'tab_layers' },
        { id: 'controls-tab', text: '🎛️ 控制', key: 'tab_controls' },
        { id: 'ai-enhancer-tab', text: '🤖 AI增强', key: 'tab_ai_enhancer' }
    ];
    
    tabs.forEach((tab, index) => {
        const tabButton = document.createElement('button');
        tabButton.id = tab.id;
        tabButton.className = 'vpe-tab-button';
        tabButton.style.cssText = `
            flex: 1; padding: 12px 8px; background: #444; color: #ccc; border: none;
            cursor: pointer; font-size: 11px; transition: all 0.3s ease;
            border-right: ${index < tabs.length - 1 ? '1px solid #555' : 'none'};
        `;
        tabButton.innerHTML = tab.text;
        tabButton.setAttribute('data-i18n', tab.key);
        
        // 默认激活第一个标签
        if (index === 0) {
            tabButton.style.background = '#10b981';
            tabButton.style.color = 'white';
            tabButton.classList.add('active');
        }
        
        tabHeader.appendChild(tabButton);
    });
    
    // 标签页内容容器
    const tabContent = document.createElement('div');
    tabContent.id = 'tab-content-container';
    tabContent.className = 'tab-content';
    tabContent.style.cssText = `
        flex: 1; overflow-y: auto; min-height: 0; padding: 8px;
    `;
    
    // 默认显示图层标签页内容
    tabContent.appendChild(createLayersTabContent());
    
    promptArea.appendChild(tabHeader);
    promptArea.appendChild(tabContent);
    
    return promptArea;
}

/**
 * 创建图层标签页内容
 */
export function createLayersTabContent() {
    const layersContent = document.createElement('div');
    layersContent.id = 'layers-tab-content';
    layersContent.style.cssText = `
        padding: 16px; display: block;
    `;
    
    layersContent.innerHTML = `
        <!-- 图层选择和管理 -->
        <!-- 统一的图层选择与操作 - 集成标注图层和连接图层 -->
        <div style="background: #333; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
            <div style="color: #4CAF50; font-weight: 600; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between;">
                <span data-i18n="layer_selection_operations">🎯 Layer Selection & Operations</span>
                <div style="display: flex; align-items: center; gap: 16px;">
                    <span id="selection-count" style="color: #888; font-size: 11px;">0 selected</span>
                </div>
            </div>
            
            <!-- 图层直接选择列表 -->
            <div style="margin-bottom: 16px;">
                <label id="layer-selection-label" style="display: block; color: #aaa; font-size: 12px; margin-bottom: 8px; font-weight: 500;" data-i18n="select_layers">📋 Available Layers</label>
                <div id="layers-list-container" style="background: #2b2b2b; border: 1px solid #555; border-radius: 6px; max-height: 300px; overflow-y: auto; position: relative; z-index: 100;">
                    <div id="layers-list" style="padding: 8px; position: relative; z-index: 101;">
                        <!-- 图层列表将在这里动态生成 -->
                    </div>
                </div>
                <div style="margin-top: 8px; display: flex; gap: 8px; align-items: center;">
                    <button id="select-all-layers" style="padding: 6px 12px; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 600;" data-i18n="btn_select_all">
                        📋 Select All
                    </button>
                    <button id="clear-selection" style="padding: 6px 12px; background: #666; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 600;" data-i18n="btn_clear_selection">
                        🗑️ Clear
                    </button>
                    <span id="selection-count-info" style="color: #888; font-size: 11px; margin-left: auto;">0 selected</span>
                </div>
            </div>
            
            <!-- 当前编辑图层信息 -->
            <div id="current-layer-info" style="display: none; margin-bottom: 16px; padding: 12px; background: #2a2a2a; border-radius: 6px; border-left: 4px solid #4CAF50;">
                <div id="layer-title" style="color: white; font-weight: 600; margin-bottom: 4px;"></div>
                <div id="layer-subtitle" style="color: #aaa; font-size: 11px;"></div>
            </div>
            
            <!-- 批量操作或单个图层编辑 -->
            <div id="layer-operations" style="display: none;">
                <div style="margin-bottom: 16px;">
                    <label style="display: block; color: #aaa; font-size: 12px; margin-bottom: 6px; font-weight: 500;" data-i18n="operation_type">⚙️ Operation Type</label>
                    <select id="current-layer-operation" style="width: 100%; padding: 10px; background: #2b2b2b; color: white; border: 1px solid #555; border-radius: 6px; font-size: 13px;">
                        <option value="add_object" data-i18n="op_add_object">Add Object</option>
                        <option value="change_color" data-i18n="op_change_color">Change Color</option>
                        <option value="change_style" data-i18n="op_change_style">Change Style</option>
                        <option value="replace_object" data-i18n="op_replace_object">Replace Object</option>
                        <option value="remove_object" data-i18n="op_remove_object">Remove Object</option>
                        <option value="change_texture" data-i18n="op_change_texture">Change Texture</option>
                        <option value="change_pose" data-i18n="op_change_pose">Change Pose</option>
                        <option value="change_expression" data-i18n="op_change_expression">Change Expression</option>
                        <option value="change_clothing" data-i18n="op_change_clothing">Change Clothing</option>
                        <option value="change_background" data-i18n="op_change_background">Change Background</option>
                        <!-- 核心局部操作 (L11-L18) -->
                        <option value="enhance_quality" data-i18n="op_enhance_quality">Enhance Quality</option>
                        <option value="blur_background" data-i18n="op_blur_background">Blur Background</option>
                        <option value="adjust_lighting" data-i18n="op_adjust_lighting">Adjust Lighting</option>
                        <option value="resize_object" data-i18n="op_resize_object">Resize Object</option>
                        <option value="enhance_skin_texture" data-i18n="op_enhance_skin_texture">Enhance Skin Texture</option>
                        <option value="character_expression" data-i18n="op_character_expression">Character Expression</option>
                        <option value="character_hair" data-i18n="op_character_hair">Character Hair</option>
                        <option value="character_accessories" data-i18n="op_character_accessories">Character Accessories</option>
                        <!-- 新增：来自kontext-presets的局部操作 -->
                        <option value="zoom_focus" data-i18n="op_zoom_focus">Zoom Focus</option>
                        <option value="stylize_local" data-i18n="op_stylize_local">Stylize Local</option>
                        <!-- 自定义操作 -->
                        <option value="custom" data-i18n="op_custom">Custom Operation</option>
                    </select>
                </div>
                
                <div id="layer-constraint-prompts-container" style="margin-bottom: 16px;">
                    <label style="display: block; color: #aaa; font-size: 12px; margin-bottom: 6px; font-weight: 500;" data-i18n="constraint_prompts">🔒 Constraint Prompts (Select multiple)</label>
                    <div style="padding: 8px; background: #2b2b2b; border: 1px solid #555; border-radius: 4px; color: #888; text-align: center;" data-i18n="select_operation_constraint">
                        Please select an operation type to load constraint prompts...
                    </div>
                    <div style="font-size: 11px; color: #777; margin-top: 2px;" data-i18n="constraint_prompts_help">
                        Quality control and technical constraints for better results
                    </div>
                </div>
                
                <div id="layer-decorative-prompts-container" style="margin-bottom: 16px;">
                    <label style="display: block; color: #aaa; font-size: 12px; margin-bottom: 6px; font-weight: 500;" data-i18n="decorative_prompts">🎨 Decorative Prompts (Select multiple)</label>
                    <div style="padding: 8px; background: #2b2b2b; border: 1px solid #555; border-radius: 4px; color: #888; text-align: center;" data-i18n="select_operation_decorative">
                        Please select an operation type to load decorative prompts...
                    </div>
                    <div style="font-size: 11px; color: #777; margin-top: 2px;" data-i18n="decorative_prompts_help">
                        Aesthetic enhancements and visual quality improvements
                    </div>
                </div>
                
                <div style="margin-bottom: 16px;">
                    <label style="display: block; color: #aaa; font-size: 12px; margin-bottom: 6px; font-weight: 500;" data-i18n="description">📝 Description</label>
                    <textarea id="current-layer-description" 
                              style="width: 100%; height: 80px; padding: 10px; background: #2b2b2b; color: white; border: 1px solid #555; border-radius: 6px; font-size: 13px; resize: vertical; font-family: inherit; line-height: 1.4;"
                              placeholder="Enter description for selected layer(s)..." data-i18n-placeholder="placeholder_layer_description"></textarea>
                </div>
                
                <div style="display: flex; gap: 8px;">
                    <button id="apply-to-selected" style="flex: 1; padding: 10px; background: #4CAF50; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 12px;" data-i18n="btn_apply_to_selected">
                        ✅ Apply to Selected
                    </button>
                </div>
            </div>
            
            <!-- 空状态提示 -->
            <div id="no-layers-message" style="text-align: center; color: #888; padding: 40px 20px;">
                <div style="font-size: 18px; margin-bottom: 8px;">📝</div>
                <div style="font-size: 14px; margin-bottom: 4px;" data-i18n="no_layers_title">No annotation layers yet</div>
                <div style="font-size: 11px;" data-i18n="no_layers_subtitle">Create annotations to start editing</div>
            </div>
        </div>
        
    `;
    
    return layersContent;
}

/**
 * 创建控制标签页内容
 */
export function createControlsTabContent() {
    const controlsContent = document.createElement('div');
    controlsContent.id = 'controls-tab-content';
    controlsContent.style.cssText = `
        padding: 16px; display: block;
    `;
    
    controlsContent.innerHTML = `
        <!-- 编辑控制 -->
        <div style="background: #333; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
            <div style="color: #4CAF50; font-weight: 600; margin-bottom: 12px;" data-i18n="edit_control">🎯 Edit Control</div>
            
            <div style="margin-bottom: 12px;">
                <label style="display: block; color: #aaa; font-size: 12px; margin-bottom: 4px;" data-i18n="template_category">Template Category</label>
                <select id="template-category" style="width: 100%; padding: 8px; background: #2b2b2b; color: white; border: 1px solid #555; border-radius: 4px; margin-bottom: 8px;">
                    <option value="global" data-i18n="template_global">🌍 Global Adjustments (15 templates)</option>
                    <option value="text" data-i18n="template_text">📝 Text Editing (5 templates)</option>
                    <option value="professional" data-i18n="template_professional">🔧 Professional Operations (15 templates)</option>
                </select>
            </div>
            
            <div style="margin-bottom: 12px;">
                <label style="display: block; color: #aaa; font-size: 12px; margin-bottom: 4px;" data-i18n="edit_operation_type">Edit Operation Type</label>
                <select id="operation-type" style="width: 100%; padding: 8px; background: #2b2b2b; color: white; border: 1px solid #555; border-radius: 4px;">
                    <!-- 动态填充选项 -->
                </select>
            </div>
            
            <div style="margin-bottom: 12px;">
                <label style="display: block; color: #aaa; font-size: 12px; margin-bottom: 4px;" data-i18n="description_text">📝 Description Text</label>
                <textarea id="target-input" 
                          style="width: 100%; height: 80px; padding: 8px; background: #2b2b2b; color: white; border: 1px solid #555; border-radius: 4px; resize: vertical; font-family: inherit; font-size: 14px; line-height: 1.4;" 
                          placeholder="Enter editing instructions for selected objects..." data-i18n-placeholder="placeholder_target_input"></textarea>
            </div>
            
            <div style="margin-bottom: 12px;">
                <label style="display: flex; align-items: center; gap: 8px; color: #aaa; font-size: 12px; cursor: pointer;">
                    <input type="checkbox" id="include-annotation-numbers" 
                           style="width: 14px; height: 14px; accent-color: #4CAF50; cursor: pointer;">
                    <span data-i18n="include_annotation_numbers">Include annotation numbers in description</span>
                </label>
                <div style="font-size: 11px; color: #777; margin-top: 2px; margin-left: 22px;" data-i18n="annotation_numbers_help">
                    🏷️ Show annotation numbers (e.g., "annotation 1") in generated prompts
                </div>
            </div>
            
            <button id="generate-prompt" style="width: 100%; padding: 10px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;" data-i18n="btn_generate_description">
                ✨ Generate Description
            </button>
        </div>
        
        <!-- 生成的描述 -->
        <div style="background: #333; padding: 16px; border-radius: 8px;">
            <div style="color: #FF9800; font-weight: 600; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                <span data-i18n="generated_description">📝 Generated Description</span>
                <span id="description-status" style="font-size: 12px; padding: 2px 6px; border-radius: 3px; background: #555; color: #ccc; display: none;" data-i18n="edited_status">
                    ✏️ Edited
                </span>
            </div>
            <textarea id="generated-description" 
                      style="width: 100%; height: 120px; padding: 12px; background: #2b2b2b; color: white; border: 1px solid #555; border-radius: 4px; resize: vertical; font-family: inherit; font-size: 14px; line-height: 1.4; transition: border-color 0.3s ease;" 
                      placeholder="Generated description text will appear here..." data-i18n-placeholder="placeholder_generated_description"></textarea>
            
            <div style="display: flex; gap: 8px; margin-top: 8px;">
                <button id="copy-description" style="flex: 1; padding: 8px; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;" data-i18n="btn_copy">
                    📋 Copy
                </button>
                <button id="clear-description" style="flex: 1; padding: 8px; background: #666; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;" data-i18n="btn_clear_description">
                    🧹 Clear
                </button>
            </div>
        </div>
    `;
    
    return controlsContent;
}

/**
 * 创建AI增强器标签页内容
 */
export function createAIEnhancerTabContent() {
    const aiContent = document.createElement('div');
    aiContent.id = 'ai-enhancer-tab-content';
    aiContent.style.cssText = `
        padding: 8px; display: block;
    `;
    
    // AI增强器内容 - 调整宽度使其填满容器
    aiContent.innerHTML = `
        <!-- AI增强器选择 -->
        <div style="background: #333; border-radius: 6px; padding: 18px; margin-bottom: 16px; width: 100%; box-sizing: border-box;">
            <div style="color: #10b981; font-weight: bold; margin-bottom: 14px; font-size: 15px; text-align: left;" data-i18n="ai_select_enhancer">🚀 选择增强器</div>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;">
                <div class="enhancer-card" data-enhancer="api" style="background: #10b981; color: white; border-radius: 4px; padding: 12px; cursor: pointer; text-align: center; font-size: 12px; transition: all 0.3s ease;" data-i18n="ai_enhancer_api">
                    API云端
                </div>
                <div class="enhancer-card" data-enhancer="ollama" style="background: #555; color: #ccc; border-radius: 4px; padding: 12px; cursor: pointer; text-align: center; font-size: 12px; transition: all 0.3s ease;" data-i18n="ai_enhancer_ollama">
                    Ollama本地
                </div>
                <div class="enhancer-card" data-enhancer="textgen" style="background: #555; color: #ccc; border-radius: 4px; padding: 12px; cursor: pointer; text-align: center; font-size: 12px; transition: all 0.3s ease;" data-i18n="ai_enhancer_textgen">
                    TextGen
                </div>
            </div>
        </div>
        
        <!-- API配置面板 -->
        <div id="enhancer-config-container" style="background: #333; border-radius: 6px; padding: 18px; margin-bottom: 16px; width: 100%; box-sizing: border-box;">
            <div id="enhancer-config-toggle" style="display: flex; justify-content: space-between; align-items: center; cursor: pointer; margin-bottom: 14px;">
                <div style="color: #10b981; font-weight: bold; font-size: 15px;" data-i18n="ai_api_settings">⚙️ API设置</div>
                <div id="config-arrow" style="color: #10b981; font-size: 14px; transition: transform 0.3s ease; transform: rotate(-90deg);">▼</div>
            </div>
            
            <div id="enhancer-config" style="max-height: 0px; overflow: hidden; transition: max-height 0.3s ease-out;">
                <!-- API云端配置 -->
                <div id="api-config" style="display: block;">
                    <div style="margin-bottom: 12px;">
                        <label style="color: #ccc; font-size: 12px; margin-bottom: 6px; display: block; font-weight: 500;" data-i18n="api_key_label">API Key:</label>
                        <input type="password" id="api-key-input" style="width: 100%; background: #222; border: 1px solid #555; color: white; padding: 10px; border-radius: 4px; font-size: 12px; box-sizing: border-box;" placeholder="输入您的API Key" data-i18n-placeholder="api_key_placeholder">
                    </div>
                    <div style="margin-bottom: 12px;">
                        <label style="color: #ccc; font-size: 12px; margin-bottom: 6px; display: block; font-weight: 500;" data-i18n="api_model_label">模型选择:</label>
                        <select id="api-model-select" style="width: 100%; background: #222; border: 1px solid #555; color: white; padding: 10px; border-radius: 4px; font-size: 12px; box-sizing: border-box;">
                            <option value="gpt-4">GPT-4</option>
                            <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                            <option value="claude-3">Claude 3</option>
                        </select>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <button onclick="testAPIConnection()" style="background: #2196F3; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: bold;" data-i18n="test_connection">测试连接</button>
                        <div id="api-status" style="color: #666; font-size: 11px;">● 未测试</div>
                    </div>
                </div>
                
                <!-- Ollama本地配置 -->
                <div id="ollama-config" style="display: none;">
                    <div style="margin-bottom: 12px;">
                        <label style="color: #ccc; font-size: 12px; margin-bottom: 6px; display: block; font-weight: 500;" data-i18n="ollama_url_label">服务地址:</label>
                        <input type="text" id="ollama-url-input" style="width: 100%; background: #222; border: 1px solid #555; color: white; padding: 10px; border-radius: 4px; font-size: 12px; box-sizing: border-box;" placeholder="http://localhost:11434" value="http://localhost:11434" data-i18n-placeholder="ollama_url_placeholder">
                    </div>
                    <div style="margin-bottom: 12px;">
                        <label style="color: #ccc; font-size: 12px; margin-bottom: 6px; display: block; font-weight: 500;" data-i18n="ollama_model_label">模型选择:</label>
                        <select id="ollama-model-select" style="width: 100%; background: #222; border: 1px solid #555; color: white; padding: 10px; border-radius: 4px; font-size: 12px; box-sizing: border-box;">
                            <option value="llama3.1:8b">Llama 3.1 8B</option>
                            <option value="llama3.1:70b">Llama 3.1 70B</option>
                            <option value="mistral:7b">Mistral 7B</option>
                            <option value="codellama:7b">CodeLlama 7B</option>
                        </select>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <button onclick="testOllamaConnection()" style="background: #2196F3; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: bold;" data-i18n="test_connection">测试连接</button>
                        <div id="ollama-status" style="color: #666; font-size: 11px;">● 未测试</div>
                    </div>
                </div>
                
                <!-- TextGen配置 -->
                <div id="textgen-config" style="display: none;">
                    <div style="margin-bottom: 12px;">
                        <label style="color: #ccc; font-size: 12px; margin-bottom: 6px; display: block; font-weight: 500;" data-i18n="textgen_url_label">服务地址:</label>
                        <input type="text" id="textgen-url-input" style="width: 100%; background: #222; border: 1px solid #555; color: white; padding: 10px; border-radius: 4px; font-size: 12px; box-sizing: border-box;" placeholder="http://localhost:5000" value="http://localhost:5000" data-i18n-placeholder="textgen_url_placeholder">
                    </div>
                    <div style="margin-bottom: 12px;">
                        <label style="color: #ccc; font-size: 12px; margin-bottom: 6px; display: block; font-weight: 500;" data-i18n="textgen_model_label">模型选择:</label>
                        <select id="textgen-model-select" style="width: 100%; background: #222; border: 1px solid #555; color: white; padding: 10px; border-radius: 4px; font-size: 12px; box-sizing: border-box;">
                            <option value="llama-3.1-8b-instruct">Llama 3.1 8B Instruct</option>
                            <option value="llama-3.1-70b-instruct">Llama 3.1 70B Instruct</option>
                            <option value="mistral-7b-instruct">Mistral 7B Instruct</option>
                            <option value="codellama-7b-instruct">CodeLlama 7B Instruct</option>
                        </select>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <button onclick="testTextGenConnection()" style="background: #2196F3; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: bold;" data-i18n="test_connection">测试连接</button>
                        <div id="textgen-status" style="color: #666; font-size: 11px;">● 未测试</div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- 编辑输入 -->
        <div style="background: #333; border-radius: 6px; padding: 18px; margin-bottom: 16px; width: 100%; box-sizing: border-box;">
            <div style="color: #10b981; font-weight: bold; margin-bottom: 14px; font-size: 15px;" data-i18n="ai_edit_description">✏️ 编辑描述</div>
            <textarea id="edit-description" style="width: 100%; height: 80px; background: #222; border: 1px solid #555; color: white; padding: 12px; border-radius: 4px; font-size: 13px; resize: vertical; box-sizing: border-box; font-family: inherit;" data-i18n-placeholder="ai_placeholder_description">将红色标记区域的天空颜色改成深蓝色的晚霞效果</textarea>
        </div>
        
        <!-- 参数控制 -->
        <div style="background: #333; border-radius: 6px; padding: 18px; margin-bottom: 16px; width: 100%; box-sizing: border-box;">
            <div style="color: #10b981; font-weight: bold; margin-bottom: 14px; font-size: 15px;" data-i18n="ai_parameter_settings">🎛️ 参数设置</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
                <div>
                    <label style="color: #ccc; font-size: 12px; margin-bottom: 6px; display: block; font-weight: 500;" data-i18n="ai_edit_intent">编辑意图</label>
                    <select id="edit-intent" style="width: 100%; background: #222; border: 1px solid #555; color: white; padding: 10px; border-radius: 4px; font-size: 12px; box-sizing: border-box;">
                        <option value="general_editing" selected data-i18n="ai_intent_general_editing">通用编辑</option>
                        <option value="product_showcase" data-i18n="ai_intent_product_showcase">产品展示优化</option>
                        <option value="portrait_enhancement" data-i18n="ai_intent_portrait_enhancement">人像美化</option>
                        <option value="creative_design" data-i18n="ai_intent_creative_design">创意设计</option>
                        <option value="architectural_photo" data-i18n="ai_intent_architectural_photo">建筑摄影</option>
                        <option value="food_styling" data-i18n="ai_intent_food_styling">美食摄影</option>
                        <option value="fashion_retail" data-i18n="ai_intent_fashion_retail">时尚零售</option>
                        <option value="landscape_nature" data-i18n="ai_intent_landscape_nature">风景自然</option>
                        <option value="professional_editing" data-i18n="ai_intent_professional_editing">专业图像编辑</option>
                        <option value="custom" data-i18n="ai_intent_custom">自定义</option>
                    </select>
                </div>
                <div>
                    <label style="color: #ccc; font-size: 12px; margin-bottom: 6px; display: block; font-weight: 500;" data-i18n="ai_processing_style">处理风格</label>
                    <select id="processing-style" style="width: 100%; background: #222; border: 1px solid #555; color: white; padding: 10px; border-radius: 4px; font-size: 12px; box-sizing: border-box;">
                        <option value="auto_smart" selected data-i18n="ai_style_auto_smart">智能自动</option>
                        <option value="efficient_fast" data-i18n="ai_style_efficient_fast">高效快速</option>
                        <option value="creative_artistic" data-i18n="ai_style_creative_artistic">创意艺术</option>
                        <option value="precise_technical" data-i18n="ai_style_precise_technical">精确技术</option>
                        <option value="custom_guidance" data-i18n="ai_style_custom_guidance">自定义指引</option>
                    </select>
                </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <div>
                    <label style="color: #ccc; font-size: 12px; margin-bottom: 6px; display: block; font-weight: 500;" data-i18n="ai_temperature">Temperature</label>
                    <select id="temperature" style="width: 100%; background: #222; border: 1px solid #555; color: white; padding: 10px; border-radius: 4px; font-size: 12px; box-sizing: border-box;">
                        <option value="0.3" data-i18n="ai_temp_conservative">0.3 (保守)</option>
                        <option value="0.7" selected data-i18n="ai_temp_creative">0.7 (创意)</option>
                        <option value="0.9" data-i18n="ai_temp_random">0.9 (随机)</option>
                        <option value="1.0" data-i18n="ai_temp_maximum">1.0 (最大)</option>
                    </select>
                </div>
                <div>
                    <label style="color: #ccc; font-size: 12px; margin-bottom: 6px; display: block; font-weight: 500;" data-i18n="ai_random_seed">随机种子</label>
                    <select id="seed" style="width: 100%; background: #222; border: 1px solid #555; color: white; padding: 10px; border-radius: 4px; font-size: 12px; box-sizing: border-box;">
                        <option value="42" selected data-i18n="ai_seed_default">42 (默认)</option>
                        <option value="-1" data-i18n="ai_seed_random">随机 (-1)</option>
                        <option value="123">123</option>
                        <option value="999">999</option>
                        <option value="2024">2024</option>
                    </select>
                </div>
            </div>
        </div>
        
        <!-- 生成按钮 -->
        <button id="generate-ai-prompt" style="width: 100%; background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; padding: 16px; border-radius: 6px; cursor: pointer; font-weight: bold; margin-bottom: 16px; font-size: 14px; box-sizing: border-box; transition: all 0.3s ease;" data-i18n="ai_generate_prompt">
            🚀 生成提示词
        </button>
        
        <!-- 预览区域 -->
        <div style="background: #222; border: 2px solid #10b981; border-radius: 6px; padding: 18px; min-height: 120px; width: 100%; box-sizing: border-box; margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <div style="color: #10b981; font-weight: bold; font-size: 13px;" data-i18n="ai_prompt_preview">📝 提示词预览</div>
                <div id="preview-status" style="color: #666; font-size: 11px; padding: 4px 8px; background: rgba(255,255,255,0.1); border-radius: 12px;" data-i18n="ai_status_pending">待生成</div>
            </div>
            <div id="preview-content" style="color: #ccc; font-size: 12px; line-height: 1.5; min-height: 60px; border-top: 1px dashed #555; padding-top: 12px;" data-i18n="ai_prompt_placeholder">
                点击"🚀 生成提示词"按钮开始生成专业提示词...
            </div>
        </div>
        
        <!-- 操作按钮 -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; width: 100%; box-sizing: border-box;">
            <button id="regenerate-ai-prompt" style="background: #f59e0b; color: white; border: none; padding: 10px; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: bold; transition: all 0.3s ease;" disabled data-i18n="ai_regenerate">
                🔄 重新生成
            </button>
            <button id="confirm-ai-prompt" style="background: #10b981; color: white; border: none; padding: 10px; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: bold; transition: all 0.3s ease;" disabled data-i18n="ai_confirm_apply">
                ✅ 确认应用
            </button>
        </div>
    `;
    
    return aiContent;
}

/**
 * 显示控制信息
 */
export function showControlInfo(modal) {
    // 显示画布控制信息
    const controlInfo = document.createElement('div');
    controlInfo.style.cssText = `
        position: absolute; bottom: 16px; left: 16px; 
        background: rgba(0,0,0,0.8); color: #4CAF50; 
        padding: 12px; border-radius: 8px; font-family: monospace; 
        font-size: 11px; line-height: 1.4; z-index: 1000;
        border: 1px solid #4CAF50;
    `;
    
    controlInfo.innerHTML = `
        <div style="color: white; font-weight: bold; margin-bottom: 4px;" data-i18n="canvas_controls_title">VPE Canvas Controls:</div>
        <span data-i18n="control_left_click">• Left-click: Draw freehand</span><br>
        <span data-i18n="control_middle_click">• Middle-click: Drag to pan</span><br>
        <span data-i18n="control_ctrl_scroll">• Ctrl+Scroll: Zoom</span><br>
        <span data-i18n="control_shift_circle">• Shift+Circle: Perfect Circle</span>
    `;
    
    const canvasContainer = modal.querySelector('#canvas-container');
    if (canvasContainer) {
        canvasContainer.appendChild(controlInfo);
    }
}

/**
 * 初始化标签页功能
 */
export function initializeTabSwitching() {
    console.log('🎯 开始初始化标签页切换功能');
    
    // 查找所有标签页按钮
    const tabs = document.querySelectorAll('.vpe-tab-button');
    console.log('📋 找到标签页按钮数量:', tabs.length);
    
    if (tabs.length === 0) {
        console.warn('⚠️ 未找到标签页按钮，跳过初始化');
        return;
    }
    
    // 预创建所有标签页内容
    const tabContents = {
        'tab_layers': createLayersTabContent(),
        'tab_controls': createControlsTabContent(),
        'tab_ai_enhancer': createAIEnhancerTabContent()
    };
    
    console.log('📝 标签页内容已预创建:', Object.keys(tabContents));
    
    tabs.forEach((tab, index) => {
        const tabKey = tab.getAttribute('data-i18n');
        console.log(`🔘 为标签页 ${index + 1} 添加点击事件，key: ${tabKey}`);
        
        tab.addEventListener('click', function() {
            console.log(`🖱️ 点击标签页: ${tabKey}`);
            switchToTab(tabKey, tabContents);
            
            // 更新标签激活状态
            tabs.forEach(t => {
                t.style.background = '#444';
                t.style.color = '#ccc';
                t.classList.remove('active');
            });
            this.style.background = '#10b981';
            this.style.color = 'white';
            this.classList.add('active');
            
            console.log(`✅ 标签页切换完成: ${tabKey}`);
        });
    });
    
    console.log('✅ 标签页切换功能初始化完成');
}

/**
 * 切换到指定标签页
 */
function switchToTab(tabKey, tabContents) {
    console.log(`🔄 Switching to tab: ${tabKey}`);
    
    const tabContentContainer = document.getElementById('tab-content-container');
    if (!tabContentContainer) {
        console.error('❌ Tab content container not found: #tab-content-container');
        return;
    }
    
    if (!tabContents[tabKey]) {
        console.error(`❌ Tab content not found: ${tabKey}`);
        return;
    }
    
    console.log(`📄 Updating tab content container`);
    
    // 清空当前内容
    tabContentContainer.innerHTML = '';
    
    // 添加新内容
    tabContentContainer.appendChild(tabContents[tabKey]);
    
    console.log(`✅ Tab content updated: ${tabKey}`);
    
    // 获取modal引用以便重新绑定事件
    const modal = tabContentContainer.closest('#unified-editor-modal');
    
    // 🔴 立即应用翻译到新添加的内容
    if (modal && typeof window.updateAllUITexts === 'function') {
        window.updateAllUITexts(modal);
        console.log(`✅ Translations applied immediately after tab switch: ${tabKey}`);
    }
    
    // 根据不同标签页执行特定的初始化
    if (tabKey === 'tab_layers') {
        console.log('🔴 Reinitializing layers tab functionality');
        setTimeout(() => {
            // 重新绑定图层下拉选择器事件
            if (modal && typeof window.bindCanvasInteractionEvents === 'function') {
                window.bindCanvasInteractionEvents(modal);
                console.log('✅ Layer dropdown events rebound');
            }
            
            // 🔧 重要：重新加载图层数据并恢复图层顺序
            console.log('🔄 重新加载图层数据并恢复顺序...');
            if (modal && window.currentVPEInstance) {
                const nodeInstance = window.currentVPEInstance;
                
                // 🔧 重要：优先尝试恢复保存的图层顺序
                if (nodeInstance.layerOrderController && typeof nodeInstance.layerOrderController.restoreSavedLayerOrder === 'function') {
                    const restored = nodeInstance.layerOrderController.restoreSavedLayerOrder(modal);
                    if (restored) {
                        console.log('✅ 图层顺序已恢复');
                    } else {
                        console.log('📋 没有保存的图层顺序，使用默认刷新');
                        // 如果没有保存的顺序，则使用默认刷新
                        if (typeof nodeInstance.refreshLayersList === 'function') {
                            nodeInstance.refreshLayersList(modal);
                            console.log('✅ 图层列表已刷新（默认顺序）');
                        }
                    }
                } else if (typeof nodeInstance.refreshLayersList === 'function') {
                    // 回退到原有的刷新方法
                    nodeInstance.refreshLayersList(modal);
                    console.log('✅ 图层列表已刷新（通过refreshLayersList）');
                } else {
                    console.warn('⚠️ 图层顺序恢复和刷新方法都不存在');
                }
                
                // 重新绑定图层事件
                if (typeof nodeInstance.bindLayerEvents === 'function') {
                    nodeInstance.bindLayerEvents(modal);
                    console.log('✅ 图层事件已重新绑定');
                }
                
                // 🔴 重要：重新更新图层选择器和操作面板
                if (typeof window.updateObjectSelector === 'function') {
                    window.updateObjectSelector(modal);
                    console.log('✅ 图层选择器已重新更新');
                }
            } else {
                console.warn('⚠️ 无法获取VPE实例，跳过图层数据重新加载');
            }
        }, 100);
    } else if (tabKey === 'tab_controls') {
        console.log('🎛️ Reinitializing controls tab functionality');
        console.log('🔍 检查window对象上的函数:');
        console.log('  - bindPromptEvents:', typeof window.bindPromptEvents);
        console.log('  - updateObjectSelector:', typeof window.updateObjectSelector);
        console.log('  - updateOperationTypeSelect:', typeof window.updateOperationTypeSelect);
        console.log('  - currentVPENode:', !!window.currentVPENode);
        console.log('  - currentVPEInstance:', !!window.currentVPEInstance);
        setTimeout(() => {
            console.log('⏰ setTimeout回调执行开始...');
            console.log('🔍 modal存在:', !!modal);
            console.log('🔍 window.bindPromptEvents类型:', typeof window.bindPromptEvents);
            
            // 重新绑定控制面板事件 - 使用动态导入避免循环依赖
            if (modal) {
                console.log('✅ 开始重新绑定控制面板事件...');
                
                // 首先尝试使用window对象上的函数（如果已暴露）
                if (typeof window.bindPromptEvents === 'function') {
                    console.log('🔧 使用window.bindPromptEvents...');
                    const node = window.currentVPENode;
                    const getObjectInfoFunction = node ? node.getObjectInfo : null;
                    window.bindPromptEvents(modal, getObjectInfoFunction);
                    console.log('✅ Controls tab events rebound via window object');
                } else {
                    console.log('🔧 window.bindPromptEvents不存在，使用动态导入...');
                    // 备用方案：动态导入
                    import('./visual_prompt_editor_prompts.js').then(module => {
                        console.log('📦 动态导入prompts模块成功');
                        const node = window.currentVPENode;
                        const getObjectInfoFunction = node ? node.getObjectInfo : null;
                        module.bindPromptEvents(modal, getObjectInfoFunction);
                        console.log('✅ Controls tab events rebound via dynamic import');
                    }).catch(err => {
                        console.error('❌ 动态导入失败:', err);
                    });
                }
            }
            
            // 🔧 修复：确保下拉框选项正确填充
            const templateCategory = modal.querySelector('#template-category') || document.querySelector('#template-category');
            const operationType = modal.querySelector('#operation-type') || document.querySelector('#operation-type'); 
            
            console.log('🔧 强制重新初始化controls面板下拉框...');
            console.log('  - templateCategory:', templateCategory ? '✅ 找到' : '❌ 未找到');
            console.log('  - operationType:', operationType ? '✅ 找到' : '❌ 未找到');
            
            if (templateCategory && operationType) {
                // 尝试使用window对象上的函数
                if (typeof window.updateOperationTypeSelect === 'function') {
                    console.log('🔧 使用window.updateOperationTypeSelect...');
                    window.updateOperationTypeSelect(operationType, 'global');
                    console.log('✅ 下拉框选项已更新');
                } else {
                    console.log('🔧 window.updateOperationTypeSelect不存在，使用动态导入...');
                    // 备用方案：动态导入
                    import('./visual_prompt_editor_utils.js').then(module => {
                        console.log('📦 动态导入utils模块成功');
                        module.updateOperationTypeSelect(operationType, 'global');
                        console.log('✅ 下拉框选项已更新（动态导入）');
                    }).catch(err => {
                        console.error('❌ 动态导入utils失败:', err);
                        console.log('⚠️ 使用手动填充方案...');
                        // 最后的备用方案：手动填充下拉框
                        operationType.innerHTML = `
                            <option value="global_color_grade">Color Grading</option>
                            <option value="global_style_transfer">Style Transfer</option>
                            <option value="global_brightness_contrast">Brightness & Contrast</option>
                            <option value="global_enhance">Global Enhance</option>
                        `;
                    });
                }
                
                // 手动触发change事件来填充operation-type下拉框
                const changeEvent = new Event('change', { bubbles: true });
                templateCategory.dispatchEvent(changeEvent);
                console.log('✅ 分类选择器change事件已触发，operation-type应该已填充');
            } else {
                console.warn('⚠️ 无法找到template-category或operation-type元素');
                // 尝试延迟查找
                setTimeout(() => {
                    const delayedCategory = document.querySelector('#template-category');
                    const delayedOperation = document.querySelector('#operation-type');
                    if (delayedCategory && delayedOperation) {
                        console.log('🔄 延迟查找成功，重新初始化...');
                        if (typeof window.updateOperationTypeSelect === 'function') {
                            window.updateOperationTypeSelect(delayedOperation, 'global');
                        }
                    }
                }, 300);
            }
        }, 150); // 🔧 增加延迟时间确保DOM完全渲染
    } else if (tabKey === 'tab_ai_enhancer') {
        console.log('🤖 Initializing AI enhancer functionality');
        setTimeout(() => {
            initializeAIEnhancerFeatures();
            
            // 强制更新AI增强器的翻译
            if (modal && typeof window.updateSelectOptions === 'function') {
                window.updateSelectOptions(modal);
                console.log('🔄 AI enhancer translations updated');
            }
            
            console.log('✅ AI enhancer features initialized');
        }, 100);
    }
}

/**
 * 初始化AI增强器功能
 */
function initializeAIEnhancerFeatures() {
    // 防止重复初始化
    if (window._aiEnhancerInitialized) {
        console.log('🔄 AI增强器已初始化，跳过重复初始化');
        return;
    }
    
    console.log('🤖 开始初始化AI增强器功能');
    let currentEnhancer = 'api';
    let isGenerating = false;
    
    // 增强器选择功能
    const enhancerCards = document.querySelectorAll('.enhancer-card');
    console.log(`📋 找到 ${enhancerCards.length} 个增强器卡片`);
    
    enhancerCards.forEach(card => {
        card.addEventListener('click', function() {
            const enhancerType = this.getAttribute('data-enhancer');
            if (enhancerType) {
                console.log(`🎯 用户选择增强器: ${enhancerType}`);
                selectEnhancer(enhancerType);
                currentEnhancer = enhancerType;
            }
        });
    });
    
    // 默认选择API增强器
    console.log('🔧 设置默认增强器: api');
    selectEnhancer('api');
    
    // 配置面板折叠功能
    const configToggle = document.getElementById('enhancer-config-toggle');
    if (configToggle) {
        console.log('🔧 绑定配置面板折叠事件');
        configToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🖱️ 配置面板折叠按钮被点击');
            toggleEnhancerConfig();
        });
    } else {
        console.warn('⚠️ 未找到配置面板折叠按钮');
    }
    
    // 生成按钮功能
    const generateBtn = document.getElementById('generate-ai-prompt');
    if (generateBtn) {
        generateBtn.addEventListener('click', () => generatePrompt(currentEnhancer));
    }
    
    // 重新生成按钮
    const regenerateBtn = document.getElementById('regenerate-ai-prompt');
    if (regenerateBtn) {
        regenerateBtn.addEventListener('click', () => generatePrompt(currentEnhancer));
    }
    
    // 确认应用按钮
    const confirmBtn = document.getElementById('confirm-ai-prompt');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', confirmPrompt);
    }
    
    // 参数实时更新功能（防抖处理）
    setupRealtimePreview(currentEnhancer);
    
    // 标记为已初始化
    window._aiEnhancerInitialized = true;
    console.log('✅ AI增强器功能初始化完成');
}

/**
 * 选择增强器
 */
function selectEnhancer(enhancerType) {
    // 更新选择状态
    const enhancerCards = document.querySelectorAll('.enhancer-card');
    enhancerCards.forEach(card => {
        const cardType = card.getAttribute('data-enhancer');
        if (cardType === enhancerType) {
            card.style.borderColor = '#10b981';
            card.style.background = 'rgba(16, 185, 129, 0.1)';
        } else {
            card.style.borderColor = '#444';
            card.style.background = '#1a1a1a';
        }
    });
    
    // 显示对应的配置面板
    const configPanels = ['api-config', 'ollama-config', 'textgen-config'];
    configPanels.forEach(panelId => {
        const panel = document.getElementById(panelId);
        if (panel) {
            panel.style.display = panelId === `${enhancerType}-config` ? 'block' : 'none';
        }
    });
    
    console.log(`🔧 选择增强器: ${enhancerType}`);
}

/**
 * 切换增强器配置面板
 */
function toggleEnhancerConfig() {
    console.log('🔧 toggleEnhancerConfig 函数被调用');
    const configContent = document.getElementById('enhancer-config');
    const arrow = document.getElementById('config-arrow');
    
    console.log('🔍 查找配置元素:', {
        configContent: !!configContent,
        arrow: !!arrow,
        currentMaxHeight: configContent?.style.maxHeight
    });
    
    if (configContent && arrow) {
        const isHidden = configContent.style.maxHeight === '0px' || !configContent.style.maxHeight;
        console.log(`🔄 面板状态: ${isHidden ? '隐藏' : '显示'}`);
        
        if (isHidden) {
            configContent.style.maxHeight = configContent.scrollHeight + 'px';
            arrow.style.transform = 'rotate(0deg)';
            console.log('📂 展开配置面板');
        } else {
            configContent.style.maxHeight = '0px';
            arrow.style.transform = 'rotate(-90deg)';
            console.log('📁 折叠配置面板');
        }
    } else {
        console.warn('❌ 配置面板元素未找到');
    }
}

/**
 * 生成提示词
 */
async function generatePrompt(enhancerType) {
    const generateBtn = document.getElementById('generate-ai-prompt');
    const regenerateBtn = document.getElementById('regenerate-ai-prompt');
    const confirmBtn = document.getElementById('confirm-ai-prompt');
    const previewStatus = document.getElementById('preview-status');
    const previewContent = document.getElementById('preview-content');
    
    if (!generateBtn || !previewStatus || !previewContent) return;
    
    // 更新按钮状态
    generateBtn.disabled = true;
    generateBtn.innerHTML = '<span style="animation: spin 1s linear infinite; display: inline-block;">⚙️</span> 正在生成...';
    if (regenerateBtn) regenerateBtn.disabled = true;
    if (confirmBtn) confirmBtn.disabled = true;
    
    // 更新状态
    previewStatus.textContent = '生成中...';
    previewStatus.style.background = 'rgba(245, 158, 11, 0.2)';
    previewStatus.style.color = '#f59e0b';
    
    // 收集参数
    const params = {
        enhancer: enhancerType,
        description: document.getElementById('edit-description')?.value || '',
        intent: document.getElementById('edit-intent')?.value || 'general_editing',
        style: document.getElementById('processing-style')?.value || 'auto_smart',
        temperature: document.getElementById('temperature')?.value || '0.7',
        seed: document.getElementById('seed')?.value || '42'
    };
    
    console.log('生成参数:', params);
    
    try {
        // 尝试调用实际的增强器API
        const result = await callEnhancerAPI(enhancerType, params);
        
        if (result.success) {
            // 更新预览内容
            displayEnhancedPrompt(result.prompt, previewContent);
            
            // 更新状态
            previewStatus.textContent = '生成完成';
            previewStatus.style.background = 'rgba(16, 185, 129, 0.2)';
            previewStatus.style.color = '#10b981';
            
            // 添加质量分析
            analyzePromptQuality(result.prompt);
        } else {
            throw new Error(result.error || '生成失败');
        }
        
    } catch (error) {
        console.warn('AI增强器调用失败，使用示例提示词:', error);
        
        // 回退到示例提示词
        const samplePrompts = [
            "Transform the red rectangular marked area into a beautiful deep blue evening sky with stunning sunset colors, maintaining natural lighting transitions and ensuring seamless blending with the surrounding environment while preserving the overall atmospheric quality of the image.",
            "Change the red annotated region to display a magnificent twilight sky in deep blue tones, creating a dramatic evening atmosphere with natural color gradients and smooth transitions that integrate harmoniously with the existing lighting conditions.",
            "Convert the marked red area to showcase a breathtaking deep blue evening sky with warm sunset undertones, ensuring professional quality color blending and maintaining realistic lighting consistency throughout the scene."
        ];
        
        const randomPrompt = samplePrompts[Math.floor(Math.random() * samplePrompts.length)];
        
        // 更新预览
        displayEnhancedPrompt(randomPrompt, previewContent);
        
        // 更新状态
        previewStatus.textContent = '生成完成（示例）';
        previewStatus.style.background = 'rgba(16, 185, 129, 0.2)';
        previewStatus.style.color = '#10b981';
        
        // 添加质量分析（示例模式）
        analyzePromptQuality(randomPrompt, true);
    } finally {
        // 恢复按钮状态
        generateBtn.disabled = false;
        generateBtn.innerHTML = '🚀 生成提示词';
        if (regenerateBtn) regenerateBtn.disabled = false;
        if (confirmBtn) confirmBtn.disabled = false;
    }
}

/**
 * 调用增强器API
 */
async function callEnhancerAPI(enhancerType, params) {
    try {
        // 构建annotation数据
        const modal = document.getElementById('unified-editor-modal');
        const annotationData = modal?.annotations || [];
        
        // 构建请求数据
        const requestData = {
            annotation_data: JSON.stringify({
                annotations: annotationData,
                include_annotation_numbers: false
            }),
            edit_description: params.description,
            editing_intent: params.intent,
            processing_style: params.style,
            seed: parseInt(params.seed) || 42,
            temperature: parseFloat(params.temperature) || 0.7
        };
        
        // 根据增强器类型调用不同的API端点
        let endpoint = '';
        switch (enhancerType) {
            case 'api':
                endpoint = '/kontext/api_enhance';
                // 添加API特定参数
                requestData.api_provider = getAPIConfig().provider || 'siliconflow';
                requestData.api_key = getAPIConfig().apiKey || '';
                requestData.model_preset = getAPIConfig().model || 'deepseek-ai/DeepSeek-V3';
                break;
            case 'ollama':
                endpoint = '/kontext/ollama_enhance';
                // 添加Ollama特定参数
                requestData.ollama_base_url = getOllamaConfig().baseUrl || 'http://localhost:11434';
                requestData.model_name = getOllamaConfig().model || 'llama3.1:8b';
                break;
            case 'textgen':
                endpoint = '/kontext/textgen_enhance';
                // 添加TextGen特定参数
                requestData.base_url = getTextGenConfig().baseUrl || 'http://localhost:5000';
                requestData.model_name = getTextGenConfig().model || 'llama-3.1-8b-instruct';
                break;
            default:
                throw new Error('不支持的增强器类型');
        }
        
        // 发送请求
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            return {
                success: true,
                prompt: result.enhanced_prompt || result.result || result.prompt
            };
        } else {
            throw new Error(result.error || result.message || '未知错误');
        }
        
    } catch (error) {
        console.error('增强器API调用失败:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * 映射意图值到增强器参数
 */
function mapIntentValue(intent) {
    const mapping = {
        'change_color': 'general_editing',
        'replace_object': 'creative_design',
        'remove_object': 'professional_editing',
        'add_object': 'creative_design',
        'change_style': 'creative_design',
        'enhance_quality': 'professional_editing',
        'adjust_lighting': 'professional_editing'
    };
    return mapping[intent] || 'general_editing';
}

/**
 * 映射风格值到增强器参数
 */
function mapStyleValue(style) {
    const mapping = {
        'natural_realistic': 'auto_smart',
        'artistic_creative': 'creative_artistic',
        'technical_precise': 'precise_technical'
    };
    return mapping[style] || 'auto_smart';
}

/**
 * 获取API配置
 */
function getAPIConfig() {
    return {
        provider: document.querySelector('#api-config select')?.value || 'siliconflow',
        apiKey: document.querySelector('#api-config input[type="password"]')?.value || '',
        model: document.querySelector('#api-config select')?.value || 'deepseek-ai/DeepSeek-V3',
        baseUrl: document.querySelector('#api-config input[placeholder*="https://api"]')?.value || 'https://api.openai.com/v1'
    };
}

/**
 * 获取Ollama配置
 */
function getOllamaConfig() {
    return {
        baseUrl: document.querySelector('#ollama-url-input')?.value || 'http://localhost:11434',
        model: document.querySelector('#ollama-model-select')?.value || 'llama3.1:8b'
    };
}

/**
 * 获取TextGen配置
 */
function getTextGenConfig() {
    return {
        baseUrl: document.querySelector('#textgen-url-input')?.value || 'http://localhost:5000',
        model: document.querySelector('#textgen-model-select')?.value || 'llama-3.1-8b-instruct'
    };
}

/**
 * 确认应用提示词
 */
function confirmPrompt() {
    const previewContent = document.getElementById('preview-content');
    if (previewContent) {
        const promptText = previewContent.textContent;
        
        if (!promptText || promptText.includes('点击上方')) {
            alert('⚠️ 请先生成提示词后再确认应用！');
            return;
        }
        
        // 将提示词应用到工作流
        applyPromptToWorkflow(promptText);
    }
}

/**
 * 将提示词应用到工作流
 */
function applyPromptToWorkflow(promptText) {
    try {
        // 获取当前节点实例
        const currentNode = window.currentVPENode;
        if (!currentNode) {
            console.error('无法获取当前节点实例');
            alert('❌ 应用失败：无法获取当前节点实例');
            return;
        }

        // 更新节点的输出widgets
        const promptWidget = currentNode.widgets?.find(w => w.name === "enhanced_prompt");
        if (promptWidget) {
            promptWidget.value = promptText;
            console.log('✅ 提示词已更新到enhanced_prompt widget');
        }

        // 更新annotation_data widget（如果存在标注数据）
        const modal = document.getElementById('unified-editor-modal');
        if (modal?.annotations && modal.annotations.length > 0) {
            const annotationWidget = currentNode.widgets?.find(w => w.name === "annotation_data");
            if (annotationWidget) {
                const annotationData = {
                    annotations: modal.annotations,
                    include_annotation_numbers: false,
                    enhanced_prompt: promptText,
                    timestamp: new Date().toISOString()
                };
                annotationWidget.value = JSON.stringify(annotationData);
                console.log('✅ 标注数据已更新到annotation_data widget');
            }
        }

        // 触发节点更新
        if (currentNode.onPropertyChanged) {
            currentNode.onPropertyChanged("enhanced_prompt", promptText);
        }

        // 标记节点为已修改
        if (currentNode.setDirtyCanvas) {
            currentNode.setDirtyCanvas(true);
        }

        // 显示成功消息
        const successMsg = `✅ 提示词已确认并应用到工作流！

📝 生成的提示词：
${promptText.substring(0, 100)}${promptText.length > 100 ? '...' : ''}

🔄 请继续您的ComfyUI工作流程。`;

        alert(successMsg);
        
        // 关闭弹窗
        const closeBtn = document.getElementById('vpe-close');
        if (closeBtn) {
            setTimeout(() => {
                closeBtn.click();
            }, 1000);
        }

        console.log('✅ 提示词应用完成');

    } catch (error) {
        console.error('应用提示词到工作流时出错:', error);
        alert('❌ 应用失败：' + error.message);
    }
}

/**
 * 设置实时预览功能（防抖处理）
 */
function setupRealtimePreview(enhancerType) {
    let debounceTimer;
    
    const inputElements = [
        document.getElementById('edit-description'),
        document.getElementById('edit-intent'),
        document.getElementById('processing-style'),
        document.getElementById('temperature'),
        document.getElementById('seed')
    ];
    
    inputElements.forEach(element => {
        if (element) {
            const eventType = element.tagName === 'TEXTAREA' || element.type === 'text' ? 'input' : 'change';
            element.addEventListener(eventType, () => {
                clearTimeout(debounceTimer);
                
                // 显示正在更新状态
                const previewStatus = document.getElementById('preview-status');
                if (previewStatus) {
                    previewStatus.textContent = '参数已更新';
                    previewStatus.style.background = 'rgba(59, 130, 246, 0.2)';
                    previewStatus.style.color = '#3b82f6';
                }
                
                // 500ms后触发预览更新
                debounceTimer = setTimeout(() => {
                    console.log('参数更新，可以触发预览生成');
                    // 这里可以添加自动预览功能，如果用户启用了该选项
                }, 500);
            });
        }
    });
}

/**
 * 显示增强的提示词预览
 */
function displayEnhancedPrompt(promptText, previewContainer) {
    if (!previewContainer || !promptText) return;
    
    // 创建增强的显示格式
    const displayHTML = `
        <div style="color: #10b981; line-height: 1.4; font-size: 10px; margin-bottom: 8px;">
            ${promptText}
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px; padding-top: 6px; border-top: 1px dashed #555;">
            <div style="font-size: 8px; color: #666;">
                字符数: ${promptText.length} | 词汇数: ${promptText.split(' ').length}
            </div>
            <div style="font-size: 8px;">
                <span style="color: #10b981; cursor: pointer;" onclick="copyPromptToClipboard('${promptText.replace(/'/g, "\\'")}')">📋 复制</span>
            </div>
        </div>
    `;
    
    previewContainer.innerHTML = displayHTML;
}

/**
 * 分析提示词质量
 */
function analyzePromptQuality(promptText, isExample = false) {
    try {
        const analysis = {
            length: promptText.length,
            wordCount: promptText.split(' ').length,
            hasColorTerms: /\b(color|blue|red|green|yellow|purple|orange|pink|black|white|gray|grey)\b/i.test(promptText),
            hasQualityTerms: /\b(beautiful|stunning|professional|natural|smooth|seamless|realistic|high.quality)\b/i.test(promptText),
            hasActionTerms: /\b(transform|change|convert|maintain|ensure|create|blend|integrate)\b/i.test(promptText),
            hasLocationTerms: /\b(area|region|section|zone|marked|rectangular|circular)\b/i.test(promptText)
        };
        
        // 计算质量分数
        let qualityScore = 0;
        if (analysis.length > 50 && analysis.length < 300) qualityScore += 25;
        if (analysis.wordCount > 10 && analysis.wordCount < 50) qualityScore += 25;
        if (analysis.hasColorTerms) qualityScore += 15;
        if (analysis.hasQualityTerms) qualityScore += 15;
        if (analysis.hasActionTerms) qualityScore += 10;
        if (analysis.hasLocationTerms) qualityScore += 10;
        
        console.log(`📊 提示词质量分析 ${isExample ? '(示例)' : ''}:`, {
            质量分数: `${qualityScore}/100`,
            字符数: analysis.length,
            词汇数: analysis.wordCount,
            包含颜色词汇: analysis.hasColorTerms,
            包含质量词汇: analysis.hasQualityTerms,
            包含动作词汇: analysis.hasActionTerms,
            包含位置词汇: analysis.hasLocationTerms
        });
        
        // 可以在这里添加更多的质量反馈逻辑
        if (qualityScore >= 80) {
            console.log('✅ 提示词质量优秀');
        } else if (qualityScore >= 60) {
            console.log('⚠️ 提示词质量良好，建议优化');
        } else {
            console.log('❌ 提示词质量有待提升');
        }
        
    } catch (error) {
        console.warn('提示词质量分析失败:', error);
    }
}

/**
 * 复制提示词到剪贴板
 */
function copyPromptToClipboard(promptText) {
    if (!promptText) return;
    
    navigator.clipboard.writeText(promptText).then(() => {
        console.log('✅ 提示词已复制到剪贴板');
        
        // 显示临时提示
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed; top: 20px; right: 20px; z-index: 30000;
            background: #10b981; color: white; padding: 8px 16px;
            border-radius: 6px; font-size: 12px; font-weight: bold;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
            animation: slideInFromRight 0.3s ease;
        `;
        toast.textContent = '✅ 提示词已复制！';
        
        // 添加动画样式
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInFromRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
            style.remove();
        }, 2000);
        
    }).catch(error => {
        console.error('复制到剪贴板失败:', error);
        alert('复制失败，请手动复制提示词内容');
    });
}

/**
 * 增强器连接测试
 */
async function testEnhancerConnection(enhancerType) {
    console.log(`🔍 测试${enhancerType}增强器连接...`);
    
    try {
        let endpoint = '';
        let testData = {};
        
        switch (enhancerType) {
            case 'api':
                endpoint = '/kontext/api_test';
                const apiConfig = getAPIConfig();
                testData = {
                    api_provider: apiConfig.provider,
                    api_key: apiConfig.apiKey,
                    base_url: apiConfig.baseUrl
                };
                break;
            case 'ollama':
                endpoint = '/kontext/ollama_test';
                const ollamaConfig = getOllamaConfig();
                testData = {
                    ollama_base_url: ollamaConfig.baseUrl
                };
                break;
            case 'textgen':
                endpoint = '/kontext/textgen_test';
                const textgenConfig = getTextGenConfig();
                testData = {
                    base_url: textgenConfig.baseUrl
                };
                break;
        }
        
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log(`✅ ${enhancerType}增强器连接成功`);
            return { success: true, message: '连接正常' };
        } else {
            console.warn(`❌ ${enhancerType}增强器连接失败:`, result.error);
            return { success: false, message: result.error };
        }
        
    } catch (error) {
        console.error(`❌ ${enhancerType}增强器连接测试失败:`, error);
        return { success: false, message: error.message };
    }
}

/**
 * 测试API连接
 */
async function testAPIConnection() {
    console.log('🔍 测试API连接...');
    const statusElement = document.getElementById('api-status');
    if (statusElement) {
        statusElement.textContent = '● 测试中...';
        statusElement.style.color = '#f59e0b';
    }
    
    const result = await testEnhancerConnection('api');
    
    if (statusElement) {
        if (result.success) {
            statusElement.textContent = '● 连接正常';
            statusElement.style.color = '#10b981';
        } else {
            statusElement.textContent = '● 连接失败';
            statusElement.style.color = '#ef4444';
            console.warn('API连接测试失败:', result.message);
        }
    }
}

/**
 * 测试Ollama连接
 */
async function testOllamaConnection() {
    console.log('🔍 测试Ollama连接...');
    const statusElement = document.getElementById('ollama-status');
    if (statusElement) {
        statusElement.textContent = '● 测试中...';
        statusElement.style.color = '#f59e0b';
    }
    
    const result = await testEnhancerConnection('ollama');
    
    if (statusElement) {
        if (result.success) {
            statusElement.textContent = '● 连接正常';
            statusElement.style.color = '#10b981';
        } else {
            statusElement.textContent = '● 连接失败';
            statusElement.style.color = '#ef4444';
            console.warn('Ollama连接测试失败:', result.message);
        }
    }
}

/**
 * 测试TextGen连接
 */
async function testTextGenConnection() {
    console.log('🔍 测试TextGen连接...');
    const statusElement = document.getElementById('textgen-status');
    if (statusElement) {
        statusElement.textContent = '● 测试中...';
        statusElement.style.color = '#f59e0b';
    }
    
    const result = await testEnhancerConnection('textgen');
    
    if (statusElement) {
        if (result.success) {
            statusElement.textContent = '● 连接正常';
            statusElement.style.color = '#10b981';
        } else {
            statusElement.textContent = '● 连接失败';
            statusElement.style.color = '#ef4444';
            console.warn('TextGen连接测试失败:', result.message);
        }
    }
}

/**
 * 创建图层列表项
 * 从主文件迁移的UI创建逻辑
 */
export function createLayerListItem(layer, layerId, type, nodeInstance) {
    const layerItem = document.createElement('div');
    layerItem.className = 'layer-list-item vpe-layer-item';
    layerItem.setAttribute('data-layer-id', layerId);
    layerItem.setAttribute('data-layer-type', type);
    layerItem.setAttribute('draggable', 'true');
    layerItem.style.position = 'relative';
    
    let icon, description, statusColor;
    // 直接使用layer.visible，默认为true
    const isVisible = layer.visible !== false; // 默认为可见
    
    if (type === 'IMAGE_LAYER') {
        icon = '🖼️';
        description = layer.name;
        statusColor = '#10b981';
    } else {
        // 为annotation保持一致的图标，基于type生成但保存到layer对象中以便复用
        if (!layer.cachedIcon) {
            layer.cachedIcon = nodeInstance?.getSimpleIcon ? nodeInstance.getSimpleIcon(layer.type) : '📝';
        }
        icon = layer.cachedIcon;
        description = `${layer.type} annotation ${layer.number + 1}`;
        statusColor = '#4CAF50';
    }
    
    layerItem.innerHTML = `
        <div class="layer-drag-handle" 
             style="cursor: grab; margin-right: 8px; padding: 4px; color: #888; font-size: 14px; user-select: none;"
             title="Drag to reorder">
            ⋮⋮
        </div>
        <button class="layer-visibility-btn" data-layer-id="${layerId}" data-layer-type="${type}"
                style="background: none; border: none; cursor: pointer; margin-right: 8px; font-size: 16px; padding: 2px;">
            ${isVisible ? '👁️' : '🙈'}
        </button>
        <input type="checkbox" data-annotation-id="${layerId}" data-layer-id="${layerId}" data-layer-type="${type}"
               style="margin-right: 8px; accent-color: ${statusColor};">
        <span style="margin-right: 8px; font-size: 16px;">${icon}</span>
        <span style="flex: 1; color: white; font-size: 12px; opacity: ${isVisible ? '1' : '0.5'};">${description}</span>
        <div class="layer-controls" style="display: flex; align-items: center; margin-left: 8px; gap: 4px;">
            <div class="layer-order-controls" style="display: flex; flex-direction: column;">
                <button class="layer-move-up" data-layer-id="${layerId}" data-layer-type="${type}"
                        style="background: none; border: none; cursor: pointer; color: #888; font-size: 10px; line-height: 1; padding: 1px 3px;"
                        title="Move Up">
                    ▲
                </button>
                <button class="layer-move-down" data-layer-id="${layerId}" data-layer-type="${type}"
                        style="background: none; border: none; cursor: pointer; color: #888; font-size: 10px; line-height: 1; padding: 1px 3px;"
                        title="Move Down">
                    ▼
                </button>
            </div>
        </div>
        <span style="color: ${statusColor}; font-size: 10px; margin-left: 8px; opacity: ${isVisible ? '1' : '0.5'};">
            ${type === 'IMAGE_LAYER' ? 'LAYER' : 'ANNOTATION'}
        </span>
    `;
    
    return layerItem;
}

/**
 * 加载图层到面板
 * 从主文件迁移的UI更新逻辑
 */
export function loadLayersToPanel(modal, layers) {
    console.log('🔍 loadLayersToPanel called with layers:', layers?.length || 0);
    
    // Safety checks
    if (!modal) {
        console.error('❌ loadLayersToPanel: modal is null/undefined');
        return;
    }

    // Find the layers container - use correct element ID from UI module
    const layersList = modal.querySelector('#annotation-objects');
    
    if (!layersList) {
        console.error('❌ loadLayersToPanel: #annotation-objects element not found');
        console.log('🔍 Available elements with IDs:', Array.from(modal.querySelectorAll('*[id]')).map(el => el.id));
        return;
    }
    
    if (!Array.isArray(layers) || layers.length === 0) {
        layersList.innerHTML = '<div style="color: #888; text-align: center; padding: 20px;">No layers detected<br><small>Draw annotations to see them here</small></div>';
        console.log('✅ Empty state set in layers panel');
        return;
    }
    
    try {
        layersList.innerHTML = '';
        console.log('✅ Layers panel cleared, processing', layers.length, 'layers');
        
        layers.forEach((layer, index) => {
        const layerItem = document.createElement('div');
        layerItem.style.cssText = `
            margin: 8px 0; padding: 12px; background: #2b2b2b;
            border-radius: 6px; cursor: pointer; border: 2px solid transparent;
            transition: all 0.2s;
        `;
        
        layerItem.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="flex: 1;">
                    <div style="color: white; font-weight: 600; margin-bottom: 4px;">${layer.class_name || 'Annotation'}</div>
                    <div style="font-size: 12px; color: #888;">
                        ID: ${layer.id || index} | Type: ${layer.type || 'manual'}
                    </div>
                    ${layer.area ? `<div style="font-size: 12px; color: #888;">Area: ${layer.area} px</div>` : ''}
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <input type="checkbox" ${index < 3 ? 'checked' : ''} data-layer-id="${layer.id || index}" 
                           style="transform: scale(1.2);">
                </div>
            </div>
        `;
        
        // 点击选择图层
        layerItem.onclick = (e) => {
            if (e.target.type !== 'checkbox') {
                const checkbox = layerItem.querySelector('input[type="checkbox"]');
                checkbox.checked = !checkbox.checked;
            }
            
            // 更新视觉反馈
            const isSelected = layerItem.querySelector('input[type="checkbox"]').checked;
            layerItem.style.borderColor = isSelected ? '#673AB7' : 'transparent';
            layerItem.style.background = isSelected ? '#3a2a5c' : '#2b2b2b';
            
            console.log('🎯 VPE选中图层:', layer.id || index);
        };
        
        layersList.appendChild(layerItem);
    });
    
        console.log('✅ VPE图层列表已更新:', layers.length);
    } catch (error) {
        console.error('❌ Error in loadLayersToPanel:', error);
        console.error('❌ Error stack:', error.stack);
    }
}

// 在window对象上暴露函数，以便在HTML中调用
window.toggleEnhancerConfig = toggleEnhancerConfig;
window.copyPromptToClipboard = copyPromptToClipboard;
window.testEnhancerConnection = testEnhancerConnection;
window.testAPIConnection = testAPIConnection;
window.testOllamaConnection = testOllamaConnection;
window.testTextGenConnection = testTextGenConnection;