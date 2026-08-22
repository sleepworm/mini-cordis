# Mini Cordis

从零实现一个最小的 [Cordis](https://github.com/cordiverse/cordis) 内核：Context、Service Registry、Plugin、Effect、Event、响应式依赖、失败隔离、Child Context——一个概念一个 commit，一个 commit 一个 tag。

这个仓库回答的问题和 [`cordis-from-zero`](https://github.com/sleepworm/cordis-from-zero) 不一样：那边回答"Cordis 有没有用、用在哪"，这边回答"Cordis 内部是怎么做出这些效果的"。先用（`cordis-from-zero`），再造（这里）。

## 怎么读

- **只读文章**：跟着 `docs/` 里逐章的文档走，看问题、看代码、看结论。
- **跑代码**：`git clone` 本仓库，`git checkout <tag>` 到任意一章，`npm install && npm test && npm run demo`。
- **看 Diff**：`git diff v0.1 v0.2`，直接看某一章真正加了什么。

## 学习路线

单线演进（不像 `cordis-from-zero` 那样有 vanilla/framework 两条线对照）——每一章在上一章的代码基础上加一个概念，同一个 `src/context.ts` 持续演进。

| Tag | 概念 | 这一章在解决什么问题 |
|---|---|---|
| `v0.1` | Context | Context 这个"容器"本身应该是什么？先做成空类 |
| `v0.2` | Service Registry | Context 能存、能取——`provide`/`get` |
| `v0.3` | Service Removal | 能力不是永远存在的——`has`/`remove` |
| `v0.4` | Plugin | 安装能力的独立单元，不再是调用现场直接 `provide` |
| `v0.5` | Effect | Plugin 造成的改变，怎么撤销 |
| `v0.6` | Plugin Scope | 只撤销一个 Plugin，不影响其他 |
| `v0.7` | Event | Producer/Consumer 不用互相认识 |
| `v0.8` | Dependency Check | 声明式地问"这些依赖此刻都在吗" |
| `v0.9` | Reactive Dependency | 依赖状态变化时自动激活/撤销 |
| `v0.10` | Failure Isolation | 一个 Plugin 出错，不连累其他 Plugin |
| `v0.11` | Child Context | Context 变成一棵树，可以 fork |
| `v1.0` | Final Demo | 把前面所有机制拼起来，重跑一遍 HelloCordis 场景 |

## 之后

这个仓库是 `cordis-from-zero` → `mini-cordis` 这条学习路径的第二站。教材/学习笔记草稿另外放在 [`docs`](https://github.com/sleepworm/docs) 仓库的 `mini-cordis-docs/` 子文件夹，不放在这里。
