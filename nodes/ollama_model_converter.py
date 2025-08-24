"""
Ollama Model Converter
Ollama模型转换器 - 将GGUF模型自动转换为Ollama格式

功能：
- 扫描指定目录的GGUF文件
- 生成Modelfile配置
- 调用ollama create命令转换模型
- 与现有Ollama集成无缝对接
"""

import os
import json
import subprocess
import time
from pathlib import Path
from typing import Dict, List, Optional, Tuple

try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False

try:
    from server import PromptServer
    from aiohttp import web
    WEB_AVAILABLE = True
except ImportError:
    WEB_AVAILABLE = False

class OllamaModelConverter:
    """Ollama模型转换器"""
    
    def __init__(self):
        # 设置模型导入目录
        self.base_path = Path(__file__).parent.parent.parent.parent  # ComfyUI根目录
        self.import_dir = self.base_path / "models" / "ollama_import"
        self.modelfiles_dir = self.import_dir / "modelfiles"
        
        # 确保目录存在
        self.import_dir.mkdir(parents=True, exist_ok=True)
        self.modelfiles_dir.mkdir(parents=True, exist_ok=True)
        
    
    def scan_gguf_models(self) -> List[Dict]:
        """扫描目录中的GGUF模型文件"""
        models = []
        
        try:
            for file_path in self.import_dir.glob("*.gguf"):
                if file_path.is_file():
                    # 检查是否已经转换
                    model_name = file_path.stem
                    is_converted = self.check_if_converted(model_name)
                    
                    model_info = {
                        'name': model_name,
                        'file_path': str(file_path),
                        'file_size': file_path.stat().st_size,
                        'is_converted': is_converted,
                        'ollama_name': f"custom-{model_name}",
                        'modelfile_path': str(self.modelfiles_dir / f"{model_name}.modelfile")
                    }
                    models.append(model_info)
            
            return models
            
        except Exception as e:
            return []
    
    def check_if_converted(self, model_name: str) -> bool:
        """检查模型是否已经转换到Ollama"""
        try:
            # 检查ollama list中是否存在
            result = subprocess.run(
                ["ollama", "list"],
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if result.returncode == 0:
                ollama_name = f"custom-{model_name}"
                return ollama_name in result.stdout
            
        except Exception as e:
            pass
        
        return False
    
    def generate_modelfile(self, model_info: Dict) -> str:
        """生成Modelfile配置"""
        model_name = model_info['name']
        model_path = model_info['file_path']
        
        # 智能识别模型类型并生成相应的系统提示
        system_prompts = {
            'qwen': "You are Qwen, created by Alibaba Cloud. You are a helpful assistant.",
            'deepseek': "You are DeepSeek Chat, an AI assistant developed by DeepSeek. You are helpful, harmless, and honest.",
            'llama': "You are a helpful, respectful and honest assistant.",
            'mistral': "You are Mistral AI, a helpful assistant.",
            'yi': "You are Yi, an AI assistant created by 01.AI. You are helpful and harmless."
        }
        
        # 根据模型名称选择合适的系统提示
        system_prompt = "You are a helpful AI assistant."
        for key, prompt in system_prompts.items():
            if key.lower() in model_name.lower():
                system_prompt = prompt
                break
        
        # 生成Modelfile内容
        modelfile_content = f'''FROM {model_path}

# 模型基本信息
PARAMETER temperature 0.7
PARAMETER top_p 0.9
PARAMETER repeat_penalty 1.1
PARAMETER stop "<|im_end|>"
PARAMETER stop "<|endoftext|>"

# 系统提示词
SYSTEM """{system_prompt}"""

# 模板设置
TEMPLATE """{{{{ if .System }}}}{{{{ .System }}}}

{{{{ end }}}}{{{{ if .Prompt }}}}User: {{{{ .Prompt }}}}

Assistant: {{{{ .Response }}}}
{{{{ end }}}}"""
'''
        
        return modelfile_content
    
    def create_modelfile(self, model_info: Dict) -> bool:
        """创建Modelfile文件"""
        try:
            modelfile_content = self.generate_modelfile(model_info)
            modelfile_path = Path(model_info['modelfile_path'])
            
            # 写入Modelfile
            with open(modelfile_path, 'w', encoding='utf-8') as f:
                f.write(modelfile_content)
            
            return True
            
        except Exception as e:
            return False
    
    def convert_model(self, model_info: Dict) -> Tuple[bool, str]:
        """转换模型到Ollama格式"""
        try:
            # 首先创建Modelfile
            if not self.create_modelfile(model_info):
                return False, "Modelfile创建失败"
            
            # 执行ollama create命令
            modelfile_path = model_info['modelfile_path']
            ollama_name = model_info['ollama_name']
            
            
            result = subprocess.run(
                ["ollama", "create", ollama_name, "-f", modelfile_path],
                capture_output=True,
                text=True,
                timeout=300  # 5分钟超时
            )
            
            if result.returncode == 0:
                return True, f"模型 {ollama_name} 转换成功"
            else:
                error_msg = result.stderr or result.stdout or "未知错误"
                return False, f"转换失败: {error_msg}"
                
        except subprocess.TimeoutExpired:
            return False, "转换超时（5分钟）"
        except Exception as e:
            return False, f"转换异常: {str(e)}"
    
    def get_available_models(self) -> List[Dict]:
        """获取可用的GGUF模型列表"""
        return self.scan_gguf_models()
    
    def convert_model_by_name(self, model_name: str) -> Tuple[bool, str]:
        """根据模型名称转换模型"""
        models = self.scan_gguf_models()
        
        for model in models:
            if model['name'] == model_name:
                return self.convert_model(model)
        
        return False, f"未找到模型: {model_name}"


# 全局转换器实例
model_converter = OllamaModelConverter()


# API端点
if WEB_AVAILABLE:
    @PromptServer.instance.routes.get("/ollama_converter/models")
    async def get_models(request):
        """获取可用模型列表"""
        try:
            models = model_converter.get_available_models()
            return web.json_response({"models": models})
        except Exception as e:
            return web.json_response({"error": str(e)}, status=500)
    
    @PromptServer.instance.routes.post("/ollama_converter/convert")
    async def convert_model_api(request):
        """转换模型API"""
        try:
            data = await request.json()
            model_name = data.get('model_name')
            
            if not model_name:
                return web.json_response({"error": "缺少model_name参数"}, status=400)
            
            success, message = model_converter.convert_model_by_name(model_name)
            
            return web.json_response({
                "success": success,
                "message": message
            })
            
        except Exception as e:
            return web.json_response({"error": str(e)}, status=500)
    
else:
