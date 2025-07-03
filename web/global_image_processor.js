/**
 * Global Image Processor - 前端扩展
 * 全图处理节点的前端界面和交互功能
 */

(function() {
    // 如果app还未加载，等待它
    if (!window.app || !window.app.registerExtension) {
        setTimeout(arguments.callee, 100);
        return;
    }

    const app = window.app;
    
    console.log("🌍 Loading Global Image Processor extension...");

    // 处理模式配置
    const PROCESSING_MODES = {
        "enhance_quality": {
            name: "Quality Enhancement",
            icon: "⭐",
            description: "Improve image quality, sharpness, and contrast enhancement",
            color: "#4CAF50"
        },
        "upscale_2x": {
            name: "2x Upscale",
            icon: "🔍",
            description: "2x upscaling using high-quality algorithms",
            color: "#2196F3"
        },
        "upscale_4x": {
            name: "4x Upscale", 
            icon: "🔍",
            description: "4x upscaling using high-quality algorithms",
            color: "#1976D2"
        },
        "desaturate": {
            name: "Desaturate",
            icon: "⚫",
            description: "Convert to grayscale image",
            color: "#757575"
        },
        "monochrome_warm": {
            name: "Warm Monochrome",
            icon: "🟤",
            description: "Warm-toned monochrome processing",
            color: "#D7842F"
        },
        "monochrome_cool": {
            name: "Cool Monochrome",
            icon: "🔵",
            description: "Cool-toned monochrome processing",
            color: "#1E88E5"
        },
        "vintage_film": {
            name: "Vintage Film",
            icon: "📷",
            description: "Retro film photography effect",
            color: "#8D6E63"
        },
        "high_contrast": {
            name: "High Contrast",
            icon: "◐",
            description: "Enhance contrast, emphasize light and shadow",
            color: "#424242"
        },
        "soft_blur": {
            name: "Soft Blur",
            icon: "💫",
            description: "Add gentle blur effect",
            color: "#E1BEE7"
        },
        "sharpen": {
            name: "Sharpen",
            icon: "⚡",
            description: "Enhance image sharpness and clarity",
            color: "#FF5722"
        },
        "denoise": {
            name: "Denoise",
            icon: "🔧",
            description: "Reduce image noise",
            color: "#607D8B"
        },
        "color_pop": {
            name: "Color Enhancement",
            icon: "🌈",
            description: "Enhance color saturation and vibrancy",
            color: "#E91E63"
        },
        "dramatic_lighting": {
            name: "Dramatic Lighting",
            icon: "🎭",
            description: "Enhance lighting effects, create dramatic atmosphere",
            color: "#9C27B0"
        },
        "custom": {
            name: "Custom",
            icon: "⚙️",
            description: "Use custom parameters for processing",
            color: "#FF9800"
        }
    };

    // 创建配置面板
    function createConfigPanel(node) {
        // 移除已存在的面板
        const existingPanel = document.getElementById('global-processor-panel');
        if (existingPanel) {
            existingPanel.remove();
        }

        const panel = document.createElement('div');
        panel.id = 'global-processor-panel';
        panel.className = 'comfy-modal';
        panel.style.cssText = `
            display: flex;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.8);
            z-index: 10000;
            align-items: center;
            justify-content: center;
        `;

        const content = document.createElement('div');
        content.style.cssText = `
            background-color: #1a1a1a;
            border-radius: 12px;
            width: 90%;
            max-width: 800px;
            max-height: 90vh;
            display: flex;
            flex-direction: column;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
            overflow: hidden;
        `;

        // 标题栏
        const header = document.createElement('div');
        header.style.cssText = `
            padding: 20px;
            border-bottom: 1px solid #333;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #2a2a2a;
        `;
        header.innerHTML = `
            <h2 style="margin: 0; color: #fff;">🌍 Global Image Processor</h2>
            <button style="
                background: #f44336;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
            " onclick="this.closest('#global-processor-panel').remove()">Close</button>
        `;
        content.appendChild(header);

        // 主体内容
        const body = document.createElement('div');
        body.style.cssText = `
            flex: 1;
            padding: 20px;
            overflow-y: auto;
            color: #fff;
        `;

        // 处理模式选择
        const modeSection = document.createElement('div');
        modeSection.innerHTML = `
            <h3 style="color: #4CAF50; margin-bottom: 15px;">📋 Processing Modes</h3>
            <div id="mode-grid" style="
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 15px;
                margin-bottom: 30px;
            "></div>
        `;
        body.appendChild(modeSection);

        // 创建模式网格
        const modeGrid = modeSection.querySelector('#mode-grid');
        Object.entries(PROCESSING_MODES).forEach(([key, config]) => {
            const modeCard = document.createElement('div');
            modeCard.className = 'mode-card';
            modeCard.dataset.mode = key;
            modeCard.style.cssText = `
                background: #333;
                border: 2px solid transparent;
                border-radius: 8px;
                padding: 15px;
                cursor: pointer;
                transition: all 0.3s ease;
                position: relative;
            `;
            
            modeCard.innerHTML = `
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                    <span style="font-size: 20px; margin-right: 10px;">${config.icon}</span>
                    <span style="font-weight: bold; color: ${config.color};">${config.name}</span>
                </div>
                <div style="font-size: 0.9em; color: #ccc; line-height: 1.4;">
                    ${config.description}
                </div>
            `;

            // 鼠标悬停效果
            modeCard.addEventListener('mouseenter', () => {
                modeCard.style.borderColor = config.color;
                modeCard.style.background = '#404040';
            });

            modeCard.addEventListener('mouseleave', () => {
                if (!modeCard.classList.contains('selected')) {
                    modeCard.style.borderColor = 'transparent';
                    modeCard.style.background = '#333';
                }
            });

            // 选择事件
            modeCard.addEventListener('click', () => {
                // 清除其他选择
                modeGrid.querySelectorAll('.mode-card').forEach(card => {
                    card.classList.remove('selected');
                    const cardConfig = PROCESSING_MODES[card.dataset.mode];
                    card.style.borderColor = 'transparent';
                    card.style.background = '#333';
                });

                // 选中当前卡片
                modeCard.classList.add('selected');
                modeCard.style.borderColor = config.color;
                modeCard.style.background = '#404040';

                // 更新节点设置
                updateNodeMode(node, key);
                
                // 显示参数设置
                showParameterSettings(key);
            });

            modeGrid.appendChild(modeCard);
        });

        // 参数设置区域
        const paramSection = document.createElement('div');
        paramSection.innerHTML = `
            <h3 style="color: #FF9800; margin-bottom: 15px;">⚙️ Parameters</h3>
            <div id="parameter-controls" style="
                background: #333;
                padding: 20px;
                border-radius: 8px;
                min-height: 100px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #888;
            ">
                Select a processing mode to configure parameters
            </div>
        `;
        body.appendChild(paramSection);

        // 预览和应用区域
        const actionSection = document.createElement('div');
        actionSection.innerHTML = `
            <div style="
                display: flex;
                gap: 15px;
                margin-top: 30px;
                justify-content: center;
            ">
                <button id="preview-btn" style="
                    background: #2196F3;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 16px;
                    opacity: 0.5;
                " disabled>🔍 Preview</button>
                <button id="apply-btn" style="
                    background: #4CAF50;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 16px;
                    opacity: 0.5;
                " disabled>✅ Apply Settings</button>
            </div>
        `;
        body.appendChild(actionSection);

        panel.appendChild(content);
        document.body.appendChild(panel);

        // 点击背景关闭
        panel.addEventListener('click', (e) => {
            if (e.target === panel) {
                panel.remove();
            }
        });

        return panel;
    }

    // 显示参数设置界面
    function showParameterSettings(mode) {
        const container = document.getElementById('parameter-controls');
        if (!container) return;

        let html = '';

        if (mode === 'custom') {
            html = `
                <div style="width: 100%;">
                    <label style="display: block; margin-bottom: 10px; font-weight: bold;">Custom Parameters (JSON):</label>
                    <textarea id="custom-params" style="
                        width: 100%;
                        height: 100px;
                        background: #2a2a2a;
                        color: #fff;
                        border: 1px solid #555;
                        border-radius: 4px;
                        padding: 10px;
                        font-family: monospace;
                        resize: vertical;
                    " placeholder='{
  "brightness": 1.2,
  "contrast": 1.1,
  "saturation": 1.3,
  "sharpness": 1.1,
  "blur_radius": 0.5
}'></textarea>
                    <small style="color: #888; margin-top: 5px; display: block;">
                        Available parameters: brightness, contrast, saturation, sharpness, blur_radius
                    </small>
                </div>
            `;
        } else {
            html = `
                <div style="width: 100%;">
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 10px; font-weight: bold;">
                            Processing Strength: <span id="strength-value">1.0</span>
                        </label>
                        <input type="range" id="strength-slider" min="0" max="2" step="0.1" value="1.0" style="
                            width: 100%;
                            height: 6px;
                            background: #555;
                            border-radius: 3px;
                            outline: none;
                        ">
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <label style="display: flex; align-items: center; cursor: pointer;">
                            <input type="checkbox" id="preserve-details" checked style="margin-right: 10px;">
                            <span>Preserve Details</span>
                        </label>
                        <small style="color: #888; margin-top: 5px; display: block;">
                            Enable to maintain fine details during processing
                        </small>
                    </div>
                    
                    <div>
                        <label style="display: block; margin-bottom: 10px; font-weight: bold;">
                            Guidance: <span id="guidance-value">7.5</span>
                        </label>
                        <input type="range" id="guidance-slider" min="0" max="20" step="0.5" value="7.5" style="
                            width: 100%;
                            height: 6px;
                            background: #555;
                            border-radius: 3px;
                            outline: none;
                        ">
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;

        // 绑定事件
        const strengthSlider = document.getElementById('strength-slider');
        const strengthValue = document.getElementById('strength-value');
        const guidanceSlider = document.getElementById('guidance-slider');
        const guidanceValue = document.getElementById('guidance-value');

        if (strengthSlider && strengthValue) {
            strengthSlider.addEventListener('input', (e) => {
                strengthValue.textContent = e.target.value;
            });
        }

        if (guidanceSlider && guidanceValue) {
            guidanceSlider.addEventListener('input', (e) => {
                guidanceValue.textContent = e.target.value;
            });
        }

        // 启用按钮
        const previewBtn = document.getElementById('preview-btn');
        const applyBtn = document.getElementById('apply-btn');
        
        if (previewBtn) {
            previewBtn.disabled = false;
            previewBtn.style.opacity = '1';
        }
        
        if (applyBtn) {
            applyBtn.disabled = false;
            applyBtn.style.opacity = '1';
            applyBtn.onclick = () => applySettings(mode);
        }
    }

    // 更新节点模式
    function updateNodeMode(node, mode) {
        const modeWidget = node.widgets?.find(w => w.name === 'processing_mode');
        if (modeWidget) {
            modeWidget.value = mode;
        }

        // 更新节点状态显示
        const statusWidget = node.widgets?.find(w => w.name === 'status');
        if (statusWidget) {
            const config = PROCESSING_MODES[mode];
            statusWidget.value = `${config.icon} ${config.name} mode selected`;
        }
    }

    // 应用设置
    function applySettings(mode) {
        const strengthSlider = document.getElementById('strength-slider');
        const guidanceSlider = document.getElementById('guidance-slider');
        const preserveDetails = document.getElementById('preserve-details');
        const customParams = document.getElementById('custom-params');

        // 收集参数
        const settings = {
            mode: mode,
            strength: strengthSlider ? parseFloat(strengthSlider.value) : 1.0,
            guidance: guidanceSlider ? parseFloat(guidanceSlider.value) : 7.5,
            preserve_details: preserveDetails ? preserveDetails.checked : true,
            custom_params: customParams ? customParams.value : ""
        };

        // 显示成功消息
        const panel = document.getElementById('global-processor-panel');
        const successMsg = document.createElement('div');
        successMsg.style.cssText = `
            position: absolute !important;
            top: 120px !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
            background: #4CAF50 !important;
            color: white !important;
            padding: 10px 20px !important;
            border-radius: 4px !important;
            z-index: 20000 !important;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3) !important;
            animation: slideDown 0.3s ease-out !important;
        `;
        successMsg.textContent = `✅ Settings applied for ${PROCESSING_MODES[mode].name}!`;
        
        // 添加动画样式（如果还没有）
        if (!document.getElementById('global-success-msg-animation')) {
            const style = document.createElement('style');
            style.id = 'global-success-msg-animation';
            style.textContent = `
                @keyframes slideDown {
                    from {
                        transform: translateX(-50%) translateY(-20px);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(-50%) translateY(0);
                        opacity: 1;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        panel.appendChild(successMsg);

        setTimeout(() => successMsg.remove(), 3000);

        console.log('Global processor settings applied:', settings);
    }

    // 注册扩展
    app.registerExtension({
        name: "Kontext.GlobalImageProcessor",
        
        async beforeRegisterNodeDef(nodeType, nodeData, app) {
            if (nodeData.name === "GlobalImageProcessor") {
                console.log("🌍 Registering Global Image Processor Node");
                
                // 添加节点创建时的回调
                const onNodeCreated = nodeType.prototype.onNodeCreated;
                nodeType.prototype.onNodeCreated = function () {
                    const r = onNodeCreated ? onNodeCreated.apply(this, arguments) : undefined;
                    
                    // 设置节点样式
                    this.color = "#FF9800";
                    this.bgcolor = "#F57C00";
                    
                    // 添加状态显示
                    this.addWidget("text", "status", "Ready for global processing", () => {}, {
                        serialize: false
                    });
                    
                    // 监听双击事件
                    this.onDblClick = function(event) {
                        console.log("🌍 Global Image Processor double-clicked!");
                        
                        if (event) {
                            event.preventDefault();
                            event.stopPropagation();
                        }
                        
                        // 打开配置面板
                        createConfigPanel(this);
                        
                        return false;
                    };
                    
                    return r;
                };
            }
        }
    });

    console.log("✅ Global Image Processor extension loaded successfully");
})();