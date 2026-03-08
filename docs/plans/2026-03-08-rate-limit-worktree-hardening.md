# Rate Limit and Worktree Hardening Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Promote #27 from RFC-only status toward executable governance while making task worktree isolation fail-closed for repo agents.

**Architecture:** Add fail-fast local git hooks + bootstrap/install scripts to block controlplane-root edits, and add a behavioral AI rate-limit coverage gate backed by runtime governance config and tests. Update repo docs/prompts plus the local openspec GitHub delivery skill so all agent entrypoints converge on the same workflow.

**Tech Stack:** Bash, Python unittest, TypeScript/tsx, Git hooks, GitHub Actions, OpenSpec docs.

---
