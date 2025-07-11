"""
API Flux Kontext Enhancer Node
API集成的Flux Kontext提示词增强节点

将VisualPromptEditor的标注数据通过API模型转换为
Flux Kontext优化的结构化编辑指令

支持多个API提供商:
- DeepSeek (¥0.001/1K tokens)
- Qianwen/千问 (¥0.002/1K tokens)  
- OpenAI (¥0.015/1K tokens)
"""

import json
import time
import traceback
from typing import Dict, List, Any, Tuple, Optional
from datetime import datetime

try:
    import openai
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    OpenAI = None
    print("Warning: openai package not found. Please install with: pip install openai")

try:
    from aiohttp import web
    from server import PromptServer
    WEB_AVAILABLE = True
except ImportError:
    WEB_AVAILABLE = False


class APIFluxKontextEnhancer:
    """
    🤖 API Flux Kontext Enhancer
    
    通过API模型将VisualPromptEditor的标注数据
    转换为Flux Kontext优化的结构化编辑指令
    """
    
    # 类级别的缓存变量
    _cached_models = {}
    _cache_timestamp = {}
    _cache_duration = 300  # 缓存5分钟
    
    # API提供商配置
    API_PROVIDERS = {
        "siliconflow": {
            "name": "SiliconFlow",
            "base_url": "https://api.siliconflow.cn/v1",
            "default_model": "deepseek-ai/DeepSeek-V3",
            "cost_per_1k": 0.001,
            "description": "SiliconFlow - 支持DeepSeek R1/V3等最新模型",
            "models": [
                "deepseek-ai/DeepSeek-R1",
                "deepseek-ai/DeepSeek-V3"
            ]
        },
        "deepseek": {
            "name": "DeepSeek",
            "base_url": "https://api.deepseek.com/v1",
            "default_model": "deepseek-chat",
            "cost_per_1k": 0.001,
            "description": "DeepSeek官方 - 高性价比中文优化模型"
        },
        "qianwen": {
            "name": "千问/Qianwen",
            "base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1",
            "default_model": "qwen-turbo",
            "cost_per_1k": 0.002,
            "description": "阿里云千问模型"
        },
        "openai": {
            "name": "OpenAI",
            "base_url": "https://api.openai.com/v1",
            "default_model": "gpt-3.5-turbo",
            "cost_per_1k": 0.015,
            "description": "OpenAI官方模型"
        }
    }
    
    @classmethod
    def get_available_models(cls, provider="siliconflow", api_key=None, force_refresh=False):
        """动态获取可用的API模型列表"""
        
        provider_config = cls.API_PROVIDERS.get(provider, cls.API_PROVIDERS["siliconflow"])
        
        # 如果提供商有预定义的模型列表，优先使用
        if "models" in provider_config:
            print(f"✅ 使用{provider_config['name']}预定义模型列表: {provider_config['models']}")
            return provider_config["models"]
        
        if not OPENAI_AVAILABLE:
            print("❌ OpenAI库未安装，无法获取API模型")
            return [provider_config["default_model"]]
            
        if not api_key:
            print(f"❌ {provider} API密钥未提供，使用默认模型")
            return [provider_config["default_model"]]
            
        import time
        current_time = time.time()
        
        # 检查缓存是否有效
        if (not force_refresh and 
            provider in cls._cached_models and 
            provider in cls._cache_timestamp and
            current_time - cls._cache_timestamp[provider] < cls._cache_duration):
            print(f"📋 使用缓存的{provider}模型列表: {cls._cached_models[provider]}")
            return cls._cached_models[provider]
        
        try:
            if not OPENAI_AVAILABLE or OpenAI is None:
                print(f"❌ OpenAI库未安装，无法获取{provider}模型")
                return [cls.API_PROVIDERS[provider]["default_model"]]
            
            provider_config = cls.API_PROVIDERS.get(provider, cls.API_PROVIDERS["siliconflow"])
            
            client = OpenAI(
                api_key=api_key,
                base_url=provider_config["base_url"]
            )
            
            # 获取模型列表
            models_response = client.models.list()
            model_names = []
            
            for model in models_response.data:
                model_names.append(model.id)
                print(f"✅ {provider_config['name']} 检测到模型: {model.id}")
            
            # 如果没有获取到模型，使用默认模型
            if not model_names:
                model_names = [provider_config["default_model"]]
                print(f"⚠️ 未获取到{provider}模型列表，使用默认模型: {provider_config['default_model']}")
            
            # 更新缓存
            cls._cached_models[provider] = model_names
            cls._cache_timestamp[provider] = current_time
            
            print(f"🔄 {provider_config['name']} 模型列表已更新，共{len(model_names)}个模型")
            return model_names
            
        except Exception as e:
            print(f"❌ 获取{provider}模型列表失败: {str(e)}")
            # 返回默认模型
            default_model = cls.API_PROVIDERS[provider]["default_model"]
            return [default_model]
    
    @classmethod
    def get_template_content_for_placeholder(cls, guidance_style, guidance_template):
        """获取模板内容用于placeholder显示"""
        try:
            # 导入guidance_templates模块
            from .guidance_templates import PRESET_GUIDANCE, TEMPLATE_LIBRARY
            
            # 根据guidance_style选择内容
            if guidance_style == "custom":
                # 自定义模式保留完整提示文字
                return """输入您的自定义AI引导指令...

例如：
你是专业的图像编辑专家，请将标注数据转换为简洁明了的编辑指令。重点关注：
1. 保持指令简洁
2. 确保操作精确
3. 维持风格一致性

更多示例请查看guidance_template选项。"""
            elif guidance_style == "template":
                if guidance_template and guidance_template != "none" and guidance_template in TEMPLATE_LIBRARY:
                    template_content = TEMPLATE_LIBRARY[guidance_template]["prompt"]
                    # 截取前200个字符用于placeholder显示
                    preview = template_content[:200].replace('\n', ' ').strip()
                    return f"当前模板: {TEMPLATE_LIBRARY[guidance_template]['name']}\n\n{preview}..."
                else:
                    return "选择一个模板后将在此显示预览..."
            else:
                # 显示预设风格的内容
                if guidance_style in PRESET_GUIDANCE:
                    preset_content = PRESET_GUIDANCE[guidance_style]["prompt"]
                    # 截取前200个字符用于placeholder显示
                    preview = preset_content[:200].replace('\n', ' ').strip()
                    return f"当前风格: {PRESET_GUIDANCE[guidance_style]['name']}\n\n{preview}..."
                else:
                    return """输入您的自定义AI引导指令...

例如：
你是专业的图像编辑专家，请将标注数据转换为简洁明了的编辑指令。重点关注：
1. 保持指令简洁
2. 确保操作精确
3. 维持风格一致性

更多示例请查看guidance_template选项。"""
        except Exception as e:
            print(f"获取模板内容失败: {e}")
            return """输入您的自定义AI引导指令...

例如：
你是专业的图像编辑专家，请将标注数据转换为简洁明了的编辑指令。重点关注：
1. 保持指令简洁
2. 确保操作精确
3. 维持风格一致性

更多示例请查看guidance_template选项。"""

    @classmethod
    def INPUT_TYPES(cls):
        """定义节点输入类型"""
        # 动态生成placeholder内容
        default_placeholder = cls.get_template_content_for_placeholder("efficient_concise", "none")
        return {
            "required": {
                "api_provider": (["siliconflow", "deepseek", "qianwen", "openai"], {
                    "default": "siliconflow"
                }),
                "api_key": ("STRING", {
                    "default": "",
                    "multiline": False,
                    "placeholder": "Enter your API key here..."
                }),
                "model_preset": ([
                    "deepseek-ai/DeepSeek-R1",
                    "deepseek-ai/DeepSeek-V3", 
                    "deepseek-chat",
                    "qwen-turbo",
                    "gpt-3.5-turbo",
                    "custom"
                ], {
                    "default": "deepseek-ai/DeepSeek-V3"
                }),
                "custom_model": ("STRING", {
                    "default": "",
                    "multiline": False,
                    "placeholder": "Custom model name (when preset=custom)"
                }),
                "image": ("IMAGE",),
                "annotation_data": ("STRING", {
                    "forceInput": True,
                    "tooltip": "来自VisualPromptEditor的标注JSON数据（连接输入）"
                }),
                "edit_description": ("STRING", {
                    "multiline": True,
                    "default": "",
                    "placeholder": "描述你想做的编辑操作...\n\n例如：\n- 在红色矩形区域增加一棵树\n- 将蓝色标记区域的车辆改为红色\n- 移除圆形区域的人物\n- 将黄色区域的天空改为晩霞效果",
                    "tooltip": "描述你想要做的编辑操作，结合标注信息生成精准的编辑指令"
                }),
                "enhancement_level": ([
                    "minimal",
                    "moderate", 
                    "comprehensive",
                    "professional"
                ], {
                    "default": "moderate"
                }),
                "language": (["chinese", "english", "bilingual"], {
                    "default": "chinese"
                }),
                "guidance_style": ([
                    "efficient_concise",   # 高效简洁 (默认)
                    "natural_creative",    # 自然创意
                    "technical_precise",   # 技术精确
                    "template",           # 模板选择
                    "custom"              # 自定义
                ], {
                    "default": "efficient_concise",
                    "tooltip": "选择AI引导话术风格：高效简洁适合快速编辑，自然创意适合艺术设计，技术精确适合专业用途，模板选择常用预设，自定义允许完全控制"
                }),
                "guidance_template": ([
                    "none",               # 无模板
                    "ecommerce_product",  # 电商产品
                    "portrait_beauty",    # 人像美化
                    "creative_design",    # 创意设计
                    "architecture_photo", # 建筑摄影
                    "food_photography",   # 美食摄影
                    "fashion_retail",     # 时尚零售
                    "landscape_nature"    # 风景自然
                ], {
                    "default": "none",
                    "tooltip": "选择专用引导模板（当guidance_style为template时使用）"
                })
            },
            "optional": {
                "custom_guidance": ("STRING", {
                    "default": "",
                    "multiline": True,
                    "placeholder": default_placeholder,
                    "tooltip": "当guidance_style为'custom'时，在此输入您的专用AI引导指令。placeholder会根据当前选择的guidance_style和guidance_template动态显示预览内容。"
                })
            }
        }
    
    RETURN_TYPES = ("STRING", "STRING")
    RETURN_NAMES = ("flux_edit_instructions", "system_prompt")
    
    FUNCTION = "enhance_flux_instructions"
    CATEGORY = "KontextVisualPromptWindow/API"
    
    def __init__(self):
        self.cache = {}
        self.cache_max_size = 100
        self.session_stats = {
            "total_requests": 0,
            "successful_requests": 0,
            "total_tokens": 0,
            "estimated_cost": 0.0
        }
    
    def _get_cache_key(self, annotation_data: str, 
                      enhancement_level: str, 
                      language: str, model_name: str) -> str:
        """生成缓存键"""
        import hashlib
        content = f"{annotation_data}|{enhancement_level}|{language}|{model_name}"
        return hashlib.md5(content.encode()).hexdigest()
    
    def _manage_cache(self):
        """管理缓存大小"""
        if len(self.cache) > self.cache_max_size:
            # 删除最旧的条目
            oldest_key = min(self.cache.keys(), key=lambda k: self.cache[k]['timestamp'])
            del self.cache[oldest_key]
    
    def _create_api_client(self, provider: str, api_key: str):
        """创建API客户端"""
        if not OPENAI_AVAILABLE or OpenAI is None:
            raise Exception("OpenAI库未安装，请运行: pip install openai")
        
        if not api_key:
            raise Exception(f"请提供{provider} API密钥")
        
        provider_config = self.API_PROVIDERS.get(provider, self.API_PROVIDERS["siliconflow"])
        
        return OpenAI(
            api_key=api_key,
            base_url=provider_config["base_url"]
        )
    
    
    def _build_user_prompt(self, annotation_data: str, edit_description: str = "") -> str:
        """构建用户提示词"""
        
        prompt_parts = []
        prompt_parts.append("请分析以下内容并生成优化的Flux Kontext编辑指令：")
        
        # 1. 编辑意图描述（最重要的信息）
        if edit_description and edit_description.strip():
            prompt_parts.append(f"\n**编辑意图：**")
            prompt_parts.append(edit_description.strip())
        
        # 2. 标注数据
        prompt_parts.append(f"\n**标注数据：**")
        prompt_parts.append(f"```json\n{annotation_data}\n```")
        
        
        # 3. 生成要求
        prompt_parts.append(f"\n请生成：")
        prompt_parts.append("1. **enhanced_prompt** - 增强后的完整提示词")
        prompt_parts.append("2. **kontext_instructions** - Flux Kontext格式的编辑指令")
        prompt_parts.append("\n确保输出的指令能够精确控制图像编辑，同时保持自然流畅的语言表达。")
        prompt_parts.append("重点根据编辑意图和标注信息的结合来生成指令。")
        
        return "\n".join(prompt_parts)
    
    def _generate_with_api(self, client, model_name: str, 
                         system_prompt: str, user_prompt: str, 
                         temperature: float, max_tokens: int, 
                         provider: str) -> Tuple[str, Dict[str, Any]]:
        """使用API生成内容"""
        try:
            response = client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.7,
                max_tokens=1000,
                stream=False
            )
            
            # 提取响应内容
            generated_text = response.choices[0].message.content
            
            # 计算成本
            provider_config = self.API_PROVIDERS[provider]
            prompt_tokens = response.usage.prompt_tokens
            completion_tokens = response.usage.completion_tokens
            total_tokens = response.usage.total_tokens
            
            estimated_cost = (total_tokens / 1000) * provider_config["cost_per_1k"]
            
            # 更新统计信息
            self.session_stats["total_requests"] += 1
            self.session_stats["successful_requests"] += 1
            self.session_stats["total_tokens"] += total_tokens
            self.session_stats["estimated_cost"] += estimated_cost
            
            response_info = {
                "provider": provider_config["name"],
                "model": model_name,
                "prompt_tokens": prompt_tokens,
                "completion_tokens": completion_tokens,
                "total_tokens": total_tokens,
                "estimated_cost": estimated_cost,
                "cost_currency": "CNY",
                "timestamp": datetime.now().isoformat()
            }
            
            return generated_text, response_info
            
        except Exception as e:
            self.session_stats["total_requests"] += 1
            error_msg = f"API调用失败: {str(e)}"
            print(f"❌ {error_msg}")
            
            response_info = {
                "error": error_msg,
                "provider": provider,
                "model": model_name,
                "timestamp": datetime.now().isoformat()
            }
            
            raise Exception(error_msg)
    
    def _parse_api_response(self, response_text: str) -> Tuple[str, str]:
        """解析API响应并提取增强提示词和Kontext指令"""
        try:
            # 尝试通过标记分离内容
            enhanced_prompt = ""
            kontext_instructions = ""
            
            lines = response_text.split('\n')
            current_section = None
            
            for line in lines:
                line = line.strip()
                
                if 'enhanced_prompt' in line.lower() or '增强提示词' in line:
                    current_section = 'enhanced'
                    continue
                elif 'kontext_instructions' in line.lower() or 'kontext' in line.lower():
                    current_section = 'kontext'
                    continue
                elif line.startswith('**') and line.endswith('**'):
                    # 可能是新的section标题
                    if '增强' in line or 'enhanced' in line.lower():
                        current_section = 'enhanced'
                    elif 'kontext' in line.lower() or '编辑指令' in line:
                        current_section = 'kontext'
                    continue
                
                if current_section == 'enhanced' and line:
                    enhanced_prompt += line + '\n'
                elif current_section == 'kontext' and line:
                    kontext_instructions += line + '\n'
            
            # 如果解析失败，将整个响应作为增强提示词
            if not enhanced_prompt.strip():
                enhanced_prompt = response_text
            
            return enhanced_prompt.strip(), kontext_instructions.strip()
            
        except Exception as e:
            print(f"⚠️ 解析API响应失败: {str(e)}")
            return response_text, ""
    
    def enhance_flux_instructions(self, api_provider, api_key, model_preset, custom_model, image, 
                                annotation_data, edit_description, 
                                enhancement_level, language, guidance_style, guidance_template,
                                custom_guidance=""):
        """主要处理函数"""
        
        try:
            start_time = time.time()
            
            # 设置移除参数的默认值
            temperature = 0.7
            max_tokens = 1000
            enable_caching = True
            debug_mode = False
            
            # 导入引导话术管理器
            try:
                from .guidance_templates import guidance_manager
            except ImportError:
                # 回退到绝对导入
                import sys
                import os
                sys.path.append(os.path.dirname(__file__))
                from guidance_templates import guidance_manager
            
            # 构建系统提示词（整合引导话术）
            system_prompt = guidance_manager.build_system_prompt(
                guidance_style=guidance_style,
                guidance_template=guidance_template,
                custom_guidance=custom_guidance,
                load_saved_guidance=""
            )
            
            # 确定实际使用的模型名称
            if model_preset == "custom":
                if not custom_model or not custom_model.strip():
                    return (
                        "错误：选择自定义模型时，请提供模型名称",
                        "错误：自定义模型名称验证失败"
                    )
                model_name = custom_model.strip()
            else:
                model_name = model_preset
            
            # 输入验证
            if not api_key or not api_key.strip():
                return (
                    "错误：请提供有效的API密钥",
                    "错误：API密钥验证失败"
                )
            
            # 检查缓存
            cache_key = None
            if enable_caching:
                cache_key = self._get_cache_key(
                    annotation_data, 
                    enhancement_level, language, model_name
                )
                
                if cache_key in self.cache:
                    cached_result = self.cache[cache_key]
                    if debug_mode:
                        print(f"🎯 使用缓存结果: {cache_key}")
                    # 选择最相关的缓存输出作为Flux编辑指令
                    flux_instructions = cached_result.get('kontext_instructions', '') or cached_result.get('enhanced_prompt', '')
                    cached_system_prompt = cached_result.get('system_prompt', '[缓存中无system_prompt信息]')
                    return (flux_instructions, cached_system_prompt)
            
            # 创建API客户端
            client = self._create_api_client(api_provider, api_key)
            
            # 构建用户提示词（系统提示词已在前面通过引导话术系统构建）
            user_prompt = self._build_user_prompt(annotation_data, edit_description)
            
            if debug_mode:
                print(f"🔍 系统提示词: {system_prompt[:200]}...")
                print(f"🔍 用户提示词: {user_prompt[:200]}...")
            
            # 调用API
            response_text, response_info = self._generate_with_api(
                client, model_name, system_prompt, user_prompt, 
                temperature, max_tokens, api_provider
            )
            
            # 解析响应
            enhanced_prompt, kontext_instructions = self._parse_api_response(response_text)
            
            # 生成调试信息
            generation_time = time.time() - start_time
            debug_info = f"""生成完成 | 提供商: {response_info.get('provider', api_provider)} | 模型: {model_name} | 
时间: {generation_time:.2f}秒 | Token: {response_info.get('total_tokens', 0)} | 
成本: ¥{response_info.get('estimated_cost', 0):.4f}"""
            
            # 准备返回的API响应信息
            api_response = json.dumps({
                "response_info": response_info,
                "generation_time": generation_time,
                "session_stats": self.session_stats,
                "raw_response": response_text[:500] + "..." if len(response_text) > 500 else response_text
            }, ensure_ascii=False, indent=2)
            
            # 缓存结果
            if enable_caching and cache_key:
                self._manage_cache()
                self.cache[cache_key] = {
                    'enhanced_prompt': enhanced_prompt,
                    'kontext_instructions': kontext_instructions,
                    'system_prompt': system_prompt,
                    'generation_time': generation_time,
                    'timestamp': time.time()
                }
            
            # 选择最相关的输出作为Flux编辑指令
            flux_instructions = kontext_instructions if kontext_instructions.strip() else enhanced_prompt
            
            return (flux_instructions, system_prompt)
            
        except Exception as e:
            error_msg = f"处理失败: {str(e)}"
            print(f"❌ {error_msg}")
            
            error_response = json.dumps({
                "error": error_msg,
                "traceback": traceback.format_exc(),
                "timestamp": datetime.now().isoformat()
            }, ensure_ascii=False, indent=2)
            
            return (
                f"错误：{error_msg}",
                f"错误：处理失败 - {error_msg}"
            )
    
    @classmethod
    def IS_CHANGED(cls, **kwargs):
        """检查输入是否改变"""
        # 对于API调用，总是重新生成以确保最新结果
        return float("nan")


# 注册节点
NODE_CLASS_MAPPINGS = {
    "APIFluxKontextEnhancer": APIFluxKontextEnhancer
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "APIFluxKontextEnhancer": "🤖 API Flux Kontext Enhancer"
}

# 添加Web UI支持
if WEB_AVAILABLE:
    @PromptServer.instance.routes.get("/kontextapi/providers")
    async def get_providers(request):
        """获取可用的API提供商"""
        providers = []
        for key, config in APIFluxKontextEnhancer.API_PROVIDERS.items():
            providers.append({
                "id": key,
                "name": config["name"],
                "cost_per_1k": config["cost_per_1k"],
                "description": config["description"],
                "default_model": config["default_model"]
            })
        return web.json_response(providers)
    
    @PromptServer.instance.routes.post("/kontextapi/models")
    async def get_models(request):
        """获取指定提供商的模型列表"""
        data = await request.json()
        provider = data.get("provider", "deepseek")
        api_key = data.get("api_key", "")
        
        try:
            models = APIFluxKontextEnhancer.get_available_models(provider, api_key)
            return web.json_response({"models": models})
        except Exception as e:
            return web.json_response({"error": str(e)}, status=400)