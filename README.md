# Black Rhino AI 商品运营诊断助手

> A lightweight AI-powered product operations diagnostic tool built after the Black Rhino interview process.

## 定位

这是一个**有数据边界意识的商品运营诊断原型**，设计用于演示 AI 如何辅助运营人员高效完成：

- 商品定位分析
- Listing 诊断（标题、卖点、描述）
- Bundle 套餐设计
- SEO 关键词与内容方向
- 数据验证指标规划

## 重要说明

本工具**不访问 Black Rhino 后台数据**，仅基于公开商品信息或手动输入的产品卡片进行诊断。

**无法判断以下内容：**
- 真实销售额 / GMV
- 毛利率 / 利润率
- 库存周转 / 断货率
- 广告 ROI / 投产比
- 真实 SKU ABC 分类

这些模块需要在获得内部数据权限后升级。

## 技术架构

```
React 前端 (Vite + TypeScript + Tailwind CSS)
    ↓ fetch /api/analyze
Cloudflare Pages Function
    ↓ MINIMAX_API_KEY env
MiniMax 大模型 API
    ↓
返回结构化 JSON
    ↓
前端展示诊断结果
```

## 本地开发

```bash
pnpm install
pnpm dev
```

## 生产部署

部署到 Cloudflare Pages 后，需在 Cloudflare Dashboard 配置以下环境变量：

| 变量名 | 说明 |
|--------|------|
| `MINIMAX_API_KEY` | MiniMax API Key |
| `MINIMAX_MODEL` | 模型名（默认 abab6.5s）|

## 核心设计原则

1. **规则层守门** — 信息不足时不调用 API，直接返回缺失字段提示
2. **不乱编** — AI 不推断销量、毛利、库存等无数据支撑的结论
3. **数据边界透明** — 每个诊断结果第一块永远是 Data Sufficiency Score，明确告知能分析什么、不能分析什么
