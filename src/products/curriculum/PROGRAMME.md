# AI Engineering — An indie degree

*Degree-rigorous internally — blocks, credits, prerequisites, capstone. The public artifact is a transcript with evidence tiers and linked artifacts, never a diploma. Rendering is a template choice; nothing here depends on it.*

- **Credits** 51 · 1 credit ≈ 20 hours of work
- **Total work** 944 hours
- **Opened** 2026-08-12
- **Pacing** irregular — Hours vary week to week. Progress is banked and monotonic — no streaks, nothing destroyable by a quiet month. Projected completion is a range derived from logged hours, never from intended hours.

> **Ordering.** Value-weighted within prerequisite constraints. Stopping at any point should leave the highest-value skills already banked, so an unfinished programme is still a gain.

## Where this starts

Advanced standing awards **4 of 51 credits** and evidence on **12 of 65 skills**, from work already shipped.

> Starts the programme roughly one course in. The portfolio is strong on shipping LLM applications and operating them, and empty on measuring whether they are any good — which is a precise description of both the gap and the plan.

| Course | Awarded | Of | Why | Still to do |
|---|---:|---:|---|---|
| AIE-101 | **2** | 3 | Four of five course skills are evidenced at level 2 or 3 across three shipped products. | Model-directed tool selection, and deliberate measurement of context-management choices. |
| AIE-102 | **0** | 4 | Awarded nothing on purpose. There is one real measurement loop in the portfolio and no eval harness anywhere, no calibration against human labels, and no regression suite. Awarding credit here would be exactly the self-flattery this programme is built to avoid. | The whole course. |
| AIE-105 | **1** | 3 | Token economics evidenced by per-run accounting and cost-aware provider routing. | Serving, batching, caching, quantisation, and forward cost modelling — none evidenced. |
| AIE-106 | **1** | 4 | Speech synthesis integration across two products; a speech-to-text path in a third. | Recognition quality measurement, streaming transport, latency budgeting, turn-taking. |

| | Hours | At 6–12 h/week |
|---|---:|---|
| Block I | 364 | |
| less advanced standing | −62 | |
| **Block I remaining** | **302** | **6–12 months** |
| Whole programme | 944 | |
| less advanced standing | −62 | |
| **Remaining** | **882** | **1.4–2.8 years** |

## Study order

| # | Code | Course | Block | Credits | Hours | Prerequisites | Standing |
|---:|---|---|---|---:|---:|---|---|
| 1 | `AIE-101` | **LLM Application Engineering** | I | 3 | 45 | — | substantial |
| 2 | `AIE-102` | **Evaluation and Measurement** | I | 4 | 66 | AIE-101 | — |
| 3 | `AIE-107` | **Architecture and Judgement** | I | 2 | 32 | AIE-101, AIE-102 | — |
| 4 | `AIE-105` | **Inference, Cost and Latency Engineering** | I | 3 | 50 | AIE-101 | partial |
| 5 | `AIE-103` | **Retrieval and Context Systems** | I | 3 | 50 | AIE-101 | — |
| 6 | `AIE-104` | **Agents and Tool-Use Systems** | I | 4 | 59 | AIE-101, AIE-102 | — |
| 7 | `AIE-106` | **Speech and Multimodal Systems** | I | 4 | 62 | AIE-101, AIE-105 | partial |
| 8 | `AIE-201` | **Mathematics for Machine Learning** | II | 3 | 70 | — | — |
| 9 | `AIE-202` | **Machine Learning Foundations** | II | 3 | 60 | AIE-201 | — |
| 10 | `AIE-203` | **Deep Learning** | II | 3 | 65 | AIE-202 | — |
| 11 | `AIE-204` | **Transformers and LLMs from Scratch** | II | 4 | 80 | AIE-203 | — |
| 12 | `AIE-205` | **Fine-tuning and Post-training** | II | 3 | 60 | AIE-204, AIE-102 | — |
| 13 | `AIE-207` | **Systems for Machine Learning** | II | 3 | 60 | AIE-204 | — |
| 14 | `AIE-206` | **Reinforcement Learning** | II | 3 | 65 | AIE-201, AIE-203 | — |
| 15 | `AIE-300` | **Capstone** | II | 6 | 120 | AIE-102, AIE-103, AIE-104, AIE-105, AIE-106, AIE-204, AIE-107 | — |

## Block I — Applied AI Engineering

*The employable core. Closes the distance to applied and field AI roles, where the gap read already puts the learner at 94%.*

### 1. AIE-101 — LLM Application Engineering

**3 credits · 45 hours**

Everything else in Block I assumes you can get reliable, structured, tool-using behaviour out of a model. Four shipped products already evidence most of this.

**By the end you can**

- Specify and enforce structured output such that malformed responses are impossible rather than unlikely
- Design tool interfaces a model can actually use, and explain why a given interface fails
- Name and detect the specific failure modes of a deployed LLM feature
- Manage context deliberately — what goes in, what gets dropped, and what that costs

**Skills** Prompting as engineering, Structured output and schema enforcement, Tool use and function calling, Context management, Failure modes and hallucination

| Resource | Author | Hours | Cost |
|---|---|---:|---|
| [Anthropic API documentation](https://docs.claude.com/en/docs/overview) | Anthropic | 6 h | Free |
| [openai/openai-cookbook](https://github.com/openai/openai-cookbook) | OpenAI | 8 h | Free |
| [Patterns for Building LLM-based Systems & Products](https://eugeneyan.com/writing/llm-patterns/) | Eugene Yan | 3 h | Free |
| [Extrinsic Hallucinations in LLMs](https://lilianweng.github.io/posts/2024-07-07-hallucination/) | Lilian Weng | 3 h | Free |
| [AI Engineering](https://openlibrary.org/isbn/9781098166304) | Chip Huyen | 30 h | Paid |
| [Chain-of-Thought Prompting Elicits Reasoning in Large Language Models](https://arxiv.org/abs/2201.11903) | Wei et al. | 2 h | Free |
| [Language Models are Few-Shot Learners](https://arxiv.org/abs/2005.14165) | Brown et al. | 4 h | Free |
| [Intro to Large Language Models](https://www.youtube.com/watch?v=zjkBMFhNj_g) | Andrej Karpathy | 1 h | Free |
| [Self-Consistency Improves Chain of Thought Reasoning in Language Models](https://arxiv.org/abs/2203.11171) | Wang et al. | 2 h | Free |
| [LLM Bootcamp - Spring 2023](https://www.youtube.com/playlist?list=PL1T8fO7ArWleyIqOy37OVXsP4hFXymdOZ) | The Full Stack | 7 h | Free |
| [LLM Foundations (LLM Bootcamp)](https://www.youtube.com/watch?v=MyFrMFab6bo) | The Full Stack | 1 h | Free |
| [Learn to Spell: Prompt Engineering (LLM Bootcamp)](https://www.youtube.com/watch?v=JnBHR_yL2w8) | The Full Stack | 1 h | Free |
| [Augmented Language Models (LLM Bootcamp)](https://www.youtube.com/watch?v=YdeuQhlHmCA) | The Full Stack | 1 h | Free |
| [UX for Language User Interfaces (LLM Bootcamp)](https://www.youtube.com/watch?v=l5mG4z343qg) | The Full Stack | 1 h | Free |
| [AI prompt engineering: A deep dive](https://www.youtube.com/watch?v=T9aRN5JkmL8) | Anthropic | 1.2 h | Free |
| [Prompting 101 \| Code w/ Claude](https://www.youtube.com/watch?v=ysPbXH0LpIE) | Anthropic | 1 h | Free |
| [anthropics/prompt-eng-interactive-tutorial](https://github.com/anthropics/prompt-eng-interactive-tutorial) | Anthropic | 6 h | Free |
| [anthropics/anthropic-cookbook](https://github.com/anthropics/anthropic-cookbook) | Anthropic | 6 h | Free |
| [Lost in the Middle: How Language Models Use Long Contexts](https://arxiv.org/abs/2307.03172) | Liu et al. | 2 h | Free |
| [Toolformer: Language Models Can Teach Themselves to Use Tools](https://arxiv.org/abs/2302.04761) | Schick et al. | 3 h | Free |
| [Models overview](https://docs.claude.com/en/docs/about-claude/models/overview) | Anthropic | 1 h | Free |
| [Structured outputs](https://docs.claude.com/en/docs/build-with-claude/structured-outputs) | Anthropic | 1 h | Free |
| [Context windows](https://docs.claude.com/en/docs/build-with-claude/context-windows) | Anthropic | 1 h | Free |
| [Tool use with Claude](https://docs.claude.com/en/docs/agents-and-tools/tool-use/overview) | Anthropic | 1 h | Free |

> Full specification: [AIE-101-llm-application-engineering.json](courses/AIE-101-llm-application-engineering.json)

### 2. AIE-102 — Evaluation and Measurement

**4 credits · 66 hours** · prerequisites: AIE-101

The highest-value and least-practised skill in applied AI, and the one that makes every later claim in this programme defensible. It is also the course that makes Indie Degree's own grading panel credible — you cannot honestly grade with a judge you have not calibrated.

**By the end you can**

- Build an eval set from production failures rather than from imagination
- Name and measure the known pathologies of LLM judges — position, verbosity, self-enhancement bias
- Calibrate an automated judge against your own labels and report the agreement, not just the score
- Decide whether a difference between two systems is real, with an interval rather than a vibe
- Wire evals into CI so a regression fails a build

**Skills** Eval design, Building eval datasets, LLM-as-judge and its pathologies, Statistical significance in evals, Calibrating automated scores to human judgement, Regression testing and CI for models, Tracing and production observability

| Resource | Author | Hours | Cost |
|---|---|---:|---|
| [Your AI Product Needs Evals](https://hamel.dev/blog/posts/evals/) | Hamel Husain | 2 h | Free |
| [Creating a LLM-as-a-Judge That Drives Business Results](https://hamel.dev/blog/posts/llm-judge/) | Hamel Husain | 2 h | Free |
| [Task-Specific LLM Evals that Do & Don't Work](https://eugeneyan.com/writing/evals/) | Eugene Yan | 2 h | Free |
| [Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena](https://arxiv.org/abs/2306.05685) | Zheng et al. | 4 h | Free |
| [G-Eval: NLG Evaluation using GPT-4 with Better Human Alignment](https://arxiv.org/abs/2303.16634) | Liu et al. | 3 h | Free |
| [Length-Controlled AlpacaEval: A Simple Way to Debias Automatic Evaluators](https://arxiv.org/abs/2404.04475) | Dubois et al. | 3 h | Free |
| [Chatbot Arena: An Open Platform for Evaluating LLMs by Human Preference](https://arxiv.org/abs/2403.04132) | Chiang et al. | 3 h | Free |
| [Holistic Evaluation of Language Models](https://arxiv.org/abs/2211.09110) | Liang et al. | 5 h | Free |
| [promptfoo/promptfoo](https://github.com/promptfoo/promptfoo) | promptfoo | 6 h | Free |
| [UKGovernmentBEIS/inspect_ai](https://github.com/UKGovernmentBEIS/inspect_ai) | UK AI Safety Institute | 8 h | Free |
| [openai/evals](https://github.com/openai/evals) | OpenAI | 8 h | Free |
| [EleutherAI/lm-evaluation-harness](https://github.com/EleutherAI/lm-evaluation-harness) | EleutherAI | 10 h | Free |
| [langfuse/langfuse](https://github.com/langfuse/langfuse) | Langfuse | 6 h | Free |
| [AI Engineering](https://openlibrary.org/isbn/9781098166304) | Chip Huyen | 30 h | Paid |
| [Designing Machine Learning Systems](https://openlibrary.org/isbn/9781098107963) | Chip Huyen | 30 h | Paid |
| [confident-ai/deepeval](https://github.com/confident-ai/deepeval) | Confident AI | 8 h | Free |
| [stanford-crfm/helm](https://github.com/stanford-crfm/helm) | Stanford CRFM | 8 h | Free |
| [sklearn.metrics.cohen_kappa_score](https://scikit-learn.org/stable/modules/generated/sklearn.metrics.cohen_kappa_score.html) | scikit-learn | 1 h | Free |
| [scipy.stats.bootstrap](https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.bootstrap.html) | SciPy | 1 h | Free |
| [Why AI evals are the hottest new skill for product builders](https://www.youtube.com/watch?v=BsWxPI9UM4c) | Hamel Husain & Shreya Shankar (Lenny's Podcast) | 1.7 h | Free |
| [How to Build and Evaluate AI systems in the Age of LLMs](https://www.youtube.com/watch?v=eC3RNuI6ow0) | Hugo Bowne-Anderson (DataTalksClub) | 1.5 h | Free |
| [Escaping Proof-of-Concept Purgatory: Building Robust LLM Powered Applications](https://www.youtube.com/watch?v=-fuXIfRIztM) | Hugo Bowne-Anderson (SciPy) | 1.5 h | Free |
| [LLMOps (LLM Bootcamp)](https://www.youtube.com/watch?v=Fquj2u7ay40) | The Full Stack | 1 h | Free |
| [LLM Evals: Everything You Need to Know](https://hamel.dev/blog/posts/evals-faq/) | Hamel Husain | 2 h | Free |
| [Who Validates the Validators? Aligning LLM-Assisted Evaluation of LLM Outputs with Human Preferences](https://arxiv.org/abs/2404.12272) | Shankar et al. | 4 h | Free |
| [Judging the Judges: A Systematic Evaluation of Bias Mitigation Strategies in LLM-as-a-Judge Pipelines](https://arxiv.org/abs/2604.23178) | arXiv 2604.23178 | 3 h | Free |
| [Am I More Pointwise or Pairwise? Revealing Position Bias in Rubric-Based LLM-as-a-Judge](https://arxiv.org/abs/2602.02219) | arXiv 2602.02219 | 3 h | Free |

> Full specification: [AIE-102-evaluation-and-measurement.json](courses/AIE-102-evaluation-and-measurement.json)

### 3. AIE-107 — Architecture and Judgement

**2 credits · 32 hours** · prerequisites: AIE-101, AIE-102

Every other Block I course teaches you to build one thing well; none asks whether you should have built it. This one does nothing else — rules versus classical ML versus an LLM, decided with measurements, and the human-in-the-loop routing that follows from it.

**By the end you can**

- Decide between rules, a classical model and an LLM for a stated problem, and defend it with numbers
- Produce and read the classification metrics that decision rests on, including calibration
- Set a confidence threshold for human review from data rather than by feel, and state what it costs
- Build a model selection matrix, and a build-versus-buy case a finance-literate reader would accept

**Skills** Choosing an AI approach, Human-in-the-loop design, AI economics and build-versus-buy, Classical model evaluation

| Resource | Author | Hours | Cost |
|---|---|---:|---|
| [Machine Learning Crash Course](https://developers.google.com/machine-learning/crash-course) | Google | 20 h | Free |
| [Hands-On Machine Learning with Scikit-Learn, Keras, and TensorFlow](https://openlibrary.org/isbn/9781098125974) | Aurélien Géron | 60 h | Paid |
| [Building Machine Learning Powered Applications](https://openlibrary.org/isbn/9781492045113) | Emmanuel Ameisen | 20 h | Paid |
| [Metrics and scoring: quantifying the quality of predictions](https://scikit-learn.org/stable/modules/model_evaluation.html) | scikit-learn | 3 h | Free |
| [Probability calibration](https://scikit-learn.org/stable/modules/calibration.html) | scikit-learn | 2 h | Free |
| [Selective Classification for Deep Neural Networks](https://arxiv.org/abs/1705.08500) | Geifman, El-Yaniv | 3 h | Free |
| [A Gentle Introduction to Conformal Prediction and Distribution-Free Uncertainty Quantification](https://arxiv.org/abs/2107.07511) | Angelopoulos, Bates | 4 h | Free |
| [Designing Machine Learning Systems](https://openlibrary.org/isbn/9781098107963) | Chip Huyen | 30 h | Paid |
| [AI Engineering](https://openlibrary.org/isbn/9781098166304) | Chip Huyen | 30 h | Paid |
| [Models overview](https://docs.claude.com/en/docs/about-claude/models/overview) | Anthropic | 1 h | Free |
| [Stanford CS229: Machine Learning Course \| Summer 2019 (Anand Avati)](https://www.youtube.com/playlist?list=PLoROMvodv4rNH7qL6-efu_q2_bPuy0adh) | Anand Avati, Stanford | 40 h | Free |

> Full specification: [AIE-107-architecture-and-judgement.json](courses/AIE-107-architecture-and-judgement.json)

### 4. AIE-105 — Inference, Cost and Latency Engineering

**3 credits · 50 hours** · prerequisites: AIE-101

The questions a field engineer is actually asked in the room: what will this cost at our volume, and how fast will it feel. Very few candidates can answer either with a number.

**By the end you can**

- Model the token cost of a feature at a given volume, before building it
- Explain the prefill/decode split and what each implies for latency
- Apply caching, batching and streaming, and measure what each bought
- Read a serving stack — paged attention, continuous batching, quantisation — and reason about its trade-offs
- Degrade a model-backed feature gracefully rather than failing it

**Skills** Token economics, Prompt and result caching, Model serving, Batching and throughput, Latency budgets and streaming, Quantisation and compression, Reliability patterns

| Resource | Author | Hours | Cost |
|---|---|---:|---|
| [Efficient Memory Management for Large Language Model Serving with PagedAttention](https://arxiv.org/abs/2309.06180) | Kwon et al. | 3 h | Free |
| [Fast Inference from Transformers via Speculative Decoding](https://arxiv.org/abs/2211.17192) | Leviathan et al. | 3 h | Free |
| [GPTQ: Accurate Post-Training Quantization for Generative Pre-trained Transformers](https://arxiv.org/abs/2210.17323) | Frantar et al. | 3 h | Free |
| [vllm-project/vllm](https://github.com/vllm-project/vllm) | vLLM | 12 h | Free |
| [ggml-org/llama.cpp](https://github.com/ggml-org/llama.cpp) | ggml | 10 h | Free |
| [BerriAI/litellm](https://github.com/BerriAI/litellm) | BerriAI | 4 h | Free |
| [MIT 6.5940 EfficientML.ai](https://www.youtube.com/playlist?list=PL80kAHvQbh-pT4lCkDT53zT8DKmhE0idB) | Song Han, MIT | 25 h | Free |
| [Designing Data-Intensive Applications](https://openlibrary.org/isbn/9781449373320) | Martin Kleppmann | 40 h | Paid |
| [Transformer Inference Arithmetic](https://kipp.ly/transformer-inference-arithmetic/) | kipply | 3 h | Free |
| [Making Deep Learning Go Brrrr From First Principles](https://horace.io/brrr_intro.html) | Horace He | 2 h | Free |
| [Stanford CS336 Language Modeling from Scratch I 2025](https://www.youtube.com/playlist?list=PLoROMvodv4rOY23Y0BoGoBGgQ1zmU_MT_) | Percy Liang, Tatsunori Hashimoto, Stanford | 45 h | Free |
| [Anthropic API documentation](https://docs.claude.com/en/docs/overview) | Anthropic | 6 h | Free |
| [Efficiently Scaling Transformer Inference](https://arxiv.org/abs/2211.05102) | Pope et al. | 4 h | Free |
| [Taming Throughput-Latency Tradeoff in LLM Inference with Sarathi-Serve](https://arxiv.org/abs/2403.02310) | Agrawal et al. | 3 h | Free |
| [AWQ: Activation-aware Weight Quantization for LLM Compression and Acceleration](https://arxiv.org/abs/2306.00978) | Lin et al. | 3 h | Free |
| [LLM.int8(): 8-bit Matrix Multiplication for Transformers at Scale](https://arxiv.org/abs/2208.07339) | Dettmers et al. | 3 h | Free |
| [SmoothQuant: Accurate and Efficient Post-Training Quantization for Large Language Models](https://arxiv.org/abs/2211.10438) | Xiao et al. | 3 h | Free |
| [Medusa: Simple LLM Inference Acceleration Framework with Multiple Decoding Heads](https://arxiv.org/abs/2401.10774) | Cai et al. | 3 h | Free |
| [stanford-cs336/spring2025-lectures](https://github.com/stanford-cs336/spring2025-lectures) | Stanford CS336 | 6 h | Free |
| [Prompt caching](https://docs.claude.com/en/docs/build-with-claude/prompt-caching) | Anthropic | 1 h | Free |
| [Streaming messages](https://docs.claude.com/en/docs/build-with-claude/streaming) | Anthropic | 1 h | Free |
| [Release It!](https://openlibrary.org/isbn/9781680502398) | Michael T. Nygard | 20 h | Paid |

> Full specification: [AIE-105-inference-cost-and-latency.json](courses/AIE-105-inference-cost-and-latency.json)

### 5. AIE-103 — Retrieval and Context Systems

**3 credits · 50 hours** · prerequisites: AIE-101

Retrieval is the default answer to most enterprise AI questions and is wrong about a third of the time. Knowing when not to use it is the differentiator.

**By the end you can**

- Build hybrid retrieval and show where lexical beats dense, with numbers
- Choose a chunking strategy from measured retrieval quality rather than from a blog post
- Evaluate retrieval separately from generation, and locate which half is failing
- Articulate when long context replaces retrieval and when it does not
- Enforce document-level access control through a retrieval pipeline, and prove it holds

**Skills** Embedding retrieval, Chunking strategy, Hybrid and lexical search, Reranking, Evaluating retrieval, Embeddings and vector semantics, Access-controlled retrieval, Ingestion and freshness

| Resource | Author | Hours | Cost |
|---|---|---:|---|
| [Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks](https://arxiv.org/abs/2005.11401) | Lewis et al. | 3 h | Free |
| [Lost in the Middle: How Language Models Use Long Contexts](https://arxiv.org/abs/2307.03172) | Liu et al. | 2 h | Free |
| [RAGAS: Automated Evaluation of Retrieval Augmented Generation](https://arxiv.org/abs/2309.15217) | Es et al. | 2 h | Free |
| [Reciprocal Rank Fusion outperforms Condorcet and individual Rank Learning Methods](https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf) | Cormack, Clarke, Buettcher | 2 h | Free |
| [SentenceTransformers Documentation](https://www.sbert.net/) | Nils Reimers, UKP Lab | 5 h | Free |
| [Vector Databases and Similarity Search](https://www.pinecone.io/learn/vector-database/) | Pinecone | 3 h | Free |
| [explodinggradients/ragas](https://github.com/explodinggradients/ragas) | Exploding Gradients | 6 h | Free |
| [Arize-ai/phoenix](https://github.com/Arize-ai/phoenix) | Arize AI | 6 h | Free |
| [AI Engineering](https://openlibrary.org/isbn/9781098166304) | Chip Huyen | 30 h | Paid |
| [Beyond the Basics of Retrieval Augmented Generation](https://www.youtube.com/watch?v=0nA5QG3087g) | Ben Clavié (Mastering LLMs Conference) | 1.5 h | Free |
| [CMU Advanced NLP Fall 2024 (10): Retrieval and RAG](https://www.youtube.com/watch?v=KfQaYk4k9eM) | Graham Neubig, Carnegie Mellon | 1.5 h | Free |
| [CMU Advanced NLP Fall 2024](https://www.youtube.com/playlist?list=PL8PYTP1V4I8D4BeyjwWczukWq9d8PNyZp) | Graham Neubig, Carnegie Mellon | 30 h | Free |
| [Dense Passage Retrieval for Open-Domain Question Answering](https://arxiv.org/abs/2004.04906) | Karpukhin et al. | 3 h | Free |
| [BEIR: A Heterogenous Benchmark for Zero-shot Evaluation of Information Retrieval Models](https://arxiv.org/abs/2104.08663) | Thakur et al. | 3 h | Free |
| [ColBERT: Efficient and Effective Passage Search via Contextualized Late Interaction over BERT](https://arxiv.org/abs/2004.12832) | Khattab, Zaharia | 3 h | Free |
| [Precise Zero-Shot Dense Retrieval without Relevance Labels](https://arxiv.org/abs/2212.10496) | Gao et al. | 2 h | Free |
| [Searching for Best Practices in Retrieval-Augmented Generation](https://arxiv.org/abs/2407.01219) | Wang et al. | 3 h | Free |
| [Retrieval Augmented Generation or Long-Context LLMs? A Comprehensive Study and Hybrid Approach](https://arxiv.org/abs/2407.16833) | Li et al. | 3 h | Free |
| [Introducing Contextual Retrieval](https://www.anthropic.com/news/contextual-retrieval) | Anthropic | 2 h | Free |
| [Pretrained Models — Sentence Transformers](https://sbert.net/docs/sentence_transformer/pretrained_models.html) | UKP Lab | 1 h | Free |
| [Pretrained Models — Cross Encoder](https://sbert.net/docs/cross_encoder/pretrained_models.html) | UKP Lab | 1 h | Free |
| [OWASP Top 10 for Large Language Model Applications](https://owasp.org/www-project-top-10-for-large-language-model-applications/) | OWASP | 3 h | Free |

> Full specification: [AIE-103-retrieval-and-context-systems.json](courses/AIE-103-retrieval-and-context-systems.json)

### 6. AIE-104 — Agents and Tool-Use Systems

**4 credits · 59 hours** · prerequisites: AIE-101, AIE-102

Multi-step reliability is where demos die. Compounding per-step error is an arithmetic problem before it is a prompting one.

**By the end you can**

- Derive the reliability of an n-step agent from its per-step success rate, and design against it
- Choose between workflow and agent for a given task and defend the choice
- Sandbox tool access to least privilege
- Evaluate an agent on task completion rather than on transcript plausibility
- Red-team your own agent and report what you got it to do that it should not
- Justify a multi-agent design against a single-agent baseline, or decline to build one
- State what personal data enters a model, where it goes, and what the local regulator expects

**Skills** Planning and decomposition, Orchestration patterns, Multi-step reliability, Sandboxing and least privilege, Evaluating agents, Red-teaming and adversarial testing, Multi-agent systems, Privacy and data handling

| Resource | Author | Hours | Cost |
|---|---|---:|---|
| [Building effective agents](https://www.anthropic.com/engineering/building-effective-agents) | Anthropic | 2 h | Free |
| [LLM Powered Autonomous Agents](https://lilianweng.github.io/posts/2023-06-23-agent/) | Lilian Weng | 3 h | Free |
| [ReAct: Synergizing Reasoning and Acting in Language Models](https://arxiv.org/abs/2210.03629) | Yao et al. | 3 h | Free |
| [Toolformer: Language Models Can Teach Themselves to Use Tools](https://arxiv.org/abs/2302.04761) | Schick et al. | 3 h | Free |
| [SWE-bench: Can Language Models Resolve Real-World GitHub Issues?](https://arxiv.org/abs/2310.06770) | Jimenez et al. | 3 h | Free |
| [Welcome to the Agents Course](https://huggingface.co/learn/agents-course/unit0/introduction) | Hugging Face | 20 h | Free |
| [UKGovernmentBEIS/inspect_ai](https://github.com/UKGovernmentBEIS/inspect_ai) | UK AI Safety Institute | 8 h | Free |
| [LLM Agents MOOC Fall 2024](https://www.youtube.com/playlist?list=PLS01nW3RtgopsNLeM936V4TNSsvvVglLc) | Dawn Song, Xinyun Chen — UC Berkeley CS294-196 | 20 h | Free |
| [Agentic AI MOOC Fall 2025](https://www.youtube.com/playlist?list=PLS01nW3RtgoqGkm4UeqNeZLccW-OGc1fJ) | UC Berkeley CS294-196 | 20 h | Free |
| [Agentic AI MOOC \| UC Berkeley CS294-196 Fall 2025 \| LLM Agents Overview](https://www.youtube.com/watch?v=r1qZpYAmqmg) | Yann Dubois — UC Berkeley | 1.5 h | Free |
| [LLM Agents MOOC \| UC Berkeley CS294-196 Fall 2024 \| LLM Reasoning](https://www.youtube.com/watch?v=QL-FS_Zcmyo) | Denny Zhou — Google DeepMind | 1.5 h | Free |
| [LLM Agents MOOC \| UC Berkeley Fall 2024 \| Safe AI Agents + Evidence-based AI Policy by Dawn Song](https://www.youtube.com/watch?v=QAgR4uQ15rc) | Dawn Song — UC Berkeley | 1.5 h | Free |
| [Building more effective AI agents](https://www.youtube.com/watch?v=uhJJgc-0iTQ) | Anthropic | 1 h | Free |
| [Writing effective tools for AI agents](https://www.anthropic.com/engineering/writing-tools-for-agents) | Anthropic | 2 h | Free |
| [Reflexion: Language Agents with Verbal Reinforcement Learning](https://arxiv.org/abs/2303.11366) | Shinn et al. | 3 h | Free |
| [Tree of Thoughts: Deliberate Problem Solving with Large Language Models](https://arxiv.org/abs/2305.10601) | Yao et al. | 3 h | Free |
| [tau-bench: A Benchmark for Tool-Agent-User Interaction in Real-World Domains](https://arxiv.org/abs/2406.12045) | Yao et al. | 3 h | Free |
| [WebArena: A Realistic Web Environment for Building Autonomous Agents](https://arxiv.org/abs/2307.13854) | Zhou et al. | 3 h | Free |
| [SWE-agent: Agent-Computer Interfaces Enable Automated Software Engineering](https://arxiv.org/abs/2405.15793) | Yang et al. | 3 h | Free |
| [Not what you've signed up for: Compromising Real-World LLM-Integrated Applications with Indirect Prompt Injection](https://arxiv.org/abs/2302.12173) | Greshake et al. | 3 h | Free |
| [Universal and Transferable Adversarial Attacks on Aligned Language Models](https://arxiv.org/abs/2307.15043) | Zou et al. | 3 h | Free |
| [OWASP Top 10 for Large Language Model Applications](https://owasp.org/www-project-top-10-for-large-language-model-applications/) | OWASP | 3 h | Free |
| [Model Context Protocol](https://modelcontextprotocol.io/) | Anthropic | 4 h | Free |
| [How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system) | Anthropic | 2 h | Free |
| [Why Do Multi-Agent LLM Systems Fail?](https://arxiv.org/abs/2503.13657) | Cemri et al. | 4 h | Free |
| [AutoGen: Enabling Next-Gen LLM Applications via Multi-Agent Conversation](https://arxiv.org/abs/2308.08155) | Wu et al. | 3 h | Free |
| [MetaGPT: Meta Programming for A Multi-Agent Collaborative Framework](https://arxiv.org/abs/2308.00352) | Hong et al. | 3 h | Free |
| [Generative Agents: Interactive Simulacra of Human Behavior](https://arxiv.org/abs/2304.03442) | Park et al. | 3 h | Free |
| [Advisory Guidelines on use of Personal Data in AI Recommendation and Decision Systems](https://www.pdpc.gov.sg/organisations/regulations-decisions/regulatory-guidance/advisory-guidelines-on-use-of-personal-data-in-ai-recommendation-and-decision-systems) | PDPC Singapore | 3 h | Free |

> Full specification: [AIE-104-agents-and-tool-use-systems.json](courses/AIE-104-agents-and-tool-use-systems.json)

### 7. AIE-106 — Speech and Multimodal Systems

**4 credits · 62 hours** · prerequisites: AIE-101, AIE-105

Domain depth for voice AI specifically, where existing shipped work already provides a foundation and the target employers live.

**By the end you can**

- Build a full ASR → reasoning → TTS loop and account for every millisecond in the budget
- Explain why transport choice dominates perceived latency in voice agents
- Measure ASR quality properly, including on accented and code-switched speech
- Handle barge-in, turn-taking and partial results
- Decide whether a document problem needs vision at all, and show the measurement behind the answer

**Skills** Speech recognition, Speech synthesis, Streaming audio transport, Conversational latency budgets, Voice agents, Vision-language models, Document understanding

| Resource | Author | Hours | Cost |
|---|---|---:|---|
| [Robust Speech Recognition via Large-Scale Weak Supervision](https://arxiv.org/abs/2212.04356) | Radford et al. | 4 h | Free |
| [Conformer: Convolution-augmented Transformer for Speech Recognition](https://arxiv.org/abs/2005.08100) | Gulati et al. | 3 h | Free |
| [openai/whisper](https://github.com/openai/whisper) | OpenAI | 6 h | Free |
| [Welcome to the Hugging Face Audio course!](https://huggingface.co/learn/audio-course/chapter0/introduction) | Hugging Face | 20 h | Free |
| [WebRTC for the Curious](https://webrtcforthecurious.com/) | WebRTC for the Curious | 10 h | Free |
| [ElevenLabs Documentation](https://elevenlabs.io/docs/overview) | ElevenLabs | 6 h | Free |
| [Speech and Language Processing](https://web.stanford.edu/~jurafsky/slp3/) | Dan Jurafsky, James H. Martin | 60 h | Free |
| [CS244S @ Stanford: LLM Based Spoken Language Processing 2025](https://www.youtube.com/watch?v=HqG79i7qyjY) | Stanford CS224S guest lecture (hosted by Gridspace) | 1.5 h | Free |
| [Understand and improve voice agent latency](https://livekit.com/blog/understand-and-improve-agent-latency) | LiveKit | 2 h | Free |
| [wav2vec 2.0: A Framework for Self-Supervised Learning of Speech Representations](https://arxiv.org/abs/2006.11477) | Baevski et al. | 3 h | Free |
| [HuBERT: Self-Supervised Speech Representation Learning by Masked Prediction of Hidden Units](https://arxiv.org/abs/2106.07447) | Hsu et al. | 3 h | Free |
| [Moshi: a speech-text foundation model for real-time dialogue](https://arxiv.org/abs/2410.00037) | Défossez et al. | 4 h | Free |
| [Neural Codec Language Models are Zero-Shot Text to Speech Synthesizers](https://arxiv.org/abs/2301.02111) | Wang et al. | 3 h | Free |
| [FastSpeech 2: Fast and High-Quality End-to-End Text to Speech](https://arxiv.org/abs/2006.04558) | Ren et al. | 3 h | Free |
| [SeamlessM4T: Massively Multilingual & Multimodal Machine Translation](https://arxiv.org/abs/2308.11596) | Seamless Communication et al. | 3 h | Free |
| [WhisperX: Time-Accurate Speech Transcription of Long-Form Audio](https://arxiv.org/abs/2303.00747) | Bain et al. | 2 h | Free |
| [Common Voice: A Massively-Multilingual Speech Corpus](https://arxiv.org/abs/1912.06670) | Ardila et al. | 2 h | Free |
| [On the End-to-End Solution to Mandarin-English Code-switching Speech Recognition](https://arxiv.org/abs/1811.00241) | Zeng et al., NTU Singapore | 3 h | Free |
| [CS-Dialogue: A 104-Hour Dataset of Spontaneous Mandarin-English Code-Switching Dialogues for Speech Recognition](https://arxiv.org/abs/2502.18913) | arXiv 2502.18913 | 2 h | Free |
| [Learning Transferable Visual Models From Natural Language Supervision](https://arxiv.org/abs/2103.00020) | Radford et al. | 3 h | Free |
| [Visual Instruction Tuning](https://arxiv.org/abs/2304.08485) | Liu et al. | 3 h | Free |
| [Qwen2-VL: Enhancing Vision-Language Model's Perception of the World at Any Resolution](https://arxiv.org/abs/2409.12191) | Wang et al. | 3 h | Free |
| [OCR-free Document Understanding Transformer](https://arxiv.org/abs/2111.15664) | Kim et al. | 3 h | Free |
| [LayoutLMv3: Pre-training for Document AI with Unified Text and Image Masking](https://arxiv.org/abs/2204.08387) | Huang et al. | 3 h | Free |
| [Nougat: Neural Optical Understanding for Academic Documents](https://arxiv.org/abs/2308.13418) | Blecher et al. | 2 h | Free |
| [DocVQA: A Dataset for VQA on Document Images](https://arxiv.org/abs/2007.00398) | Mathew et al. | 2 h | Free |
| [Flamingo: a Visual Language Model for Few-Shot Learning](https://arxiv.org/abs/2204.14198) | Alayrac et al. | 3 h | Free |
| [Evaluation metrics for ASR](https://huggingface.co/learn/audio-course/chapter5/evaluation) | Hugging Face | 1 h | Free |
| [Streaming \| ElevenLabs Documentation](https://elevenlabs.io/docs/api-reference/streaming) | ElevenLabs | 1 h | Free |
| [Latency optimization \| ElevenLabs Documentation](https://elevenlabs.io/docs/best-practices/latency-optimization) | ElevenLabs | 1 h | Free |
| [Vision](https://docs.claude.com/en/docs/build-with-claude/vision) | Anthropic | 1 h | Free |

> Full specification: [AIE-106-speech-and-multimodal-systems.json](courses/AIE-106-speech-and-multimodal-systems.json)

## Block II — Depth

*What makes this a programme rather than a certificate. Builds the models rather than calling them.*

### 8. AIE-201 — Mathematics for Machine Learning

**3 credits · 70 hours**

Targeted, not an undergraduate sequence. Only what is needed to read the papers and understand what training is doing.

**By the end you can**

- Manipulate matrices, eigendecompositions and projections fluently enough to read architecture papers
- Differentiate through a computational graph by hand
- Reason about distributions, expectation and variance in a loss function
- Explain gradient descent and its common variants from the mathematics, not the metaphor

**Skills** Linear algebra, Calculus and differentiation, Probability and statistics, Optimisation

| Resource | Author | Hours | Cost |
|---|---|---:|---|
| [Mathematics for Machine Learning](https://mml-book.github.io/) | Deisenroth, Faisal, Ong | 60 h | Free |
| [Essence of linear algebra](https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab) | 3Blue1Brown | 5 h | Free |
| [Essence of calculus](https://www.youtube.com/playlist?list=PLZHQObOWTQDMsr9K-rj53DwVRMYO3t5Yr) | 3Blue1Brown | 4 h | Free |
| [Gilbert Strang lectures on Linear Algebra (MIT)](https://www.youtube.com/playlist?list=PL49CF3715CB9EF31D) | Gilbert Strang, MIT OCW | 35 h | Free |
| [Linear Algebra \| Mathematics \| MIT OpenCourseWare](https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/) | MIT OCW | 40 h | Free |

> Full specification: [AIE-201-mathematics-for-machine-learning.json](courses/AIE-201-mathematics-for-machine-learning.json)

### 9. AIE-202 — Machine Learning Foundations

**3 credits · 60 hours** · prerequisites: AIE-201

The classical grounding that makes deep learning legible rather than magical, and the source of most evaluation intuition.

**By the end you can**

- Implement linear and logistic regression, and a tree ensemble, from scratch
- Diagnose bias and variance from learning curves
- Choose and justify a metric for an imbalanced problem
- Explain what a model is fitting, and to what

**Skills** Supervised learning, Unsupervised learning, Feature engineering, Classical model evaluation

| Resource | Author | Hours | Cost |
|---|---|---:|---|
| [Stanford CS229: Machine Learning Course \| Summer 2019 (Anand Avati)](https://www.youtube.com/playlist?list=PLoROMvodv4rNH7qL6-efu_q2_bPuy0adh) | Anand Avati, Stanford | 40 h | Free |
| [Hands-On Machine Learning with Scikit-Learn, Keras, and TensorFlow](https://openlibrary.org/isbn/9781098125974) | Aurélien Géron | 60 h | Paid |
| [Machine Learning Crash Course](https://developers.google.com/machine-learning/crash-course) | Google | 20 h | Free |
| [Building Machine Learning Powered Applications](https://openlibrary.org/isbn/9781492045113) | Emmanuel Ameisen | 20 h | Paid |

### 10. AIE-203 — Deep Learning

**3 credits · 65 hours** · prerequisites: AIE-202

Backpropagation built by hand, then the training dynamics that decide whether a network learns anything.

**By the end you can**

- Implement reverse-mode autodiff from scratch and use it to train a network
- Debug a training run from its loss curve
- Apply and justify normalisation, initialisation and regularisation choices
- Read an architecture diagram and implement it

**Skills** Backpropagation and autodiff, Network architectures, Training dynamics, Regularisation and generalisation, PyTorch, Python and the numeric stack

| Resource | Author | Hours | Cost |
|---|---|---:|---|
| [Neural Networks: Zero to Hero](https://www.youtube.com/playlist?list=PLAqhIrjkxbuWI23v9cThsA9GvCAUhRvKZ) | Andrej Karpathy | 25 h | Free |
| [Neural networks](https://www.youtube.com/playlist?list=PLZHQObOWTQDNU6R1_67000Dx_ZCJB-3pi) | 3Blue1Brown | 5 h | Free |
| [Practical Deep Learning for Coders](https://course.fast.ai/) | Jeremy Howard, fast.ai | 60 h | Free |
| [Dive into Deep Learning](https://d2l.ai/) | Zhang, Lipton, Li, Smola | 80 h | Free |
| [CS231n Winter 2016](https://www.youtube.com/playlist?list=PLkt2uSq6rBVctENoVBg1TpCC7OQi31AlC) | Fei-Fei Li, Andrej Karpathy, Justin Johnson | 30 h | Free |
| [MIT Introduction to Deep Learning \| 6.S191](https://www.youtube.com/playlist?list=PLtBw6njQRU-rwp5__7C0oIVt26ZgjG9NI) | Alexander Amini, MIT | 15 h | Free |
| [Deep Learning](https://www.deeplearningbook.org/) | Goodfellow, Bengio, Courville | 80 h | Free |
| [Welcome to PyTorch Tutorials](https://pytorch.org/tutorials/) | PyTorch | 15 h | Free |
| [NumPy: the absolute basics for beginners](https://numpy.org/doc/stable/user/absolute_beginners.html) | NumPy | 4 h | Free |
| [Understanding LSTM Networks](https://colah.github.io/posts/2015-08-Understanding-LSTMs/) | Christopher Olah | 2 h | Free |

### 11. AIE-204 — Transformers and LLMs from Scratch

**4 credits · 80 hours** · prerequisites: AIE-203

The flagship of Block II. Ends with a working GPT you can explain line by line — the single most legible artifact in the programme.

**By the end you can**

- Implement multi-head self-attention from scratch, without reference
- Train a small GPT end to end, from tokeniser to sampling
- Explain every architectural choice in a modern decoder and what it is buying
- Reproduce a published result and account for the gap where you fail to

**Skills** Attention, Transformer architecture, Implementing a transformer from scratch, Tokenisation

| Resource | Author | Hours | Cost |
|---|---|---:|---|
| [Let's build GPT: from scratch, in code, spelled out](https://www.youtube.com/watch?v=kCc8FmEb1nY) | Andrej Karpathy | 6 h | Free |
| [Let's reproduce GPT-2 (124M)](https://www.youtube.com/watch?v=l8pRSuU81PU) | Andrej Karpathy | 8 h | Free |
| [Stanford CS336 Language Modeling from Scratch I 2025](https://www.youtube.com/playlist?list=PLoROMvodv4rOY23Y0BoGoBGgQ1zmU_MT_) | Percy Liang, Tatsunori Hashimoto, Stanford | 45 h | Free |
| [karpathy/nanoGPT](https://github.com/karpathy/nanoGPT) | Andrej Karpathy | 15 h | Free |
| [karpathy/minGPT](https://github.com/karpathy/minGPT) | Andrej Karpathy | 8 h | Free |
| [Attention Is All You Need](https://arxiv.org/abs/1706.03762) | Vaswani et al. | 4 h | Free |
| [The Annotated Transformer](https://nlp.seas.harvard.edu/annotated-transformer/) | Harvard NLP | 6 h | Free |
| [The Illustrated Transformer](https://jalammar.github.io/illustrated-transformer/) | Jay Alammar | 2 h | Free |
| [Attention and Augmented Recurrent Neural Networks](https://distill.pub/2016/augmented-rnns/) | Olah, Carter | 2 h | Free |
| [Build a Large Language Model (From Scratch)](https://openlibrary.org/isbn/9781633437166) | Sebastian Raschka | 40 h | Paid |
| [Stanford CS224N: Natural Language Processing with Deep Learning](https://www.youtube.com/playlist?list=PLoROMvodv4rOSH4v6133s9LFPRHjEmbmJ) | Christopher Manning, Stanford | 35 h | Free |
| [Stanford CS25 - Transformers United](https://www.youtube.com/playlist?list=PLoROMvodv4rNiJRchCzutFw5ItR_Z27CM) | Stanford | 20 h | Free |
| [Scaling Laws for Neural Language Models](https://arxiv.org/abs/2001.08361) | Kaplan et al. | 3 h | Free |
| [Training Compute-Optimal Large Language Models](https://arxiv.org/abs/2203.15556) | Hoffmann et al. | 3 h | Free |

### 12. AIE-205 — Fine-tuning and Post-training

**3 credits · 60 hours** · prerequisites: AIE-204, AIE-102

Where a base model becomes a product, and where evaluation discipline from AIE-102 stops being optional.

**By the end you can**

- Curate a fine-tuning dataset and defend every inclusion rule
- Run LoRA fine-tuning and measure whether it actually helped
- Explain preference optimisation and implement DPO
- Detect and report regression on capabilities you did not intend to change

**Skills** Training data curation, Supervised fine-tuning, Parameter-efficient fine-tuning, Preference optimisation, Alignment techniques

| Resource | Author | Hours | Cost |
|---|---|---:|---|
| [LoRA: Low-Rank Adaptation of Large Language Models](https://arxiv.org/abs/2106.09685) | Hu et al. | 3 h | Free |
| [Direct Preference Optimization: Your Language Model is Secretly a Reward Model](https://arxiv.org/abs/2305.18290) | Rafailov et al. | 4 h | Free |
| [Training language models to follow instructions with human feedback](https://arxiv.org/abs/2203.02155) | Ouyang et al. | 4 h | Free |
| [Llama 2: Open Foundation and Fine-Tuned Chat Models](https://arxiv.org/abs/2307.09288) | Touvron et al. | 5 h | Free |
| [Constitutional AI: Harmlessness from AI Feedback](https://arxiv.org/abs/2212.08073) | Bai et al. | 5 h | Free |
| [huggingface/trl](https://github.com/huggingface/trl) | Hugging Face | 12 h | Free |
| [huggingface/peft](https://github.com/huggingface/peft) | Hugging Face | 8 h | Free |
| [huggingface/transformers](https://github.com/huggingface/transformers) | Hugging Face | 15 h | Free |
| [Introduction - Hugging Face NLP Course](https://huggingface.co/learn/nlp-course/chapter1/1) | Hugging Face | 20 h | Free |
| [Deep Dive into LLMs like ChatGPT](https://www.youtube.com/watch?v=7xTGNNLPyMI) | Andrej Karpathy | 4 h | Free |
| [Build a Large Language Model (From Scratch)](https://openlibrary.org/isbn/9781633437166) | Sebastian Raschka | 40 h | Paid |

### 13. AIE-207 — Systems for Machine Learning

**3 credits · 60 hours** · prerequisites: AIE-204

The hardware reality underneath everything above. Explains why architectures look the way they do.

**By the end you can**

- Explain the memory hierarchy of a GPU and why attention is IO-bound
- Profile a training step and identify the bottleneck
- Describe data, tensor and pipeline parallelism and when each applies
- Reason about the arithmetic intensity of an operation

**Skills** GPU execution model, Distributed training

| Resource | Author | Hours | Cost |
|---|---|---:|---|
| [FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness](https://arxiv.org/abs/2205.14135) | Dao et al. | 4 h | Free |
| [Switch Transformers: Scaling to Trillion Parameter Models with Simple and Efficient Sparsity](https://arxiv.org/abs/2101.03961) | Fedus et al. | 3 h | Free |
| [karpathy/llm.c](https://github.com/karpathy/llm.c) | Andrej Karpathy | 20 h | Free |
| [MIT 6.5940 EfficientML.ai](https://www.youtube.com/playlist?list=PL80kAHvQbh-pT4lCkDT53zT8DKmhE0idB) | Song Han, MIT | 25 h | Free |
| [pytorch/pytorch](https://github.com/pytorch/pytorch) | PyTorch | 10 h | Free |
| [Stanford CS336 Language Modeling from Scratch I 2025](https://www.youtube.com/playlist?list=PLoROMvodv4rOY23Y0BoGoBGgQ1zmU_MT_) | Percy Liang, Tatsunori Hashimoto, Stanford | 45 h | Free |

### 14. AIE-206 — Reinforcement Learning

**3 credits · 65 hours** · prerequisites: AIE-201, AIE-203

Lowest immediate employability of the deep track, and the necessary grounding for RLHF and for reasoning-model training. Placed late on purpose.

**By the end you can**

- Formalise a problem as an MDP
- Implement a value-based and a policy-gradient agent
- Explain the credit assignment problem and how RLHF inherits it
- Connect policy optimisation to preference optimisation from AIE-205

**Skills** Markov decision processes, Value-based methods, Policy gradient methods, RLHF

| Resource | Author | Hours | Cost |
|---|---|---:|---|
| [Reinforcement Learning: An Introduction](https://openlibrary.org/isbn/9780262039246) | Richard S. Sutton, Andrew G. Barto | 60 h | Free |
| [Welcome to Spinning Up in Deep RL!](https://spinningup.openai.com/en/latest/) | OpenAI | 40 h | Free |
| [openai/spinningup](https://github.com/openai/spinningup) | OpenAI | 20 h | Free |
| [Welcome to the Deep Reinforcement Learning Course](https://huggingface.co/learn/deep-rl-course/unit0/introduction) | Hugging Face | 30 h | Free |

### 15. AIE-300 — Capstone

**6 credits · 120 hours** · prerequisites: AIE-102, AIE-103, AIE-104, AIE-105, AIE-106, AIE-204, AIE-107

One substantial system that exercises the whole programme, shipped publicly and defended aloud. This is the artifact the transcript is built around.

**By the end you can**

- Ship a system that a stranger can use, with published evaluation results
- Report honestly on what did not work and what the numbers actually say
- Defend the design under unscripted questioning
- Write it up so a hiring manager can assess it in ten minutes

## Skill map

Skills are a separate graph from courses — courses, items and artifacts all map onto them many-to-many. That is what makes the tree structural rather than decorative, and what makes this forkable to another domain.

**Engineering**

| Skill | Depends on |
|---|---|
| Python and the numeric stack | — |
| PyTorch | Python and the numeric stack |
| Deploying and operating services | — |

**Mathematics**

| Skill | Depends on |
|---|---|
| Linear algebra | — |
| Calculus and differentiation | — |
| Probability and statistics | — |
| Optimisation | Linear algebra, Calculus and differentiation |

**Machine Learning**

| Skill | Depends on |
|---|---|
| Supervised learning | Linear algebra, Probability and statistics |
| Unsupervised learning | Linear algebra |
| Feature engineering | Supervised learning |
| Classical model evaluation | Probability and statistics |

**Deep Learning**

| Skill | Depends on |
|---|---|
| Backpropagation and autodiff | Calculus and differentiation, Linear algebra |
| Network architectures | Backpropagation and autodiff |
| Training dynamics | Backpropagation and autodiff, Optimisation |
| Regularisation and generalisation | Training dynamics |

**Nlp**

| Skill | Depends on |
|---|---|
| Tokenisation | — |
| Embeddings and vector semantics | Linear algebra |

**Transformers**

| Skill | Depends on |
|---|---|
| Attention | Linear algebra, Backpropagation and autodiff |
| Transformer architecture | Attention, Network architectures |
| Implementing a transformer from scratch | Transformer architecture, PyTorch |

**Llm Application**

| Skill | Depends on |
|---|---|
| Prompting as engineering | — |
| Structured output and schema enforcement | Prompting as engineering |
| Tool use and function calling | Structured output and schema enforcement |
| Context management | Prompting as engineering |
| Failure modes and hallucination | Prompting as engineering |

**Evaluation**

| Skill | Depends on |
|---|---|
| Eval design | Failure modes and hallucination |
| Building eval datasets | Eval design |
| LLM-as-judge and its pathologies | Eval design |
| Statistical significance in evals | Probability and statistics, Eval design |
| Calibrating automated scores to human judgement | LLM-as-judge and its pathologies, Statistical significance in evals |
| Regression testing and CI for models | Building eval datasets |
| Tracing and production observability | Eval design, Deploying and operating services |

**Retrieval**

| Skill | Depends on |
|---|---|
| Embedding retrieval | Embeddings and vector semantics |
| Chunking strategy | Embedding retrieval |
| Hybrid and lexical search | Embedding retrieval |
| Reranking | Hybrid and lexical search |
| Evaluating retrieval | Embedding retrieval, Eval design |
| Access-controlled retrieval | Embedding retrieval |
| Ingestion and freshness | Chunking strategy |

**Agents**

| Skill | Depends on |
|---|---|
| Planning and decomposition | Tool use and function calling |
| Orchestration patterns | Planning and decomposition |
| Multi-step reliability | Orchestration patterns, Eval design |
| Sandboxing and least privilege | Orchestration patterns |
| Evaluating agents | Multi-step reliability, Building eval datasets |
| Multi-agent systems | Orchestration patterns, Evaluating agents |

**Inference**

| Skill | Depends on |
|---|---|
| Token economics | Tokenisation |
| Prompt and result caching | Token economics |
| Batching and throughput | Model serving |
| Model serving | Deploying and operating services |
| Latency budgets and streaming | Model serving |
| Quantisation and compression | Training dynamics |
| GPU execution model | PyTorch |
| Distributed training | GPU execution model, Training dynamics |
| Reliability patterns | Deploying and operating services |

**Speech**

| Skill | Depends on |
|---|---|
| Speech recognition | Network architectures |
| Speech synthesis | Network architectures |
| Streaming audio transport | Latency budgets and streaming |
| Conversational latency budgets | Streaming audio transport |
| Voice agents | Speech recognition, Speech synthesis, Conversational latency budgets, Orchestration patterns |

**Fine Tuning**

| Skill | Depends on |
|---|---|
| Training data curation | Building eval datasets |
| Supervised fine-tuning | Transformer architecture, Training data curation |
| Parameter-efficient fine-tuning | Supervised fine-tuning |
| Preference optimisation | Supervised fine-tuning |

**Reinforcement Learning**

| Skill | Depends on |
|---|---|
| Markov decision processes | Probability and statistics |
| Value-based methods | Markov decision processes |
| Policy gradient methods | Markov decision processes, Optimisation |
| RLHF | Policy gradient methods, Preference optimisation |

**Safety**

| Skill | Depends on |
|---|---|
| Alignment techniques | Preference optimisation |
| Red-teaming and adversarial testing | Eval design, Failure modes and hallucination |
| Privacy and data handling | Context management |

**Multimodal**

| Skill | Depends on |
|---|---|
| Vision-language models | Network architectures |
| Document understanding | Vision-language models, Structured output and schema enforcement |

**Architecture**

| Skill | Depends on |
|---|---|
| Choosing an AI approach | Failure modes and hallucination, Eval design |
| Human-in-the-loop design | Choosing an AI approach, Classical model evaluation |
| AI economics and build-versus-buy | Token economics |

### Accepted inversions

Applied-first ordering means some skills are used before they are derived. Deliberate: you learn to measure a judge before you can prove the statistics, and to call attention before you can differentiate it. Each pair below is an accepted, recorded exception; anything not listed here is a genuine ordering bug.

- **Embeddings and vector semantics** is taught before **Linear algebra**
- **Statistical significance in evals** is taught before **Probability and statistics**
- **Token economics** is taught before **Tokenisation**
- **Quantisation and compression** is taught before **Training dynamics**
- **Speech recognition** is taught before **Network architectures**
- **Speech synthesis** is taught before **Network architectures**
- **Vision-language models** is taught before **Network architectures**
- **Classical model evaluation** is taught before **Probability and statistics**

---

*Generated by `scripts/corpus/render.py`. Edit the JSON, not this file.*
