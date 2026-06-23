/**
 * ObserverSubject — local alias for DualObserverSubject.
 *
 * In the original guia_js this path re-exported DualObserverSubject from the
 * paraty_geocore CDN (which in turn vendored it from bessa_patterns.ts). For
 * this standalone package we vendor DualObserverSubject locally and keep the
 * same module path so the speech files import unchanged.
 *
 * @module core/ObserverSubject
 */
export { default, type ObserverObject, type ObserverFunction } from "./DualObserverSubject.js";
//# sourceMappingURL=ObserverSubject.d.ts.map