"""
Setup script for Kontext Visual Prompt Window
ComfyUI Custom Node Package
"""

from setuptools import setup, find_packages
import os

# Read the version from __init__.py
def get_version():
    """Extract version from __init__.py"""
    init_path = os.path.join(os.path.dirname(__file__), '__init__.py')
    with open(init_path, 'r', encoding='utf-8') as f:
        for line in f:
            if line.startswith('__version__'):
                return line.split('=')[1].strip().strip('"\'')
    return "1.2.0"  # fallback

# Read README for long description
def get_long_description():
    """Read README.md if available"""
    readme_path = os.path.join(os.path.dirname(__file__), 'README.md')
    if os.path.exists(readme_path):
        with open(readme_path, 'r', encoding='utf-8') as f:
            return f.read()
    return "Intelligent Visual Prompt Builder for Flux Kontext - ComfyUI Custom Node"

setup(
    name="kontext-super-prompt",
    version=get_version(),
    author="Kontext Team",
    author_email="kontext@example.com",
    description="Intelligent Visual Prompt Builder for Flux Kontext - ComfyUI Custom Node",
    long_description=get_long_description(),
    long_description_content_type="text/markdown",
    url="https://github.com/aiaiaikkk/kontext-super-prompt",
    project_urls={
        "Bug Reports": "https://github.com/aiaiaikkk/kontext-super-prompt/issues",
        "Source": "https://github.com/aiaiaikkk/kontext-super-prompt",
        "Documentation": "https://github.com/aiaiaikkk/kontext-super-prompt#readme",
    },
    packages=find_packages(),
    include_package_data=True,
    package_data={
        '': ['*.js', '*.html', '*.css', '*.png', '*.jpg', '*.json', '*.md', '*.txt', '*.xlsx'],
    },
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "Intended Audience :: End Users/Desktop",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Topic :: Multimedia :: Graphics :: Graphics Conversion",
        "Topic :: Scientific/Engineering :: Artificial Intelligence",
    ],
    python_requires=">=3.8",
    install_requires=[
        "torch>=2.0.0",
        "torchvision>=0.15.0",
        "numpy>=1.21.0",
        "pillow>=9.0.0",
    ],
    extras_require={
        "ollama": ["ollama>=0.4.8"],
        "opencv": ["opencv-python>=4.5.0"],
        "nlp": ["transformers>=4.20.0"],
        "diffusion": ["diffusers>=0.20.0"],
        "web": ["aiohttp>=3.8.0"],
        "data": ["pandas>=1.3.0", "openpyxl>=3.0.0"],
        "all": [
            "ollama>=0.4.8",
            "opencv-python>=4.5.0",
            "transformers>=4.20.0",
            "diffusers>=0.20.0",
            "aiohttp>=3.8.0",
            "pandas>=1.3.0",
            "openpyxl>=3.0.0",
        ],
    },
    keywords="comfyui flux kontext visual-prompt ai image-editing annotation",
    zip_safe=False,
)