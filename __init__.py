"""
kontext-super-prompt - ComfyUI Custom Nodes
Intelligent Visual Prompt Builder with Kontext Transform Engine
Kontext团队原创架构 - Transform-First设计

Version: 1.3.3
Author: Kontext Team
Repository: https://github.com/aiaiaikkk/kontext-super-prompt
License: MIT
"""

import importlib.util
import os
import sys

# Version information
__version__ = "1.3.3"
__author__ = "Kontext Team"
__description__ = "Intelligent Visual Prompt Builder with Kontext Transform Engine"

NODE_CLASS_MAPPINGS = {}
NODE_DISPLAY_NAME_MAPPINGS = {}
WEB_DIRECTORY = "./web"

def get_ext_dir(subpath=None):
    dir = os.path.dirname(__file__)
    if subpath is not None:
        dir = os.path.join(dir, subpath)
    return os.path.abspath(dir)

# Load nodes from py directory
nodes_dir = get_ext_dir("nodes")
if os.path.exists(nodes_dir):
    files = os.listdir(nodes_dir)
    for file in files:
        if not file.endswith(".py") or file.startswith("__"):
            continue
        # 跳过备份文件和测试文件
        if "backup" in file or "test" in file or file.endswith("_backup.py"):
            continue
        
        name = os.path.splitext(file)[0]
        try:
            # 使用绝对路径导入模块
            spec = importlib.util.spec_from_file_location(name, os.path.join(nodes_dir, file))
            imported_module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(imported_module)
            
            if hasattr(imported_module, 'NODE_CLASS_MAPPINGS'):
                NODE_CLASS_MAPPINGS.update(imported_module.NODE_CLASS_MAPPINGS)
            if hasattr(imported_module, 'NODE_DISPLAY_NAME_MAPPINGS'):
                NODE_DISPLAY_NAME_MAPPINGS.update(imported_module.NODE_DISPLAY_NAME_MAPPINGS)
        except Exception as e:
            print(f"[Kontext-Super-Prompt] Error loading node {name}: {e}")
            import traceback
            traceback.print_exc()

# 输出加载信息
print(f"[Kontext-Super-Prompt] v{__version__} 加载完成")
print(f"[Kontext-Super-Prompt] 已注册节点: {list(NODE_CLASS_MAPPINGS.keys())}")
print(f"[Kontext-Super-Prompt] Kontext Transform Engine 已激活")

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS", "WEB_DIRECTORY"]
