## Performance & Architecture Rules

### React High-Frequency State
Never store high-frequency changing state (e.g., media playback progress, scroll positions, mouse coordinates) in global React Contexts or high-level parent components. This causes severe re-render cascades. 
**Required Approach**: Use `requestAnimationFrame` combined with local `useRef` direct DOM manipulations, or tightly scoped local component state, to visualize fast-changing data without blocking the main thread.

### Asynchronous Operation Deduplication
When implementing expensive backend operations (such as child processes, CLI executions like `yt-dlp`, or heavy API fetches), always implement a concurrency lock/deduplication mechanism.
**Required Approach**: Maintain an `activePromises` Map (keyed by the resource ID) to ensure that multiple simultaneous requests for the exact same resource return the shared in-flight Promise rather than spawning redundant overlapping processes.
