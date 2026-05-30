---
name: FFmpeg isCancelling stale closure
description: useFFmpeg.js generateVideos callback must read isCancelling from store, not from hook scope destructuring
---

## Rule
Inside the `generateVideos` useCallback, all cancellation checks must use `useAppStore.getState().isCancelling` rather than the destructured `isCancelling` captured at render time.

**Why:** The `generateVideos` function is async and runs over many iterations. The `isCancelling` variable destructured from `useAppStore()` is captured once at render and goes stale during async processing. When the user clicks cancel, `isCancelling` becomes true in the store but the running async closure still sees the old `false` value — so cancellation is silently ignored.

**How to apply:** Replace every `if (isCancelling)` and `!isCancelling` check *inside* the async body with `useAppStore.getState().isCancelling`. The dependency array can still list `isCancelling` to re-create the callback when it changes.
