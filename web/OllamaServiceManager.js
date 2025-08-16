// Ollama Service Manager Node - 服务管理界面
import { app } from "../../scripts/app.js";
import { api } from "../../scripts/api.js";

class OllamaServiceManagerUI {
    constructor(node) {
        this.node = node;
        this.currentStatus = "unknown";
        this.isOperating = false;
        
        // 创建UI
        this.createUI();
        
        // 初始检查状态
        this.checkStatus();
        
        // 定期检查状态
        this.statusInterval = setInterval(() => {
            if (!this.isOperating) {
                this.checkStatus();
            }
        }, 5000);
    }
    
    createUI() {
        // 创建主容器 - 紧凑的一行布局
        const container = document.createElement('div');
        container.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 6px 10px;
            background: #2a2a2a;
            border-radius: 3px;
            border: 1px solid #444;
            font-size: 11px;
        `;
        
        // 服务名称标签
        const nameLabel = document.createElement('span');
        nameLabel.textContent = '🦙';
        nameLabel.style.cssText = `
            font-size: 14px;
            margin-right: 4px;
        `;
        
        // 状态显示
        this.statusIcon = document.createElement('span');
        this.statusIcon.style.cssText = `
            font-size: 12px;
            margin-right: 4px;
        `;
        
        this.statusText = document.createElement('span');
        this.statusText.style.cssText = `
            color: #ccc;
            font-size: 11px;
            min-width: 60px;
        `;
        
        // 主控制按钮 - 紧凑样式
        this.controlButton = document.createElement('button');
        this.controlButton.style.cssText = `
            padding: 4px 8px;
            border: none;
            border-radius: 3px;
            cursor: pointer;
            font-size: 10px;
            font-weight: bold;
            transition: all 0.2s;
            min-width: 60px;
        `;
        
        this.controlButton.addEventListener('click', () => this.toggleService());
        
        // 刷新按钮 - 小图标按钮
        const refreshButton = document.createElement('button');
        refreshButton.textContent = '🔄';
        refreshButton.title = '刷新状态';
        refreshButton.style.cssText = `
            width: 24px;
            height: 24px;
            padding: 2px;
            border: 1px solid #555;
            border-radius: 3px;
            background: #333;
            color: #ccc;
            cursor: pointer;
            font-size: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        refreshButton.addEventListener('click', () => this.checkStatus());
        refreshButton.addEventListener('mouseenter', () => {
            refreshButton.style.background = '#444';
        });
        refreshButton.addEventListener('mouseleave', () => {
            refreshButton.style.background = '#333';
        });
        
        // 组装UI - 一行排列
        container.appendChild(nameLabel);
        container.appendChild(this.statusIcon);
        container.appendChild(this.statusText);
        container.appendChild(this.controlButton);
        container.appendChild(refreshButton);
        
        // 添加到节点
        this.node.addDOMWidget("ollama_manager", "div", container);
        
        // 更新初始状态
        this.updateUI("unknown");
    }
    
    updateUI(status) {
        this.currentStatus = status;
        
        switch (status) {
            case "运行中":
                this.statusIcon.textContent = "🟢";
                this.statusText.textContent = "运行中";
                this.statusText.style.color = "#4CAF50";
                this.controlButton.textContent = "停止";
                this.controlButton.style.background = "#f44336";
                this.controlButton.style.color = "white";
                this.controlButton.disabled = false;
                break;
                
            case "已停止":
                this.statusIcon.textContent = "🔴";
                this.statusText.textContent = "已停止";
                this.statusText.style.color = "#f44336";
                this.controlButton.textContent = "启动";
                this.controlButton.style.background = "#4CAF50";
                this.controlButton.style.color = "white";
                this.controlButton.disabled = false;
                break;
                
            case "starting":
                this.statusIcon.textContent = "🟡";
                this.statusText.textContent = "启动中";
                this.statusText.style.color = "#FF9800";
                this.controlButton.textContent = "启动中";
                this.controlButton.style.background = "#666";
                this.controlButton.style.color = "#ccc";
                this.controlButton.disabled = true;
                break;
                
            case "stopping":
                this.statusIcon.textContent = "🟡";
                this.statusText.textContent = "停止中";
                this.statusText.style.color = "#FF9800";
                this.controlButton.textContent = "停止中";
                this.controlButton.style.background = "#666";
                this.controlButton.style.color = "#ccc";
                this.controlButton.disabled = true;
                break;
                
            default:
                this.statusIcon.textContent = "⚪";
                this.statusText.textContent = "未知";
                this.statusText.style.color = "#999";
                this.controlButton.textContent = "检查";
                this.controlButton.style.background = "#666";
                this.controlButton.style.color = "#ccc";
                this.controlButton.disabled = false;
                break;
        }
        
        // 添加悬停效果
        if (!this.controlButton.disabled) {
            this.controlButton.addEventListener('mouseenter', () => {
                if (this.currentStatus === "运行中") {
                    this.controlButton.style.background = "#d32f2f";
                } else if (this.currentStatus === "已停止") {
                    this.controlButton.style.background = "#388e3c";
                }
            });
            
            this.controlButton.addEventListener('mouseleave', () => {
                if (this.currentStatus === "运行中") {
                    this.controlButton.style.background = "#f44336";
                } else if (this.currentStatus === "已停止") {
                    this.controlButton.style.background = "#4CAF50";
                }
            });
        }
    }
    
    async checkStatus() {
        try {
            const response = await api.fetchApi("/ollama_service_control", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "status" })
            });
            
            const result = await response.json();
            if (result.success) {
                this.updateUI(result.status);
            } else {
                this.showNotification("错误: " + result.message, "error");
            }
        } catch (error) {
            console.error("[Ollama Manager] 状态检查失败:", error);
            this.updateUI("unknown");
        }
    }
    
    async toggleService() {
        if (this.isOperating) return;
        
        this.isOperating = true;
        const action = this.currentStatus === "运行中" ? "stop" : "start";
        const operatingStatus = action === "start" ? "starting" : "stopping";
        
        this.updateUI(operatingStatus);
        
        try {
            const response = await api.fetchApi("/ollama_service_control", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: action })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showNotification(result.message, "success");
                // 等待一秒后检查状态
                setTimeout(() => this.checkStatus(), 1000);
            } else {
                this.showNotification("操作失败: " + result.message, "error");
                this.checkStatus(); // 恢复状态
            }
        } catch (error) {
            console.error(`[Ollama Manager] ${action}操作失败:`, error);
            this.showNotification(`${action}操作失败: ${error.message}`, "error");
            this.checkStatus(); // 恢复状态
        } finally {
            this.isOperating = false;
            this.controlButton.disabled = false;
        }
    }
    
    showNotification(message, type = "info") {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 4px;
            color: white;
            font-size: 14px;
            z-index: 10000;
            max-width: 300px;
            word-wrap: break-word;
            animation: slideIn 0.3s ease-out;
        `;
        
        // 根据类型设置颜色
        switch (type) {
            case "success":
                notification.style.background = "#4CAF50";
                break;
            case "error":
                notification.style.background = "#f44336";
                break;
            default:
                notification.style.background = "#2196F3";
        }
        
        // 添加滑入动画
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(notification);
        
        // 3秒后自动消失
        setTimeout(() => {
            notification.style.animation = 'slideIn 0.3s ease-out reverse';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
    
    destroy() {
        if (this.statusInterval) {
            clearInterval(this.statusInterval);
        }
    }
}

// 注册节点扩展
app.registerExtension({
    name: "OllamaServiceManager",
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name === "OllamaServiceManager") {
            const onNodeCreated = nodeType.prototype.onNodeCreated;
            nodeType.prototype.onNodeCreated = function () {
                if (onNodeCreated) {
                    onNodeCreated.apply(this, arguments);
                }
                
                // 创建UI管理器
                this.ollamaUI = new OllamaServiceManagerUI(this);
                
                // 设置节点大小 - 紧凑的一行布局
                this.size = [280, 50];  // 宽280px, 高50px (一行高度)
                
                // 强制更新节点大小
                if (this.setSize) {
                    this.setSize([280, 50]);
                }
                
                // 禁用自动调整大小
                this.resizable = false;
            };
            
            const onRemoved = nodeType.prototype.onRemoved;
            nodeType.prototype.onRemoved = function () {
                if (this.ollamaUI) {
                    this.ollamaUI.destroy();
                }
                if (onRemoved) {
                    onRemoved.apply(this, arguments);
                }
            };
        }
    }
});

console.log("[Ollama Service Manager] 🦙 UI扩展已注册");