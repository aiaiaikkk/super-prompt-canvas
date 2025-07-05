/**
 * Visual Prompt Editor - UI组件模块
 * 负责创建和管理UI界面组件
 */

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
        width: 95%; height: 95%; background: #1a1a1a;
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
            <span style="font-weight: 700; font-size: 20px;">Visual Prompt Editor</span>
            <span style="background: rgba(255, 255, 255, 0.15); padding: 4px 12px; border-radius: 20px; font-size: 11px; opacity: 0.9;">
                Unified Annotation & Prompt Generation
            </span>
        </div>
        <div style="display: flex; gap: 12px;">
            <button id="vpe-help" style="background: rgba(255, 255, 255, 0.2); border: none; color: white; padding: 8px 16px; border-radius: 6px; cursor: pointer; transition: all 0.2s;">
                ❓ Help
            </button>
            <button id="vpe-save" style="background: #4CAF50; border: none; color: white; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600; transition: all 0.2s;">
                💾 Save & Apply
            </button>
            <button id="vpe-close" style="background: #f44336; border: none; color: white; padding: 10px 16px; border-radius: 6px; cursor: pointer; font-weight: 600; transition: all 0.2s;">
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
                <span style="color: #ccc; font-size: 11px;">Tools:</span>
                <button class="vpe-tool" data-tool="rectangle" title="Rectangle">📐</button>
                <button class="vpe-tool" data-tool="circle" title="Circle (Shift=Perfect Circle)">⭕</button>
                <button class="vpe-tool" data-tool="arrow" title="Arrow">➡️</button>
                <button class="vpe-tool" data-tool="freehand" title="Freehand Drawing (Left-click to add anchor points, right-click to close)">🔗</button>
                <button class="vpe-tool" data-tool="brush" title="Brush (Adjustable size and feather)">🖌️</button>
                <button class="vpe-tool" data-tool="eraser" title="Eraser">🗑️</button>
            </div>
            
            <!-- 颜色选择组 -->
            <div style="display: flex; gap: 4px; align-items: center; border-right: 1px solid #555; padding-right: 8px;">
                <span style="color: #ccc; font-size: 11px;">Colors:</span>
                <button class="vpe-color" data-color="#ff0000" style="background: linear-gradient(135deg, #ff0000, #cc0000); border: 2px solid #fff; box-shadow: 0 2px 4px rgba(255,0,0,0.3);"></button>
                <button class="vpe-color" data-color="#00ff00" style="background: linear-gradient(135deg, #00ff00, #00cc00); border: 2px solid #fff; box-shadow: 0 2px 4px rgba(0,255,0,0.3);"></button>
                <button class="vpe-color" data-color="#ffff00" style="background: linear-gradient(135deg, #ffff00, #cccc00); border: 2px solid #fff; box-shadow: 0 2px 4px rgba(255,255,0,0.3);"></button>
                <button class="vpe-color" data-color="#0000ff" style="background: linear-gradient(135deg, #0000ff, #0000cc); border: 2px solid #fff; box-shadow: 0 2px 4px rgba(0,0,255,0.3);"></button>
            </div>
            
            <!-- 编辑操作组 -->
            <div style="display: flex; gap: 4px; align-items: center; border-right: 1px solid #555; padding-right: 8px;">
                <span style="color: #ccc; font-size: 11px;">Edit:</span>
                <button id="vpe-undo" style="font-size: 11px; padding: 4px 8px;" title="Undo">↶ Undo</button>
                <button id="vpe-clear" style="font-size: 11px; padding: 4px 8px;" title="Clear All">🗂️ Clear</button>
            </div>
            
            <!-- 填充样式组 -->
            <div style="display: flex; gap: 4px; align-items: center; border-right: 1px solid #555; padding-right: 8px;">
                <span style="color: #ccc; font-size: 11px;">Fill:</span>
                <button id="vpe-fill-toggle" style="font-size: 11px; padding: 4px 8px;" title="Toggle between filled and outline annotations">🔴 Filled</button>
            </div>
            
            <!-- 不透明度控制组 -->
            <div style="display: flex; gap: 6px; align-items: center; border-right: 1px solid #555; padding-right: 8px;">
                <span style="color: #ccc; font-size: 11px;">Opacity:</span>
                <input type="range" id="vpe-opacity-slider" min="10" max="100" value="50" 
                       style="width: 80px; height: 20px; background: #333; outline: none; cursor: pointer;" 
                       title="Adjust annotation opacity (10-100%)">
                <span id="vpe-opacity-value" style="color: #aaa; font-size: 10px; min-width: 30px; text-align: center;">50%</span>
            </div>
            
            <!-- 画笔控制组 -->
            <div id="vpe-brush-controls" style="display: none; gap: 6px; align-items: center; border-right: 1px solid #555; padding-right: 8px;">
                <span style="color: #ccc; font-size: 11px;">Brush:</span>
                <span style="color: #aaa; font-size: 10px;">Size:</span>
                <input type="range" id="vpe-brush-size" min="5" max="50" value="20" 
                       style="width: 60px; height: 20px; background: #333; outline: none; cursor: pointer;" 
                       title="Adjust brush size (5-50px)">
                <span id="vpe-brush-size-value" style="color: #aaa; font-size: 10px; min-width: 25px; text-align: center;">20px</span>
                <span style="color: #aaa; font-size: 10px;">Feather:</span>
                <input type="range" id="vpe-brush-feather" min="0" max="20" value="5" 
                       style="width: 60px; height: 20px; background: #333; outline: none; cursor: pointer;" 
                       title="Adjust brush feather/softness (0-20px)">
                <span id="vpe-brush-feather-value" style="color: #aaa; font-size: 10px; min-width: 25px; text-align: center;">5px</span>
            </div>
            
            <!-- 视图控制组 -->
            <div style="display: flex; gap: 4px; align-items: center;">
                <span style="color: #ccc; font-size: 11px;">View:</span>
                <button id="vpe-zoom-fit" style="font-size: 11px; padding: 4px 8px;" title="Fit to Screen">Fit</button>
                <button id="vpe-zoom-100" style="font-size: 11px; padding: 4px 8px;" title="100% Zoom">1:1</button>
                <button id="vpe-zoom-in" style="font-size: 11px; padding: 4px 6px;" title="Zoom In">+</button>
                <button id="vpe-zoom-out" style="font-size: 11px; padding: 4px 6px;" title="Zoom Out">-</button>
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
        width: 320px; background: #2b2b2b; display: flex; flex-direction: column;
        border-left: 1px solid #404040;
        flex-shrink: 0; /* 防止右侧面板被压缩 */
    `;
    
    const promptContent = document.createElement('div');
    promptContent.style.cssText = `
        flex: 1; padding: 16px; overflow-y: auto; min-height: 0;
    `;
    
    promptContent.innerHTML = `
        <!-- 多选功能元素 -->
        <div style="background: #333; padding: 12px; border-radius: 8px; margin-bottom: 16px;">
            <div style="color: #4CAF50; font-weight: 600; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between;">
                🎯 Layer Selection
                <span id="selection-count" style="color: #888; font-size: 11px;">0 selected</span>
            </div>
            
            <div style="margin-bottom: 8px;">
                <label style="display: flex; align-items: center; cursor: pointer; color: white; font-size: 12px; font-weight: 500;">
                    <input type="checkbox" id="select-all-objects" style="margin-right: 6px; transform: scale(1.1);">
                    Select All Layers
                </label>
            </div>
            
            <div id="annotation-objects" style="max-height: 120px; overflow-y: auto; border: 1px solid #555; border-radius: 4px; padding: 4px; background: #2b2b2b;"></div>
        </div>
        
        <div style="background: #333; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
            <div style="color: #4CAF50; font-weight: 600; margin-bottom: 12px;">🎯 Edit Control</div>
            
            <div style="margin-bottom: 12px;">
                <label style="display: block; color: #aaa; font-size: 12px; margin-bottom: 4px;">Edit Operation Type</label>
                <select id="operation-type" style="width: 100%; padding: 8px; background: #2b2b2b; color: white; border: 1px solid #555; border-radius: 4px;">
                    <option value="change_color">Change Color</option>
                    <option value="change_style">Change Style</option>
                    <option value="replace_object">Replace Object</option>
                    <option value="add_object">Add Object</option>
                    <option value="remove_object">Remove Object</option>
                    <option value="change_texture">Change Texture</option>
                    <option value="change_pose">Change Pose</option>
                    <option value="change_expression">Change Expression</option>
                    <option value="change_clothing">Change Clothing</option>
                    <option value="change_background">Change Background</option>
                    <option value="enhance_quality">Enhance Quality</option>
                    <option value="custom">Custom Operation</option>
                </select>
            </div>
            
            <div style="margin-bottom: 12px;">
                <label style="display: block; color: #aaa; font-size: 12px; margin-bottom: 4px;">Description Text</label>
                <textarea id="target-input" 
                          style="width: 100%; height: 80px; padding: 8px; background: #2b2b2b; color: white; border: 1px solid #555; border-radius: 4px; resize: vertical; font-family: inherit; font-size: 14px; line-height: 1.4;" 
                          placeholder="Please enter editing instructions for this object..."></textarea>
            </div>
            
            <div style="margin-bottom: 12px;">
                <label style="display: flex; align-items: center; gap: 8px; color: #aaa; font-size: 12px; cursor: pointer;">
                    <input type="checkbox" id="include-annotation-numbers" checked 
                           style="width: 14px; height: 14px; accent-color: #4CAF50; cursor: pointer;">
                    <span>Include annotation numbers in description</span>
                </label>
                <div style="font-size: 11px; color: #777; margin-top: 2px; margin-left: 22px;">
                    🏷️ Show annotation numbers (e.g., "annotation 1") in generated prompts
                </div>
            </div>
            
            <button id="generate-prompt" style="width: 100%; padding: 10px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">
                ✨ Generate Description
            </button>
        </div>
        
        <div style="background: #333; padding: 16px; border-radius: 8px;">
            <div style="color: #FF9800; font-weight: 600; margin-bottom: 12px;">📝 Generated Description</div>
            <textarea id="generated-description" 
                      style="width: 100%; height: 120px; padding: 12px; background: #2b2b2b; color: white; border: 1px solid #555; border-radius: 4px; resize: vertical; font-family: inherit; font-size: 14px; line-height: 1.4;" 
                      placeholder="Generated description text will appear here..."></textarea>
            
            <div style="display: flex; gap: 8px; margin-top: 8px;">
                <button id="copy-description" style="flex: 1; padding: 8px; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                    📋 Copy
                </button>
                <button id="clear-description" style="flex: 1; padding: 8px; background: #666; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                    🧹 Clear
                </button>
            </div>
        </div>
    `;
    
    promptArea.appendChild(promptContent);
    return promptArea;
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
        <div style="color: white; font-weight: bold; margin-bottom: 4px;">VPE Canvas Controls:</div>
        • Left-click: Draw freehand<br>
        • Middle-click: Drag to pan<br>
        • Ctrl+Scroll: Zoom<br>
        • Shift+Circle: Perfect Circle
    `;
    
    const canvasContainer = modal.querySelector('#canvas-container');
    if (canvasContainer) {
        canvasContainer.appendChild(controlInfo);
    }
}