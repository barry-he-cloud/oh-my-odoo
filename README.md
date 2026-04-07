# Oh My Odoo

**专为 Odoo ERP 打造的 AI 编程助手插件** — 基于 OpenCode 的全功能插件，内置版本升级助手（14.0→19.0）、模块脚手架、安全审计、XML 视图验证和多模型编排。

---

## 目录

- [功能概览](#功能概览)
- [系统要求](#系统要求)
- [安装方法](#安装方法)
- [配置说明](#配置说明)
- [使用指南](#使用指南)
  - [Odoo CLI 工具](#1-odoo-cli-工具)
  - [模块扫描器](#2-模块扫描器)
  - [配置验证器](#3-配置验证器)
  - [版本升级助手](#4-版本升级助手旗舰功能)
  - [安全审计](#5-安全审计)
  - [XML 视图验证](#6-xml-视图验证)
  - [模块脚手架](#7-模块脚手架)
- [内置 Skills 知识库](#内置-skills-知识库)
- [斜杠命令](#斜杠命令)
- [智能 Hooks](#智能-hooks)
- [Doctor 系统检查](#doctor-系统检查)
- [项目结构](#项目结构)
- [常见问题](#常见问题)
- [License](#license)

---

## 功能概览

| 类别 | 功能 | 说明 |
|------|------|------|
| **CLI 工具** | `odoo_cli` | 安全执行 odoo-bin 命令 |
| | `odoo_module_update` | 更新模块（-u） |
| | `odoo_module_install` | 安装模块（-i） |
| | `odoo_test_module` | 运行模块测试（--test-enable） |
| **模块管理** | `odoo_module_scanner` | 扫描所有自定义模块并生成报告 |
| | `odoo_scaffold` | 生成完整模块骨架 |
| **质量检查** | `odoo_config_validator` | 验证 odoo.conf 安全与性能配置 |
| | `odoo_security_checker` | 全面安全审计（访问规则、SQL注入、sudo滥用） |
| | `odoo_xml_validator` | XML 视图验证（废弃属性、重复ID等） |
| **升级助手** | `odoo_upgrade_analyze` | 版本兼容性分析（14.0→19.0） |
| | `odoo_upgrade_migrate` | 生成标准迁移脚本 |
| **智能感知** | `odoo-context-injector` | 自动检测并注入 Odoo 项目上下文 |
| | `odoo-module-guard` | 防止误改核心模块 |

---

## 系统要求

| 依赖 | 版本要求 | 说明 |
|------|---------|------|
| **Node.js** | >= 18.0 | 插件运行时 |
| **Bun** | >= 1.0 | 推荐的包管理器和运行时 |
| **OpenCode** | >= 1.0 | AI 编码客户端 |
| **Python** | >= 3.10 (Odoo 17), >= 3.12 (Odoo 19) | Odoo 运行时 |
| **PostgreSQL** | >= 12 | Odoo 数据库 |
| **wkhtmltopdf** | 可选 | PDF 报表（Odoo <=18） |
| **weasyprint** | 可选 | PDF 报表（Odoo 19+） |

运行 `oh-my-odoo doctor` 可以一键检测以上所有依赖。

---

## 安装与配置

### 3.1 前提条件

#### 系统要求

```bash
# 检查 Node.js 版本（需要 18+）
node --version
# v18.0.0 或更高

# 检查 Bun 版本（推荐 1.0+）
bun --version
# 1.0.0 或更高

# 如果未安装 Bun，执行以下命令
curl -fsSL https://bun.sh/install | bash
```

#### OpenCode 安装

oh-my-odoo 是 OpenCode 的插件，需要先安装 OpenCode：

```bash
# 全局安装 OpenCode
bun install -g opencode-ai

# 验证安装
opencode --version
```

### 3.2 安装 oh-my-odoo

#### 方法一：交互式安装（推荐）

```bash
# 在 Odoo 项目根目录执行
bunx oh-my-odoo install
```

安装脚本会自动：

1. 检查 OpenCode 是否已安装
2. 自动检测当前 Odoo 项目信息（版本、模块、数据库）
3. 交互式引导配置（Odoo 版本、版本类型、Python 版本等）
4. 注册 `oh-my-odoo` 插件到 `.opencode/opencode.json`
5. 生成 `.opencode/oh-my-odoo.jsonc` 配置文件

安装过程示意：

```
┌  oh-my-odoo — 安装向导
│
◇  检测到 Odoo 项目: 版本: 17.0, 自定义模块: 12, 数据库: mydb
│
◇  OpenCode 1.2.27 已安装 [OK]
│
◆  Odoo 版本？
│  ○ 14.0 (Legacy)
│  ○ 15.0
│  ○ 16.0 (OWL2 + 新 Asset Bundle)
│  ● 17.0 (推荐 — attrs 废弃, Python 3.10+)
│  ○ 18.0 (OWL3 + 增强 RBAC)
│  ○ 19.0 (最新 — OWL4 Signals, Vite, Python 3.12+)
│
◆  Odoo 版本类型？
│  ● Community (CE) — 开源社区版
│  ○ Enterprise (EE) — 企业版
│
◆  Python 版本？
│  ● Python 3.12 (推荐)
│
◆  默认数据库名称？
│  mydb
│
◆  启用哪些功能？
│  ◻ 自动检测 Odoo 项目上下文 (推荐)
│  ◻ 安全审计 (扫描 SQL 注入、sudo 滥用等)
│  ◻ 升级安全检查 (版本升级兼容性提醒)
│
◇  插件已注册 → .opencode/opencode.json
◇  配置已写入 → .opencode/oh-my-odoo.jsonc
│
│  安装完成
│  Odoo Version:    17.0
│  Edition:         community
│  Python:          3.12
│  Database:        mydb
│  Auto-detect:     enabled
│  Security Audit:  enabled
│  Upgrade Checks:  enabled
│
└  oh-my-odoo 安装完成！祝开发愉快！
```

#### 方法二：非交互式安装

适合 CI/CD 或脚本批量部署：

```bash
bunx oh-my-odoo install --no-tui \
  --odoo-version=17.0 \
  --edition=community \
  --python-version=3.12 \
  --database=mydb
```

#### 方法三：从 GitHub 全局安装

```bash
# 使用 bun（推荐）
bun add -g git+ssh://git@github.com:barry-he-cloud/oh-my-odoo.git

# 或者使用 npm
npm install -g git+ssh://git@github.com:barry-he-cloud/oh-my-odoo.git
```

全局安装后，同样使用 `oh-my-odoo install` 进行项目配置。

#### 方法四：从源码安装

```bash
git clone git@github.com:barry-he-cloud/oh-my-odoo.git
cd oh-my-odoo
bun install
bun run build
```

从源码安装时，在 `.opencode/opencode.json` 中使用绝对路径注册：

```json
{
  "plugin": ["/path/to/oh-my-odoo/dist/index.js"]
}
```

### 3.3 验证安装

```bash
# 检查系统环境（Python、PostgreSQL、odoo-bin 等）
oh-my-odoo doctor

# 查看插件信息和所有可用工具
oh-my-odoo info

# 查看版本
oh-my-odoo --version
```

### 3.4 更新配置

已经安装过？可随时重新运行 install 更新配置：

```bash
bunx oh-my-odoo install
```

安装器会自动检测已有配置并以更新模式运行。

---

## 配置说明

在项目根目录创建 `.opencode/oh-my-odoo.jsonc`（项目级配置）：

```jsonc
{
  // Odoo 项目配置
  "odoo": {
    "odoo_version": "17.0",           // 当前 Odoo 版本
    "edition": "community",            // community 或 enterprise
    "python_version": "3.12",          // Python 版本
    "odoo_bin_path": "./odoo-bin",     // odoo-bin 路径
    "odoo_conf_path": "./odoo.conf",   // 配置文件路径
    "database_name": "mydb",           // 默认数据库
    "addons_paths": [                  // 自定义 addons 路径
      "./addons",
      "./custom_addons"
    ],
    // 升级配置
    "upgrade_source_version": "16.0",  // 升级源版本
    "upgrade_target_version": "19.0"   // 升级目标版本
  },

  // 功能开关
  "auto_detect": true,                 // 自动检测 Odoo 项目上下文
  "upgrade_safety_checks": true,       // 升级安全检查
  "security_audit": true,              // 安全审计

  // 按需禁用特定工具/hooks/skills
  "disabled_tools": [],
  "disabled_hooks": [],
  "disabled_skills": []
}
```

也可以在 `~/.config/opencode/oh-my-odoo.jsonc` 创建用户级全局配置。

---

## 使用指南

### 1. Odoo CLI 工具

安全地执行 odoo-bin 命令，无需切换到终端：

```
> 使用 odoo_cli 工具运行 scaffold 命令创建一个新模块

> 使用 odoo_module_update 更新 sale 和 purchase 模块

> 使用 odoo_module_install 安装 my_custom_module

> 使用 odoo_test_module 运行 my_module 的测试
```

**支持的操作：**
- `scaffold` — 创建模块骨架
- `shell` — 进入 Odoo Python shell
- `--update / --init` — 更新/安装模块
- `--test-enable` — 运行测试
- `db` 子命令 — 数据库管理

### 2. 模块扫描器

扫描项目中所有自定义模块，生成完整清单：

```
> 使用 odoo_module_scanner 扫描当前项目的所有模块
```

**输出示例：**
```
Found 12 Odoo modules in 2 addons dir(s) (234ms)
Addons paths: addons, custom_addons

--- Installable (10) ---
  my_sales v17.0.1.2.0 [15py/8xml/3js]
    Custom sales workflow
    Components: models, views, controllers, security, tests
    Depends: sale, stock, account

  my_website_theme v17.0.1.0.0 [5py/12xml/8js]
    Custom website theme
    Components: views, assets, controllers
    Depends: website, website_sale
```

### 3. 配置验证器

验证 `odoo.conf` 的安全性和性能配置：

```
> 使用 odoo_config_validator 检查我的 odoo.conf
```

**检查项：**
- 管理员密码强度（admin_passwd）
- 数据库列表是否公开（list_db）
- Worker 数量和内存限制
- 反向代理配置（proxy_mode）
- addons_path 完整性
- 敏感信息自动脱敏显示

### 4. 版本升级助手（旗舰功能）

这是 oh-my-odoo 最强大的功能——帮你从 14.0 一路升到 19.0：

#### 第一步：升级分析

```
> 使用 odoo_upgrade_analyze 分析从 16.0 升级到 19.0 的兼容性
```

**输出示例：**
```
=== Odoo Upgrade Analysis: 16.0 → 19.0 ===
Modules scanned: 12
Estimated effort: HIGH

--- Breaking Changes (18) ---
  [16.0→17.0] ORM: Computed field store behavior changed
    Migration: Review compute methods with store=True
  [17.0→18.0] Web: OWL3 upgrade, component lifecycle changes
    Migration: Update OWL components for OWL3 lifecycle
  [18.0→19.0] Web: OWL 4.0 with Signals reactivity model
    Migration: Refactor useState() to useSignal()
  [18.0→19.0] API: Native REST API /api/v2/, /jsonrpc deprecated
    Migration: Migrate to /api/v2/ with OAuth2 bearer tokens
  ...

--- Module Issues (8 modules affected) ---
  my_sales (addons/my_sales)
    12 errors, 25 warnings | Auto-fixable: 15, Manual: 22
    [view_change] (8):
      WARN addons/my_sales/views/order_views.xml:45 — attrs={} deprecated since 17.0
        Fix: Use individual invisible/readonly/required attributes
    [js_change] (5):
      ERROR addons/my_sales/static/src/js/widget.js:12 — Widget.extend() deprecated since 16.0
        Fix: Use OWL Component class
    ...

--- Recommendations ---
  • Large version gap (3 major). Consider incremental upgrade: 16.0 → 17.0 → 18.0 → 19.0
  • Ensure Python >= 3.12 — Python 3.10/3.11 no longer supported in Odoo 19
  • Install weasyprint — it replaces wkhtmltopdf as default PDF engine
  • OWL 4.0 Signals: refactor useState() to useSignal() reactivity model

--- Summary ---
Total issues: 156 (52 auto-fixable)
```

#### 第二步：生成迁移脚本

```
> 使用 odoo_upgrade_migrate 为 my_sales 模块生成 16.0 到 17.0 的迁移脚本
```

生成标准的 `migrations/17.0.1.0.0/pre-migrate.py` 和 `post-migrate.py`，符合 Odoo 官方规范。

#### 支持的版本路径

```
14.0 → 15.0 → 16.0 → 17.0 → 18.0 → 19.0
```

每个版本跳跃的关键变更：

| 版本 | 核心变更 |
|------|---------|
| **15→16** | OWL2 强制，资源包重写，Command API |
| **16→17** | attrs={} 废弃，Python 3.10+，fields_view_get 移除 |
| **17→18** | OWL3，增强 RBAC，JSON-RPC 变更 |
| **18→19** | OWL4 Signals，Vite 打包，REST /api/v2/，Python 3.12+，weasyprint PDF |

### 5. 安全审计

全面扫描自定义模块的安全问题：

```
> 使用 odoo_security_checker 审计所有自定义模块
```

**检查项：**
- ir.model.access.csv 是否完整
- 是否有无分组的公开访问规则
- ir.rule 记录规则的有效性
- Python 代码中的 SQL 注入风险（`cr.execute(f"...")`)
- `eval()` 使用
- `sudo()` 滥用
- `os.system()` / `shell=True` 命令注入

### 6. XML 视图验证

验证所有 Odoo XML 文件的正确性：

```
> 使用 odoo_xml_validator 验证我所有模块的 XML 文件

> 使用 odoo_xml_validator 验证 addons/my_module/views/order_views.xml
```

**检查项：**
- 废弃的 `attrs={}` 语法（Odoo 17+）
- 废弃的 `states=` 属性
- 缺少 `noupdate` 的数据文件
- 未限定模块名的 `ref()` 引用
- 危险的 `position="replace"` xpath
- 重复的 record ID
- 缺少 `name` 属性的 `<field>` 标签

### 7. 模块脚手架

生成符合 OCA 标准的完整模块骨架：

```
> 使用 odoo_scaffold 创建一个名为 my_inventory 的模块，显示名"库存追踪"，Odoo 17.0
```

**生成的文件结构：**
```
my_inventory/
├── __manifest__.py        # 模块元数据
├── __init__.py            # 根包
├── models/
│   ├── __init__.py
│   └── my_inventory.py    # 主模型（含字段、计算、约束、工作流）
├── views/
│   └── my_inventory_views.xml  # 表单/列表/搜索视图 + 菜单 + Action
├── security/
│   └── ir.model.access.csv    # 访问权限
├── controllers/           # 可选：HTTP 控制器
├── wizards/               # 可选：向导（TransientModel）
└── static/                # 静态资源
```

---

## 内置 Skills 知识库

8 个 Odoo 领域专家知识，AI 可以随时调用：

| Skill | 覆盖范围 |
|-------|---------|
| **odoo-orm-expert** | Model 定义、字段类型、计算字段、约束、域语法、Recordset 操作、CRUD、性能 |
| **odoo-views-xml** | 表单/列表/看板/搜索视图、QWeb、视图继承 xpath、Odoo 17+ 新属性语法 |
| **odoo-security** | ir.model.access.csv、ir.rule、安全组、sudo() 最佳实践、Controller 鉴权 |
| **odoo-upgrade-analysis** | 版本迁移规划 14→19、breaking changes、迁移脚本、OCA openupgradelib |
| **odoo-debugging** | 日志分析、Odoo shell、pdb/ipdb、SQL 调试、性能 profiling、常见错误 |
| **odoo-performance** | N+1 查询修复、批量操作、computed 优化、PostgreSQL 调优、ormcache |
| **odoo-testing** | TransactionCase、HttpCase、Form helper、test tags、Mock、CI 配置 |
| **odoo-api-integration** | JSON-RPC、XML-RPC、REST Controller、Webhook、API Key 鉴权 |

---

## 斜杠命令

| 命令 | 功能 |
|------|------|
| `/odoo-new-module` | 交互式创建新模块（含模型、视图、安全、可选 controller/wizard/report） |
| `/odoo-upgrade` | 版本升级全流程（分析 → 生成迁移脚本 → 测试清单） |
| `/odoo-security-audit` | 运行全面安全审计 |
| `/odoo-fix-module` | 诊断并修复模块问题（ORM/视图/安全/JS 错误） |

---

## 智能 Hooks

### odoo-context-injector

自动检测当前目录是否为 Odoo 项目，并将以下信息注入 AI 上下文：

- Odoo 版本、Edition
- 自定义模块数量
- 是否使用 OCA 扩展
- Website / E-commerce / POS 模块检测
- 数据库名称
- Odoo 编码规范提示

### odoo-module-guard

当 AI 尝试修改核心 Odoo 模块（`odoo/addons/*`）时自动拦截，建议使用正确的继承方式：

- `_inherit` 扩展模型
- `xpath` 修改视图
- `ir.config_parameter` 运行时配置

---

## Doctor 系统检查

```bash
oh-my-odoo doctor
```

输出示例：
```
=== oh-my-odoo doctor ===

  [OK]   Python: Python 3.12.3
  [OK]   pip: pip 24.0
  [OK]   PostgreSQL (psql): psql 16.2
  [OK]   PostgreSQL Server: PostgreSQL is running
  [OK]   odoo-bin: Found at ./odoo-bin
  [OK]   odoo.conf: Found at ./odoo.conf
  [OK]   Custom Modules: Found 12 module(s)
  [OK]   Node.js: v20.11.1
  [WARN] wkhtmltopdf: wkhtmltopdf not found

Results: 8 passed, 1 warnings, 0 failures
```

---

## 项目结构

```
oh-my-odoo/
├── src/
│   ├── index.ts                      # 插件入口
│   ├── plugin-interface.ts            # Hook 接口层
│   ├── plugin-config.ts               # 配置加载（JSONC + Zod 校验）
│   ├── types.ts                       # 核心类型定义
│   ├── config/
│   │   └── schema/
│   │       ├── odoo.ts                # Odoo 域配置 Schema
│   │       └── oh-my-odoo-config.ts   # 根配置 Schema
│   ├── tools/
│   │   ├── odoo-cli/                  # CLI 执行工具
│   │   ├── odoo-module-scanner/       # 模块扫描器
│   │   ├── odoo-config-validator/     # 配置验证器
│   │   ├── odoo-upgrade-assistant/    # 版本升级助手
│   │   ├── odoo-security-checker/     # 安全审计
│   │   ├── odoo-xml-validator/        # XML 验证器
│   │   └── odoo-scaffold/             # 模块脚手架
│   ├── hooks/
│   │   ├── odoo-context-injector/     # 上下文注入
│   │   └── odoo-module-guard/         # 核心模块保护
│   ├── features/
│   │   ├── builtin-skills/            # 8 个内置 Skill
│   │   └── builtin-commands/          # 斜杠命令模板
│   ├── shared/                        # 通用工具（日志、JSONC、常量）
│   └── cli/                           # CLI 命令
│       ├── index.ts                   # CLI 入口（install/doctor/info）
│       ├── install.ts                 # 安装分发（TUI/CLI）
│       ├── tui-installer.ts           # 交互式 TUI 安装器
│       ├── tui-install-prompts.ts     # TUI 交互提示
│       ├── cli-installer.ts           # 非交互式安装器
│       ├── install-validators.ts      # 参数校验与格式化
│       ├── types.ts                   # 安装相关类型定义
│       ├── config-manager/            # 配置管理
│       │   ├── detect-current-config.ts   # 检测已有配置
│       │   ├── add-plugin-to-opencode-config.ts  # 注册插件
│       │   ├── write-config.ts        # 写入 oh-my-odoo.jsonc
│       │   └── opencode-binary.ts     # OpenCode 二进制检测
│       └── doctor/                    # 系统检查
├── bin/oh-my-odoo.js                  # CLI 入口
├── package.json
├── tsconfig.json
└── README.md
```

---

## 常见问题

### Q: 升级分析支持哪些版本？

支持 14.0、15.0、16.0、17.0、18.0、19.0 之间的任意升级路径。建议大版本跨度（>2）时采用逐步升级策略。

### Q: 我没有 Odoo 源码，只有自定义模块，能用吗？

可以。只需要把自定义模块放在 `addons/` 或 `custom_addons/` 目录下，工具会自动扫描。

### Q: 安全检查会修改我的代码吗？

不会。所有检查工具都是只读的，只报告问题和建议，不自动修改任何文件。

### Q: 如何禁用某个工具或 Hook？

在 `.opencode/oh-my-odoo.jsonc` 中配置：

```jsonc
{
  "disabled_tools": ["odoo_security_checker"],
  "disabled_hooks": ["odoo-module-guard"]
}
```

### Q: 支持 Odoo Enterprise 吗？

支持。可以在配置中设置 `"edition": "enterprise"`，上下文注入和升级分析都会考虑 Enterprise 版本差异。

---

## License

MIT

---

**Made with ❤️ for the Odoo community**
