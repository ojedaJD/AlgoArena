---
slug: sre102-conclusion
title: "Conclusion"
orderIndex: 15
estimatedMinutes: 10
sourceTitle: "School of SRE - System Design Conclusion (Level 102)"
sourceAuthor: "LinkedIn School of SRE"
sourceUrl: "https://raw.githubusercontent.com/linkedin/school-of-sre/main/courses/level102/system_design/conclusion.md"
sourceLicense: "CC BY 4.0"
attributionText: "Content adapted from LinkedIn School of SRE (CC BY 4.0)."
---
## Goal

Learn conclusion using a vetted, open-licensed reference and apply it in interview-style design discussions.

## Core concepts

```mermaid
flowchart TD
  A["Conclusion"] --> B["Key_components"]
  B --> C["Tradeoffs"]
```

We have looked at designing a sytem from the scratch, scaling it up from a single server to multiple datacenters and hundreds of thousands of users. However, you might have (rightly!) guessed that there is a lot more to system design than what we have covered so far. This course should give you a sweeping glance at the things that are fundamental to any system design process. Specific solutions implemented, frameworks and orchestration systems used evolve rapidly. However, the guiding principles remain the same. We hope you this course helped in getting you started along the right direction and that you have fun designing systems and solving interesting problems.


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
