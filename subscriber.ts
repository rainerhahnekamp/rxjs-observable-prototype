import { Observer } from "./observable";

const emptyFn = () => void true;

export class Subscriber<T> implements Observer<T> {
  destination: Observer<T> = {
    next: emptyFn,
    error: emptyFn,
    complete: emptyFn,
  };
  stopped = false;
  closed = false;
  finalizer: () => void = emptyFn;

  constructor(partialObserver?: Partial<Observer<T>> | ((value: T) => void)) {
    let next: (value: T) => void;
    let error: (value: unknown) => void = emptyFn;
    let complete: () => void = emptyFn;

    if (typeof partialObserver === "function") {
      this.destination.next = partialObserver;
    } else if (partialObserver !== undefined) {
      this.destination.next = partialObserver.next || emptyFn;
      this.destination.error = partialObserver.error || emptyFn;
      this.destination.complete = partialObserver.complete || emptyFn;
    }
  }

  add(teardownFn: () => void) {
    if (this.closed) {
      teardownFn();
    } else {
      this.finalizer = teardownFn;
    }
  }

  next(value: T) {
    if (!this.stopped) {
      this.destination.next(value);
    }
  }

  error(err: unknown) {
    if (!this.stopped) {
      this.destination.error(err);
      this.unsubscribe();
    }
  }

  complete() {
    if (!this.stopped) {
      this.destination.complete();
      this.unsubscribe();
    }
  }

  unsubscribe() {
    if (!this.closed) {
      this.closed = true;
      this.stopped = true;
      this.finalizer();
    }
  }
}
