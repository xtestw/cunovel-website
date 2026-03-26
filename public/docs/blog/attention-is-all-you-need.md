---
title: 《Attention Is All You Need》在讲什么
---

# 《Attention Is All You Need》在讲什么

2017 年，Google 团队发表的这篇论文提出了 **Transformer** 架构。标题里的「All you need is Attention」并不是说世界上只需要注意力、别的都不重要，而是：**在序列建模这一任务上，可以不再依赖循环（RNN）或卷积，仅用注意力机制就能构建出性能更好、且更易并行训练的模型**。下面分块说明它在说什么，以及为什么重要。

## 当时要解决什么问题

在 Transformer 之前，处理文本序列的主流是 **RNN / LSTM** 以及带 **Encoder–Decoder** 的机器翻译模型。它们有两个痛点：

1. **顺序计算**：第 *t* 步往往依赖前一步的隐状态，难以在时间上完全并行，训练慢、长序列更难扩展。  
2. **长距离依赖**：信息要经过很多步传递才能从句首「流」到句尾，容易衰减或遗忘。

此前已有工作用 **注意力（Attention）** 把 Encoder 的全局信息接到 Decoder 上（例如 Bahdanau 注意力），但骨干网络仍是 RNN。这篇论文的问题是：**能否把「注意力」从配角升级成主干？**

## 核心：Scaled Dot-Product Attention

对每个位置，模型会算三组向量：**Query（Q）**、**Key（K）**、**Value（V）**。直观理解：

- **Key / Value**：像图书馆里每本书的「索引」和「正文」——Key 用来匹配，Value 是读出来的内容。  
- **Query**：当前位置「想问的问题」——和各个 Key 比相似度，决定从哪些 Value 里取信息。

计算步骤可以概括为：

1. 用 Q 和 K 算相似度（点积）。  
2. 除以 **√d_k**（d_k 为 Key 的向量维度）做 **缩放**，避免点积随维度变大而数值过大，导致 softmax 几乎 one-hot、梯度不稳定。  
3. 对最后一维做 **softmax**，得到每个位置对各个 Key 的权重（**注意力权重**）。  
4. 用权重对 **V** 加权求和，得到当前位置的输出。

一句话：**当前位置输出 = 按「和谁的关联强」对全体 Value 做加权平均**。关联由 Q、K 决定，内容来自 V。

在 **Encoder** 里，Q、K、V 都来自同一侧序列，所以也叫 **Self-Attention（自注意力）**：每个词在看整句（在实现里还会配合 mask 处理 padding 等）。

在 **Decoder** 里，生成第 *t* 个词时只能看到前面已生成的部分，不能看到未来，因此用 **Mask** 把「未来位置」的注意力分数设为一个很小的负数（实现上常等价于负无穷），softmax 后权重为 0，这就是 **因果掩码（Causal Mask）**。

## Multi-Head Attention：多视角一起看

只做一套 Q、K、V，相当于只有一种「关联方式」。**多头注意力（Multi-Head）** 是把 Q、K、V 线性投影到多组低维子空间，各自做注意力，再拼起来再投影一次。

好处是：不同头可以侧重不同关系（语法、指代、局部搭配等），表达能力比单头更强。论文里这是标配，而不是可选花哨功能。

## 为什么说可以不要 RNN / CNN

**Encoder** 由 \(N\) 层堆叠，每层大致包含：

- Multi-Head Self-Attention  
- 前馈网络（FFN，通常两层 MLP，中间维度更大）  
- 每层都有 **残差连接（Residual）** 和 **Layer Normalization**（论文采用 Post-LN 形式：先子层再加残差再 Norm，具体实现版本有 Pre-LN 等变体）

**Decoder** 除了自注意力，还有一层 **Encoder–Decoder Attention**：Decoder 的 Q 来自已生成序列，K、V 来自 Encoder 输出，用于对齐源语言与目标语言。

整段序列可以在矩阵层面一次性算注意力（配合 mask），**训练时并行度高**，这是相对 RNN 的最大工程优势之一。论文在 WMT 英德翻译上取得了当时很好的效果，且训练成本更友好。

## 位置从哪来：Positional Encoding

去掉 RNN 以后，**自注意力本身是置换等价的**——打乱句子顺序再算，每词与其它词的关联模式在结构上可以不变，所以模型默认「不知道顺序」。论文在词向量上 **加上** 固定的 **正弦 / 余弦位置编码**，让同一位置在不同维度上有不同波长，使模型能区分次序并外推到比训练时更长的序列（理论上）。后续很多工作改用可学习的位置嵌入或其它编码方式，但「必须显式注入位置信息」这一点保留了下来。

## 「All you need」到底怎么理解

更准确的说法是：

- 在这篇工作的 **Encoder–Decoder 翻译模型** 里，**没有使用卷积和循环**，核心可并行的计算单元就是 **注意力 + 逐位置 FFN**。  
- 它不是说 CNN/RNN 再无用处，而是证明 **仅基于注意力的堆叠结构** 就能在强基线上做出 SOTA，并带来 **并行训练** 的收益。

后来 **BERT**（Encoder-only）、**GPT**（Decoder-only）等模型都把 Transformer 块当作基本积木，大语言模型的爆发与这篇论文直接相关。

## 小结

| 概念 | 作用 |
|------|------|
| Scaled Dot-Product Attention | 用 Q、K 决定「看哪里」，用 V 取出内容；缩放稳定训练 |
| Multi-Head | 多种子空间并行，丰富关系建模 |
| 位置编码 | 补回序列顺序信息 |
| 残差 + LayerNorm | 加深网络、稳定优化 |
| Encoder / Decoder 结构 | 翻译等任务的完整框架；-only 变体衍生出 BERT/GPT 路线 |

若你只想记一句话：**Transformer 用自注意力在序列全体位置上直接建立关联，并用多头、位置编码和深度堆叠取代循环，在效果和并行性之间取得了革命性的平衡**——这就是「Attention Is All You Need」这篇论文的核心贡献。

---

**延伸阅读**：Vaswani et al., *Attention Is All You Need*, NeurIPS 2017.（原始论文标题为 *Attention Is All You Need*，常被口语说成「All you need is attention」，含义相同。）
