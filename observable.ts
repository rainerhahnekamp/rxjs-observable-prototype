import { Subscriber } from "./subscriber";

export interface Observer<T> {
  next: (value: T) => void;
  error: (value: unknown) => void;
  complete: () => void;
}

export interface Subscription {
  unsubscribe: () => void;
}

export class Observable<T> {
  constructor(
    private subscribeFn: (subscriber: Subscriber<T>) => (() => void) | void
  ) {}

  subscribe(
    partialObserver?: Partial<Observer<T>> | ((value: T) => void)
  ): Subscription {
    const sink = new Subscriber<T>(partialObserver);
    try {
      const teardown = this.subscribeFn(sink);
      if (typeof teardown === "function") {
        sink.add(teardown);
      }
    } catch (err) {
      sink.error(err);
    }

    return sink;
  }
}
