// Ids for optimistic UI only, never persisted by the backend.
// crypto.randomUUID needs a secure context, so plain http gets a fallback
export function createLocalId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID()
    }

    return `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}
