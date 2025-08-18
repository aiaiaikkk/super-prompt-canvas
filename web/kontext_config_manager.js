/**
 * Kontext Super Prompt 配置管理器前端扩展
 * 增强API密钥管理的用户体验
 */

import { app } from "../../scripts/app.js";
import { ComfyWidgets } from "../../scripts/widgets.js";

// 配置管理器前端功能
class KontextConfigManager {
    constructor() {
        this.savedKeys = new Set();
        this.monitoringTimer = null;
        this.lastKnownSettings = {};
        this.init();
    }

    async init() {
        // 等待应用初始化
        await new Promise(resolve => {
            if (app.graph) {
                resolve();
            } else {
                app.addEventListener("graphChanged", resolve, { once: true });
            }
        });

        this.setupNodeExtensions();
        
        // 启动持续监控
        this.startMonitoring();
    }

    setupNodeExtensions() {
        // 扩展 KontextSuperPrompt 节点
        const originalNodeCreated = app.graph.onNodeAdded;
        
        app.graph.onNodeAdded = (node) => {
            if (originalNodeCreated) {
                originalNodeCreated.call(app.graph, node);
            }
            
            if (node.comfyClass === "KontextSuperPrompt") {
                this.enhanceKontextNode(node);
            }
        };

        // 监听工作流加载事件
        const originalLoadGraph = app.loadGraphData;
        app.loadGraphData = (graphData) => {
            const result = originalLoadGraph.call(app, graphData);
            
            // 工作流加载后，延迟恢复所有KontextSuperPrompt节点的设置
            setTimeout(() => {
                this.restoreAllNodeSettings();
            }, 500);
            
            return result;
        };

        // 监听图形变化事件
        app.graph.onGraphChanged = () => {
            // 每次图形变化时检查和恢复设置
            setTimeout(() => {
                this.restoreAllNodeSettings();
            }, 100);
        };

        // 处理现有节点
        if (app.graph && app.graph._nodes) {
            app.graph._nodes.forEach(node => {
                if (node.comfyClass === "KontextSuperPrompt") {
                    this.enhanceKontextNode(node);
                }
            });
        }
    }

    enhanceKontextNode(node) {
        // 为API密钥输入框添加增强功能
        const apiKeyWidget = node.widgets?.find(w => w.name === "api_key");
        const apiProviderWidget = node.widgets?.find(w => w.name === "api_provider");
        
        if (apiKeyWidget && apiProviderWidget) {
            this.enhanceApiKeyWidget(node, apiKeyWidget);
            this.autoFillApiKey(node, apiKeyWidget, apiProviderWidget);
        }

        // 添加设置管理按钮
        this.addConfigButton(node);
        
        // 监听提供商变化，自动切换密钥
        if (apiProviderWidget) {
            this.setupProviderChangeListener(node, apiProviderWidget, apiKeyWidget);
        }
    }

    enhanceApiKeyWidget(node, widget) {
        const originalOnChange = widget.callback;
        
        widget.callback = (value) => {
            // 保存原始回调
            if (originalOnChange) {
                originalOnChange.call(widget, value);
            }
            
            // 检查是否是已保存的密钥
            if (value && value.length > 0) {
                this.markKeyAsSaved(node, value);
            }
        };

        // 添加密钥状态指示
        this.addKeyStatusIndicator(node, widget);
    }

    addKeyStatusIndicator(node, widget) {
        // 在节点上添加状态文本
        const originalDrawForeground = node.onDrawForeground;
        
        node.onDrawForeground = function(ctx) {
            if (originalDrawForeground) {
                originalDrawForeground.call(this, ctx);
            }
            
            // 绘制密钥状态指示
            const apiProviderWidget = this.widgets?.find(w => w.name === "api_provider");
            const apiKeyWidget = this.widgets?.find(w => w.name === "api_key");
            
            if (apiProviderWidget && apiKeyWidget) {
                const provider = apiProviderWidget.value;
                const hasKey = apiKeyWidget.value && apiKeyWidget.value.length > 0;
                
                if (hasKey) {
                    ctx.save();
                    ctx.font = "12px monospace";
                    ctx.fillStyle = "#4CAF50";
                    ctx.fillText(`🔑 ${provider} API密钥已保存`, 10, this.size[1] - 25);
                    ctx.restore();
                }
            }
        };
    }

    addConfigButton(node) {
        // 添加配置管理按钮
        const configButton = node.addWidget("button", "🔧 密钥管理", null, () => {
            this.showConfigDialog(node);
        });
        
        configButton.serialize = false; // 不序列化这个按钮
    }

    async showConfigDialog(node) {
        // 创建配置对话框
        const dialog = document.createElement("div");
        dialog.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #2a2a2a;
            border: 1px solid #555;
            border-radius: 8px;
            padding: 20px;
            z-index: 10000;
            min-width: 400px;
            color: white;
            font-family: monospace;
        `;

        dialog.innerHTML = `
            <div style="margin-bottom: 15px;">
                <h3 style="margin: 0 0 10px 0; color: #4CAF50;">🔑 API密钥管理</h3>
                <p style="margin: 0; font-size: 12px; color: #aaa;">
                    管理保存的API密钥和设置
                </p>
            </div>
            
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px;">已保存的API密钥:</label>
                <div id="saved-keys-list" style="background: #1a1a1a; padding: 10px; border-radius: 4px; min-height: 60px;">
                    <div style="color: #666;">加载中...</div>
                </div>
            </div>
            
            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button id="refresh-keys" style="background: #555; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
                    🔄 刷新
                </button>
                <button id="clear-all-keys" style="background: #f44336; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
                    🗑️ 清除所有
                </button>
                <button id="close-dialog" style="background: #4CAF50; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
                    关闭
                </button>
            </div>
        `;

        document.body.appendChild(dialog);

        // 加载已保存的密钥列表
        this.loadSavedKeysList(dialog);

        // 事件处理
        dialog.querySelector("#refresh-keys").onclick = () => {
            this.loadSavedKeysList(dialog);
        };

        dialog.querySelector("#clear-all-keys").onclick = () => {
            if (confirm("确定要清除所有保存的API密钥吗？")) {
                this.clearAllKeys();
                this.loadSavedKeysList(dialog);
            }
        };

        dialog.querySelector("#close-dialog").onclick = () => {
            document.body.removeChild(dialog);
        };

        // 点击外部关闭
        dialog.onclick = (e) => {
            if (e.target === dialog) {
                document.body.removeChild(dialog);
            }
        };
    }

    async loadSavedKeysList(dialog) {
        const listContainer = dialog.querySelector("#saved-keys-list");
        
        try {
            // 调用后端API获取保存的密钥列表
            const response = await fetch('/kontext_api/list_providers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            const savedProviders = data.providers || [];
            
            if (savedProviders.length === 0) {
                listContainer.innerHTML = '<div style="color: #666;">暂无保存的API密钥</div>';
                return;
            }

            listContainer.innerHTML = savedProviders.map(provider => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 5px 0; border-bottom: 1px solid #333;">
                    <span style="color: #4CAF50;">🔑 ${provider}</span>
                    <button onclick="this.removeApiKey('${provider}', this.parentElement)" style="background: #f44336; color: white; border: none; padding: 2px 8px; border-radius: 3px; cursor: pointer; font-size: 12px;">
                        删除
                    </button>
                </div>
            `).join('');
            
        } catch (error) {
            listContainer.innerHTML = '<div style="color: #f44336;">加载失败: ' + error.message + '</div>';
        }
    }

    async clearAllKeys() {
        try {
            // 调用后端API清除所有密钥
            const response = await fetch('/kontext_api/clear_all_keys', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            if (response.ok) {
                console.log("所有API密钥已清除");
                this.savedKeys.clear();
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            alert("清除失败: " + error.message);
        }
    }

    async removeApiKey(provider, element) {
        try {
            // 调用后端API删除特定提供商的密钥
            const response = await fetch('/kontext_api/save_api_key', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    provider: provider,
                    api_key: "" // 传空字符串表示删除
                })
            });
            
            if (response.ok) {
                element.remove();
                console.log(`${provider} API密钥已删除`);
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            alert(`删除${provider}密钥失败: ` + error.message);
        }
    }

    async autoFillApiKey(node, apiKeyWidget, apiProviderWidget) {
        // 如果API密钥为空，尝试从后端加载保存的密钥
        if (!apiKeyWidget.value || apiKeyWidget.value.trim() === "") {
            const provider = apiProviderWidget.value || "siliconflow";
            const savedKey = await this.loadApiKey(provider);
            
            if (savedKey && savedKey.trim() !== "") {
                apiKeyWidget.value = savedKey;
                console.log(`[Kontext] 自动填充 ${provider} API密钥`);
                
                // 触发更新
                if (apiKeyWidget.callback) {
                    apiKeyWidget.callback(savedKey);
                }
                
                // 标记为已保存
                this.markKeyAsSaved(node, savedKey);
            }
        }
    }

    setupProviderChangeListener(node, apiProviderWidget, apiKeyWidget) {
        const originalCallback = apiProviderWidget.callback;
        
        apiProviderWidget.callback = async (value) => {
            // 调用原始回调
            if (originalCallback) {
                originalCallback.call(apiProviderWidget, value);
            }
            
            // 当提供商变化时，自动加载对应的API密钥
            const savedKey = await this.loadApiKey(value);
            if (savedKey && savedKey.trim() !== "") {
                apiKeyWidget.value = savedKey;
                console.log(`[Kontext] 切换到 ${value}，自动填充API密钥`);
                
                // 触发API密钥的回调
                if (apiKeyWidget.callback) {
                    apiKeyWidget.callback(savedKey);
                }
                
                this.markKeyAsSaved(node, savedKey);
            } else {
                // 清空密钥框，因为该提供商没有保存的密钥
                apiKeyWidget.value = "";
                if (apiKeyWidget.callback) {
                    apiKeyWidget.callback("");
                }
            }
        };
    }

    async loadApiKey(provider) {
        // 调用后端API获取保存的密钥
        try {
            const response = await fetch('/kontext_api/get_api_key', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ provider: provider })
            });
            
            if (response.ok) {
                const data = await response.json();
                return data.api_key || "";
            }
        } catch (error) {
            console.log(`[Kontext] 无法加载 ${provider} 的API密钥:`, error);
        }
        
        return "";
    }

    async saveApiKey(provider, apiKey) {
        // 调用后端API保存密钥
        try {
            const response = await fetch('/kontext_api/save_api_key', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    provider: provider,
                    api_key: apiKey
                })
            });
            
            if (response.ok) {
                console.log(`[Kontext] ${provider} API密钥已保存到服务器`);
                return true;
            }
        } catch (error) {
            console.log(`[Kontext] 保存 ${provider} API密钥失败:`, error);
        }
        
        return false;
    }

    async restoreAllNodeSettings() {
        """恢复所有KontextSuperPrompt节点的保存设置"""
        if (!app.graph || !app.graph._nodes) return;
        
        for (const node of app.graph._nodes) {
            if (node.comfyClass === "KontextSuperPrompt") {
                await this.restoreNodeSettings(node);
            }
        }
    }

    async restoreNodeSettings(node) {
        """恢复单个节点的保存设置"""
        try {
            // 获取保存的设置
            const apiSettings = await this.loadSavedSettings();
            
            // 恢复API提供商
            const apiProviderWidget = node.widgets?.find(w => w.name === "api_provider");
            if (apiProviderWidget && apiSettings.last_provider) {
                if (apiProviderWidget.value !== apiSettings.last_provider) {
                    apiProviderWidget.value = apiSettings.last_provider;
                    console.log(`[Kontext] 恢复API提供商: ${apiSettings.last_provider}`);
                }
            }
            
            // 恢复API密钥
            const apiKeyWidget = node.widgets?.find(w => w.name === "api_key");
            if (apiKeyWidget && apiProviderWidget) {
                const provider = apiProviderWidget.value || "siliconflow";
                const savedKey = await this.loadApiKey(provider);
                
                if (savedKey && savedKey.trim() !== "") {
                    if (apiKeyWidget.value !== savedKey) {
                        apiKeyWidget.value = savedKey;
                        console.log(`[Kontext] 恢复 ${provider} API密钥`);
                    }
                }
            }
            
            // 恢复其他API设置
            const apiModelWidget = node.widgets?.find(w => w.name === "api_model");
            if (apiModelWidget && apiSettings.last_model) {
                if (apiModelWidget.value !== apiSettings.last_model) {
                    apiModelWidget.value = apiSettings.last_model;
                }
            }
            
            const apiEditingIntentWidget = node.widgets?.find(w => w.name === "api_editing_intent");
            if (apiEditingIntentWidget && apiSettings.last_editing_intent) {
                if (apiEditingIntentWidget.value !== apiSettings.last_editing_intent) {
                    apiEditingIntentWidget.value = apiSettings.last_editing_intent;
                }
            }
            
            const apiProcessingStyleWidget = node.widgets?.find(w => w.name === "api_processing_style");
            if (apiProcessingStyleWidget && apiSettings.last_processing_style) {
                if (apiProcessingStyleWidget.value !== apiSettings.last_processing_style) {
                    apiProcessingStyleWidget.value = apiSettings.last_processing_style;
                }
            }
            
            // 恢复选项卡模式
            const tabModeWidget = node.widgets?.find(w => w.name === "tab_mode");
            if (tabModeWidget && apiSettings.last_tab) {
                if (tabModeWidget.value !== apiSettings.last_tab) {
                    tabModeWidget.value = apiSettings.last_tab;
                }
            }
            
        } catch (error) {
            console.log(`[Kontext] 恢复节点设置失败:`, error);
        }
    }

    async loadSavedSettings() {
        """加载保存的设置"""
        try {
            const response = await fetch('/kontext_api/get_settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                return data.settings || {};
            }
        } catch (error) {
            console.log('[Kontext] 无法加载保存的设置:', error);
        }
        
        return {};
    }

    startMonitoring() {
        """启动持续监控，每2秒检查一次节点设置"""
        if (this.monitoringTimer) {
            clearInterval(this.monitoringTimer);
        }
        
        this.monitoringTimer = setInterval(async () => {
            await this.checkAndRestoreSettings();
        }, 2000); // 每2秒检查一次
        
        console.log("[Kontext] 设置监控已启动");
    }

    async checkAndRestoreSettings() {
        """检查并恢复所有节点的设置"""
        if (!app.graph || !app.graph._nodes) return;
        
        for (const node of app.graph._nodes) {
            if (node.comfyClass === "KontextSuperPrompt") {
                await this.checkAndRestoreNodeSettings(node);
            }
        }
    }

    async checkAndRestoreNodeSettings(node) {
        """检查并恢复单个节点的设置"""
        try {
            const apiProviderWidget = node.widgets?.find(w => w.name === "api_provider");
            const apiKeyWidget = node.widgets?.find(w => w.name === "api_key");
            
            if (!apiProviderWidget || !apiKeyWidget) return;
            
            // 如果设置被重置了，就恢复它们
            const needsRestore = 
                !apiKeyWidget.value || 
                apiKeyWidget.value.trim() === "" ||
                apiProviderWidget.value === "siliconflow"; // 默认值说明被重置了
            
            if (needsRestore) {
                // 加载保存的设置
                const settings = await this.loadSavedSettings();
                
                // 恢复API提供商
                if (settings.last_provider && apiProviderWidget.value !== settings.last_provider) {
                    apiProviderWidget.value = settings.last_provider;
                    console.log(`[Kontext] 自动恢复API提供商: ${settings.last_provider}`);
                }
                
                // 恢复API密钥
                const provider = apiProviderWidget.value || settings.last_provider || "siliconflow";
                const savedKey = await this.loadApiKey(provider);
                
                if (savedKey && savedKey.trim() !== "" && apiKeyWidget.value !== savedKey) {
                    apiKeyWidget.value = savedKey;
                    console.log(`[Kontext] 自动恢复 ${provider} API密钥`);
                }
                
                // 恢复其他设置
                const widgets = {
                    'api_model': settings.last_model,
                    'api_editing_intent': settings.last_editing_intent,
                    'api_processing_style': settings.last_processing_style,
                    'tab_mode': settings.last_tab
                };
                
                for (const [widgetName, savedValue] of Object.entries(widgets)) {
                    if (savedValue) {
                        const widget = node.widgets?.find(w => w.name === widgetName);
                        if (widget && widget.value !== savedValue) {
                            widget.value = savedValue;
                        }
                    }
                }
            }
            
        } catch (error) {
            // 静默处理错误，避免控制台刷屏
            if (error.message && !error.message.includes('fetch')) {
                console.log(`[Kontext] 检查节点设置时出错:`, error);
            }
        }
    }

    markKeyAsSaved(node, key) {
        const provider = node.widgets?.find(w => w.name === "api_provider")?.value || "unknown";
        this.savedKeys.add(provider);
        
        // 强制重绘节点以更新状态指示
        if (node.setDirtyCanvas) {
            node.setDirtyCanvas(true);
        }
    }
}

// 初始化配置管理器
const configManager = new KontextConfigManager();

// 添加样式
const style = document.createElement("style");
style.textContent = `
    /* Kontext配置管理器样式 */
    .kontext-config-button {
        background: #4CAF50 !important;
        color: white !important;
        border: none !important;
        padding: 4px 8px !important;
        border-radius: 4px !important;
        cursor: pointer !important;
        font-size: 12px !important;
        margin: 2px !important;
    }
    
    .kontext-config-button:hover {
        background: #45a049 !important;
    }
    
    .kontext-key-status {
        color: #4CAF50;
        font-size: 11px;
        margin-left: 5px;
    }
`;
document.head.appendChild(style);

console.log("[Kontext Config Manager] 前端配置管理器已加载");