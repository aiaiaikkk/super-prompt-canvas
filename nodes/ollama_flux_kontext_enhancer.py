"""
OllamaFluxKontextEnhancer Node
Ollama集成的Flux Kontext提示词增强节点

将VisualPromptEditor的标注数据通过本地Ollama模型转换为
Flux Kontext优化的结构化编辑指令
"""

import json
import time
import traceback
from typing import Dict, List, Any, Tuple, Optional
from datetime import datetime

try:
    from ollama import Client
    OLLAMA_AVAILABLE = True
except ImportError:
    OLLAMA_AVAILABLE = False
    print("Warning: ollama package not found. Please install with: pip install ollama")

try:
    from aiohttp import web
    from server import PromptServer
    WEB_AVAILABLE = True
except ImportError:
    WEB_AVAILABLE = False


class OllamaFluxKontextEnhancer:
    """
    🤖 Ollama Flux Kontext Enhancer
    
    通过本地Ollama模型将VisualPromptEditor的标注数据
    转换为Flux Kontext优化的结构化编辑指令
    """
    
    @classmethod
    def get_available_models(cls, url="http://127.0.0.1:11434"):
        """动态获取可用的Ollama模型列表"""
        try:
            if not OLLAMA_AVAILABLE:
                return ["qwen:0.5b"]  # 默认回退模型
            
            from ollama import Client
            client = Client(host=url)
            models_response = client.list()
            models = models_response.get('models', [])
            
            # 提取模型名称
            model_names = []
            for model in models:
                if isinstance(model, dict):
                    name = model.get('model') or model.get('name')
                    if name:
                        model_names.append(name)
                elif hasattr(model, 'model'):
                    # 处理对象类型的模型
                    model_names.append(model.model)
                else:
                    # 尝试转换为字符串并提取模型名
                    model_str = str(model)
                    if "model='" in model_str:
                        # 从字符串中提取模型名 例: "model='qwen3:0.6b'"
                        start = model_str.find("model='") + 7
                        end = model_str.find("'", start)
                        if end > start:
                            model_names.append(model_str[start:end])
                        else:
                            # 如果提取失败，跳过这个模型
                            print(f"Warning: Failed to extract model name from: {model_str[:100]}...")
                    else:
                        # 如果格式不匹配，跳过这个模型
                        print(f"Warning: Unknown model format: {model_str[:100]}...")
            
            # 如果没有模型，返回默认模型
            if not model_names:
                return ["qwen:0.5b"]
            
            return model_names
        except Exception as e:
            print(f"Warning: Failed to get Ollama models: {e}")
            # 返回常见的默认模型列表作为回退
            return ["qwen3:0.6b", "qwen2.5:0.5b", "qwen:0.5b", "llama3.2:3b", "llama3.1:8b"]

    @classmethod
    def INPUT_TYPES(cls):
        # 动态获取模型列表
        available_models = cls.get_available_models()
        default_model = available_models[0] if available_models else "qwen:0.5b"
        
        return {
            "required": {
                "annotation_data": ("STRING", {
                    "multiline": True, 
                    "default": "",
                    "tooltip": "来自VisualPromptEditor的标注JSON数据"
                }),
                "model": (available_models, {
                    "default": default_model,
                    "tooltip": "选择Ollama模型进行文本生成 (自动从Ollama服务获取)"
                }),  # 动态填充模型列表
                "edit_instruction_type": ([
                    "auto_detect",          # 🔄 自动根据操作类型选择最佳策略
                    "spatial_precise",      # 空间精准编辑
                    "semantic_enhanced",    # 语义增强编辑  
                    "style_coherent",       # 风格一致性编辑
                    "content_aware",        # 内容感知编辑
                    "multi_region",         # 多区域协调编辑
                    "custom"                # 自定义指令
                ], {
                    "default": "auto_detect",
                    "tooltip": "选择编辑指令的生成策略 (auto_detect根据操作类型自动选择)"
                }),
                "output_format": ([
                    "flux_kontext_standard",  # Flux Kontext标准格式
                    "structured_json",        # 结构化JSON
                    "natural_language",       # 自然语言描述
                    "prompt_engineering"      # 提示工程优化
                ], {
                    "default": "flux_kontext_standard",
                    "tooltip": "选择输出的提示词格式"
                }),
            },
            "optional": {
                "reference_context": ("STRING", {
                    "multiline": True,
                    "default": "",
                    "tooltip": "参考上下文，用于增强编辑指令的连贯性"
                }),
                "edit_intensity": ("FLOAT", {
                    "default": 0.8,
                    "min": 0.1,
                    "max": 2.0,
                    "step": 0.1,
                    "tooltip": "编辑强度 (0.1=轻微, 1.0=标准, 2.0=强烈)"
                }),
                "preservation_mask": ("STRING", {
                    "default": "",
                    "tooltip": "需要保护不变的区域描述"
                }),
                "style_guidance": ("STRING", {
                    "default": "",
                    "tooltip": "风格引导参数"
                }),
                "url": ("STRING", {
                    "default": "http://127.0.0.1:11434",
                    "tooltip": "Ollama服务地址"
                }),
                "temperature": ("FLOAT", {
                    "default": 0.7,
                    "min": 0.1,
                    "max": 1.0,
                    "step": 0.1,
                    "tooltip": "生成温度 (创意性控制)"
                }),
                "top_p": ("FLOAT", {
                    "default": 0.9,
                    "min": 0.1,
                    "max": 1.0,
                    "step": 0.1,
                    "tooltip": "核心采样参数"
                }),
                "keep_alive": ("INT", {
                    "default": 5,
                    "min": -1,
                    "max": 60,
                    "tooltip": "模型保持活跃时间(分钟)"
                }),
                "debug_mode": ("BOOLEAN", {
                    "default": False,
                    "tooltip": "启用调试模式，输出详细处理日志"
                }),
            }
        }
    
    RETURN_TYPES = ("STRING", "STRING", "STRING")
    RETURN_NAMES = (
        "flux_edit_instructions",  # Flux Kontext格式的编辑指令
        "spatial_mappings",        # 空间映射信息
        "processing_metadata"      # 处理元数据和调试信息
    )
    
    FUNCTION = "enhance_flux_instructions"
    CATEGORY = "kontext/ai_enhanced"
    DESCRIPTION = "🤖 通过Ollama增强VisualPromptEditor的标注数据，生成Flux Kontext优化的结构化编辑指令"
    
    def __init__(self):
        self.start_time = None
        self.debug_logs = []
    
    def enhance_flux_instructions(self, annotation_data: str, model: str, 
                                edit_instruction_type: str, output_format: str,
                                reference_context: str = "", edit_intensity: float = 0.8,
                                preservation_mask: str = "", style_guidance: str = "",
                                url: str = "http://127.0.0.1:11434", temperature: float = 0.7,
                                top_p: float = 0.9, keep_alive: int = 5,
                                debug_mode: bool = False):
        """通过Ollama增强标注数据，生成Flux Kontext优化的编辑指令"""
        
        self.start_time = time.time()
        self.debug_logs = []
        
        try:
            # 检查Ollama可用性
            if not OLLAMA_AVAILABLE:
                return self._create_fallback_output(
                    "Ollama package not available. Please install with: pip install ollama",
                    debug_mode
                )
            
            # 自动检测最佳编辑策略
            if edit_instruction_type == "auto_detect":
                edit_instruction_type = self._auto_detect_strategy(annotation_data, debug_mode)
                self._log_debug(f"🔄 自动检测到最佳策略: {edit_instruction_type}", debug_mode)
            
            self._log_debug(f"🚀 开始处理 - 模型: {model}, 策略: {edit_instruction_type}", debug_mode)
            
            # 1. 解析标注数据
            annotations, parsed_data = self._parse_annotation_data(annotation_data, debug_mode)
            if not annotations:
                return self._create_fallback_output(
                    "No valid annotations found in annotation_data",
                    debug_mode
                )
            
            # 2. 连接Ollama服务
            client = self._connect_ollama(url, debug_mode)
            if not client:
                return self._create_fallback_output(
                    f"Failed to connect to Ollama at {url}",
                    debug_mode
                )
            
            # 3. 构建提示词
            system_prompt = self._build_system_prompt(edit_instruction_type, output_format)
            user_prompt = self._build_user_prompt(
                annotations, parsed_data, reference_context, 
                edit_intensity, preservation_mask, style_guidance
            )
            
            self._log_debug(f"📝 生成的用户提示词长度: {len(user_prompt)} 字符", debug_mode)
            
            # 4. 调用Ollama生成增强指令
            enhanced_instructions = self._generate_with_ollama(
                client, model, system_prompt, user_prompt,
                temperature, top_p, keep_alive, debug_mode
            )
            
            if not enhanced_instructions:
                return self._create_fallback_output(
                    "Failed to generate enhanced instructions from Ollama",
                    debug_mode
                )
            
            # 5. 格式化输出
            flux_instructions = self._format_flux_instructions(
                enhanced_instructions, output_format, debug_mode
            )
            
            # 6. 生成空间映射
            spatial_mappings = self._generate_spatial_mappings(annotations, debug_mode)
            
            # 7. 生成处理元数据
            processing_metadata = self._generate_processing_metadata(
                model, edit_instruction_type, len(annotations), debug_mode
            )
            
            self._log_debug("✅ 处理完成", debug_mode)
            
            return (flux_instructions, spatial_mappings, processing_metadata)
            
        except Exception as e:
            error_msg = f"Error in enhance_flux_instructions: {str(e)}"
            if debug_mode:
                error_msg += f"\n{traceback.format_exc()}"
            return self._create_fallback_output(error_msg, debug_mode)
    
    def _auto_detect_strategy(self, annotation_data: str, debug_mode: bool) -> str:
        """根据annotation数据自动检测最佳编辑策略"""
        try:
            if not annotation_data or not annotation_data.strip():
                return "spatial_precise"  # 默认策略
            
            parsed_data = json.loads(annotation_data)
            operation_type = parsed_data.get('operation_type', '')
            
            # Visual Prompt Editor操作类型到编辑策略的映射
            operation_to_strategy = {
                # 空间精准类操作
                "change_color": "spatial_precise",
                "replace_object": "spatial_precise", 
                "resize_object": "spatial_precise",
                "geometric_warp": "spatial_precise",
                "perspective_transform": "spatial_precise",
                "precision_cutout": "spatial_precise",
                
                # 语义增强类操作
                "add_object": "semantic_enhanced",
                "remove_object": "semantic_enhanced",
                "change_expression": "semantic_enhanced",
                "character_expression": "semantic_enhanced",
                "content_aware_fill": "semantic_enhanced",
                "seamless_removal": "semantic_enhanced",
                
                # 风格一致性类操作
                "change_style": "style_coherent",
                "change_texture": "style_coherent",
                "global_style_transfer": "style_coherent",
                "style_blending": "style_coherent",
                "global_color_grade": "style_coherent",
                
                # 内容感知类操作
                "enhance_quality": "content_aware",
                "change_pose": "content_aware",
                "change_clothing": "content_aware",
                "enhance_skin_texture": "content_aware",
                "detail_enhance": "content_aware",
                "realism_enhance": "content_aware",
                
                # 多区域协调类操作（检测多个标注）
                "global_enhance": "multi_region",
                "global_filter": "multi_region",
                "collage_integration": "multi_region",
                "texture_mixing": "multi_region"
            }
            
            # 根据操作类型选择策略
            detected_strategy = operation_to_strategy.get(operation_type, "spatial_precise")
            
            # 检查是否有多个标注区域
            annotations = parsed_data.get('annotations', [])
            if len(annotations) > 2:
                detected_strategy = "multi_region"
            
            self._log_debug(f"🎯 操作类型: {operation_type} → 策略: {detected_strategy}", debug_mode)
            return detected_strategy
            
        except Exception as e:
            self._log_debug(f"⚠️ 策略自动检测失败: {e}, 使用默认策略", debug_mode)
            return "spatial_precise"
    
    def _parse_annotation_data(self, annotation_data: str, debug_mode: bool) -> Tuple[List[Dict], Dict]:
        """解析标注数据"""
        try:
            if not annotation_data or not annotation_data.strip():
                self._log_debug("⚠️ 标注数据为空", debug_mode)
                return [], {}
            
            parsed_data = json.loads(annotation_data)
            self._log_debug(f"📊 解析标注数据成功，数据类型: {type(parsed_data)}", debug_mode)
            
            # 提取annotations
            annotations = []
            if isinstance(parsed_data, dict):
                if "annotations" in parsed_data:
                    annotations = parsed_data["annotations"]
                elif "layers_data" in parsed_data:
                    annotations = parsed_data["layers_data"]
            elif isinstance(parsed_data, list):
                annotations = parsed_data
            
            self._log_debug(f"📍 提取到 {len(annotations)} 个标注", debug_mode)
            return annotations, parsed_data
            
        except json.JSONDecodeError as e:
            self._log_debug(f"❌ JSON解析失败: {e}", debug_mode)
            return [], {}
        except Exception as e:
            self._log_debug(f"❌ 标注数据解析异常: {e}", debug_mode)
            return [], {}
    
    def _connect_ollama(self, url: str, debug_mode: bool) -> Optional[object]:
        """连接Ollama服务"""
        try:
            if not OLLAMA_AVAILABLE:
                self._log_debug("❌ Ollama模块不可用", debug_mode)
                return None
                
            from ollama import Client
            client = Client(host=url)
            # 测试连接
            models = client.list()
            self._log_debug(f"🔗 Ollama连接成功，可用模型数: {len(models.get('models', []))}", debug_mode)
            return client
        except Exception as e:
            self._log_debug(f"❌ Ollama连接失败: {e}", debug_mode)
            return None
    
    def _build_system_prompt(self, edit_instruction_type: str, output_format: str) -> str:
        """构建系统提示词"""
        
        # 编辑策略说明及具体指导
        strategy_descriptions = {
            "spatial_precise": {
                "description": "专注于精确的空间位置描述和坐标定位",
                "guidance": """Focus on:
- Precise spatial positioning and coordinates
- Exact boundary definitions
- Clear geometric transformations
- Maintain spatial relationships
- Include specific pixel/region coordinates when possible"""
            },
            "semantic_enhanced": {
                "description": "强调语义理解和内容识别，生成语义丰富的编辑指令",
                "guidance": """Focus on:
- Object recognition and semantic understanding
- Context-aware content modifications
- Intelligent object relationships
- Meaningful content additions/removals
- Preserve semantic coherence"""
            },
            "style_coherent": {
                "description": "注重整体风格的协调统一，确保编辑后的视觉一致性",
                "guidance": """Focus on:
- Visual style consistency
- Color harmony and palette coherence
- Texture and material uniformity
- Lighting and shadow consistency
- Overall aesthetic unity"""
            },
            "content_aware": {
                "description": "智能理解图像内容和上下文，生成内容感知的编辑指令",
                "guidance": """Focus on:
- Context-sensitive modifications
- Content-appropriate enhancements
- Scene understanding
- Natural content integration
- Preserve content authenticity"""
            },
            "multi_region": {
                "description": "处理多个标注区域的协调关系，确保整体编辑的和谐性",
                "guidance": """Focus on:
- Coordinate multiple region edits
- Ensure region-to-region harmony
- Balance competing modifications
- Maintain overall composition
- Synchronize related changes"""
            },
            "custom": {
                "description": "根据用户需求生成自定义的编辑指令",
                "guidance": """Focus on:
- User-specific requirements
- Flexible adaptation to needs
- Custom modification approaches
- Personalized editing strategies"""
            }
        }
        
        # 输出格式说明
        format_descriptions = {
            "flux_kontext_standard": """Output EXACTLY in this format:

[EDIT_OPERATIONS]
operation_1: change the marked area to [target color/object]

[SPATIAL_CONSTRAINTS]
preserve_regions: ["background"]
blend_boundaries: "seamless"

[QUALITY_CONTROLS]
detail_level: "high"
consistency: "maintain_original_quality"
""",
            "structured_json": "输出结构化的JSON格式，包含操作、约束和质量控制信息",
            "natural_language": "输出自然流畅的语言描述，适合直接作为提示词使用",
            "prompt_engineering": "输出经过提示工程优化的格式，包含明确的标签和结构"
        }
        
        # 获取当前策略的指导
        current_strategy = strategy_descriptions.get(edit_instruction_type, strategy_descriptions["spatial_precise"])
        
        system_prompt = f"""Generate image editing instructions in Flux Kontext format.

EDITING STRATEGY: {edit_instruction_type}
{current_strategy["guidance"]}

OUTPUT FORMAT:
{format_descriptions.get(output_format, "Standard format")}

Rules:
- Output ONLY the formatted instructions
- Do NOT include code, explanations, or comments
- Apply the specific editing strategy focus areas listed above
- Ensure instructions match the strategy requirements"""
        
        return system_prompt
    
    def _build_user_prompt(self, annotations: List[Dict], parsed_data: Dict,
                          reference_context: str, edit_intensity: float,
                          preservation_mask: str, style_guidance: str) -> str:
        """构建用户提示词"""
        
        prompt_parts = []
        
        # 1. 标注信息
        prompt_parts.append("=== 图像标注信息 ===")
        for i, annotation in enumerate(annotations):
            annotation_desc = f"标注 {i+1}:"
            annotation_desc += f" 类型={annotation.get('type', 'unknown')}"
            annotation_desc += f" 颜色={annotation.get('color', '#000000')}"
            
            if 'start' in annotation and 'end' in annotation:
                start = annotation['start']
                end = annotation['end']
                annotation_desc += f" 坐标=({start.get('x', 0)},{start.get('y', 0)})-({end.get('x', 0)},{end.get('y', 0)})"
            
            prompt_parts.append(annotation_desc)
        
        # 2. 操作信息
        if 'operation_type' in parsed_data:
            prompt_parts.append(f"\n=== 操作类型 ===")
            prompt_parts.append(f"操作: {parsed_data['operation_type']}")
        
        if 'target_description' in parsed_data:
            prompt_parts.append(f"目标描述: {parsed_data['target_description']}")
        
        # 3. 增强提示词
        if 'constraint_prompts' in parsed_data and parsed_data['constraint_prompts']:
            prompt_parts.append(f"\n=== 约束性提示词 ===")
            constraints = parsed_data['constraint_prompts']
            if isinstance(constraints, list):
                prompt_parts.append(", ".join(constraints))
            else:
                prompt_parts.append(str(constraints))
        
        if 'decorative_prompts' in parsed_data and parsed_data['decorative_prompts']:
            prompt_parts.append(f"\n=== 修饰性提示词 ===")
            decoratives = parsed_data['decorative_prompts']
            if isinstance(decoratives, list):
                prompt_parts.append(", ".join(decoratives))
            else:
                prompt_parts.append(str(decoratives))
        
        # 4. 参考上下文
        if reference_context:
            prompt_parts.append(f"\n=== 参考上下文 ===")
            prompt_parts.append(reference_context)
        
        # 5. 编辑参数
        prompt_parts.append(f"\n=== 编辑参数 ===")
        prompt_parts.append(f"编辑强度: {edit_intensity}")
        
        if preservation_mask:
            prompt_parts.append(f"保护区域: {preservation_mask}")
        
        if style_guidance:
            prompt_parts.append(f"风格指导: {style_guidance}")
        
        # 6. 生成要求
        prompt_parts.append(f"\n=== 生成要求 ===")
        prompt_parts.append("请根据以上信息生成优化的Flux Kontext编辑指令。")
        prompt_parts.append("确保指令精确、可执行，并符合指定的输出格式。")
        
        return "\n".join(prompt_parts)
    
    def _generate_with_ollama(self, client: object, model: str, system_prompt: str,
                             user_prompt: str, temperature: float, top_p: float,
                             keep_alive: int, debug_mode: bool) -> Optional[str]:
        """使用Ollama生成增强指令"""
        try:
            self._log_debug(f"🤖 调用Ollama模型: {model}", debug_mode)
            
            # 配置生成参数
            options = {
                "temperature": temperature,
                "top_p": top_p,
            }
            
            # 对于qwen3等支持thinking模式的模型，尝试禁用thinking输出
            if "qwen3" in model.lower():
                options.update({
                    "thinking": False,  # 尝试禁用thinking模式
                    "stream": False,    # 禁用流式输出
                })
                # 在system prompt中明确要求不要thinking
                system_prompt += "\n\nIMPORTANT: Do not include any thinking process, reasoning steps, or <think> tags in your response. Output only the final formatted instructions."
            
            # 生成响应
            response = client.generate(
                model=model,
                prompt=user_prompt,
                system=system_prompt,
                options=options,
                keep_alive=keep_alive
            )
            
            if response and 'response' in response:
                generated_text = response['response'].strip()
                
                # 过滤掉qwen3等模型的thinking内容
                filtered_text = self._filter_thinking_content(generated_text, debug_mode)
                
                self._log_debug(f"✅ Ollama生成成功，原始长度: {len(generated_text)}, 过滤后长度: {len(filtered_text)} 字符", debug_mode)
                return filtered_text
            else:
                self._log_debug("❌ Ollama响应格式异常", debug_mode)
                return None
                
        except Exception as e:
            self._log_debug(f"❌ Ollama生成失败: {e}", debug_mode)
            return None
    
    def _filter_thinking_content(self, text: str, debug_mode: bool) -> str:
        """过滤掉模型的thinking内容 (如qwen3的<think>标签)"""
        try:
            import re
            
            # 过滤常见的thinking标签格式
            thinking_patterns = [
                r'<think>.*?</think>',  # qwen3的<think>标签
                r'<thinking>.*?</thinking>',  # 其他可能的thinking标签
                r'<thought>.*?</thought>',  # thought标签
                r'思考[:：].*?(?=\n|$)',  # 中文"思考:"开头的行
                r'Let me think.*?(?=\n|$)',  # 英文thinking开头
                r'I need to think.*?(?=\n|$)',  # 其他thinking表达
            ]
            
            filtered_text = text
            original_length = len(text)
            
            # 应用所有过滤规则
            for pattern in thinking_patterns:
                filtered_text = re.sub(pattern, '', filtered_text, flags=re.DOTALL | re.IGNORECASE)
            
            # 清理多余的空白字符
            filtered_text = re.sub(r'\n\s*\n\s*\n', '\n\n', filtered_text)  # 多个空行变成两个
            filtered_text = filtered_text.strip()
            
            # 如果过滤掉了内容，记录日志
            if len(filtered_text) < original_length:
                self._log_debug(f"🧹 过滤掉thinking内容，减少了 {original_length - len(filtered_text)} 字符", debug_mode)
            
            return filtered_text
            
        except Exception as e:
            self._log_debug(f"⚠️ thinking内容过滤失败: {e}，返回原始内容", debug_mode)
            return text
    
    def _format_flux_instructions(self, instructions: str, output_format: str, debug_mode: bool) -> str:
        """格式化Flux指令"""
        try:
            if output_format == "flux_kontext_standard":
                # 如果已经是标准格式，直接返回
                if "[EDIT_OPERATIONS]" in instructions:
                    return instructions
                else:
                    # 转换为标准格式
                    formatted = f"""[EDIT_OPERATIONS]
operation_1: {instructions}

[SPATIAL_CONSTRAINTS]
preserve_regions: ["original_composition"]
blend_boundaries: "seamless"

[QUALITY_CONTROLS]
detail_level: "high"
consistency: "maintain_original_quality"
realism: "photorealistic"
"""
                    return formatted
            elif output_format == "structured_json":
                # 转换为JSON格式
                try:
                    json_output = {
                        "operations": [{"description": instructions}],
                        "constraints": ["preserve_original_composition"],
                        "quality": {"detail_level": "high", "consistency": "high"}
                    }
                    return json.dumps(json_output, indent=2, ensure_ascii=False)
                except:
                    return instructions
            else:
                # 其他格式直接返回
                return instructions
                
        except Exception as e:
            self._log_debug(f"⚠️ 格式化失败，返回原始内容: {e}", debug_mode)
            return instructions
    
    def _generate_spatial_mappings(self, annotations: List[Dict], debug_mode: bool) -> str:
        """生成空间映射信息"""
        try:
            mappings = {
                "regions": [],
                "coordinate_system": "absolute_pixels",
                "total_annotations": len(annotations)
            }
            
            for i, annotation in enumerate(annotations):
                region = {
                    "id": annotation.get("id", f"annotation_{i+1}"),
                    "type": annotation.get("type", "unknown"),
                    "color_code": annotation.get("color", "#000000"),
                    "number": annotation.get("number", i+1)
                }
                
                # 添加坐标信息
                if 'start' in annotation and 'end' in annotation:
                    start = annotation['start']
                    end = annotation['end']
                    region["coordinates"] = [
                        start.get('x', 0), start.get('y', 0),
                        end.get('x', 0), end.get('y', 0)
                    ]
                elif 'points' in annotation:
                    region["points"] = annotation['points']
                
                mappings["regions"].append(region)
            
            return json.dumps(mappings, indent=2, ensure_ascii=False)
            
        except Exception as e:
            self._log_debug(f"⚠️ 空间映射生成失败: {e}", debug_mode)
            return f'{{"error": "Failed to generate spatial mappings: {str(e)}"}}'
    
    def _generate_processing_metadata(self, model: str, strategy: str, 
                                    annotation_count: int, debug_mode: bool) -> str:
        """生成处理元数据"""
        try:
            processing_time = time.time() - self.start_time if self.start_time else 0
            
            metadata = {
                "processing_time": f"{processing_time:.2f}s",
                "timestamp": datetime.now().isoformat(),
                "ollama_model_used": model,
                "edit_strategy": strategy,
                "annotations_processed": annotation_count,
                "enhancement_applied": True,
                "status": "success"
            }
            
            if debug_mode and self.debug_logs:
                metadata["debug_logs"] = self.debug_logs
            
            return json.dumps(metadata, indent=2, ensure_ascii=False)
            
        except Exception as e:
            return f'{{"error": "Failed to generate metadata: {str(e)}"}}'
    
    def _log_debug(self, message: str, debug_mode: bool):
        """记录调试信息"""
        if debug_mode:
            timestamp = datetime.now().strftime("%H:%M:%S.%f")[:-3]
            log_message = f"[{timestamp}] {message}"
            self.debug_logs.append(log_message)
            print(log_message)  # 同时输出到控制台
    
    def _create_fallback_output(self, error_msg: str, debug_mode: bool) -> Tuple[str, str, str]:
        """创建失败时的回退输出"""
        self._log_debug(f"❌ 创建回退输出: {error_msg}", debug_mode)
        
        fallback_instructions = f"""[EDIT_OPERATIONS]
operation_1: Apply standard edit to marked regions
# Error: {error_msg}

[SPATIAL_CONSTRAINTS]
preserve_regions: ["all_unmarked_areas"]
blend_boundaries: "seamless"

[QUALITY_CONTROLS]
detail_level: "standard"
consistency: "maintain_original"
"""
        
        fallback_mappings = f'{{"error": "{error_msg}", "regions": []}}'
        
        fallback_metadata = f'{{"error": "{error_msg}", "status": "failed", "timestamp": "{datetime.now().isoformat()}"}}'
        
        return (fallback_instructions, fallback_mappings, fallback_metadata)


# 添加API端点用于动态获取模型
if WEB_AVAILABLE:
    @PromptServer.instance.routes.post("/ollama_flux_enhancer/get_models")
    async def get_models_endpoint(request):
        """获取可用的Ollama模型列表"""
        try:
            data = await request.json()
            url = data.get("url", "http://127.0.0.1:11434")
            
            if not OLLAMA_AVAILABLE:
                return web.json_response([])
            
            from ollama import Client
            client = Client(host=url)
            models_response = client.list()
            models = models_response.get('models', [])
            
            # 提取模型名称 - 使用与get_available_models相同的逻辑
            model_names = []
            for model in models:
                if isinstance(model, dict):
                    name = model.get('model') or model.get('name')
                    if name:
                        model_names.append(name)
                elif hasattr(model, 'model'):
                    # 处理对象类型的模型
                    model_names.append(model.model)
                else:
                    # 尝试转换为字符串并提取模型名
                    model_str = str(model)
                    if "model='" in model_str:
                        # 从字符串中提取模型名 例: "model='qwen3:0.6b'"
                        start = model_str.find("model='") + 7
                        end = model_str.find("'", start)
                        if end > start:
                            model_names.append(model_str[start:end])
                        else:
                            # 如果提取失败，跳过这个模型
                            print(f"Warning: Failed to extract model name from: {model_str[:100]}...")
                    else:
                        # 如果格式不匹配，跳过这个模型
                        print(f"Warning: Unknown model format: {model_str[:100]}...")
            
            return web.json_response(model_names)
            
        except Exception as e:
            print(f"Error fetching Ollama models: {e}")
            return web.json_response([])


# 节点注册
NODE_CLASS_MAPPINGS = {
    "OllamaFluxKontextEnhancer": OllamaFluxKontextEnhancer,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "OllamaFluxKontextEnhancer": "🤖 Ollama Flux Kontext Enhancer",
}