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
        
        print(f"[Ollama Converter] 模型导入目录: {self.import_dir}")
        print(f"[Ollama Converter] Modelfile目录: {self.modelfiles_dir}")
    
    def scan_gguf_models(self) -> List[Dict]:
        """扫描目录中的GGUF模型文件（支持文件夹形式）"""
        models = []
        
        try:
            # 扫描所有子文件夹
            for folder_path in self.import_dir.iterdir():
                if folder_path.is_dir():
                    # 在文件夹中查找GGUF文件和Modelfile
                    gguf_files = list(folder_path.glob("*.gguf"))
                    modelfile_path = folder_path / "Modelfile"
                    
                    if gguf_files:
                        # 使用第一个找到的GGUF文件
                        gguf_file = gguf_files[0]
                        # 使用GGUF文件名（不含扩展名）作为模型名
                        model_name = gguf_file.stem
                        is_converted = self.check_if_converted(model_name)
                        
                        model_info = {
                            'name': model_name,
                            'file_path': str(gguf_file),
                            'file_size': gguf_file.stat().st_size,
                            'is_converted': is_converted,
                            'ollama_name': model_name,
                            'modelfile_path': str(modelfile_path),
                            'has_modelfile': modelfile_path.exists(),
                            'folder_name': folder_path.name
                        }
                        models.append(model_info)
            
            # 也支持直接放在根目录的GGUF文件（向后兼容）
            for file_path in self.import_dir.glob("*.gguf"):
                if file_path.is_file():
                    model_name = file_path.stem
                    is_converted = self.check_if_converted(model_name)
                    
                    model_info = {
                        'name': model_name,
                        'file_path': str(file_path),
                        'file_size': file_path.stat().st_size,
                        'is_converted': is_converted,
                        'ollama_name': model_name,
                        'modelfile_path': str(self.modelfiles_dir / f"{model_name}.modelfile"),
                        'has_modelfile': False
                    }
                    models.append(model_info)
            
            print(f"[Ollama Converter] 扫描到 {len(models)} 个GGUF模型")
            return models
            
        except Exception as e:
            print(f"[Ollama Converter] 扫描模型失败: {e}")
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
                return model_name in result.stdout
            
        except Exception as e:
            print(f"[Ollama Converter] 检查转换状态失败: {e}")
        
        return False
    
    def generate_modelfile(self, model_info: Dict) -> str:
        """根据模型类型生成相应的Modelfile配置"""
        model_name = model_info['name']
        # 使用相对路径
        model_filename = Path(model_info['file_path']).name
        model_path = f"./{model_filename}"
        
        # 根据模型类型生成不同的配置
        if 'qwen' in model_name.lower():
            modelfile_content = f'''FROM {model_path}

TEMPLATE """{{{{ if .System }}}}<|im_start|>system
{{{{ .System }}}}<|im_end|>
{{{{ end }}}}{{{{ range .Messages }}}}{{{{ if eq .Role "user" }}}}<|im_start|>user
{{{{ .Content }}}}<|im_end|>
<|im_start|>assistant
{{{{ else if eq .Role "assistant" }}}}{{{{ .Content }}}}<|im_end|>
{{{{ end }}}}{{{{ end }}}}"""

SYSTEM """You are Qwen, created by Alibaba Cloud. You are a helpful assistant."""

PARAMETER stop "<|im_end|>"
PARAMETER num_ctx 4096
PARAMETER temperature 0.7'''
        
        elif 'deepseek' in model_name.lower():
            modelfile_content = f'''FROM {model_path}

PARAMETER stop "<|end_of_sentence|>"
PARAMETER num_ctx 4096
PARAMETER temperature 0.7'''
        
        else:
            # 默认配置
            modelfile_content = f'''FROM {model_path}

PARAMETER num_ctx 4096
PARAMETER temperature 0.7'''
        
        return modelfile_content
    
    def create_modelfile(self, model_info: Dict) -> bool:
        """创建Modelfile文件"""
        try:
            modelfile_content = self.generate_modelfile(model_info)
            modelfile_path = Path(model_info['modelfile_path'])
            
            # 写入Modelfile
            with open(modelfile_path, 'w', encoding='utf-8') as f:
                f.write(modelfile_content)
            
            print(f"[Ollama Converter] Modelfile创建成功: {modelfile_path}")
            return True
            
        except Exception as e:
            print(f"[Ollama Converter] Modelfile创建失败: {e}")
            return False
    
    def convert_model(self, model_info: Dict) -> Tuple[bool, str]:
        """转换模型到Ollama格式"""
        try:
            modelfile_path = Path(model_info['modelfile_path'])
            
            # 检查是否有现有的Modelfile
            if model_info.get('has_modelfile', False):
                # 使用现有的Modelfile，不创建新的
                print(f"[Ollama Converter] 使用现有Modelfile: {modelfile_path}")
                working_dir = modelfile_path.parent
            else:
                # 没有Modelfile时，根据模型类型创建对应的Modelfile
                print(f"[Ollama Converter] 创建新的Modelfile: {modelfile_path}")
                if not self.create_modelfile(model_info):
                    return False, "Modelfile创建失败"
                working_dir = modelfile_path.parent
            
            # 执行ollama create命令
            ollama_name = model_info['ollama_name']
            
            print(f"[Ollama Converter] 开始转换模型: {ollama_name}")
            
            result = subprocess.run(
                ["ollama", "create", ollama_name, "-f", "Modelfile"],
                capture_output=True,
                text=True,
                cwd=str(working_dir),
                timeout=300  # 5分钟超时
            )
            
            if result.returncode == 0:
                print(f"[Ollama Converter] 模型转换成功: {ollama_name}")
                return True, f"模型 {ollama_name} 转换成功"
            else:
                error_msg = result.stderr or result.stdout or "未知错误"
                print(f"[Ollama Converter] 模型转换失败: {error_msg}")
                return False, f"转换失败: {error_msg}"
                
        except subprocess.TimeoutExpired:
            return False, "转换超时（5分钟）"
        except Exception as e:
            print(f"[Ollama Converter] 模型转换异常: {e}")
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
    
    print("[Ollama Converter] API endpoints registered")
else:
    print("[Ollama Converter] Web server not available, API endpoints disabled")