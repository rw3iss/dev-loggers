import { type DebugPanelOptions } from './DebugPanel/DebugPanel.js';
/**
 * Framework-agnostic mount helper. Construct one panel and return a disposer
 * that destroys it. Suitable as a `useEffect` / `onCleanup` / `onMount` body
 * in any framework with a register-then-cleanup lifecycle.
 *
 * Preact / React:
 *
 *     useEffect(() => mountDebugPanel({ loggers }), []);
 *
 * Solid:
 *
 *     onMount(() => {
 *         const dispose = mountDebugPanel({ loggers });
 *         onCleanup(dispose);
 *     });
 *
 * The DebugPanel constructor itself is idempotent (it tears down any prior
 * panel on the page first), so re-running the effect in React StrictMode is
 * safe even without the cleanup phase.
 */
export declare function mountDebugPanel(options?: DebugPanelOptions): () => void;
//# sourceMappingURL=mount.d.ts.map