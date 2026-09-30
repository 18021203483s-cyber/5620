# HomeMatch AI - Mermaid 类图和对象图

## 一、类图 (Class Diagram)

### 1.1 系统整体架构类图

```mermaid
%%{init: {'theme':'base', 'themeVariables': { 'primaryColor': '#4472C4', 'primaryTextColor': '#fff', 'primaryBorderColor': '#2F5496', 'lineColor': '#8C8C8C', 'secondaryColor': '#EDEDED', 'tertiaryColor': '#F5F5F5'}}}%%
classDiagram
    direction TB
    
    class ChatInterface {
        +Message[] messages
        +SystemState state
        +ScoredProperty[] matchedProperties
        +ScoredProperty selectedProperty
        +boolean showPassportUpload
        +boolean showApplication
        +PassportInfo passportInfo
        +boolean isTyping
        +handleSendMessage(input: string) Promise~void~
        +handlePropertySelect(property: ScoredProperty) void
        +handlePassportUpload(info: PassportInfo) void
        +handleSkipPassport() void
        +handleSubmitApplication() void
    }
    
    class MapView {
        +ScoredProperty[] properties
        +ScoredProperty selectedProperty
        +initMap() Promise~void~
        +updateMarkers() void
    }
    
    class PassportUpload {
        +File selectedFile
        +string preview
        +boolean isProcessing
        +string error
        +handleFileChange() void
        +handleDrop() void
        +handleUpload() Promise~void~
    }
    
    class ApplicationForm {
        +string additionalNotes
        +boolean isSubmitting
        +handleSubmit() Promise~void~
        +handleCopyToClipboard() Promise~void~
        +handleShareWhatsApp() void
        +handleShareEmail() void
    }
    
    class PropertyCard {
        +ScoredProperty property
        +boolean isSelected
        +onSelect() void
        +getScoreColor(score: number) string
        +getOverallBadgeColor(score: number) string
    }
    
    class ChatBubble {
        +Message message
    }
    
    class ChatInput {
        +string input
        +boolean disabled
        +handleSubmit() void
        +handleKeyDown() void
    }
    
    ChatInterface --> ChatBubble : contains
    ChatInterface --> ChatInput : uses
    ChatInterface --> MapView : uses
    ChatInterface --> PassportUpload : uses
    ChatInterface --> ApplicationForm : uses
    ChatInterface --> PropertyCard : uses
```

### 1.2 核心类型类图

```mermaid
%%{init: {'theme':'base', 'themeVariables': { 'primaryColor': '#70AD47', 'primaryTextColor': '#fff', 'primaryBorderColor': '#507E32', 'lineColor': '#8C8C8C', 'secondaryColor': '#EDEDED', 'tertiaryColor': '#F5F5F5'}}}%%
classDiagram
    direction TB
    
    class Message {
        +string id
        +MessageRole role
        +string content
        +Date timestamp
    }
    
    class MessageRole {
        <<enumeration>>
        USER : "user"
        AGENT : "agent"
        SYSTEM : "system"
    }
    
    class UserProfile {
        +string name
        +string contact
        +Budget budget
        +string[] preferredAreas
        +number bedrooms
        +string moveInDate
        +string[] specialRequirements
        +string[] transportationNeeds
    }
    
    class Budget {
        +number min
        +number max
    }
    
    class PassportInfo {
        +string fullName
        +string passportNumber
        +string nationality
        +string dateOfBirth
        +string expiryDate
        +number confidence
        +boolean verified
    }
    
    class Property {
        +string id
        +string address
        +string suburb
        +number price
        +number bedrooms
        +number bathrooms
        +number parking
        +number lat
        +number lng
        +string[] features
        +string imageUrl
        +string description
    }
    
    class ScoredProperty {
        +number matchScore
        +number mapScore
        +number parkScore
        +number busScore
        +number trainScore
        +number priceScore
        +number totalScore
    }
    
    class ConversationStage {
        <<enumeration>>
        GREETING : "问候"
        COLLECTING_BASIC_INFO : "采集基本信息"
        COLLECTING_BUDGET : "采集预算"
        COLLECTING_LOCATION : "采集区域"
        COLLECTING_BEDROOMS : "采集卧室数"
        COLLECTING_MOVE_DATE : "采集入住日期"
        COLLECTING_SPECIAL : "采集特殊要求"
        SEARCHING_PROPERTIES : "搜索房产"
        SHOWING_RESULTS : "展示结果"
        AWAITING_SELECTION : "等待选择"
        AWAITING_PASSPORT : "等待护照验证"
        GENERATING_APPLICATION : "生成申请"
        COMPLETE : "完成"
    }
    
    class SystemState {
        +ConversationStage conversationStage
        +UserProfile userProfile
        +PassportInfo passportInfo
        +Message[] messages
        +Property[] availableProperties
        +ScoredProperty[] matchedProperties
        +ScoredProperty selectedProperty
        +boolean isProcessing
    }
    
    class POI {
        +string name
        +POIType type
        +number lat
        +number lng
        +number distance
    }
    
    class POIType {
        <<enumeration>>
        PARK : "park"
        BUS_STOP : "bus_stop"
        TRAIN_STATION : "train_station"
    }
    
    Message --> MessageRole : role
    UserProfile --> Budget : budget
    ScoredProperty --|> Property : extends
    SystemState --> ConversationStage : conversationStage
    SystemState --> UserProfile : userProfile
    SystemState --> PassportInfo : passportInfo
    POI --> POIType : type
```

### 1.3 Agent层类图

```mermaid
%%{init: {'theme':'base', 'themeVariables': { 'primaryColor': '#ED7D31', 'primaryTextColor': '#fff', 'primaryBorderColor': '#C55A11', 'lineColor': '#8C8C8C', 'secondaryColor': '#EDEDED', 'tertiaryColor': '#F5F5F5'}}}%%
classDiagram
    direction TB
    
    class ConversationAgent {
        +processUserMessageWithLLM(message, profile, stage) Promise~ConversationResult~
        +processUserMessage(message, profile, stage) ConversationResult
        +generateProfileSummary(profile) string
        -processWithGemini(message, profile, stage) Promise~ConversationResult~
        -processWithSimpleRules(message, profile, stage) ConversationResult
        -buildConversationHistory(profile) string
    }
    
    class ConversationResult {
        +Partial~UserProfile~ updatedProfile
        +string reply
        +ConversationStage stage
        +boolean shouldSearch
    }
    
    class MatchingAgent {
        +matchProperties(profile) ScoredProperty[]
        +getPropertyById(id) ScoredProperty
        +generateMatchSummary(property, profile) string
        -calculateAreaScore(property, profile) number
        -calculatePriceScore(property, profile) number
        -calculateBedroomScore(property, profile) number
        -calculateSpecialScore(property, profile) number
    }
    
    class MapAgent {
        +calculateMapScores(property) Promise~MapScoreResult~
        +calculateMapScoresForProperties(properties) Promise~ScoredProperty[]~
        +formatPOISummary(parks, busStops, trains) string
        +getScoreBreakdown(property) ScoreItem[]
        -findParks(lat, lng, radius) Promise~POI[]~
        -findBusStops(lat, lng, radius) Promise~POI[]~
        -findTrainStations(lat, lng, radius) Promise~POI[]~
        -calculateParkScore(parks) number
        -calculateBusScore(busStops) number
        -calculateTrainScore(stations) number
        -calculateDistance(lat1, lon1, lat2, lon2) number
    }
    
    class MapScoreResult {
        +number parkScore
        +number busScore
        +number trainScore
        +number mapScore
        +POI[] nearbyParks
        +POI[] nearbyBusStops
        +POI[] nearbyTrainStations
    }
    
    class DocumentAgent {
        +extractPassportInfo(imageBase64) Promise~PassportInfo~
        +extractPassportInfoWithGemini(imageBase64, apiKey) Promise~PassportInfo~
        +validatePassportInfo(info) ValidationResult
        +formatPassportSummary(info) string
    }
    
    class ValidationResult {
        +boolean valid
        +string[] errors
    }
    
    class CommunicationAgent {
        +generateApplication(profile, passport, property, notes) RentalApplication
        +formatApplicationForDisplay(application) ApplicationForm
        +generateLandlordMessage(application) string
        +generateApplicationSummary(application) SummaryItem[]
        +generatePlainTextApplication(application) string
        +generateContactMessage(application) string
    }
    
    class RentalApplication {
        +UserProfile userProfile
        +PassportInfo passportInfo
        +ScoredProperty selectedProperty
        +string additionalNotes
        +Date submittedAt
    }
    
    class Properties {
        +Property[] properties
        +getPropertyById(id) Property
        +getPropertiesBySuburb(suburb) Property[]
        +getAllSuburbs() string[]
    }
    
    ConversationAgent ..> ConversationResult : returns
    ConversationAgent ..> UserProfile : uses
    MatchingAgent ..> ScoredProperty : returns
    MatchingAgent ..> Property : uses
    MapAgent ..> MapScoreResult : returns
    MapAgent ..> POI : uses
    DocumentAgent ..> PassportInfo : returns
    DocumentAgent ..> ValidationResult : returns
    CommunicationAgent ..> RentalApplication : returns
    CommunicationAgent ..> ApplicationForm : returns
    MatchingAgent --> Properties : uses
    MapAgent --> Properties : uses
```

### 1.4 完整依赖关系图

```mermaid
%%{init: {'theme':'base', 'themeVariables': { 'primaryColor': '#7030A0', 'primaryTextColor': '#fff', 'primaryBorderColor': '#4B0082', 'lineColor': '#8C8C8C', 'secondaryColor': '#EDEDED', 'tertiaryColor': '#F5F5F5'}}}%%
classDiagram
    direction TB
    
    %% UI层
    class ChatInterface
    class MapView
    class PassportUpload
    class ApplicationForm
    class PropertyCard
    
    %% 类型层
    class Message
    class UserProfile
    class PassportInfo
    class Property
    class ScoredProperty
    class SystemState
    class ConversationStage
    
    %% Agent层
    class ConversationAgent
    class MatchingAgent
    class MapAgent
    class DocumentAgent
    class CommunicationAgent
    class Properties
    
    %% 依赖关系
    ChatInterface ..> ConversationAgent : 依赖
    ChatInterface ..> MatchingAgent : 依赖
    ChatInterface ..> MapAgent : 依赖
    PassportUpload ..> DocumentAgent : 依赖
    ApplicationForm ..> CommunicationAgent : 依赖
    PropertyCard ..> MapAgent : 依赖
    MatchingAgent ..> Properties : 依赖
    MapAgent ..> Properties : 依赖
    CommunicationAgent ..> DocumentAgent : 依赖
    
    %% 继承关系
    ScoredProperty --|> Property : extends
    
    %% 包含关系
    ChatInterface ..> Message : contains
    ChatInterface ..> SystemState : contains
    ChatInterface ..> ScoredProperty : contains
    ChatInterface ..> PassportInfo : contains
```

---

## 二、对象图 (Object Diagram)

### 2.1 用户会话对象图

```mermaid
%%{init: {'theme':'base', 'themeVariables': { 'primaryColor': '#4472C4', 'primaryTextColor': '#fff', 'primaryBorderColor': '#2F5496', 'lineColor': '#8C8C8C', 'secondaryColor': '#EDEDED', 'tertiaryColor': '#F5F5F5'}}}%%
classDiagram
    direction TB
    
    class chatInterfaceInstance {
        <<ChatInterface>>
        state: SystemState = {...}
        messages: Message[] = [5条消息]
        matchedProperties: ScoredProperty[] = [5个房产]
        selectedProperty: ScoredProperty = prop-009
        showPassportUpload: boolean = false
        showApplication: boolean = false
    }
    
    class systemStateInstance {
        <<SystemState>>
        conversationStage: ConversationStage = SHOWING_RESULTS
        userProfile: UserProfile = {...}
        isProcessing: boolean = false
    }
    
    class userProfileInstance {
        <<UserProfile>>
        name: string = "张三"
        contact: string = "zhang@example.com"
        budget: Budget = {min: 400, max: 600}
        preferredAreas: string[] = ["Newtown", "Surry Hills"]
        bedrooms: number = 2
        moveInDate: string = "ASAP"
        specialRequirements: string[] = ["Pet Friendly", "Near Transport"]
    }
    
    class budgetInstance {
        <<Budget>>
        min: number = 400
        max: number = 600
    }
    
    chatInterfaceInstance --> systemStateInstance : state
    chatInterfaceInstance --> userProfileInstance : userProfile
    systemStateInstance --> userProfileInstance : userProfile
    userProfileInstance --> budgetInstance : budget
```

### 2.2 房产匹配对象图

```mermaid
%%{init: {'theme':'base', 'themeVariables': { 'primaryColor': '#70AD47', 'primaryTextColor': '#fff', 'primaryBorderColor': '#507E32', 'lineColor': '#8C8C8C', 'secondaryColor': '#EDEDED', 'tertiaryColor': '#F5F5F5'}}}%%
classDiagram
    direction TB
    
    class matchedPropertiesList {
        <<ScoredProperty[]>>
        [0] = prop-009实例
        [1] = prop-005实例
        [2] = prop-010实例
        [3] = prop-012实例
        [4] = prop-009备选实例
    }
    
    class prop009Instance {
        <<ScoredProperty>>
        id: string = "prop-009"
        address: string = "89 Erskineville Road"
        suburb: string = "Newtown"
        price: number = 550
        bedrooms: number = 2
        bathrooms: number = 1
        parking: number = 1
        lat: number = -33.8960
        lng: number = 151.1820
        features: string[] = ["Renovated", "Close to Station", "Pet Friendly"]
    }
    
    class prop009Scores {
        <<ScoredProperty内嵌>>
        matchScore: number = 92
        mapScore: number = 78
        parkScore: number = 75
        busScore: number = 85
        trainScore: number = 74
        priceScore: number = 100
        totalScore: number = 85
    }
    
    class prop005Instance {
        <<ScoredProperty>>
        id: string = "prop-005"
        address: string = "42 Crown Street"
        suburb: string = "Surry Hills"
        price: number = 620
        bedrooms: number = 2
        matchScore: number = 88
        mapScore: number = 82
        totalScore: number = 83
    }
    
    matchedPropertiesList --> prop009Instance : [0]
    matchedPropertiesList --> prop005Instance : [1]
    prop009Instance --> prop009Scores : 评分详情
```

### 2.3 护照验证对象图

```mermaid
%%{init: {'theme':'base', 'themeVariables': { 'primaryColor': '#ED7D31', 'primaryTextColor': '#fff', 'primaryBorderColor': '#C55A11', 'lineColor': '#8C8C8C', 'secondaryColor': '#EDEDED', 'tertiaryColor': '#F5F5F5'}}}%%
classDiagram
    direction TB
    
    class passportInfoInstance {
        <<PassportInfo>>
        fullName: string = "John Smith"
        passportNumber: string = "PA1234567"
        nationality: string = "Australian"
        dateOfBirth: string = "1990-05-15"
        expiryDate: string = "2030-05-15"
        confidence: number = 0.95
        verified: boolean = true
    }
    
    class applicationInstance {
        <<RentalApplication>>
        userProfile: UserProfile = {...}
        passportInfo: PassportInfo = passportInfoInstance
        selectedProperty: ScoredProperty = prop-009Instance
        additionalNotes: string = ""
        submittedAt: Date = 2026-09-14T10:30:00.000Z
    }
    
    applicationInstance --> passportInfoInstance : passportInfo
```

### 2.4 对话状态机对象图

```mermaid
%%{init: {'theme':'base', 'themeVariables': { 'primaryColor': '#7030A0', 'primaryTextColor': '#fff', 'primaryBorderColor': '#4B0082', 'lineColor': '#8C8C8C', 'secondaryColor': '#EDEDED', 'tertiaryColor': '#F5F5F5'}}}%%
classDiagram
    direction TB
    
    class currentStateInstance {
        <<ConversationStage>>
        current: ConversationStage = SHOWING_RESULTS
        description: string = "当前展示匹配结果，等待用户选择"
    }
    
    class stateHistory {
        <<ConversationStage[]>>
        [0] = GREETING (问候)
        [1] = COLLECTING_BASIC_INFO (采集姓名)
        [2] = COLLECTING_BUDGET (采集预算)
        [3] = COLLECTING_LOCATION (采集区域)
        [4] = COLLECTING_BEDROOMS (采集卧室)
        [5] = COLLECTING_MOVE_DATE (采集入住日期)
        [6] = COLLECTING_SPECIAL (采集特殊要求)
        [7] = SEARCHING_PROPERTIES (搜索房产)
        [8] = SHOWING_RESULTS (展示结果) ← 当前
    }
    
    class transitionLogic {
        <<状态转换规则>>
        GREETING → COLLECTING_BASIC_INFO: 用户首次输入
        COLLECTING_BASIC_INFO → COLLECTING_BUDGET: 获取姓名后
        COLLECTING_BUDGET → COLLECTING_LOCATION: 获取预算后
        COLLECTING_LOCATION → COLLECTING_BEDROOMS: 获取区域后
        COLLECTING_BEDROOMS → COLLECTING_MOVE_DATE: 获取卧室后
        COLLECTING_MOVE_DATE → COLLECTING_SPECIAL: 获取入住日期后
        COLLECTING_SPECIAL → SEARCHING_PROPERTIES: 获取特殊要求后
        SEARCHING_PROPERTIES → SHOWING_RESULTS: 匹配完成
        SHOWING_RESULTS → AWAITING_PASSPORT: 用户选择房产
        AWAITING_PASSPORT → GENERATING_APPLICATION: 护照上传完成
        GENERATING_APPLICATION → COMPLETE: 申请提交
    }
    
    currentStateInstance --> stateHistory : 状态历史
```

---

## 三、流程图 (补充)

### 3.1 系统工作流程图

```mermaid
%%{init: {'theme':'base', 'themeVariables': { 'primaryColor': '#4472C4', 'primaryTextColor': '#fff', 'primaryBorderColor': '#2F5496', 'lineColor': '#8C8C8C'}}}%%
flowchart TD
    subgraph 用户交互层
        A[用户输入] --> B{ChatInterface}
    end
    
    subgraph 对话处理
        B --> C{conversation-agent}
        C --> D{检查API Key}
        D -->|有Key| E[processWithGemini]
        D -->|无Key| F[processWithSimpleRules]
        E --> G[LLM处理]
        F --> H[规则引擎处理]
        G --> I[返回结果]
        H --> I
    end
    
    subgraph 房产匹配
        I -->|shouldSearch=true| J{matching-agent}
        J --> K[遍历28个房产]
        K --> L[计算各项评分]
        L --> M[matchScore]
        L --> N[priceScore]
        L --> O[specialScore]
        M --> P[综合评分排序]
        N --> P
        O --> P
    end
    
    subgraph 地图评分
        P --> Q{map-agent}
        Q --> R[查询Overpass API]
        R --> S[findParks 500m]
        R --> T[findBusStops 300m]
        R --> U[findTrainStations 800m]
        S --> V[parkScore]
        T --> W[busScore]
        U --> X[trainScore]
        V --> Y[mapScore]
        W --> Y
        X --> Y
    end
    
    subgraph 护照验证
        Y --> Z[返回ScoredProperty[]]
        Z --> AA[用户选择房产]
        AA --> BB{选择prop-009}
        BB -->|是| CC{PassportUpload}
        CC --> DD[用户上传护照]
        DD --> EE{document-agent}
        EE --> FF[extractPassportInfo]
        FF --> GG[PassportInfo]
    end
    
    subgraph 申请生成
        GG --> HH{ApplicationForm}
        HH --> II[用户补充信息]
        II --> JJ{communication-agent}
        JJ --> KK[generateApplication]
        KK --> LL[RentalApplication]
        LL --> MM[完成]
    end
    
    style A fill:#e1f5ff,stroke:#01579b
    style MM fill:#c8e6c9,stroke:#2e7d32
    style CC fill:#fff3e0,stroke:#ef6c00
```

### 3.2 Agent协作时序图

```mermaid
%%{init: {'theme':'base', 'themeVariables': { 'primaryColor': '#4472C4', 'primaryTextColor': '#fff', 'lineColor': '#8C8C8C'}}}%%
sequenceDiagram
    autonumber
    participant User as 用户
    participant CI as ChatInterface
    participant CA as ConversationAgent
    participant MA as MatchingAgent
    participant MPA as MapAgent
    participant DA as DocumentAgent
    participant ComA as CommunicationAgent
    
    User->>CI: 用户输入需求
    CI->>CA: processUserMessageWithLLM()
    CA->>CA: 检查API Key
    alt 有API Key
        CA->>CA: processWithGemini()
        Note over CA: LLM智能处理
    else 无API Key
        CA->>CA: processWithSimpleRules()
        Note over CA: 规则引擎处理
    end
    CA-->>CI: ConversationResult
    
    alt shouldSearch = true
        CI->>MA: matchProperties(profile)
        MA-->>CI: ScoredProperty[]
        
        CI->>MPA: calculateMapScoresForProperties()
        loop 每个房产
            MPA->>MPA: 查询OSM Overpass API
            Note over MPA: 公园/公交/火车
        end
        MPA-->>CI: 带地图评分的房产列表
        
        CI-->>User: 展示匹配结果
    end
    
    User->>CI: 选择房产 prop-009
    CI-->>User: 请求上传护照
    
    User->>CI: 上传护照图片
    CI->>DA: extractPassportInfo(base64)
    DA-->>CI: PassportInfo
    
    CI-->>User: 显示申请表
    
    User->>CI: 提交申请
    CI->>ComA: generateApplication()
    ComA-->>CI: RentalApplication
    CI-->>User: 申请已提交
```

---

## 四、Mermaid使用说明

### 4.1 如何查看Mermaid图表

1. **VS Code / Cursor**: 安装 `Markdown Preview Mermaid Support` 插件
2. **GitHub/GitLab**: 直接在Markdown中渲染
3. **在线编辑器**: https://mermaid.live
4. **Typora**: 直接支持Mermaid

### 4.2 在Markdown中使用

````markdown
```mermaid
%% 这里放Mermaid代码 %%
```
````

### 4.3 自定义主题颜色

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 
    'primaryColor': '#4472C4',
    'primaryTextColor': '#fff',
    'primaryBorderColor': '#2F5496',
    'lineColor': '#8C8C8C',
    'secondaryColor': '#EDEDED'
}}}%%
```
