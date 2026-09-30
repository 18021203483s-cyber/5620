@echo off
echo ================================================
echo HomeMatch AI 文档生成器
echo ================================================
echo.

echo 正在安装 python-docx 库...
pip install python-docx

echo.
echo 正在生成 Word 文档...
python generate_diagrams_doc.py

echo.
echo ================================================
echo 完成！文档已生成: HomeMatch_AI_Class_Object_Diagrams.docx
echo ================================================
pause
