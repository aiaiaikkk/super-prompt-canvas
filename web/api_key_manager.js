/**
 * API密钥管理器 - 使用localStorage持久化存储
 * 不修改ComfyUI核心，仅在节点级别处理
 */

import { app } from "../../scripts/app.js";

class APIKeyManager {
    constructor() {
        this.STORAGE_KEY = "kontext_api_keys";
        this.NODE_TYPE = "KontextSuperPrompt";
        this.init();
    }

    init() {
        // 注册ComfyUI扩展
        app.registerExtension({
            name: "Kontext.APIKeyManager",
            
            // 节点创建时
            async nodeCreated(node) {
                if (node.type === "KontextSuperPrompt" || node.comfyClass === "KontextSuperPrompt") {
                    // 延迟处理，确保widgets已创建
                    setTimeout(() => {
                        this.enhanceNode(node);
                    }, 0);
                }
            },
            
            // 在序列化之前保存API密钥
            async beforeRegisterNodeDef(nodeType, nodeData, app) {
                if (nodeData.name === "KontextSuperPrompt") {
                    // 劫持序列化方法
                    const originalSerialize = nodeType.prototype.serialize;
                    nodeType.prototype.serialize = function() {
                        const data = originalSerialize ? originalSerialize.call(this) : {};
                        
                        // 保存API密钥到localStorage而不是工作流
                        const apiKeyWidget = this.widgets?.find(w => w.name === "api_key");
                        const apiProviderWidget = this.widgets?.find(w => w.name === "api_provider");
                        
                        if (apiKeyWidget && apiKeyWidget.value) {
                            const manager = window.kontextAPIManager || new APIKeyManager();
                            manager.saveKey(
                                apiProviderWidget?.value || "siliconflow",
                                apiKeyWidget.value
                            );
                        }
                        
                        // 不将API密钥保存到工作流JSON中
                        if (data.widgets_values) {
                            const apiKeyIndex = this.widgets?.findIndex(w => w.name === "api_key");
                            if (apiKeyIndex >= 0 && data.widgets_values[apiKeyIndex]) {
                                // 保存一个占位符而不是实际密钥
                                data.widgets_values[apiKeyIndex] = "";
                            }
                        }
                        
                        return data;
                    };
                    
                    // 劫持配置方法
                    const originalConfigure = nodeType.prototype.configure;
                    nodeType.prototype.configure = function(data) {
                        if (originalConfigure) {
                            originalConfigure.call(this, data);
                        }
                        
                        // 从localStorage恢复API密钥
                        setTimeout(() => {
                            const manager = window.kontextAPIManager || new APIKeyManager();
                            manager.restoreNodeKeys(this);
                        }, 100);
                    };
                }
            }
        });
    }
    
    enhanceNode(node) {
        // 找到相关widgets
        const apiKeyWidget = node.widgets?.find(w => w.name === "api_key");
        const apiProviderWidget = node.widgets?.find(w => w.name === "api_provider");
        const tabModeWidget = node.widgets?.find(w => w.name === "tab_mode");
        
        if (!apiKeyWidget || !apiProviderWidget) return;
        
        // 立即尝试恢复
        this.restoreNodeKeys(node);
        
        // 监听provider变化
        const originalProviderCallback = apiProviderWidget.callback;
        apiProviderWidget.callback = (value) => {
            if (originalProviderCallback) {
                originalProviderCallback.call(apiProviderWidget, value);
            }
            
            // 切换provider时加载对应的密钥
            const savedKey = this.getKey(value);
            if (savedKey) {
                apiKeyWidget.value = savedKey;
            } else {
                apiKeyWidget.value = "";
            }
        };
        
        // 监听密钥变化并自动保存
        const originalKeyCallback = apiKeyWidget.callback;
        apiKeyWidget.callback = (value) => {
            if (originalKeyCallback) {
                originalKeyCallback.call(apiKeyWidget, value);
            }
            
            // 自动保存到localStorage
            if (value && value.trim()) {
                const provider = apiProviderWidget.value || "siliconflow";
                this.saveKey(provider, value);
                console.log(`[APIKeyManager] 自动保存 ${provider} 密钥`);
            }
        };
        
        // 监听tab切换
        if (tabModeWidget) {
            const originalTabCallback = tabModeWidget.callback;
            tabModeWidget.callback = (value) => {
                if (originalTabCallback) {
                    originalTabCallback.call(tabModeWidget, value);
                }
                
                // 当切换到API tab时，恢复密钥
                if (value === "api") {
                    setTimeout(() => {
                        this.restoreNodeKeys(node);
                    }, 0);
                }
            };
        }
        
        // 添加手动保存/加载按钮
        this.addManagementButtons(node);
    }
    
    addManagementButtons(node) {
        // 添加一个清除密钥的按钮
        const clearButton = node.addWidget("button", "🗑️ 清除保存的密钥", null, () => {
            const apiProviderWidget = node.widgets?.find(w => w.name === "api_provider");
            if (apiProviderWidget) {
                const provider = apiProviderWidget.value || "siliconflow";
                this.removeKey(provider);
                
                // 清空输入框
                const apiKeyWidget = node.widgets?.find(w => w.name === "api_key");
                if (apiKeyWidget) {
                    apiKeyWidget.value = "";
                }
                
                alert(`已清除 ${provider} 的保存密钥`);
            }
        });
        
        // 按钮不序列化
        clearButton.serialize = false;
    }
    
    restoreNodeKeys(node) {
        const apiProviderWidget = node.widgets?.find(w => w.name === "api_provider");
        const apiKeyWidget = node.widgets?.find(w => w.name === "api_key");
        
        if (!apiProviderWidget || !apiKeyWidget) return;
        
        const provider = apiProviderWidget.value || "siliconflow";
        const savedKey = this.getKey(provider);
        
        if (savedKey && (!apiKeyWidget.value || apiKeyWidget.value === "")) {
            apiKeyWidget.value = savedKey;
            console.log(`[APIKeyManager] 恢复 ${provider} 密钥`);
        }
    }
    
    // localStorage操作方法
    saveKey(provider, key) {
        try {
            const keys = this.getAllKeys();
            keys[provider] = key;
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(keys));
        } catch (e) {
            console.error("[APIKeyManager] 保存失败:", e);
        }
    }
    
    getKey(provider) {
        try {
            const keys = this.getAllKeys();
            return keys[provider] || "";
        } catch (e) {
            console.error("[APIKeyManager] 读取失败:", e);
            return "";
        }
    }
    
    removeKey(provider) {
        try {
            const keys = this.getAllKeys();
            delete keys[provider];
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(keys));
        } catch (e) {
            console.error("[APIKeyManager] 删除失败:", e);
        }
    }
    
    getAllKeys() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            return stored ? JSON.parse(stored) : {};
        } catch (e) {
            return {};
        }
    }
}

// 创建全局实例
window.kontextAPIManager = new APIKeyManager();

console.log("[APIKeyManager] API密钥管理器已加载 - 使用localStorage持久化");