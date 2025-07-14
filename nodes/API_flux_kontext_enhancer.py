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
            print(f"✅ Using {provider_config['name']} predefined model list: {provider_config['models']}")
            return provider_config["models"]
        
        if not OPENAI_AVAILABLE:
            print("❌ OpenAI library not installed, cannot get API models")
            return [provider_config["default_model"]]
            
        if not api_key:
            print(f"❌ {provider} API key not provided, using default model")
            return [provider_config["default_model"]]
            
        import time
        current_time = time.time()
        
        # 检查缓存是否有效
        if (not force_refresh and 
            provider in cls._cached_models and 
            provider in cls._cache_timestamp and
            current_time - cls._cache_timestamp[provider] < cls._cache_duration):
            print(f"📋 Using cached {provider} model list: {cls._cached_models[provider]}")
            return cls._cached_models[provider]
        
        try:
            if not OPENAI_AVAILABLE or OpenAI is None:
                print(f"❌ OpenAI library not installed, cannot get {provider} models")
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
                print(f"✅ {provider_config['name']} detected model: {model.id}")
            
            # 如果没有获取到模型，使用默认模型
            if not model_names:
                model_names = [provider_config["default_model"]]
                print(f"⚠️ Failed to get {provider} model list, using default model: {provider_config['default_model']}")
            
            # 更新缓存
            cls._cached_models[provider] = model_names
            cls._cache_timestamp[provider] = current_time
            
            print(f"🔄 {provider_config['name']} model list updated, {len(model_names)} models total")
            return model_names
            
        except Exception as e:
            print(f"❌ Failed to get {provider} model list: {str(e)}")
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
                # Custom mode retains complete prompt text
                return """Enter your custom AI guidance instructions...

For example:
You are a professional image editing expert. Please convert annotation data into clear and concise editing instructions. Focus on:
1. Keep instructions concise
2. Ensure precise operations
3. Maintain style consistency

For more examples, please check guidance_template options."""
            elif guidance_style == "template":
                if guidance_template and guidance_template != "none" and guidance_template in TEMPLATE_LIBRARY:
                    template_content = TEMPLATE_LIBRARY[guidance_template]["prompt"]
                    # 截取前200个字符用于placeholder显示
                    preview = template_content[:200].replace('\n', ' ').strip()
                    return f"Current template: {TEMPLATE_LIBRARY[guidance_template]['name']}\n\n{preview}..."
                else:
                    return "Preview will be displayed here after selecting a template..."
            else:
                # Display preset style content
                if guidance_style in PRESET_GUIDANCE:
                    preset_content = PRESET_GUIDANCE[guidance_style]["prompt"]
                    # 截取前200个字符用于placeholder显示
                    preview = preset_content[:200].replace('\n', ' ').strip()
                    return f"Current style: {PRESET_GUIDANCE[guidance_style]['name']}\n\n{preview}..."
                else:
                    return """Enter your custom AI guidance instructions...

For example:
You are a professional image editing expert. Please convert annotation data into clear and concise editing instructions. Focus on:
1. Keep instructions concise
2. Ensure precise operations
3. Maintain style consistency

For more examples, please check guidance_template options."""
        except Exception as e:
            print(f"Failed to get template content: {e}")
            return """Enter your custom AI guidance instructions...

For example:
You are a professional image editing expert. Please convert annotation data into clear and concise editing instructions. Focus on:
1. Keep instructions concise
2. Ensure precise operations
3. Maintain style consistency

For more examples, please check guidance_template options."""

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
                "annotation_data": ("STRING", {
                    "forceInput": True,
                    "tooltip": "Annotation JSON data from VisualPromptEditor (connected input)"
                }),
                "edit_description": ("STRING", {
                    "multiline": True,
                    "default": "",
                    "placeholder": "Describe the editing operations you want to perform...\n\nFor example:\n- Add a tree in the red rectangular area\n- Change the vehicle in the blue marked area to red\n- Remove the person in the circular area\n- Change the sky in the yellow area to sunset effect",
                    "tooltip": "Describe the editing operations you want to perform, combined with annotation information to generate precise editing instructions"
                }),
                "edit_instruction_type": ([
                    "auto_detect",          # 🔄 Automatically select best strategy based on operation type
                    "spatial_precise",      # Spatial precise editing
                    "semantic_enhanced",    # Semantic enhanced editing  
                    "style_coherent",       # Style coherent editing
                    "content_aware",        # Content aware editing
                    "multi_region"          # Multi-region coordinated editing
                ], {
                    "default": "auto_detect",
                    "tooltip": "Select editing instruction generation strategy (auto_detect automatically selects based on operation type)"
                }),
                "guidance_style": ([
                    "efficient_concise",   # Efficient Concise (default)
                    "natural_creative",    # Natural Creative
                    "technical_precise",   # Technical Precise
                    "template",            # Template Selection
                    "custom"              # Custom User Input
                ], {
                    "default": "efficient_concise",
                    "tooltip": "Select AI guidance style: Efficient Concise for quick editing, Natural Creative for artistic design, Technical Precise for professional use, Template for common presets, Custom for user-defined guidance"
                }),
                "guidance_template": ([
                    "none",               # No Template
                    "ecommerce_product",  # E-commerce Product
                    "portrait_beauty",    # Portrait Beauty
                    "creative_design",    # Creative Design
                    "architecture_photo", # Architecture Photography
                    "food_photography",   # Food Photography
                    "fashion_retail",     # Fashion Retail
                    "landscape_nature"    # Landscape Nature
                ], {
                    "default": "none",
                    "tooltip": "Select specialized guidance template (used when guidance_style is template)"
                }),
                "seed": ("INT", {
                    "default": 0,
                    "min": 0,
                    "max": 0xffffffffffffffff,
                    "tooltip": "Random seed for generation consistency. Change to get different variations."
                }),
                "custom_guidance": ("STRING", {
                    "multiline": True,
                    "default": "",
                    "placeholder": default_placeholder,
                    "tooltip": "Custom AI guidance instructions (used when guidance_style is custom)"
                }),
                "load_saved_guidance": (["none"], {
                    "default": "none",
                    "tooltip": "Load previously saved custom guidance (used when guidance_style is custom)"
                })
            },
            "optional": {
                "image": ("IMAGE", {
                    "tooltip": "Optional: Image for visual analysis (required only when visual models are supported)"
                }),
            }
        }
    
    RETURN_TYPES = ("STRING", "STRING")
    RETURN_NAMES = ("flux_edit_instructions", "system_prompt")
    
    FUNCTION = "enhance_flux_instructions"
    CATEGORY = "kontext_super_prompt/api"
    DESCRIPTION = "🌐 Kontext Super Prompt API Enhancer - Generate optimized structured editing instructions through cloud AI models"
    
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
                      edit_instruction_type: str, 
                      model_name: str, seed: int = 0) -> str:
        """生成缓存键"""
        import hashlib
        content = f"{annotation_data}|{edit_instruction_type}|{model_name}|{seed}"
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
            raise Exception("OpenAI library not installed, please run: pip install openai")
        
        if not api_key:
            raise Exception(f"Please provide {provider} API key")
        
        provider_config = self.API_PROVIDERS.get(provider, self.API_PROVIDERS["siliconflow"])
        
        return OpenAI(
            api_key=api_key,
            base_url=provider_config["base_url"]
        )
    
    
    def _build_user_prompt(self, annotation_data: str, edit_description: str = "") -> str:
        """构建用户提示词"""
        
        prompt_parts = []
        prompt_parts.append("Based on the following information, generate a simple and direct editing instruction:")
        
        # 1. 编辑意图描述（最重要的信息）
        if edit_description and edit_description.strip():
            prompt_parts.append(f"\n**Edit Intent:**")
            prompt_parts.append(edit_description.strip())
        
        # 2. 标注数据
        prompt_parts.append(f"\n**Annotation Data:**")
        
        # 处理编号显示设置
        processed_annotation_data = self._process_annotation_data(annotation_data)
        prompt_parts.append(f"```json\n{processed_annotation_data}\n```")
        
        # 3. 简化的生成要求
        prompt_parts.append(f"\nGenerate ONLY a single, simple editing instruction.")
        prompt_parts.append("Output format: A direct command like 'change_color the red area to blue naturally'")
        prompt_parts.append("Do NOT include:")
        prompt_parts.append("- Technical analysis or explanations")
        prompt_parts.append("- Annotation numbers in parentheses")
        prompt_parts.append("- Multiple sections or bullet points")
        prompt_parts.append("- Quality metrics or rationale")
        prompt_parts.append("\nJust provide the clean, natural editing instruction.")
        
        return "\n".join(prompt_parts)
    
    def _process_annotation_data(self, annotation_data: str) -> str:
        """处理标注数据，根据include_annotation_numbers设置过滤编号信息"""
        try:
            import json
            data = json.loads(annotation_data)
            
            # 检查是否包含编号设置
            include_numbers = data.get("include_annotation_numbers", True)
            
            # 如果不包含编号，移除annotations中的number字段
            if not include_numbers and "annotations" in data:
                for annotation in data["annotations"]:
                    if "number" in annotation:
                        del annotation["number"]
            
            return json.dumps(data, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"⚠️ Error processing annotation data: {str(e)}")
            return annotation_data
    
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
                temperature=temperature,
                max_tokens=max_tokens,
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
            error_msg = f"API call failed: {str(e)}"
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
                
                if 'enhanced_prompt' in line.lower() or 'enhanced prompt' in line.lower():
                    current_section = 'enhanced'
                    continue
                elif 'kontext_instructions' in line.lower() or 'kontext' in line.lower():
                    current_section = 'kontext'
                    continue
                elif line.startswith('**') and line.endswith('**'):
                    # 可能是新的section标题
                    if 'enhanced' in line.lower():
                        current_section = 'enhanced'
                    elif 'kontext' in line.lower() or 'edit' in line.lower():
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
            print(f"⚠️ Failed to parse API response: {str(e)}")
            return response_text, ""
    
    def enhance_flux_instructions(self, api_provider, api_key, model_preset, custom_model, 
                                annotation_data, edit_description, 
                                edit_instruction_type, guidance_style, guidance_template, seed,
                                custom_guidance, load_saved_guidance, image=None):
        """主要处理函数"""
        
        try:
            start_time = time.time()
            
            # 设置参数，使用seed控制随机性
            # 使用seed来调整temperature，确保可重复性
            import random
            random.seed(seed)
            temperature = 0.3 + (random.random() * 0.7)  # 0.3-1.0 range based on seed
            max_tokens = 1000
            enable_caching = True
            debug_mode = False
            language = "english"  # Fixed language to English for downstream processing
            output_format = "natural_language"  # Fixed output format to natural language
            
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
                load_saved_guidance=load_saved_guidance,
                language=language
            )
            
            # 确定实际使用的模型名称
            if model_preset == "custom":
                if not custom_model or not custom_model.strip():
                    return (
                        "Error: Please provide model name when selecting custom model",
                        "Error: Custom model name validation failed"
                    )
                model_name = custom_model.strip()
            else:
                model_name = model_preset
            
            # 输入验证
            if not api_key or not api_key.strip():
                return (
                    "Error: Please provide valid API key",
                    "Error: API key validation failed"
                )
            
            # 检查缓存
            cache_key = None
            if enable_caching:
                cache_key = self._get_cache_key(
                    annotation_data, 
                    edit_instruction_type, model_name, seed
                )
                
                if cache_key in self.cache:
                    cached_result = self.cache[cache_key]
                    if debug_mode:
                        print(f"🎯 Using cached result: {cache_key}")
                    # 选择最相关的缓存输出作为Flux编辑指令
                    flux_instructions = cached_result.get('kontext_instructions', '') or cached_result.get('enhanced_prompt', '')
                    cached_system_prompt = cached_result.get('system_prompt', '[No system_prompt info in cache]')
                    return (flux_instructions, cached_system_prompt)
            
            # 创建API客户端
            client = self._create_api_client(api_provider, api_key)
            
            # 构建用户提示词（系统提示词已在前面通过引导话术系统构建）
            user_prompt = self._build_user_prompt(annotation_data, edit_description)
            
            if debug_mode:
                print(f"🔍 System prompt: {system_prompt[:200]}...")
                print(f"🔍 User prompt: {user_prompt[:200]}...")
            
            # 调用API
            response_text, response_info = self._generate_with_api(
                client, model_name, system_prompt, user_prompt, 
                temperature, max_tokens, api_provider
            )
            
            # 解析响应
            enhanced_prompt, kontext_instructions = self._parse_api_response(response_text)
            
            # 生成调试信息
            generation_time = time.time() - start_time
            debug_info = f"""Generation complete | Provider: {response_info.get('provider', api_provider)} | Model: {model_name} | 
Time: {generation_time:.2f}s | Tokens: {response_info.get('total_tokens', 0)} | 
Cost: ¥{response_info.get('estimated_cost', 0):.4f}"""
            
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
            
            # Clean output for natural language format
            flux_instructions = self._clean_natural_language_output(flux_instructions)
            
            return (flux_instructions, system_prompt)
            
        except Exception as e:
            error_msg = f"Processing failed: {str(e)}"
            print(f"❌ {error_msg}")
            
            error_response = json.dumps({
                "error": error_msg,
                "traceback": traceback.format_exc(),
                "timestamp": datetime.now().isoformat()
            }, ensure_ascii=False, indent=2)
            
            return (
                f"Error: {error_msg}",
                f"Error: Processing failed - {error_msg}"
            )
    
    def _clean_natural_language_output(self, instructions: str) -> str:
        """Clean natural language output to remove technical details and annotation numbers"""
        try:
            import re
            
            # First, try to find the actual editing instruction before any technical analysis
            lines = instructions.split('\n')
            
            # Look for the core editing instruction line that contains action verbs
            action_patterns = [
                r'change_color[^.]*',
                r'transform[^.]*to\s+blue[^.]*',
                r'将.*改.*蓝[^.]*',
                r'[^.]*red.*blue[^.]*'
            ]
            
            # Find the first line that looks like a simple editing instruction
            for line in lines:
                line = line.strip()
                
                # Skip technical headers and analysis
                if (line.startswith(('#', '*', '-', '1.', '2.', '3.')) or 
                    'Explanation' in line or 'Precision' in line or 'Alignment' in line or
                    'Clarity' in line or 'Rationale' in line or 'Details' in line):
                    continue
                
                # Look for simple action instructions
                for pattern in action_patterns:
                    if re.search(pattern, line, re.IGNORECASE):
                        # Clean this instruction
                        result = line
                        
                        # Remove annotation references
                        result = re.sub(r'\(annotation[_\s]*\d+\)', '', result, flags=re.IGNORECASE)
                        result = re.sub(r'annotation[_\s]*\d+:?', '', result, flags=re.IGNORECASE)
                        
                        # Clean up extra words
                        result = re.sub(r'the red rectangular area', 'the red area', result, flags=re.IGNORECASE)
                        result = re.sub(r'with good quality', '', result, flags=re.IGNORECASE)
                        result = re.sub(r'seamlessly', '', result, flags=re.IGNORECASE)
                        result = re.sub(r'\s+', ' ', result).strip()
                        result = re.sub(r',\s*$', '', result)  # Remove trailing comma
                        
                        if result:
                            return result
            
            # If no simple instruction found, try to extract from the whole text
            full_text = ' '.join(lines)
            
            # Remove all technical analysis sections
            full_text = re.sub(r'###[^#]*?(?=###|$)', '', full_text, flags=re.DOTALL)
            full_text = re.sub(r'\*\*[^*]*?\*\*[^*]*?(?=\*\*|$)', '', full_text, flags=re.DOTALL)
            
            # Look for action patterns in cleaned text
            for pattern in action_patterns:
                match = re.search(pattern, full_text, re.IGNORECASE)
                if match:
                    result = match.group(0)
                    
                    # Clean annotation references
                    result = re.sub(r'\(annotation[_\s]*\d+\)', '', result, flags=re.IGNORECASE)
                    result = re.sub(r'annotation[_\s]*\d+:?', '', result, flags=re.IGNORECASE)
                    
                    # Clean up
                    result = re.sub(r'\s+', ' ', result).strip()
                    if result:
                        return result
            
            # Final fallback: create a simple instruction
            if 'red' in instructions.lower() and 'blue' in instructions.lower():
                return "change the red area to blue"
            
            # Last resort
            return instructions
            
        except Exception as e:
            # If cleaning fails, return original
            return instructions
    
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