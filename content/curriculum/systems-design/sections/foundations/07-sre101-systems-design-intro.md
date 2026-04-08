---
slug: sre101-intro
title: "Systems Design (Intro)"
orderIndex: 6
estimatedMinutes: 20
sourceTitle: "School of SRE - Systems Design (Level 101)"
sourceAuthor: "LinkedIn School of SRE"
sourceUrl: "https://raw.githubusercontent.com/linkedin/school-of-sre/main/courses/level101/systems_design/intro.md"
sourceLicense: "CC BY 4.0"
attributionText: "Content adapted from LinkedIn School of SRE (CC BY 4.0)."
---
## Goal

Learn systems design (intro) using a vetted, open-licensed reference and apply it in interview-style design discussions.

## Core concepts

```mermaid
flowchart TD
  A["Systems Design (Intro)"] --> B["Key_components"]
  B --> C["Tradeoffs"]
```

# Systems Design

## Prerequisites

Fundamentals of common software system components:

- [Linux Basics](https://linkedin.github.io/school-of-sre/level101/linux_basics/intro/)
- [Linux Networking](https://linkedin.github.io/school-of-sre/level101/linux_networking/intro/)
- Databases RDBMS
- [NoSQL Concepts](https://linkedin.github.io/school-of-sre/level101/databases_nosql/intro/)

## What to expect from this course

Thinking about and designing for scalability, availability, and reliability of large scale software systems.

## What is not covered under this course

Individual software components’ scalability and reliability concerns like e.g. Databases, while the same scalability principles and thinking can be applied, these individual components have their own specific nuances when scaling them and thinking about their reliability.

More light will be shed on concepts rather than on setting up and configuring components like Loadbalancers to achieve scalability, availability, and reliability of systems

## Course Contents

- [Introduction](https://linkedin.github.io/school-of-sre/level101/systems_design/intro/#backstory)
- [Scalability](https://linkedin.github.io/school-of-sre/level101/systems_design/scalability/)
- [High Availability](https://linkedin.github.io/school-of-sre/level101/systems_design/availability/)
- [Fault Tolerance](https://linkedin.github.io/school-of-sre/level101/systems_design/fault-tolerance/)


## Introduction

So, how do you go about learning to design a system?

"*Like most great questions, it showed a level of naivety that was breathtaking. The only short answer I could give was, essentially, that you learned how to design a system by designing systems and finding out what works and what doesn’t work.*"&mdash;Jim Waldo, Sun Microsystems, On System Design

    
As software and hardware systems have multiple moving parts, we need to think about how those parts will grow, their failure modes, their inter-dependencies, how it will impact the users and the business.

There is no one-shot method or way to learn or do system design, we only learn to design systems by designing and iterating on them.

This course will be a starter to make one think about _scalability_, _availability_, and _fault tolerance_ during systems design.

## Backstory

Let’s design a simple content sharing application where users can share photos, media in our application which can be liked by their friends. Let’s start with a simple design of the application and evolve it as we learn system design concepts.


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
