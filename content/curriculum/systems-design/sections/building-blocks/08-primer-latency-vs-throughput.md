---
slug: primer-latency-vs-throughput
title: "Latency vs Throughput"
orderIndex: 7
estimatedMinutes: 15
sourceTitle: "System Design Primer"
sourceAuthor: "Donne Martin"
sourceUrl: "https://github.com/donnemartin/system-design-primer#latency-vs-throughput"
sourceLicense: "CC BY 4.0"
attributionText: "Content adapted from Donne Martin, System Design Primer (CC BY 4.0)."
---
## Goal

Learn latency vs throughput using a vetted, open-licensed reference and apply it in interview-style design discussions.

## Core concepts

```mermaid
flowchart TD
  A["Latency vs Throughput"] --> B["Key_components"]
  B --> C["Tradeoffs"]
```

## Latency vs throughput

**Latency** is the time to perform some action or to produce some result.

**Throughput** is the number of such actions or results per unit of time.

Generally, you should aim for **maximal throughput** with **acceptable latency**.

### Source(s) and further reading

* [Understanding latency vs throughput](https://community.cadence.com/cadence_blogs_8/b/fv/posts/understanding-latency-vs-throughput)


## Trade-offs

- Latency: Identify where you add hops (cache, LB, queues) and how it shifts p95/p99.
- Cost: Call out which components scale linearly vs super-linearly with traffic.
- Consistency: State which data must be strongly consistent vs can be eventual.
- Complexity: Note operational overhead (deployments, oncall, observability).

## Failure modes

- Single points of failure and missing failover paths.
- Retry storms, overload collapse, and cache stampedes.
- Hot partitions / uneven traffic distribution and its impact on SLOs.

## Interview prompts

1. What are the top 2 constraints that drive this design choice?
2. What breaks first at 10× traffic, and how do you know?
3. What would you simplify for v1 and why?

## Mini design drill (10-15 min)

- Pick a product you use daily and identify where this concept appears in its architecture.
- Write 3 concrete SLOs and name the metrics you would monitor.

## Checkpoint quiz

1. What problem does this concept solve?
2. What is the main trade-off it introduces?
3. Name one common failure mode and one mitigation.
4. Where would you apply it in a URL shortener or chat system?
5. What metric would tell you it is working?
