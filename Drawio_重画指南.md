# ELEC5620 Stage 1 — Draw.io 重画指南

> 参考用，按你的理解自由发挥。**不要照搬！**

## 🎨 统一配色（5 Agents）

| Agent | 颜色 | 用途 |
|-------|------|------|
| 🤖 Conversation | 蓝 `#4287F5` | Member A |
| 🎯 Matching | 橙 `#FF9933` | Member B |
| 📄 Document | 绿 `#33CC66` | Member C |
| 🗺️ Map | 紫 `#9966CC` | Member D |
| 📬 Communication | 红 `#E74C3C` | Member E |
| 中央协调 | 灰 `#666666` | Orchestrator |

---

## 📐 24 张图清单

### 必做 16 张

| # | 图名 | 类型 | 复杂度 | 建议起始 |
|---|------|------|--------|----------|
| 1 | Ad Hoc Overview | 总览框图 | ⭐⭐ | 简单方框+箭头 |
| 2 | Feature Diagram | 树状/分层 | ⭐⭐ | 根节点+子节点 |
| 3 | Use Case Overall | 用例图 | ⭐⭐⭐ | 椭圆+小人 |
| 4 | Class Diagram | 类图 | ⭐⭐⭐⭐⭐ | **最重要！** |
| 5 | Object Diagram | 对象图 | ⭐⭐⭐ | Class 实例化 |
| 6 | Collaboration Diagram | 协作图 | ⭐⭐⭐ | 类似 Sequence |
| 7-12 | Activity × 6 | 活动图 | ⭐⭐ | 流程图风格 |
| 13-17 | Sequence × 5 | 顺序图 | ⭐⭐ | Lifeline+消息 |
| 18-22 | State Machine × 5 | 状态机 | ⭐⭐ | 圆角矩形+箭头 |

### 可选 8 张（加分）

| # | 图名 | 类型 |
|---|------|------|
| 23 | Package Diagram | 包图 |
| 24 | Deployment Diagram | 部署图 |
| 6+ | Architecture 4+1 View | 多视图 |

---

## 🎯 第 1 步：Class Diagram（最重要）

### 必画的 5 个核心类
- `ConversationAgent`
- `MatchingAgent`
- `DocumentAgent`
- `MapAgent`
- `CommunicationAgent`

### 必画的辅助类（自由发挥）
- 用户相关：`User`, `BuyerProfile`, `Preferences`
- 房源相关：`Property`, `Listing`, `MatchScore`
- 文档相关：`Document`, `Passport`, `Verification`
- 地图相关：`Map`, `POI`, `Location`
- 通信相关：`Message`, `Email`, `Application`

### 关联关系建议
- Agent ↔ Agent：**依赖**（虚线箭头）
- Agent ↔ 数据类：**关联**（实线）
- 聚合/组合：根据实际语义判断（实心菱形=组合，空心菱形=聚合）
- 继承：抽象基类 `Agent` → 5 个具体 Agent
- 接口：`IAgent` 接口 → 5 个 Agent 实现

---

## 🎯 第 2 步：Use Case Overall

### 必有的 Actor（系统边界外）
- `HomeBuyer`（主用户）
- `Real Estate Agent`（中介/卖家）
- `Admin`（系统管理员）

### 必有的 Use Case（椭圆）
1. **用户相关**
   - Register/Login
   - Set Preferences
   - Chat with Conversation Agent
2. **匹配相关**
   - Search Properties
   - Get Match Score
   - View Recommendations
3. **文档相关**
   - Upload Document
   - Verify Passport
4. **地图相关**
   - View Property on Map
   - Find Nearby POIs
5. **通信相关**
   - Generate Application
   - Send Email to Agent

### 系统边界
画一个大方框把所有 Use Case 包起来，框外放 Actor。

---

## 🎯 第 3 步：Feature Diagram

### 树状结构
```
[HomeMatch AI System]
├── [Conversation Features]
│   ├── Natural Language Chat
│   ├── Typo Correction
│   └── Intent Recognition
├── [Matching Features]
│   ├── Score-based Ranking
│   ├── Multi-criteria Filter
│   └── Personalization
├── [Document Features]
│   ├── Passport OCR
│   └── Verification Status
├── [Map Features]
│   ├── POI Search
│   └── Route Planning
└── [Communication Features]
    ├── Application Auto-fill
    └── Email Generation
```

---

## 🎯 第 4 步：Ad Hoc Diagram（自由发挥）

### 推荐结构
- 中心：`User (Homebuyer)`
- 周围 5 个 Agent（用配色区分）
- 底部/旁边：`Orchestrator` 协调所有 Agent
- 数据库图标（云/桶）放在底部
- 箭头表示数据流向

---

## 🎯 第 5 步：Object Diagram

### 用 Class Diagram 的类，实例化
例如：
- `user1: User` (name="Alice")
- `property1: Property` (id=123, price=850k)
- `match1: MatchScore` (score=92)

### 链（Link）连接对象
- 用实线，不用箭头
- 可以标多重性：`1`, `*`, `0..1`

---

## 🎯 第 6 步：Collaboration Diagram（Communication Diagram）

### 元素
- 矩形 = Object
- 带编号的箭头 = Message（`1: login()`, `2: verify()`）

### 布局建议
- 围绕一个中心对象（如 `orchestrator: Orchestrator`）
- 其他对象围绕在四周
- 数字标明消息顺序

---

## 🎯 第 7-12 步：Activity Diagrams（6 张，每人至少 1 张）

### 通用元素
- **实心圆** = Initial Node
- **空心圆+×** = Final Node
- **圆角矩形** = Action
- **菱形** = Decision
- **粗横条** = Fork / Join
- **泳道（可选）**：按 Agent 或角色分列

### 建议每张图的内容

| 张 | Agent | 主题 |
|----|-------|------|
| 1 | Conversation | 处理用户对话流程 |
| 2 | Conversation | 拼写纠正 |
| 3 | Matching | 评分算法 |
| 4 | Document | 护照验证 |
| 5 | Map | POI 评分 |
| 6 | Communication | 申请生成 |

---

## 🎯 第 13-17 步：Sequence Diagrams（5 张，每人至少 1 张）

### 元素
- 顶部方框 = Object（每人一列）
- 下方虚线 = Lifeline
- 窄矩形 = Activation
- 实线箭头 = 同步消息
- 虚线箭头 = 返回消息

### 每张图建议

| 张 | Agent | 场景 |
|----|-------|------|
| 1 | Document | 护照验证流程 |
| 2 | Map | POI 查询 |
| 3 | Matching | 评分工作流 |
| 4 | Communication | 申请提交 |
| 5 | Conversation | LLM/Rules 处理 |

---

## 🎯 第 18-22 步：State Machines（5 张，每人至少 1 张）

### 元素
- 圆角矩形 = State
- 实心圆 = Initial
- 双圆 = Final
- 箭头 + label = Transition（如 `[clicked] / goto X`）

### 每张图建议

| 张 | Agent | 状态 |
|----|-------|------|
| 1 | Conversation | 对话流（Idle → Listening → Processing → Responding） |
| 2 | Document | 验证流（Pending → Validating → Verified / Rejected） |
| 3 | Communication | 申请流（Drafting → Sent → Acknowledged → Archived） |
| 4 | Matching | 匹配流（Searching → Scoring → Ranking → Completed） |
| 5 | Map | POI 流（Querying → Fetching → Cached / Failed） |

---

## 🎯 加分图（可选）

### Package Diagram
- 顶层包：`com.homematch`
- 子包：`agent`, `model`, `service`, `repository`, `controller`, `config`
- 用依赖箭头连接

### Deployment Diagram
- 节点：Web Browser, Mobile App, App Server, Database, External API
- 显示硬件和软件组件部署

### 4+1 View Architecture
- Logical View：类图
- Process View：活动图/序列图
- Physical View：部署图
- Development View：包图
- Scenarios：Use Case 图

---

## 🛠 Draw.io 操作技巧

### 快捷键
- `Ctrl+D`：复制
- `Ctrl+G`：组合
- `Ctrl+Shift+G`：解组
- `F2`：编辑文字
- `Ctrl+滚轮`：缩放

### 美化技巧
1. **对齐**：选中多个 → `Arrange → Align`
2. **统一大小**：选中 → `Arrange → Distribute`
3. **网格**：View → Grid（开启）
4. **导出**：File → Export as → PNG（高 DPI）

### 推荐导出设置
- 格式：PNG 或 SVG
- DPI：300（高清打印）
- 边框：选 Transparent
- 尺寸：A4 适应

---

## ✅ 自检清单

每张图画完后问自己：

- [ ] 颜色是否和对应 Agent 匹配？
- [ ] 文字是否清晰易读？
- [ ] 箭头方向是否正确？
- [ ] 关联类型是否准确（聚合/组合/依赖）？
- [ ] 有没有多余的线或重叠？
- [ ] 导出 PNG 后是否清晰？
- [ ] 在 Report 中替换原 Mermaid 图了吗？

---

## 📝 命名规范建议

### 文件命名
```
fig-01-adhoc.png
fig-02-feature.png
fig-03-usecase-overall.png
fig-04-class-diagram.png
fig-05-object.png
fig-06-collaboration.png
fig-07-activity-conversation.png
fig-08-activity-typo.png
...
fig-13-sequence-passport.png
...
fig-18-state-conversation.png
...
fig-23-package.png
fig-24-deployment.png
```

### 存放位置
```
C:\Users\18021\Desktop\Assignment1\images\
```

---

## 🚀 建议工作流

### 单人流程
1. 打开 Draw.io → File → New
2. 选模板（UML / Flowchart）
3. 拖拽组件，编辑文字
4. 调整颜色、字体（推荐 11pt, Arial）
5. File → Export as → PNG → 保存到 `images/` 文件夹
6. 在 Report 里 `![Alt](images/fig-XX-name.png)` 替换原 Mermaid

### 协作流程
1. 每人负责自己 Agent 的图（Activity/Interaction/State）
2. 共同图（Class、Use Case Overall 等）**一个人画，其他人 review**
3. 文件命名加后缀避免冲突：`fig-04-class-diagram_v2_memberB.png`

---

## 💡 常见错误避免

| 错误 | 正确做法 |
|------|----------|
| 关联线交叉太多 | 重新布局，弯线连接 |
| 类图挤在一起 | 用子区域或子包分层 |
| Activity 没起止 | 必须有 Initial + Final |
| Sequence 没编号 | 消息加序号 `1`, `2`, `3` |
| State 转换没 label | 箭头必须标触发条件 |
| Use Case 没系统边界 | 画大方框圈住所有 UC |

---

## 🎁 Bonus 技巧

### 在 Draw.io 中插入中文
- 字体选：`Microsoft YaHei` 或 `SimSun`
- 字号：11pt
- 颜色：深色 `#333`

### 复用图形
- 画好一个常用符号（如 Agent 框），右键 → "Add to Library"
- 下次直接拖出来用

### 颜色库
- 选中元素 → 右侧 Format → Style → FillColor
- 用 16 进制或调色板

---

**最后：图要简洁清晰，每张图自己看一眼能不能 5 秒内看懂大意。如果太复杂就拆成多张！**
