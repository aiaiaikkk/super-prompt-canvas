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
        const self = this; // 保存this引用
        
        // 注册ComfyUI扩展
        app.registerExtension({
            name: "Kontext.APIKeyManager",
            
            // 节点创建时
            async nodeCreated(node) {
                if (node.type === "KontextSuperPrompt" || node.comfyClass === "KontextSuperPrompt") {
                    console.log("[APIKeyManager] KontextSuperPrompt节点已创建，准备增强...");
                    // 延迟处理，确保widgets已创建
                    setTimeout(() => {
                        self.enhanceNode(node);
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
                            const provider = apiProviderWidget?.value || "siliconflow";
                            const currentKey = apiKeyWidget.value;
                            const savedKey = self.getKey(provider);
                            
                            // 只有当密钥改变时才保存（避免频繁保存）
                            if (currentKey !== savedKey) {
                                console.log("[APIKeyManager] 序列化时保存密钥:", provider);
                                self.saveKey(provider, currentKey);
                            }
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
                            console.log("[APIKeyManager] 尝试从localStorage恢复密钥...");
                            self.restoreNodeKeys(this);
                        }, 100);
                    };
                }
            }
        });
    }
    
    enhanceNode(node) {
        console.log("[APIKeyManager] 开始增强节点...", node);
        
        // 找到相关widgets
        const apiKeyWidget = node.widgets?.find(w => w.name === "api_key");
        const apiProviderWidget = node.widgets?.find(w => w.name === "api_provider");
        const tabModeWidget = node.widgets?.find(w => w.name === "tab_mode");
        
        console.log("[APIKeyManager] 找到的widgets:", {
            apiKey: !!apiKeyWidget,
            apiProvider: !!apiProviderWidget,
            tabMode: !!tabModeWidget
        });
        
        if (!apiKeyWidget || !apiProviderWidget) {
            console.log("[APIKeyManager] 缺少必要的widgets，跳过增强");
            return;
        }
        
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
                
                // 触发UI更新
                if (apiKeyWidget.callback) {
                    apiKeyWidget.callback(savedKey);
                }
                
                // 触发change事件确保UI更新
                if (apiKeyWidget.element) {
                    const event = new Event('input', { bubbles: true });
                    apiKeyWidget.element.dispatchEvent(event);
                }
                
                console.log(`[APIKeyManager] 切换到 ${value}，自动填充并更新UI`);
            } else {
                apiKeyWidget.value = "";
                
                // 触发UI更新
                if (apiKeyWidget.callback) {
                    apiKeyWidget.callback("");
                }
                
                // 触发change事件确保UI更新
                if (apiKeyWidget.element) {
                    const event = new Event('input', { bubbles: true });
                    apiKeyWidget.element.dispatchEvent(event);
                }
                
                console.log(`[APIKeyManager] 切换到 ${value}，清空密钥框`);
            }
        };
        
        // 监听密钥变化并自动保存
        const originalKeyCallback = apiKeyWidget.callback;
        apiKeyWidget.callback = (value) => {
            if (originalKeyCallback) {
                originalKeyCallback.call(apiKeyWidget, value);
            }
            
            // 自动保存到localStorage（避免重复保存）
            if (value && value.trim()) {
                const provider = apiProviderWidget.value || "siliconflow";
                const savedKey = this.getKey(provider);
                if (value !== savedKey) {
                    this.saveKey(provider, value);
                    console.log(`[APIKeyManager] 自动保存 ${provider} 密钥`);
                }
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
        console.log("[APIKeyManager] 开始恢复节点密钥...");
        
        const apiProviderWidget = node.widgets?.find(w => w.name === "api_provider");
        const apiKeyWidget = node.widgets?.find(w => w.name === "api_key");
        
        if (!apiProviderWidget || !apiKeyWidget) {
            console.log("[APIKeyManager] 恢复失败：缺少必要的widgets");
            return;
        }
        
        const provider = apiProviderWidget.value || "siliconflow";
        const savedKey = this.getKey(provider);
        const currentKey = apiKeyWidget.value;
        
        console.log("[APIKeyManager] 恢复状态:", {
            provider: provider,
            hasSavedKey: !!savedKey,
            currentKey: currentKey ? "有值" : "空",
            savedKeyLength: savedKey ? savedKey.length : 0
        });
        
        if (savedKey && (!currentKey || currentKey === "")) {
            apiKeyWidget.value = savedKey;
            
            // 触发UI更新和回调
            if (apiKeyWidget.callback) {
                apiKeyWidget.callback(savedKey);
            }
            
            // 强制重绘节点
            if (node.setDirtyCanvas) {
                node.setDirtyCanvas(true, true);
            }
            
            // 触发change事件确保UI更新
            if (apiKeyWidget.element) {
                const event = new Event('input', { bubbles: true });
                apiKeyWidget.element.dispatchEvent(event);
            }
            
            console.log(`[APIKeyManager] ✅ 已恢复并更新UI ${provider} 密钥 (${savedKey.length}字符)`);
        } else if (savedKey && currentKey) {
            console.log(`[APIKeyManager] 跳过恢复：当前已有密钥`);
        } else {
            console.log(`[APIKeyManager] 跳过恢复：没有保存的密钥`);
        }
    }
    
    // localStorage操作方法
    saveKey(provider, key) {
        try {
            const keys = this.getAllKeys();
            keys[provider] = key;
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(keys));
            console.log(`[APIKeyManager] ✅ 已保存 ${provider} 密钥到localStorage (${key.length}字符)`);
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