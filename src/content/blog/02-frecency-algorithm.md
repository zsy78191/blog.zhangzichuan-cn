---
title: 'Frecency：一个被 Mozilla 发明、被我塞进命令行工具的排序算法'
description: '从 Firefox 3 的地址栏到我的命令行目录跳转工具，frecency 一直在帮我回答同一个问题：人用过的东西，怎么排序才算"聪明"？'
pubDatetime: 2026-06-13
math: true
tags: ['算法', 'CLI', 'Firefox', '数据库', 'Node.js', 'ZZ']
category: '技术'
---

这篇文章不是算法论文的导读。是我从一个小工具的需求出发，摸到 Mozilla 在 2008 年搞出来的排序算法，然后顺着演化线把各个版本抄了一遍的记录。

我写了个叫 zz 的命令行工具，功能很简单：你 cd 到一个目录，它记下来，下次想去那个目录的时候敲 zz 加几个字母就能跳过去。跟 z、autojump、zoxide 这些差不多，但我有个执念：排序得聪明。按最近用过的排，太浅了，你昨天为了修 bug 进了 50 次 /var/log，今天不想再看到它排在最前头。按用得最多的排也不行，上个月的项目天天进，这周碰都没碰过，凭啥占着榜一。频率和时效性得同时算进去，这个诉求太自然了，我以为动手之前肯定有个标准答案。一搜还真有，Mozilla 在 2008 年就发明了，叫 frecency。

## Frecency 是什么

名字已经说明白了，frequency 乘 recency。不是你用得多的排最前，也不是最近用的排最前，是又常用又近用的排最前。关键是怎么量化。假设每个目录有个热度分，你进去一次涨一点，时间一长不进了就慢慢降下来，经常进的目录分高但不进了会沉下去给新目录让位，就这么个直觉。

Mozilla 在 Firefox 3 的 AwesomeBar 里第一次实现了这个东西。2008 年的时候，他们把地址栏和书签历史合并了，下拉菜单需要一种排序算法。工程师的方案是这样：每次访问按类型给基础分，地址栏输入 URL 得 100 分，点书签 120 分，从历史记录里选 60 分。然后按多久前乘一个系数，4 天内乘 100，14 天内乘 70，30 天内乘 50，90 天内乘 25，更早的乘 10。最终分数 $\displaystyle S = \sum_i b_i \cdot d(t_i)$（$b_i$ 是基础分，$t_i$ 是距今天数，$d$ 是分段系数）。直接就能看出问题：分段太粗糙了，第 4 天和第 5 天之间差了 30% 的权重，用户根本感觉不到昨天和前天有什么区别，用久了排序偶尔会跳一下，因为某条记录刚刚跨过了一个分段边界。

2012 年，Mozilla 的 Jesse Ruderman 和 Justin Lebar 在 Wiki 上贴了个改进方案，扔掉分段，改用指数衰减。公式改用指数衰减：

$$
v_i = w \cdot e^{-\lambda d_i}, \quad S = \sum_i v_i
$$

其中 $d_i$ 是距今天数，$w$ 是访问类型权重。半衰期 30 天对应 $\lambda = \ln 2 / 30$，30 天前的访问贡献值只有今天的一半，60 天前的只有四分之一，没有阈值，每天平滑衰减。Firefox 147 之后用的是这个版本的改良版，双指数衰减加采样最近访问，这里不展开了。指数衰减是 frecency 的核心升级，这个公式在物理学里是放射性衰变，在记忆科学里是遗忘曲线。同一套数学换了套参数，从原子衰变成了人的行为衰减，我觉得这比算法本身有意思。

## ZZ 项目里的实际实现

回到我的工具。我没做每次访问单独算那种精细活，zz 跟浏览器地址栏不一样。浏览器里一天可能访问几百个 URL，每次都应该独立贡献，命令行里一天进出的目录就那几个，按最后一次访问算就够了。所以我做了个简化：

$$
\text{score} = \text{count} \cdot e^{-\text{age} / 7}
$$

count 是累计次数，age 是距最后一次访问的天数，半衰期是 7 天。源码就一行：

```js
computeScore(count, lastTime, now) {
    const ageDays = Math.max(0, (now - lastTime) / 86400000);
    return Math.round(count * Math.exp(-ageDays / HALF_LIFE_DAYS) * 10000) / 10000;
}
```

每次 zz 记录目录时走 addOrUpdate，count 加 1，时间戳刷新，分数重算，一条记录一个分数。但太简单也有问题。最开始写查询的时候我顺手加了个 WHERE pinned = 0，觉得逻辑很清楚，收藏的放一组，其他的按分数排。结果用户反馈说 pin 了一个目录之后 zz alias 找不到它了。查了半天发现 searchBySubstring 的 SQL 里有个 AND pinned = 0，pin 过的目录被排除在搜索范围之外了。修复就是删掉那个条件，但一个再简单的算法落到具体实现里，边界条件都能给你挖出坑来。

最终展示的时候我也没用纯 score 排序，而是分了几组。Pinned 始终在最上面，然后是分数最高的 5 条，再然后是最近 7 天有访问的，最后是剩下的全部。Pinned 单独拉出来按时间排序，其他按分数倒序：

```sql
WHERE pinned = 0 ORDER BY score DESC, time DESC, id ASC
WHERE pinned = 1 ORDER BY time DESC, id ASC
```

折腾了半天 frecency，最后展示还是手动插了个 pinned 置顶。算法是帮你排序的，不是替你决策的。

半衰期为什么用 7 天，不是 Firefox 的 30 天？不是算过最优参数，命令行目录切换比浏览器 URL 访问短命得多，一个项目的活跃周期按周算不是按月算的。我试过 14 天和 30 天，都觉得排序反应太慢，一个目录你一周没进去了还浮在顶上，不合适。7 天是试出来的。同类工具比一圈的话，z 用原始桶式 frecency，autojump 用自定义 frecency，zoxide 和 z.lua 都用指数衰减且半衰期可配置，zz 也用的指数衰减但写死了 7 天。大家都在做同一件事，不同语言各实现一遍。zoxide 和 z.lua 做了可配置半衰期，我懒，直接写死。参数可配置不代表参数有意义，没见过几个人去调 zoxide 的半衰期，99% 装完就不管了，所以写死 7 天省一个配置项。

## 一些问题

为什么不直接用频率乘时间做线性衰减？可以做 $\text{score} = \text{count} \cdot (1 - \text{age} / \text{maxAge})$，但 maxAge 设多少又是个问题，30 天前的突然变 0，又回到分段问题。而且线性衰减每天掉一样多，人的行为不是线性的，今天不去的目录明天更不可能去。指数衰减只有一个参数半衰期，直觉好调，7 天半衰期等于 7 天前的访问贡献值减半，谁听了都懂。

为什么不做机器学习？犯不着，目录跳转工具不需要 10MB 模型文件，指数衰减一行公式，结果跟 zoxide 差不多。足够好有时候比最好更值得选，尤其是一个装在终端里的工具。

这个算法最好的部分是什么？它解决了新目录怎么浮上来的问题。纯按频率排序，新目录永远排不过积累了三个月的旧目录。有了时间衰减，旧目录不进了就沉下去，新目录进几次分数就超上来。这其实是在模拟你的注意力，你真正的工作目录是流动的，算法得跟上。

## 最后

我在一个命令行工具里实现了 Mozilla 工程师 18 年前发明的算法，后来又跟进了 2012 年的改进版。不是从头推导的，是从需求出发顺藤摸瓜找到的。中间踩了坑（WHERE pinned = 0），做了妥协（简化成单次聚合），也发现半衰期是个好参数因为谁都能理解它的含义。下次写需要排序的东西，想想 frecency，不复杂，一行公式，但比你直觉写的排序聪明。

**引用资料：**

- Connor, M. & Spitzer, S. (2007). _Frecency algorithm_, MDN Web Docs
- Ruderman, J. & Lebar, J. (2012). _A new frecency algorithm based on exponential decay_, Mozilla Wiki — [链接](https://wiki.mozilla.org/User:Jesse/NewFrecency)
- Firefox Source Docs: [Legacy ranking](https://firefox-source-docs.mozilla.org/browser/urlbar/ranking-legacy.html) / [Current ranking](https://firefox-source-docs.mozilla.org/browser/urlbar/ranking.html)
- ZZ 源码: [github.com/zsy78191/zz](https://github.com/zsy78191/zz)

---

_zz 的 GitHub 上有 frecency 的 Node.js 实现，100 行代码带 SQLite 操作。比读论文快。_
