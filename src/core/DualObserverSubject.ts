/**
 * DualObserverSubject - GoF Observer pattern implementation supporting both
 * object-based observers (with update methods) and function-based observers.
 *
 * @fileoverview Provides a reusable Subject that maintains two independent observer
 * collections: object observers (GoF pattern, notified via notifyObservers) and
 * function observers (modern callback pattern, notified via notifyFunctionObservers).
 *
 * **Design Principles:**
 * - **Dual Observer Collections:** Object and function observers are managed independently
 * - **Immutability:** subscribe/unsubscribe create new arrays (spread + filter); no in-place mutation
 * - **Error Isolation:** Errors in individual observers are caught so others still receive notifications
 * - **Null Safety:** Null/undefined subscriptions are silently ignored
 *
 * **Observer Types:**
 * - Object observers: `{ update(...args): void }` — subscribed via `subscribe()`, notified via `notifyObservers()`
 * - Function observers: `(...args) => void` — subscribed via `subscribeFunction()`, notified via `notifyFunctionObservers()`
 *
 * @module core/DualObserverSubject
 * @since 0.10.0-alpha
 * @author Marcelo Pereira Barbosa
 * @reviewed 2026-03-18
 * 
 * @example
 * // Object-based (GoF) pattern
 * const subject = new DualObserverSubject();
 *
 * const myObserver = {
 *   update(source, event, data) {
 *     console.log('Notified:', event, data);
 *   }
 * };
 *
 * subject.subscribe(myObserver);
 * subject.notifyObservers(this, 'positionChanged', { lat: -23.5, lon: -46.6 });
 * subject.unsubscribe(myObserver);
 *
 * @example
 * // Function-based pattern
 * const subject = new DualObserverSubject();
 *
 * const handler = (source, event, data) => {
 *   console.log('Function notified:', event);
 * };
 *
 * subject.subscribeFunction(handler);
 * subject.notifyFunctionObservers(this, 'positionChanged', data);
 * subject.unsubscribeFunction(handler);
 *
 * @example
 * // Mixed usage — both patterns are independent
 * const subject = new DualObserverSubject();
 * subject.subscribe({ update: (src, evt) => console.log(evt) });
 * subject.subscribeFunction((src, evt) => console.log(evt));
 *
 * subject.notifyObservers(this, 'event');    // notifies ONLY object observers
 * subject.notifyFunctionObservers(this, 'event'); // notifies ONLY function observers
 */

/**
 * An observer object that may implement an `update` method.
 * @template T - Tuple of argument types for observer notifications (defaults to `unknown[]`)
 */
export type ObserverObject<T extends unknown[] = unknown[]> = { update?: (...args: T) => void };

/**
 * A function-based observer callback.
 * @template T - Tuple of argument types for observer notifications (defaults to `unknown[]`)
 */
export type ObserverFunction<T extends unknown[] = unknown[]> = (...args: T) => void;

/**
 * DualObserverSubject — Subject managing two independent observer collections.
 *
 * @class
 * @template T - Tuple of argument types forwarded to observer callbacks (defaults to `unknown[]`)
 *
 * @example
 * // Typed usage: all notifications are [source: object, event: string]
 * const bus = new DualObserverSubject<[source: object, event: string]>();
 * bus.subscribe({ update(src, evt) { console.log(evt); } });
 * bus.notifyObservers(this, 'click');
 *
 * @example
 * // Untyped usage (backwards-compatible default)
 * const subject = new DualObserverSubject();
 * subject.subscribe({ update: (...args) => console.log(args) });
 */
class DualObserverSubject<T extends unknown[] = unknown[]> {
  private _observers: ObserverObject<T>[];
  private _functionObservers: ObserverFunction<T>[];

  /** Read-only view of object observers subscribed via {@link subscribe}. */
  get observers(): ReadonlyArray<ObserverObject<T>> {
    return this._observers;
  }
  /** Read-only view of function observers subscribed via {@link subscribeFunction}. */
  get functionObservers(): ReadonlyArray<ObserverFunction<T>> {
    return this._functionObservers;
  }

  /**
   * Creates a new DualObserverSubject with empty observer collections.
   */
  constructor() {
    this._observers = [];
    this._functionObservers = [];
  }

  /**
   * Subscribes an object observer to receive notifications via its `update()` method.
   *
   * **Immutable Pattern:** Creates a new array using spread operator instead of
   * mutating the existing observers array.
   *
   * @param {ObserverObject | null | undefined} observer - Observer object (may have `update` method)
   * @returns {void}
   *
   * @example
   * const observer = { update: (source, event) => console.log(event) };
   * subject.subscribe(observer);
   */
  subscribe(observer: ObserverObject<T> | null | undefined): void {
    if (observer) {
      this._observers = [...this._observers, observer];
    }
  }

  /**
   * Unsubscribes an object observer from notifications.
   *
   * **Immutable Pattern:** Uses filter to create a new array without the observer.
   *
   * @param {ObserverObject} observer - Observer object to remove
   * @returns {void}
   *
   * @example
   * subject.unsubscribe(myObserver);
   */
  unsubscribe(observer: ObserverObject<T>): void {
    this._observers = this._observers.filter((o) => o !== observer);
  }

  /**
   * Notifies all subscribed object observers.
   * Calls `observer.update(...args)` on each observer that implements `update`.
   * Errors thrown by individual observers are caught so others still receive notifications.
   *
   * @param {...unknown} args - Arguments forwarded to each observer's `update()` method
   * @returns {void}
   *
   * @example
   * subject.notifyObservers(this, 'positionChanged', position, null);
   */
  notifyObservers(...args: T): void {
    this._observers.forEach((observer) => {
      if (typeof observer.update === 'function') {
        try {
          observer.update(...args);
        } catch (err: unknown) {
          console.warn('DualObserverSubject: Error notifying observer', err);
        }
      }
    });
  }

  /**
   * Subscribes a function observer to receive notifications via `notifyFunctionObservers`.
   *
   * **Immutable Pattern:** Creates a new array using spread operator.
   *
   * @param {ObserverFunction | null | undefined} observerFunction - Callback function
   * @returns {void}
   *
   * @example
   * const handler = (source, event, data) => console.log(event);
   * subject.subscribeFunction(handler);
   */
  subscribeFunction(observerFunction: ObserverFunction<T> | null | undefined): void {
    if (observerFunction) {
      this._functionObservers = [...this._functionObservers, observerFunction];
    }
  }

  /**
   * Unsubscribes a function observer from notifications.
   *
   * **Immutable Pattern:** Uses filter to create a new array without the function.
   *
   * @param {ObserverFunction} observerFunction - Function to remove
   * @returns {void}
   *
   * @example
   * subject.unsubscribeFunction(handler);
   */
  unsubscribeFunction(observerFunction: ObserverFunction<T>): void {
    this._functionObservers = this._functionObservers.filter((fn) => fn !== observerFunction);
  }

  /**
   * Notifies all subscribed function observers.
   * Errors thrown by individual observers are caught so others still receive notifications.
   *
   * @param {...unknown} args - Arguments forwarded to each observer function
   * @returns {void}
   *
   * @example
   * subject.notifyFunctionObservers(this, 'positionChanged', data);
   */
  notifyFunctionObservers(...args: T): void {
    this._functionObservers.forEach((fn) => {
      if (typeof fn === 'function') {
        try {
          fn(...args);
        } catch (err: unknown) {
          console.warn('DualObserverSubject: Error notifying function observer', err);
        }
      }
    });
  }

  /**
   * Returns the count of subscribed object observers.
   *
   * @returns {number} Number of object observers subscribed via {@link subscribe}
   */
  getObserverCount(): number {
    return this._observers.length;
  }

  /**
   * Returns the count of subscribed function observers.
   *
   * @returns {number} Number of function observers subscribed via {@link subscribeFunction}
   */
  getFunctionObserverCount(): number {
    return this._functionObservers.length;
  }

  /**
   * Removes all observers (both object and function collections).
   *
   * @returns {void}
   *
   * @example
   * subject.clearAllObservers();
   * console.log(subject.getObserverCount());         // 0
   * console.log(subject.getFunctionObserverCount()); // 0
   */
  clearAllObservers(): void {
    this._observers = [];
    this._functionObservers = [];
  }
}

export default DualObserverSubject;
