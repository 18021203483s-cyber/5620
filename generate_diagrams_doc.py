# -*- coding: utf-8 -*-
"""
HomeMatch AI - 类图和对象图 Word文档生成器
"""

from docx import Document
from docx.shared import Inches, Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

def set_cell_shading(cell, color):
    """设置单元格背景色"""
    shading_elm = OxmlElement('w:shd')
    shading_elm.set(qn('w:fill'), color)
    cell._tc.get_or_add_tcPr().append(shading_elm)

def add_heading_with_style(doc, text, level=1):
    """添加带样式的标题"""
    heading = doc.add_heading(text, level=level)
    for run in heading.runs:
        run.font.name = 'Microsoft YaHei'
        run._element.rPr.rFonts.set(qn('w:eastAsia'), 'Microsoft YaHei')
    return heading

def add_paragraph_with_font(doc, text, bold=False, font_size=11):
    """添加带字体的段落"""
    p = doc.add_paragraph()
    run = p.add_run(text)
    run.font.name = 'Microsoft YaHei'
    run._element.rPr.rFonts.set(qn('w:eastAsia'), 'Microsoft YaHei')
    run.font.size = Pt(font_size)
    run.bold = bold
    return p

def add_code_block(doc, code_text):
    """添加代码块"""
    p = doc.add_paragraph()
    p.paragraph_format.left_indent = Cm(1)
    run = p.add_run(code_text)
    run.font.name = 'Consolas'
    run.font.size = Pt(9)
    run.font.color.rgb = RGBColor(0, 100, 0)
    return p

def add_table_with_style(doc, headers, rows, header_color='4472C4'):
    """添加带样式的表格"""
    table = doc.add_table(rows=len(rows)+1, cols=len(headers))
    table.style = 'Table Grid'
    
    # 表头
    header_cells = table.rows[0].cells
    for i, header in enumerate(headers):
        header_cells[i].text = header
        header_cells[i].paragraphs[0].runs[0].bold = True
        header_cells[i].paragraphs[0].runs[0].font.color.rgb = RGBColor(255, 255, 255)
        set_cell_shading(header_cells[i], header_color)
    
    # 数据行
    for row_idx, row_data in enumerate(rows):
        row_cells = table.rows[row_idx + 1].cells
        for col_idx, cell_data in enumerate(row_data):
            row_cells[col_idx].text = str(cell_data)
            if row_idx % 2 == 0:
                set_cell_shading(row_cells[col_idx], 'F2F2F2')
    
    return table

def create_homematch_document():
    """创建HomeMatch AI文档"""
    doc = Document()
    
    # 设置默认字体
    style = doc.styles['Normal']
    style.font.name = 'Microsoft YaHei'
    style._element.rPr.rFonts.set(qn('w:eastAsia'), 'Microsoft YaHei')
    
    # ==================== 封面 ====================
    doc.add_paragraph()
    doc.add_paragraph()
    
    title = doc.add_heading('HomeMatch AI', 0)
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    
    subtitle = doc.add_paragraph('智能租房匹配系统')
    subtitle.alignment = WD_ALIGN_PARAGRAPH.CENTER
    for run in subtitle.runs:
        run.font.size = Pt(18)
        run.font.color.rgb = RGBColor(100, 100, 100)
    
    doc.add_paragraph()
    
    info = doc.add_paragraph('类图 (Class Diagram) 和 对象图 (Object Diagram) 文档')
    info.alignment = WD_ALIGN_PARAGRAPH.CENTER
    for run in info.runs:
        run.font.size = Pt(14)
        run.font.bold = True
    
    doc.add_paragraph()
    
    meta = doc.add_paragraph('Version 1.0 | 2026年9月')
    meta.alignment = WD_ALIGN_PARAGRAPH.CENTER
    
    doc.add_page_break()
    
    # ==================== 目录 ====================
    add_heading_with_style(doc, '目录', 1)
    
    toc_items = [
        '1. 系统概述',
        '2. 类图 (Class Diagram)',
        '   2.1 组件层 (UI Components)',
        '   2.2 核心类型层 (Core Types)',
        '   2.3 Agent层 (Agents)',
        '   2.4 类图详细说明',
        '3. 对象图 (Object Diagram)',
        '   3.1 用户会话实例',
        '   3.2 房产匹配实例',
        '   3.3 护照验证实例',
        '   3.4 对话状态机',
        '4. 系统工作流程',
        '5. 类之间的关系',
    ]
    
    for item in toc_items:
        p = doc.add_paragraph(item)
        p.paragraph_format.space_after = Pt(6)
    
    doc.add_page_break()
    
    # ==================== 1. 系统概述 ====================
    add_heading_with_style(doc, '1. 系统概述', 1)
    
    add_paragraph_with_font(doc, '''HomeMatch AI 是一个基于多Agent协作的智能租房匹配系统。该系统通过自然语言对话采集用户需求，
利用LLM智能理解和匹配房产，并结合OpenStreetMap数据为房产进行周边设施评分。

系统特点：
• 智能对话：支持LLM和规则引擎两种模式处理用户输入
• 容错性：能识别拼写错误和缩写（如"chatwood"→"Chatswood"）
• 多维度评分：从匹配度、地图评分、价格三个维度综合评估房产
• 护照识别：使用Gemini Vision API自动提取护照信息
• 完整流程：从找房到申请的一站式服务''')
    
    doc.add_paragraph()
    
    # 系统架构表
    add_heading_with_style(doc, '系统架构概览', 2)
    
    headers = ['层次', '组件/模块', '文件', '主要功能']
    rows = [
        ['UI层', 'ChatInterface', 'components/ChatInterface.tsx', '主聊天界面，管理对话状态'],
        ['UI层', 'MapView', 'components/MapView.tsx', 'Leaflet地图展示'],
        ['UI层', 'PassportUpload', 'components/PassportUpload.tsx', '护照上传组件'],
        ['UI层', 'ApplicationForm', 'components/ApplicationForm.tsx', '申请表展示'],
        ['UI层', 'PropertyCard', 'components/PropertyCard.tsx', '房产卡片展示'],
        ['类型层', 'Types', 'lib/types.ts', '核心数据类型定义'],
        ['类型层', 'Properties', 'lib/properties.ts', '28个悉尼租房数据'],
        ['Agent层', 'ConversationAgent', 'lib/conversation-agent.ts', '对话处理、需求采集'],
        ['Agent层', 'MatchingAgent', 'lib/matching-agent.ts', '房产匹配评分'],
        ['Agent层', 'MapAgent', 'lib/map-agent.ts', '地图API、周边设施评分'],
        ['Agent层', 'DocumentAgent', 'lib/document-agent.ts', '护照识别'],
        ['Agent层', 'CommunicationAgent', 'lib/communication-agent.ts', '申请生成'],
    ]
    
    add_table_with_style(doc, headers, rows)
    
    doc.add_page_break()
    
    # ==================== 2. 类图 ====================
    add_heading_with_style(doc, '2. 类图 (Class Diagram)', 1)
    
    add_paragraph_with_font(doc, '''类图展示了系统中各个类的结构及其之间的关系。每个类包含属性和方法。''')
    
    # 2.1 UI组件层
    add_heading_with_style(doc, '2.1 组件层 (UI Components)', 2)
    
    # ChatInterface
    add_heading_with_style(doc, 'ChatInterface 组件', 3)
    
    code = '''┌─────────────────────────────────────────────────────────────┐
│                    ChatInterface (主组件)                           │
├─────────────────────────────────────────────────────────────────┤
│ 属性:                                                            │
│ ─────────────────────────────────────────────────────────────────│
│ - messages: Message[]           // 对话消息列表                    │
│ - state: SystemState            // 系统状态                        │
│ - matchedProperties: ScoredProperty[]  // 匹配房产列表             │
│ - selectedProperty: ScoredProperty     // 选中的房产               │
│ - showPassportUpload: boolean   // 是否显示护照上传               │
│ - showApplication: boolean      // 是否显示申请表                  │
│ - passportInfo: PassportInfo    // 护照信息                       │
│ - isTyping: boolean            // 是否正在输入                    │
├─────────────────────────────────────────────────────────────────┤
│ 方法:                                                            │
│ ─────────────────────────────────────────────────────────────────│
│ + handleSendMessage(input: string): Promise<void>                 │
│ + handlePropertySelect(property: ScoredProperty): void            │
│ + handlePassportUpload(info: PassportInfo): void                  │
│ + handleSkipPassport(): void                                     │
│ + handleSubmitApplication(): void                                 │
└─────────────────────────────────────────────────────────────────┘'''
    add_code_block(doc, code)
    
    doc.add_paragraph()
    
    # MapView
    add_heading_with_style(doc, 'MapView 组件', 3)
    
    code = '''┌─────────────────────────────────────────────────────────────┐
│                      MapView (地图组件)                            │
├─────────────────────────────────────────────────────────────────┤
│ 属性:                                                            │
│ ─────────────────────────────────────────────────────────────────│
│ - mapRef: RefObject<HTMLDivElement>  // 地图容器引用              │
│ - mapInstanceRef: any                 // Leaflet地图实例          │
│ - markersRef: any[]                   // 标记点引用列表            │
│ - isInitializedRef: boolean          // 初始化标志                │
├─────────────────────────────────────────────────────────────────┤
│ 方法:                                                            │
│ ─────────────────────────────────────────────────────────────────│
│ + useEffect()                           // 初始化地图               │
│ + updateMarkers(): void                // 更新标记点               │
│ + initMap(): Promise<void>            // 异步初始化地图          │
└─────────────────────────────────────────────────────────────────┘'''
    add_code_block(doc, code)
    
    doc.add_paragraph()
    
    # PassportUpload
    add_heading_with_style(doc, 'PassportUpload 组件', 3)
    
    code = '''┌─────────────────────────────────────────────────────────────┐
│                   PassportUpload (护照上传组件)                      │
├─────────────────────────────────────────────────────────────────┤
│ 属性:                                                            │
│ ─────────────────────────────────────────────────────────────────│
│ - selectedFile: File | null       // 选择的文件                   │
│ - preview: string | null         // 预览URL                       │
│ - isProcessing: boolean          // 是否处理中                    │
│ - error: string | null          // 错误信息                       │
│ - fileInputRef: RefObject       // 文件输入引用                   │
├─────────────────────────────────────────────────────────────────┤
│ 方法:                                                            │
│ ─────────────────────────────────────────────────────────────────│
│ + handleFileChange(): void        // 处理文件选择                  │
│ + handleDrop(): void             // 处理拖放                      │
│ + handleDragOver(): void         // 处理拖拽悬停                  │
│ + handleUpload(): Promise<void>  // 上传并识别护照                │
└─────────────────────────────────────────────────────────────────┘'''
    add_code_block(doc, code)
    
    doc.add_page_break()
    
    # 2.2 核心类型层
    add_heading_with_style(doc, '2.2 核心类型层 (Core Types)', 2)
    
    add_paragraph_with_font(doc, '核心类型定义了系统的数据结构，包括用户信息、房产信息、对话状态等。')
    
    # Message
    add_heading_with_style(doc, 'Message 消息类型', 3)
    
    code = '''┌─────────────────────────────────────────────────────────────┐
│                         Message (消息)                               │
├─────────────────────────────────────────────────────────────────┤
│ 属性:                                                            │
│ ─────────────────────────────────────────────────────────────────│
│ + id: string                    // 消息唯一ID                     │
│ + role: MessageRole            // 角色: user | agent | system     │
│ + content: string              // 消息内容                        │
│ + timestamp: Date              // 时间戳                          │
└─────────────────────────────────────────────────────────────────┘

MessageRole (枚举):
┌─────────────────────────────────────────────────────────────┐
│ type MessageRole = 'user' | 'agent' | 'system'             │
└─────────────────────────────────────────────────────────┘'''
    add_code_block(doc, code)
    
    doc.add_paragraph()
    
    # UserProfile
    add_heading_with_style(doc, 'UserProfile 用户资料', 3)
    
    code = '''┌─────────────────────────────────────────────────────────────┐
│                     UserProfile (用户资料)                          │
├─────────────────────────────────────────────────────────────────┤
│ 属性:                                                            │
│ ─────────────────────────────────────────────────────────────────│
│ + name: string                    // 用户姓名                       │
│ + contact: string                // 联系方式                       │
│ + budget: {                      // 预算范围                       │
│     min: number,                 //   最低预算                     │
│     max: number                  //   最高预算                     │
│   }                              │                                │
│ + preferredAreas: string[]       // 首选区域                       │
│ + bedrooms: number               // 卧室数量                       │
│ + moveInDate: string             // 入住日期                       │
│ + specialRequirements: string[]  // 特殊要求                       │
│ + transportationNeeds: string[] // 交通需求                       │
└─────────────────────────────────────────────────────────────────┘'''
    add_code_block(doc, code)
    
    doc.add_paragraph()
    
    # Property
    add_heading_with_style(doc, 'Property 房产类型', 3)
    
    code = '''┌─────────────────────────────────────────────────────────────┐
│                       Property (房产)                               │
├─────────────────────────────────────────────────────────────────┤
│ 属性:                                                            │
│ ─────────────────────────────────────────────────────────────────│
│ + id: string                    // 房产唯一ID                     │
│ + address: string               // 地址                           │
│ + suburb: string               // 区域/郊区                       │
│ + price: number                // 周租金                         │
│ + bedrooms: number             // 卧室数                         │
│ + bathrooms: number            // 浴室数                         │
│ + parking: number              // 停车位                         │
│ + lat: number                 // 纬度                           │
│ + lng: number                 // 经度                           │
│ + features: string[]           // 特色设施                       │
│ + imageUrl: string             // 图片URL                        │
│ + description: string          // 描述                           │
└─────────────────────────────────────────────────────────────────┘
                              △
                              │ extends (使用extends关键字)
                              │
┌─────────────────────────────────────────────────────────────────┐
│                 ScoredProperty (带评分的房产)                     │
├─────────────────────────────────────────────────────────────────┤
│ 属性:                                                            │
│ ─────────────────────────────────────────────────────────────────│
│ + matchScore: number           // 匹配度得分 (0-100)              │
│ + mapScore: number             // 地图综合得分 (0-100)            │
│ + parkScore: number            // 公园得分 (0-100)                │
│ + busScore: number             // 公交得分 (0-100)                │
│ + trainScore: number           // 火车得分 (0-100)                │
│ + priceScore: number           // 价格合理性得分 (0-100)           │
│ + totalScore: number           // 总得分 (0-100)                  │
└─────────────────────────────────────────────────────────────────┘'''
    add_code_block(doc, code)
    
    doc.add_paragraph()
    
    # ConversationStage
    add_heading_with_style(doc, 'ConversationStage 对话阶段', 3)
    
    code = '''┌─────────────────────────────────────────────────────────────┐
│               ConversationStage (对话阶段枚举)                      │
├─────────────────────────────────────────────────────────────────┤
│ 枚举值:                                                          │
│ ─────────────────────────────────────────────────────────────────│
│                                                                 │
│   GREETING                 // 问候阶段                           │
│   COLLECTING_BASIC_INFO    // 采集基本信息                       │
│   COLLECTING_BUDGET        // 采集预算                           │
│   COLLECTING_LOCATION      // 采集区域                           │
│   COLLECTING_BEDROOMS      // 采集卧室数                         │
│   COLLECTING_MOVE_DATE     // 采集入住日期                       │
│   COLLECTING_SPECIAL       // 采集特殊要求                       │
│   SEARCHING_PROPERTIES     // 搜索房产                           │
│   SHOWING_RESULTS          // 展示结果                           │
│   AWAITING_SELECTION       // 等待选择                           │
│   AWAITING_PASSPORT        // 等待护照验证                       │
│   GENERATING_APPLICATION   // 生成申请                           │
│   COMPLETE                 // 完成                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘'''
    add_code_block(doc, code)
    
    doc.add_page_break()
    
    # 2.3 Agent层
    add_heading_with_style(doc, '2.3 Agent层 (Agents)', 2)
    
    add_paragraph_with_font(doc, '''Agent层包含系统的核心业务逻辑，每个Agent负责特定的功能模块。''')
    
    # conversation-agent
    add_heading_with_style(doc, 'conversation-agent.ts 采集Agent', 3)
    
    code = '''┌─────────────────────────────────────────────────────────────┐
│              conversation-agent.ts (采集Agent)                      │
├─────────────────────────────────────────────────────────────────┤
│ 主要功能: 智能多轮对话，采集用户租房需求                             │
├─────────────────────────────────────────────────────────────────┤
│ 公开方法:                                                        │
│ ─────────────────────────────────────────────────────────────────│
│ + processUserMessageWithLLM(                                     │
│     message: string,                                             │
│     currentProfile: Partial<UserProfile>,                        │
│     currentStage: ConversationStage                             │
│   ): Promise<ConversationResult>                                │
│   // 主要入口：优先使用LLM，失败则回退到规则引擎                    │
│                                                                 │
│ + processUserMessage(                                            │
│     message: string,                                             │
│     currentProfile: Partial<UserProfile>,                        │
│     currentStage: ConversationStage                              │
│   ): ConversationResult                                          │
│   // 同步版本，直接使用规则引擎                                    │
│                                                                 │
│ + generateProfileSummary(profile: Partial<UserProfile>): string  │
│   // 生成用户资料摘要                                             │
├─────────────────────────────────────────────────────────────────┤
│ 内部方法:                                                        │
│ ─────────────────────────────────────────────────────────────────│
│ - processWithGemini(): Promise<ConversationResult>              │
│   // 使用Gemini LLM处理                                          │
│                                                                 │
│ - processWithSimpleRules(): ConversationResult                   │
│   // 使用规则引擎处理（支持拼写纠错）                             │
│                                                                 │
│ - buildConversationHistory(): string                            │
│   // 构建对话历史上下文                                          │
├─────────────────────────────────────────────────────────────────┤
│ ConversationResult 返回结构:                                     │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ updatedProfile: Partial<UserProfile>                        │ │
│ │ reply: string              // 回复内容                      │ │
│ │ stage: ConversationStage   // 下一阶段                       │ │
│ │ shouldSearch: boolean      // 是否触发搜索                   │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘'''
    add_code_block(doc, code)
    
    doc.add_paragraph()
    
    # matching-agent
    add_heading_with_style(doc, 'matching-agent.ts 匹配Agent', 3)
    
    code = '''┌─────────────────────────────────────────────────────────────┐
│               matching-agent.ts (匹配Agent)                          │
├─────────────────────────────────────────────────────────────────┤
│ 主要功能: 根据用户需求匹配房产，计算匹配度得分                         │
├─────────────────────────────────────────────────────────────────┤
│ 权重配置:                                                        │
│ ┌─────────────────────────────────────────────────────────────┐   │
│ │ const MATCH_WEIGHTS = {                                    │   │
│ │   area: 30,    // 区域权重                                  │   │
│ │   price: 25,  // 价格权重                                  │   │
│ │   bedrooms: 25,  // 卧室数权重                             │   │
│ │   special: 20   // 特殊要求权重                             │   │
│ │ };                                                         │   │
│ └─────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│ 公开方法:                                                        │
│ ─────────────────────────────────────────────────────────────────│
│ + matchProperties(profile: Partial<UserProfile>): ScoredProperty[]
│   // 主方法：匹配房产并返回评分后的列表                           │
│                                                                 │
│ + getPropertyById(propertyId: string): ScoredProperty           │
│   // 根据ID获取单个房产                                          │
│                                                                 │
│ + generateMatchSummary(                                         │
│     scoredProperty: ScoredProperty,                             │
│     profile: Partial<UserProfile>                               │
│   ): string                                                     │
│   // 生成匹配摘要说明                                            │
├─────────────────────────────────────────────────────────────────┤
│ 私有评分方法:                                                    │
│ ─────────────────────────────────────────────────────────────────│
│ - calculateAreaScore(property: Property, profile): number        │
│   // 计算区域匹配度（考虑相邻区域）                               │
│                                                                 │
│ - calculatePriceScore(property: Property, profile): number      │
│   // 计算价格合理性（在预算范围内满分）                           │
│                                                                 │
│ - calculateBedroomScore(property: Property, profile): number     │
│   // 计算卧室数匹配度                                            │
│                                                                 │
│ - calculateSpecialScore(property: Property, profile): number     │
│   // 计算特殊要求匹配度（宠物、停车、交通）                       │
└─────────────────────────────────────────────────────────────────┘'''
    add_code_block(doc, code)
    
    doc.add_paragraph()
    
    # map-agent
    add_heading_with_style(doc, 'map-agent.ts 地图Agent', 3)
    
    code = '''┌─────────────────────────────────────────────────────────────┐
│                  map-agent.ts (地图Agent)                            │
├─────────────────────────────────────────────────────────────────┤
│ 主要功能: 通过OpenStreetMap API获取周边设施信息并评分                 │
├─────────────────────────────────────────────────────────────────┤
│ API配置:                                                         │
│ ┌─────────────────────────────────────────────────────────────┐   │
│ │ const OVERPASS_API = 'https://overpass-api.de/api/'         │   │
│ │ // 使用Overpass API查询OSM数据                                │   │
│ └─────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│ 公开方法:                                                        │
│ ─────────────────────────────────────────────────────────────────│
│ + calculateMapScores(property: Property): Promise<{              │
│     parkScore: number,                                          │
│     busScore: number,                                           │
│     trainScore: number,                                        │
│     mapScore: number,                                          │
│     nearbyParks: POI[],                                        │
│     nearbyBusStops: POI[],                                     │
│     nearbyTrainStations: POI[]                                 │
│   }>                                                            │
│   // 计算单个房产的地图评分                                       │
│                                                                 │
│ + calculateMapScoresForProperties(                              │
│     properties: Property[]                                      │
│   ): Promise<ScoredProperty[]>                                  │
│   // 批量计算多个房产的地图评分                                   │
│                                                                 │
│ + formatPOISummary(...): string                                 │
│   // 格式化POI摘要                                              │
│                                                                 │
│ + getScoreBreakdown(property): {category, score, icon}[]        │
│   // 获取评分详情                                                │
├─────────────────────────────────────────────────────────────────┤
│ 私有方法:                                                        │
│ ─────────────────────────────────────────────────────────────────│
│ - findParks(lat, lng, radius): Promise<POI[]>                    │
│   // 查询附近公园（默认500米范围）                                │
│                                                                 │
│ - findBusStops(lat, lng, radius): Promise<POI[]>                 │
│   // 查询附近公交站（默认300米范围）                              │
│                                                                 │
│ - findTrainStations(lat, lng, radius): Promise<POI[]>           │
│   // 查询附近火车站（默认800米范围）                              │
│                                                                 │
│ - calculateDistance(lat1, lon1, lat2, lon2): number              │
│   // Haversine公式计算距离                                       │
└─────────────────────────────────────────────────────────────────┘'''
    add_code_block(doc, code)
    
    doc.add_paragraph()
    
    # document-agent
    add_heading_with_style(doc, 'document-agent.ts 护照识别Agent', 3)
    
    code = '''┌─────────────────────────────────────────────────────────────┐
│              document-agent.ts (护照识别Agent)                        │
├─────────────────────────────────────────────────────────────────┤
│ 主要功能: 使用Gemini Vision API识别护照信息                         │
├─────────────────────────────────────────────────────────────────┤
│ 公开方法:                                                        │
│ ─────────────────────────────────────────────────────────────────│
│ + extractPassportInfo(imageBase64: string): Promise<PassportInfo>
│   // 主方法：提取护照信息（优先使用API，回退到模拟数据）            │
│                                                                 │
│ + extractPassportInfoWithGemini(                                 │
│     imageBase64: string,                                        │
│     apiKey: string                                              │
│   ): Promise<PassportInfo>                                      │
│   // 使用Gemini Vision API进行识别                               │
│                                                                 │
│ + validatePassportInfo(info: PassportInfo): {                    │
│     valid: boolean,                                             │
│     errors: string[]                                            │
│   }                                                             │
│   // 验证护照信息有效性                                          │
│                                                                 │
│ + formatPassportSummary(info: PassportInfo): string              │
│   // 格式化护照摘要                                             │
├─────────────────────────────────────────────────────────────────┤
│ Gemini API提示词关键逻辑:                                         │
│ ─────────────────────────────────────────────────────────────────│
│ 1. 首先判断是否为护照（检查是否为旅行证件）                        │
│ 2. 如果不是护照，返回错误提示                                      │
│ 3. 如果是护照，提取:                                             │
│    - Full Name (姓名)                                           │
│    - Passport Number (护照号)                                   │
│    - Nationality (国籍)                                         │
│    - Date of Birth (出生日期)                                   │
│    - Expiry Date (有效期)                                       │
└─────────────────────────────────────────────────────────────────┘'''
    add_code_block(doc, code)
    
    doc.add_paragraph()
    
    # communication-agent
    add_heading_with_style(doc, 'communication-agent.ts 通讯Agent', 3)
    
    code = '''┌─────────────────────────────────────────────────────────────┐
│            communication-agent.ts (通讯Agent)                        │
├─────────────────────────────────────────────────────────────────┤
│ 主要功能: 生成标准化租赁申请，格式化输出用于房东沟通                 │
├─────────────────────────────────────────────────────────────────┤
│ 公开方法:                                                        │
│ ─────────────────────────────────────────────────────────────────│
│ + generateApplication(                                           │
│     userProfile: UserProfile,                                    │
│     passportInfo: PassportInfo,                                   │
│     selectedProperty: ScoredProperty,                            │
│     additionalNotes: string = ''                                  │
│   ): RentalApplication                                          │
│   // 生成完整租赁申请                                            │
│                                                                 │
│ + formatApplicationForDisplay(app): ApplicationForm              │
│   // 格式化申请用于UI展示                                        │
│                                                                 │
│ + generateLandlordMessage(app): string                           │
│   // 生成房东消息（带格式）                                      │
│                                                                 │
│ + generateApplicationSummary(app): {label, value, icon}[]         │
│   // 生成摘要列表                                                │
│                                                                 │
│ + generatePlainTextApplication(app): string                       │
│   // 生成纯文本申请（用于复制）                                   │
│                                                                 │
│ + generateContactMessage(app): string                            │
│   // 生成WhatsApp/Email链接                                      │
└─────────────────────────────────────────────────────────────────┘'''
    add_code_block(doc, code)
    
    doc.add_page_break()
    
    # ==================== 3. 对象图 ====================
    add_heading_with_style(doc, '3. 对象图 (Object Diagram)', 1)
    
    add_paragraph_with_font(doc, '''对象图展示了系统在运行时创建的具体实例，显示了类的实例化结果和数据结构。''')
    
    # 3.1 用户会话实例
    add_heading_with_style(doc, '3.1 用户会话实例', 2)
    
    add_paragraph_with_font(doc, '当用户"张三"完成找房流程后，系统中的主要实例如下：')
    
    code = '''┌─────────────────────────────────────────────────────────────────────────────┐
│                          chatInterfaceInstance                                     │
│                           ChatInterface 实例                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  state: SystemState                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │ conversationStage: "SHOWING_RESULTS"                                     │  │
│  │                                                                      │  │
│  │ userProfile: UserProfile实例                                          │  │
│  │ ┌───────────────────────────────────────────────────────────────────┐ │  │
│  │ │ name: "张三"                                                     │ │  │
│  │ │ contact: "zhang@example.com"                                     │ │  │
│  │ │ budget: { min: 400, max: 600 }                                   │ │  │
│  │ │ preferredAreas: ["Newtown", "Surry Hills"]                        │ │  │
│  │ │ bedrooms: 2                                                      │ │  │
│  │ │ moveInDate: "ASAP"                                               │ │  │
│  │ │ specialRequirements: ["Pet Friendly", "Near Transport"]            │ │  │
│  │ └───────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                      │  │
│  │ selectedProperty: ScoredProperty实例 (prop-009)                       │  │
│  │ isProcessing: false                                                   │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                               │
│  matchedProperties: ScoredProperty[] (共5个匹配房产)                             │
│  selectedProperty: ScoredProperty实例                                           │
│  showPassportUpload: false                                                      │
│  showApplication: false                                                        │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘'''
    add_code_block(doc, code)
    
    doc.add_page_break()
    
    # 3.2 房产匹配实例
    add_heading_with_style(doc, '3.2 房产匹配实例', 2)
    
    add_paragraph_with_font(doc, 'matchedProperties数组中的前两个实例：')
    
    code = '''┌─────────────────────────────────────────────────────────────────────────────┐
│                     matchedProperties: ScoredProperty[]                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  [0] : ScoredProperty                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │ id: "prop-009"                                                        │  │
│  │ address: "89 Erskineville Road"                                       │  │
│  │ suburb: "Newtown"                                                     │  │
│  │ price: 550                                                           │  │
│  │ bedrooms: 2, bathrooms: 1, parking: 1                                │  │
│  │ lat: -33.8960, lng: 151.1820                                        │  │
│  │ features: ["Renovated", "Close to Station", "Pet Friendly"]            │  │
│  │                                                                        │  │
│  │ 评分详情:                                                             │  │
│  │ ┌─────────────────────────────────────────────────────────────────┐ │  │
│  │ │ matchScore: 92  // 区域30 + 价格25 + 卧室25 + 特殊12 = 92       │ │  │
│  │ │ mapScore: 78    // 公园20% + 公交25% + 火车55%                  │ │  │
│  │ │ parkScore: 75   // 2个公园，最远420米                           │ │  │
│  │ │ busScore: 85    // 多公交站，覆盖良好                           │ │  │
│  │ │ trainScore: 74   // Erskineville站 180米                        │ │  │
│  │ │ priceScore: 100  // 在预算400-600范围内                         │ │  │
│  │ │ totalScore: 85   // 匹配40%×92 + 地图40%×78 + 价格20%×100 = 85 │ │  │
│  │ └─────────────────────────────────────────────────────────────────┘ │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                               │
│  [1] : ScoredProperty                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │ id: "prop-005"                                                        │  │
│  │ address: "42 Crown Street"                                           │  │
│  │ suburb: "Surry Hills"                                                │  │
│  │ price: 620, bedrooms: 2                                               │  │
│  │ matchScore: 88, mapScore: 82, totalScore: 83                         │  │
│  │ features: ["Courtyard", "Pet Friendly", "Close to Oxford Street"]     │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘'''
    add_code_block(doc, code)
    
    doc.add_paragraph()
    
    # 3.3 护照验证实例
    add_heading_with_style(doc, '3.3 护照验证实例', 2)
    
    code = '''┌─────────────────────────────────────────────────────────────────────────────┐
│                          passportInfoInstance                                       │
│                           PassportInfo 实例                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  passportInfo: PassportInfo                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │ fullName: "John Smith"                                                │  │
│  │ passportNumber: "PA1234567"                                           │  │
│  │ nationality: "Australian"                                             │  │
│  │ dateOfBirth: "1990-05-15"                                           │  │
│  │ expiryDate: "2030-05-15"                                             │  │
│  │ confidence: 0.95  // 95%识别置信度                                     │  │
│  │ verified: true    // 已验证通过                                        │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘'''
    add_code_block(doc, code)
    
    doc.add_paragraph()
    
    # 3.4 对话状态机
    add_heading_with_style(doc, '3.4 对话状态机实例', 2)
    
    add_paragraph_with_font(doc, '状态机控制对话流程，从GREETING到COMPLETE：')
    
    code = '''┌─────────────────────────────────────────────────────────────────────────────┐
│                       ConversationStateMachine                                      │
│                           系统状态机实例                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  当前阶段: SHOWING_RESULTS                                                      │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                         │  │
│  │   GREETING ──► COLLECTING_BASIC_INFO ──► COLLECTING_BUDGET             │  │
│  │      │               │                    │                             │  │
│  │      │ 用户输入       │ 用户输入           │ 用户输入                     │  │
│  │      │               │                    ▼                             │  │
│  │      │               │               COLLECTING_LOCATION               │  │
│  │      │               │                    │                             │  │
│  │      │               │                    │ 用户输入                     │  │
│  │      │               │                    ▼                             │  │
│  │      │               │               COLLECTING_BEDROOMS                │  │
│  │      │               │                    │                             │  │
│  │      │               │                    │ 用户输入                     │  │
│  │      │               │                    ▼                             │  │
│  │      │               │               COLLECTING_MOVE_DATE               │  │
│  │      │               │                    │                             │  │
│  │      │               │                    │ 用户输入                     │  │
│  │      │               │                    ▼                             │  │
│  │      │               │               COLLECTING_SPECIAL                  │  │
│  │      │               │                    │                             │  │
│  │      │               │                    │ 用户输入                     │  │
│  │      │               │                    ▼                             │  │
│  │      │               │          ┌──────────────────┐                    │  │
│  │      │               │          │   SEARCH         │                    │  │
│  │      │               │          │   (触发搜索)      │                    │  │
│  │      │               │          └────────┬─────────┘                    │  │
│  │      │               │                   │                              │  │
│  │      │               │                   ▼                              │  │
│  │      │               │          ┌──────────────────┐                    │  │
│  │      │               │          │ SHOWING_RESULTS  │ ◄── 当前阶段       │  │
│  │      │               │          │   (展示结果)      │                    │  │
│  │      │               │          └────────┬─────────┘                    │  │
│  │      │               │                   │                              │  │
│  │      │               │                   │ 用户选择房产                    │  │
│  │      │               │                   ▼                              │  │
│  │      │               │          ┌──────────────────┐                    │  │
│  │      │               │          │ AWAITING_PASSPORT│                    │  │
│  │      │               │          │   (等待护照)      │                    │  │
│  │      │               │          └────────┬─────────┘                    │  │
│  │      │               │                   │                              │  │
│  │      │               │                   │ 上传护照                      │  │
│  │      │               │                   ▼                              │  │
│  │      │               │          ┌──────────────────┐                    │  │
│  │      │               │          │GENERATING_       │                    │  │
│  │      │               │          │APPLICATION       │                    │  │
│  │      │               │          │  (生成申请)       │                    │  │
│  │      │               │          └────────┬─────────┘                    │  │
│  │      │               │                   │                              │  │
│  │      │               │                   │ 提交申请                    │  │
│  │      │               │                   ▼                              │  │
│  │      │               └──────────► COMPLETE                               │  │
│  │      │                          (完成)                                   │  │
│  │      │                                                                  │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘'''
    add_code_block(doc, code)
    
    doc.add_page_break()
    
    # ==================== 4. 系统工作流程 ====================
    add_heading_with_style(doc, '4. 系统工作流程', 1)
    
    add_paragraph_with_font(doc, '完整租房流程的时序图：')
    
    code = '''┌─────────────────────────────────────────────────────────────────────────────┐
│                          完整租房流程时序图                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  用户        ChatInterface      conversation      matching       map        │
│                │                   agent           agent        agent       │
│                │                     │               │            │         │
│  │─────────────│                     │               │            │         │
│  │ 用户输入    │                     │               │            │         │
│  │ "张三,预算500│                     │               │            │         │
│  │  想住newtown"│                     │               │            │         │
│  │─────────────►│                    │               │            │         │
│                │                     │               │            │         │
│                │  processUserMessage │               │            │         │
│                │────────────────────►│               │            │         │
│                │                     │               │            │         │
│                │                     │ 检查API Key   │            │         │
│                │                     │──┐            │            │         │
│                │                     │  │ (有Key)     │            │         │
│                │                     │◄─┘            │            │         │
│                │                     │               │            │         │
│                │                     │ 调用Gemini    │            │         │
│                │                     │──────────────│            │         │
│                │                     │               │            │         │
│                │  返回: 更新资料+阶段 │               │            │         │
│                │◄────────────────────│               │            │         │
│                │                     │               │            │         │
│                │  shouldSearch=true  │               │            │         │
│                │                     │               │            │         │
│                │  matchProperties    │               │            │         │
│                │────────────────────────────────────►│            │         │
│                │                     │               │            │         │
│                │                     │  返回匹配列表  │            │         │
│                │◄────────────────────────────────────│            │         │
│                │                     │               │            │         │
│                │  calculateMapScoresForProperties    │            │         │
│                │────────────────────────────────────────────────►│         │
│                │                     │               │            │         │
│                │                     │               │    查询OSM API│
│                │                     │               │    (公园/公交/火车)│
│                │                     │               │            │         │
│                │  返回带地图评分的房产列表│            │            │         │
│                │◄────────────────────────────────────────────────│         │
│                │                     │               │            │         │
│                │ 显示匹配结果卡片      │               │            │         │
│                │══════════════════════│               │            │         │
│                │                     │               │            │         │
│  │─────────────│                     │               │            │         │
│  │ 选择房产    │                     │               │            │         │
│  │ prop-009   │                     │               │            │         │
│  │─────────────►│                    │               │            │         │
│                │                     │               │            │         │
│                │ 显示护照上传弹窗      │               │            │         │
│                │══════════════════════│               │            │         │
│                │                     │               │            │         │
│  │─────────────│                     │               │            │         │
│  │ 上传护照    │                     │               │            │         │
│  │─────────────►│                    │               │            │         │
│                │                     │               │            │         │
│                │  extractPassportInfo│               │            │         │
│                │──────────────────────────────────────────────────│►        │
│                │                     │               │            │         │
│                │                     │               │     Gemini Vision│
│                │                     │               │        识别护照  │
│                │  返回护照信息        │               │            │         │
│                │◄──────────────────────────────────────────────────│        │
│                │                     │               │            │         │
│                │ 显示申请表           │               │            │         │
│                │══════════════════════│               │            │         │
│                │                     │               │            │         │
│  │─────────────│                     │               │            │         │
│  │ 提交申请    │                     │               │            │         │
│  │─────────────►│                    │               │            │         │
│                │                     │               │            │         │
│                │  generateApplication│               │            │         │
│                │═══════════════════════════════════════════════════│         │
│                │                     │               │            │         │
│                │ 完成提示            │               │            │         │
│                │══════════════════════│               │            │         │
│                │                     │               │            │         │
└─────────────────────────────────────────────────────────────────────────────┘'''
    add_code_block(doc, code)
    
    doc.add_page_break()
    
    # ==================== 5. 类之间的关系 ====================
    add_heading_with_style(doc, '5. 类之间的关系', 1)
    
    add_paragraph_with_font(doc, '系统中各类之间的关系总结：')
    
    # 关系表
    headers = ['关系类型', '源类', '目标类', '说明']
    rows = [
        ['依赖 (uses)', 'ChatInterface', 'conversation-agent', '调用processUserMessageWithLLM'],
        ['依赖 (uses)', 'ChatInterface', 'matching-agent', '调用matchProperties'],
        ['依赖 (uses)', 'ChatInterface', 'map-agent', '调用calculateMapScoresForProperties'],
        ['依赖 (uses)', 'PassportUpload', 'document-agent', '调用extractPassportInfo'],
        ['依赖 (uses)', 'ApplicationForm', 'communication-agent', '调用generateApplication'],
        ['依赖 (uses)', 'PropertyCard', 'map-agent', '调用getScoreBreakdown'],
        ['依赖 (uses)', 'matching-agent', 'properties', '导入房产数据'],
        ['依赖 (uses)', 'map-agent', 'properties', '获取房产位置'],
        ['依赖 (uses)', 'communication-agent', 'document-agent', '调用formatPassportSummary'],
        ['继承 (extends)', 'ScoredProperty', 'Property', '继承所有属性并添加评分字段'],
        ['实现 (contains)', 'ChatInterface', 'Message[]', '包含消息数组'],
        ['实现 (contains)', 'ChatInterface', 'SystemState', '包含系统状态'],
    ]
    
    add_table_with_style(doc, headers, rows)
    
    doc.add_paragraph()
    
    # 关系说明图
    add_heading_with_style(doc, '依赖关系图', 2)
    
    code = '''┌─────────────────────────────────────────────────────────────────────────────┐
│                           依赖关系图 (Dependencies)                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│                                    ┌──────────────────┐                        │
│                                    │ conversation-     │                        │
│                                    │ agent.ts         │                        │
│                                    │                  │                        │
│                                    │ • 智能对话处理    │                        │
│                                    │ • 需求采集       │                        │
│                                    │ • LLM集成       │                        │
│                                    └────────┬─────────┘                        │
│                                             │                                  │
│  ┌──────────────────┐                      │ 依赖                               │
│  │ ChatInterface    │◄─────────────────────┘                                   │
│  │ components/      │                                                             │
│  └────────┬─────────┘                                                             │
│           │                                                                       │
│           │ 依赖                    ┌──────────────────┐                          │
│           ├───────────────────────►│ matching-agent   │                          │
│           │                       │ lib/             │                          │
│           │                       │                  │                          │
│           │                       │ • 房产匹配       │                          │
│           │                       │ • 评分计算       │                          │
│           │                       └────────┬─────────┘                          │
│           │                                │                                    │
│           │                                │ 依赖                                │
│           │                                ▼                                    │
│           │                       ┌──────────────────┐                        │
│           │                       │ properties.ts    │                          │
│           │                       │ lib/             │                          │
│           │                       │                  │                          │
│           │                       │ • 28个租房数据    │                          │
│           │                       └──────────────────┘                        │
│           │                                                                       │
│           │                                                                       │
│           │ 依赖                    ┌──────────────────┐                        │
│           ├───────────────────────►│ map-agent        │                        │
│           │                       │ lib/             │                          │
│           │                       │                  │                          │
│           │                       │ • 地图评分       │                          │
│           │                       │ • OSM API查询    │                          │
│           │                       └──────────────────┘                        │
│           │                                                                       │
│           │                                                                       │
│           │ 依赖                    ┌──────────────────┐                        │
│           ├───────────────────────►│ document-agent   │                          │
│           │                       │ lib/             │                          │
│           │                       │                  │                          │
│           │                       │ • 护照识别       │                          │
│           │                       │ • Gemini Vision  │                          │
│           │                       └──────────────────┘                        │
│           │                                                                       │
│           │ 依赖                    ┌──────────────────┐                        │
│           └───────────────────────►│ communication-   │                        │
│                                   │ agent            │                        │
│                                   │ lib/             │                        │
│                                   │                  │                        │
│                                   │ • 申请生成       │                        │
│                                   │ • 格式化输出     │                        │
│                                   └──────────────────┘                        │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘'''
    add_code_block(doc, code)
    
    # ==================== 保存文档 ====================
    doc.save('HomeMatch_AI_Class_Object_Diagrams.docx')
    print('文档已生成: HomeMatch_AI_Class_Object_Diagrams.docx')

if __name__ == '__main__':
    create_homematch_document()
