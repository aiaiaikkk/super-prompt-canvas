"""
Configuration Manager for Kontext Super Prompt
配置管理器 - 安全保存API密钥和用户设置
"""

import os
import json
import base64
import hashlib
import platform
from typing import Dict, Any, Optional

# 使用内置的简单加密方案，不依赖外部库
CRYPTO_AVAILABLE = True  # 总是可用，因为使用内置方法

class ConfigManager:
    """
    配置管理器 - 安全保存API密钥和用户设置
    """
    
    def __init__(self):
        self.config_dir = os.path.join(os.path.expanduser("~"), ".kontext_super_prompt")
        self.config_file = os.path.join(self.config_dir, "config.json")
        self.key_file = os.path.join(self.config_dir, "key.dat")
        
        # 确保配置目录存在
        os.makedirs(self.config_dir, exist_ok=True)
        
        # 初始化加密密钥
        self._init_encryption()
        
        # 加载配置
        self.config = self._load_config()
    
    def _init_encryption(self):
        """初始化加密密钥"""
        try:
            if os.path.exists(self.key_file):
                # 加载现有密钥
                with open(self.key_file, 'r', encoding='utf-8') as f:
                    self.encryption_key = f.read().strip()
            else:
                # 生成新密钥（基于机器特征的简单密钥）
                machine_id = platform.node() + platform.machine() + str(os.getpid())
                self.encryption_key = hashlib.sha256(machine_id.encode()).hexdigest()[:32]
                
                with open(self.key_file, 'w', encoding='utf-8') as f:
                    f.write(self.encryption_key)
                
                # 设置文件权限（仅所有者可读写）
                try:
                    os.chmod(self.key_file, 0o600)
                except OSError:
                    pass  # Windows可能不支持chmod
                    
        except Exception as e:
            print(f"[Kontext Config] Encryption init failed: {e}")
            self.encryption_key = "default_key_12345678901234567890"[:32]
    
    def _encrypt_value(self, value: str) -> str:
        """加密字符串值（简单XOR加密）"""
        if not value:
            return ""
            
        try:
            # 使用简单的XOR加密
            key_bytes = self.encryption_key.encode()
            value_bytes = value.encode()
            
            encrypted_bytes = bytearray()
            for i, byte in enumerate(value_bytes):
                encrypted_bytes.append(byte ^ key_bytes[i % len(key_bytes)])
            
            # Base64编码
            return base64.b64encode(encrypted_bytes).decode()
            
        except Exception as e:
            print(f"[Kontext Config] Encryption failed: {e}")
            # 回退到简单Base64编码
            return base64.b64encode(value.encode()).decode()
    
    def _decrypt_value(self, encrypted_value: str) -> str:
        """解密字符串值"""
        if not encrypted_value:
            return ""
            
        try:
            # Base64解码
            encrypted_bytes = base64.b64decode(encrypted_value.encode())
            
            # XOR解密
            key_bytes = self.encryption_key.encode()
            decrypted_bytes = bytearray()
            for i, byte in enumerate(encrypted_bytes):
                decrypted_bytes.append(byte ^ key_bytes[i % len(key_bytes)])
            
            return decrypted_bytes.decode()
            
        except Exception as e:
            print(f"[Kontext Config] Decryption failed: {e}")
            # 回退到简单Base64解码
            try:
                return base64.b64decode(encrypted_value.encode()).decode()
            except Exception:
                return encrypted_value
    
    def _load_config(self) -> Dict[str, Any]:
        """加载配置文件"""
        default_config = {
            "api_keys": {},  # 存储加密的API密钥
            "api_settings": {
                "last_provider": "siliconflow",
                "last_model": "deepseek-ai/DeepSeek-V3",
                "last_editing_intent": "general_editing",
                "last_processing_style": "auto_smart"
            },
            "ollama_settings": {
                "last_url": "http://127.0.0.1:11434",
                "last_model": "",
                "last_temperature": 0.7,
                "last_editing_intent": "general_editing",
                "last_processing_style": "auto_smart",
                "enable_visual": False,
                "auto_unload": False
            },
            "ui_settings": {
                "remember_tab": True,
                "last_tab": "manual",
                "auto_save_prompts": True
            }
        }
        
        if not os.path.exists(self.config_file):
            return default_config
            
        try:
            with open(self.config_file, 'r', encoding='utf-8') as f:
                loaded_config = json.load(f)
                
            # 合并默认配置和加载的配置
            for key, value in default_config.items():
                if key not in loaded_config:
                    loaded_config[key] = value
                elif isinstance(value, dict):
                    for sub_key, sub_value in value.items():
                        if sub_key not in loaded_config[key]:
                            loaded_config[key][sub_key] = sub_value
            
            return loaded_config
        except Exception as e:
            print(f"[Kontext Config] Failed to load config: {e}")
            return default_config
    
    def _save_config(self):
        """保存配置文件"""
        try:
            with open(self.config_file, 'w', encoding='utf-8') as f:
                json.dump(self.config, f, indent=2, ensure_ascii=False)
            # 设置文件权限
            os.chmod(self.config_file, 0o600)
        except Exception as e:
            print(f"[Kontext Config] Failed to save config: {e}")
    
    def save_api_key(self, provider: str, api_key: str):
        """保存API密钥"""
        if api_key and api_key.strip():
            encrypted_key = self._encrypt_value(api_key.strip())
            self.config["api_keys"][provider] = encrypted_key
            self._save_config()
            print(f"[Kontext Config] API key saved for provider: {provider}")
    
    def get_api_key(self, provider: str) -> str:
        """获取API密钥"""
        encrypted_key = self.config["api_keys"].get(provider, "")
        if encrypted_key:
            return self._decrypt_value(encrypted_key)
        return ""
    
    def remove_api_key(self, provider: str):
        """删除API密钥"""
        if provider in self.config["api_keys"]:
            del self.config["api_keys"][provider]
            self._save_config()
            print(f"[Kontext Config] API key removed for provider: {provider}")
    
    def save_api_settings(self, provider: str, model: str, editing_intent: str, processing_style: str):
        """保存API设置"""
        self.config["api_settings"].update({
            "last_provider": provider,
            "last_model": model,
            "last_editing_intent": editing_intent,
            "last_processing_style": processing_style
        })
        self._save_config()
    
    def get_api_settings(self) -> Dict[str, str]:
        """获取API设置"""
        return self.config["api_settings"].copy()
    
    def save_ollama_settings(self, url: str, model: str, temperature: float, 
                           editing_intent: str, processing_style: str, 
                           enable_visual: bool, auto_unload: bool):
        """保存Ollama设置"""
        self.config["ollama_settings"].update({
            "last_url": url,
            "last_model": model,
            "last_temperature": temperature,
            "last_editing_intent": editing_intent,
            "last_processing_style": processing_style,
            "enable_visual": enable_visual,
            "auto_unload": auto_unload
        })
        self._save_config()
    
    def get_ollama_settings(self) -> Dict[str, Any]:
        """获取Ollama设置"""
        return self.config["ollama_settings"].copy()
    
    def save_ui_settings(self, tab: str):
        """保存UI设置"""
        if self.config["ui_settings"]["remember_tab"]:
            self.config["ui_settings"]["last_tab"] = tab
            self._save_config()
    
    def get_ui_settings(self) -> Dict[str, Any]:
        """获取UI设置"""
        return self.config["ui_settings"].copy()
    
    def list_saved_providers(self) -> list:
        """列出已保存密钥的提供商"""
        return list(self.config["api_keys"].keys())
    
    def clear_all_api_keys(self):
        """清除所有API密钥"""
        self.config["api_keys"].clear()
        self._save_config()
        print("[Kontext Config] All API keys cleared")

# 全局配置管理器实例
config_manager = ConfigManager()

# 便捷函数
def save_api_key(provider: str, api_key: str):
    """保存API密钥的便捷函数"""
    config_manager.save_api_key(provider, api_key)

def get_api_key(provider: str) -> str:
    """获取API密钥的便捷函数"""
    return config_manager.get_api_key(provider)

def get_api_settings() -> Dict[str, str]:
    """获取API设置的便捷函数"""
    return config_manager.get_api_settings()

def save_api_settings(provider: str, model: str, editing_intent: str, processing_style: str):
    """保存API设置的便捷函数"""
    config_manager.save_api_settings(provider, model, editing_intent, processing_style)

# HTTP API端点
try:
    from aiohttp import web
    from server import PromptServer
    
    @PromptServer.instance.routes.post("/kontext_api/get_api_key")
    async def get_api_key_endpoint(request):
        """获取API密钥的HTTP端点"""
        try:
            data = await request.json()
            provider = data.get('provider', '')
            
            if not provider:
                return web.json_response({"error": "Provider not specified"}, status=400)
            
            api_key = get_api_key(provider)
            return web.json_response({"api_key": api_key})
            
        except Exception as e:
            return web.json_response({"error": str(e)}, status=500)
    
    @PromptServer.instance.routes.post("/kontext_api/save_api_key")
    async def save_api_key_endpoint(request):
        """保存API密钥的HTTP端点"""
        try:
            data = await request.json()
            provider = data.get('provider', '')
            api_key = data.get('api_key', '')
            
            if not provider:
                return web.json_response({"error": "Provider not specified"}, status=400)
            
            save_api_key(provider, api_key)
            return web.json_response({"success": True, "message": f"API key saved for {provider}"})
            
        except Exception as e:
            return web.json_response({"error": str(e)}, status=500)
    
    @PromptServer.instance.routes.post("/kontext_api/list_providers")
    async def list_providers_endpoint(request):
        """列出已保存密钥的提供商"""
        try:
            providers = config_manager.list_saved_providers()
            return web.json_response({"providers": providers})
            
        except Exception as e:
            return web.json_response({"error": str(e)}, status=500)
    
    @PromptServer.instance.routes.post("/kontext_api/clear_all_keys")
    async def clear_all_keys_endpoint(request):
        """清除所有API密钥"""
        try:
            config_manager.clear_all_api_keys()
            return web.json_response({"success": True, "message": "All API keys cleared"})
            
        except Exception as e:
            return web.json_response({"error": str(e)}, status=500)
    
    @PromptServer.instance.routes.post("/kontext_api/get_settings")
    async def get_settings_endpoint(request):
        """获取所有保存的设置"""
        try:
            api_settings = config_manager.get_api_settings()
            ollama_settings = config_manager.get_ollama_settings()
            ui_settings = config_manager.get_ui_settings()
            
            # 合并所有设置
            all_settings = {
                **api_settings,
                **ollama_settings,
                **ui_settings
            }
            
            return web.json_response({"settings": all_settings})
            
        except Exception as e:
            return web.json_response({"error": str(e)}, status=500)
    
    print("[Kontext Config] HTTP API endpoints registered successfully")
    
except ImportError:
    print("[Kontext Config] Warning: HTTP API endpoints not available (server module not found)")