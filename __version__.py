"""
Version information for Kontext Visual Prompt Window
Centralized version management for all components
"""

__version__ = "1.2.1"
__version_info__ = tuple(map(int, __version__.split('.')))

# Metadata
__title__ = "Kontext Visual Prompt Window"
__description__ = "Intelligent Visual Prompt Builder for Flux Kontext"
__author__ = "Kontext Team"
__author_email__ = "kontext@example.com"
__license__ = "MIT"
__copyright__ = "Copyright 2024-2025 Kontext Team"
__url__ = "https://github.com/aiaiaikkk/kontext-super-prompt"

# ComfyUI Manager compatibility
COMFYUI_SUPPORTED_VERSIONS = [">=1.0.0"]
PYTHON_REQUIRES = ">=3.8"

# Release information
RELEASE_NOTES = {
    "1.2.1": [
        "ComfyUI Manager版本识别修复",
        "添加标准package配置文件",
        "统一版本管理系统",
        "仓库URL标准化"
    ],
    "1.2.0": [
        "鼠标滚轮缩放功能",
        "图像重复加载优化",
        "注释清理和代码优化",
        "用户体验增强功能"
    ],
    "1.1.0": [
        "多边形绘制工具",
        "不透明度控制",
        "多图编辑支持"
    ],
    "1.0.0": [
        "初始版本发布",
        "基础可视化提示词编辑器",
        "Fabric.js集成"
    ]
}

# For backward compatibility
version = __version__
VERSION = __version__