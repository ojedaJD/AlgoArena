---
slug: apis-and-data-modeling
title: "APIs and Data Modeling"
orderIndex: 2
estimatedMinutes: 25
---

## Goal

Learn to design clean REST/gRPC APIs and translate requirements into data models during a systems design interview.

## Core concepts

- Start from use-cases, then derive endpoints and entities.
- Define API contracts: request/response shapes, pagination, filtering, idempotency.
- Pick an interface style: REST (resource-oriented) vs RPC/gRPC (operation-oriented).
- Model data around access patterns: primary keys, indexes, write paths, read paths.
- Consistency and invariants: what must be strongly consistent vs can be eventual.

```mermaid
flowchart LR
  A[Requirements] --> B[Use cases]
  B --> C[API surface]
  C --> D[Entities]
  D --> E[Storage model]
  E --> F[Indexes & access patterns]
  F --> G[Edge cases & failure modes]
```

## Trade-offs

- **REST vs gRPC**: REST is ubiquitous and debuggable; gRPC is strongly typed and efficient but needs stronger client tooling and gateway support.
- **Normalized vs denormalized**: normalization reduces duplication; denormalization improves read performance and reduces joins at the cost of write complexity.
- **Strong vs eventual consistency**: strong simplifies reasoning; eventual improves availability/latency but requires conflict/ordering strategies.
- **Opaque IDs vs natural keys**: opaque IDs are stable and avoid PII leakage; natural keys are human-friendly but harder to evolve.

## Failure modes

- **Ambiguous ownership**: unclear “source of truth” causes double-writes and drift.
- **Chatty APIs**: too many round trips increases tail latency and failure probability.
- **Unbounded queries**: missing limits/indexes leads to slow queries and outages.
- **No versioning plan**: contract changes break clients; mitigate with additive changes and versioned fields.

## Interview prompts

1. Design the API + data model for a URL shortener: create, resolve, analytics.
2. Design the API for a chat service: send message, fetch history, read receipts.
3. What invariants must be strongly consistent (e.g., uniqueness, balance, quota)?

## Mini design drill (10-15 min)

Pick one: “Create short link” or “Send message”.

- Write a single request/response contract (JSON).
- Identify the tables/collections needed and primary keys.
- List the top 3 queries and the indexes that support them.
- Call out one place you’d denormalize and why.

## Checkpoint quiz

1. When do you prefer cursor-based pagination over offset-based pagination?
2. Give an example of an invariant that should be strongly consistent.
3. What’s one common reason a “simple” data model fails at scale?
