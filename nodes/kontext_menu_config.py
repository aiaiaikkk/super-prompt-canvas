"""
Kontext菜单配置系统
基于1026样本数据的选项卡和双下拉框配置
Version: 2.0.0 - Kontext架构版
"""

from typing import Dict, List, Optional, Tuple
from .guidance_templates import KONTEXT_EDITING_TYPES

class KontextMenuConfig:
    """Kontext菜单配置管理器"""
    
    def __init__(self):
        self.editing_types = KONTEXT_EDITING_TYPES
        
    def get_tab_config(self) -> List[Dict]:
        """获取选项卡配置"""
        tabs = []
        
        # 按优先级排序的选项卡
        tab_order = [
            "local_editing",      # 最高频使用
            "creative_reconstruction",  # 新增重要功能
            "global_editing",     # 全局处理  
            "text_editing",       # 文字专用
            "professional_operations"  # 商业场景
        ]
        
        for tab_id in tab_order:
            if tab_id in self.editing_types:
                config = self.editing_types[tab_id]
                tabs.append({
                    "id": tab_id,
                    "name": config["name"],
                    "display_name": self._get_tab_display_name(tab_id, config),
                    "description": config["description"],
                    "badge": config.get("badge", ""),
                    "is_new": tab_id == "creative_reconstruction"
                })
            elif tab_id == "text_editing":
                # 文字编辑保持原有架构
                tabs.append({
                    "id": "text_editing",
                    "name": "文字编辑", 
                    "display_name": "📝 文字编辑",
                    "description": "专门处理图像中的文字内容",
                    "badge": "",
                    "is_new": False
                })
            elif tab_id == "professional_operations":
                # 专业操作场景化
                tabs.append({
                    "id": "professional_operations",
                    "name": "专业操作",
                    "display_name": "💼 专业操作",
                    "description": "商业级专业编辑场景",
                    "badge": "商业版",
                    "is_new": False
                })
        
        return tabs
    
    def get_operation_types(self, editing_type: str) -> List[Dict]:
        """获取操作类型（第一个下拉框）"""
        if editing_type not in self.editing_types:
            return self._get_default_operations(editing_type)
        
        config = self.editing_types[editing_type]
        operations = []
        
        # 按优先级排序
        sorted_ops = sorted(
            config["operation_types"].items(),
            key=lambda x: x[1].get("priority", 999)
        )
        
        for op_id, op_config in sorted_ops:
            operations.append({
                "id": op_id,
                "name": op_config["name"],
                "display_name": op_config["name"],
                "priority": op_config.get("priority", 999),
                "complexity": op_config.get("complexity", ""),
                "description": op_config.get("description", "")
            })
        
        return operations
    
    def get_specific_operations(self, editing_type: str, operation_type: str) -> List[Dict]:
        """获取具体操作（第二个下拉框）"""
        if editing_type not in self.editing_types:
            return self._get_default_specific_operations(editing_type, operation_type)
        
        if operation_type not in self.editing_types[editing_type]["operation_types"]:
            return []
        
        specific_ops = self.editing_types[editing_type]["operation_types"][operation_type]["specific_operations"]
        
        return [
            {
                "id": op["id"],
                "name": op["name"],
                "display_name": f'{op["name"]} "{op["example"]}"',
                "example": op["example"],
                "complexity": op.get("complexity", ""),
                "description": self._generate_operation_description(op)
            }
            for op in specific_ops
        ]
    
    
    def get_operation_guidance(self, editing_type: str, operation_type: str) -> Dict:
        """获取操作引导信息"""
        guidance = {
            "title": "操作指导",
            "description": "",
            "tips": [],
            "examples": []
        }
        
        if editing_type in self.editing_types and operation_type in self.editing_types[editing_type]["operation_types"]:
            op_config = self.editing_types[editing_type]["operation_types"][operation_type]
            
            guidance["title"] = f"{op_config['name']}指导"
            guidance["description"] = op_config['name']
            
            # 提示由前端KontextMenuSystem.getOperationTips处理
            guidance["tips"] = []
            guidance["examples"] = [op["example"] for op in op_config["specific_operations"][:3]]
        
        return guidance
    
    def _get_tab_display_name(self, tab_id: str, config: Dict) -> str:
        """生成选项卡显示名称"""
        emoji_map = {
            "local_editing": "🎯",
            "global_editing": "🌍", 
            "creative_reconstruction": "🎭",
            "text_editing": "📝",
            "professional_operations": "💼"
        }
        
        emoji = emoji_map.get(tab_id, "")
        name = config["name"]
        
        return f"{emoji} {name}"
    
    def _generate_operation_description(self, op: Dict) -> str:
        """生成操作描述"""
        base_desc = f"示例: {op['example']}"
        
        if "complexity" in op:
            base_desc += f" | 复杂度: {op['complexity']}"
        
        return base_desc
    
    
    
    def _get_default_operations(self, editing_type: str) -> List[Dict]:
        """获取默认操作类型（为向后兼容）"""
        default_maps = {
            "text_editing": [
                {"id": "content_replace", "name": "文字内容替换", "display_name": "文字内容替换"},
                {"id": "content_add", "name": "文字添加", "display_name": "文字添加"},
                {"id": "style_modify", "name": "文字样式修改", "display_name": "文字样式修改"},
                {"id": "size_adjust", "name": "文字大小调整", "display_name": "文字大小调整"},
                {"id": "position_change", "name": "文字位置变更", "display_name": "文字位置变更"},
                {"id": "text_remove", "name": "文字删除", "display_name": "文字删除"}
            ],
            "professional_operations": [
                {"id": "ecommerce", "name": "电商产品级", "display_name": "🛍️ 电商产品级"},
                {"id": "portrait", "name": "人像专业级", "display_name": "👤 人像专业级"},
                {"id": "architecture", "name": "建筑空间级", "display_name": "🏢 建筑空间级"},
                {"id": "food", "name": "美食摄影级", "display_name": "🍽️ 美食摄影级"},
                {"id": "fashion", "name": "时尚零售级", "display_name": "👗 时尚零售级"},
                {"id": "nature", "name": "自然风光级", "display_name": "🌲 自然风光级"}
            ]
        }
        
        return default_maps.get(editing_type, [])
    
    def _get_default_specific_operations(self, editing_type: str, operation_type: str) -> List[Dict]:
        """获取默认具体操作"""
        # 专业操作的具体操作项
        if editing_type == "professional_operations":
            professional_specifics = {
                "ecommerce": [
                    {"id": "color_accuracy", "name": "色彩准确性控制", "example": "accurate product colors"},
                    {"id": "background_clean", "name": "背景纯净化处理", "example": "clean white background"},
                    {"id": "detail_enhance", "name": "产品细节增强", "example": "enhance product details"},
                    {"id": "defect_remove", "name": "缺陷修复处理", "example": "remove defects"}
                ],
                "portrait": [
                    {"id": "skin_natural", "name": "自然肌肤处理", "example": "natural skin enhancement"},
                    {"id": "feature_preserve", "name": "特征保持技术", "example": "preserve facial features"},
                    {"id": "background_pro", "name": "背景专业化", "example": "professional background"},
                    {"id": "lighting_opt", "name": "光线优化调整", "example": "optimize portrait lighting"}
                ]
            }
            return [
                {
                    "id": op["id"],
                    "name": op["name"],
                    "display_name": f'{op["name"]} "{op["example"]}"',
                    "example": op["example"],
                    "complexity": "",
                    "description": f'示例: {op["example"]}'
                }
                for op in professional_specifics.get(operation_type, [])
            ]
        
        return []


# 全局菜单配置实例
kontext_menu_config = KontextMenuConfig()

def get_menu_config() -> KontextMenuConfig:
    """获取菜单配置实例"""
    return kontext_menu_config

def get_tab_options() -> List[Dict]:
    """获取选项卡选项"""
    return kontext_menu_config.get_tab_config()

def get_operation_options(editing_type: str) -> List[Dict]:
    """获取操作类型选项"""
    return kontext_menu_config.get_operation_types(editing_type)

def get_specific_options(editing_type: str, operation_type: str) -> List[Dict]:
    """获取具体操作选项"""
    return kontext_menu_config.get_specific_operations(editing_type, operation_type)