import { Observable } from "./observable";
//import { Observable } from "rxjs";
import { describe, expect, it, vi } from "vitest";

describe("Observable", () => {
  describe("basics", function () {
    it("should instantiate with a subscriber", () => {
      const observable = new Observable<number>((subscriber) => {
        subscriber.next(1);
      });
    });

    it("should not run subscriberFn without subscription", () => {
      let a = 1;
      new Observable((subscriber) => {
        a++;
      });
      expect(a).toBe(1);
    });

    it("should run subscriberFn with subscription", () => {
      let a = 1;
      new Observable((subscriber) => {
        a++;
        subscriber.next(1);
      }).subscribe();

      expect(a).toBe(2);
    });

    it("should run per subscriber", () => {
      let a = 1;
      const observable = new Observable(() => {
        a++;
      });

      observable.subscribe();
      observable.subscribe();

      expect(a).toBe(3);
    });
  });

  describe("next handler", () => {
    it("should emit synchronously", () => {
      let a = 0;
      const n$ = new Observable<number>((subscriber) => subscriber.next(1));
      n$.subscribe((value) => (a += value));
      expect(a).toBe(1);
    });

    it("should emit asynchronously", () => {
      vi.useFakeTimers();
      let a = 0;
      const n$ = new Observable<number>((subscriber) => {
        setTimeout(() => subscriber.next(1));
      });
      n$.subscribe((value) => (a += value));
      expect(a).toBe(0);
      vi.runAllTimers();
      expect(a).toBe(1);
    });

    it("should allow multiple emits", () => {
      let a = 0;
      new Observable<number>((subscriber) => {
        subscriber.next(1);
        subscriber.next(2);
      }).subscribe((n) => (a += n));
      expect(a).toBe(3);
    });
  });

  describe("error handler", () => {
    it("should be able to emit an error", () => {
      let error = "";
      new Observable((subscriber) => {
        subscriber.error("something went wrong");
      }).subscribe({ error: (err) => (error = "" + err) });

      expect(error).toBe("something went wrong");
    });

    it("should be able catch and emit an error", () => {
      let error = "";
      new Observable((subscriber) => {
        throw "something went wrong";
      }).subscribe({ error: (err) => (error = "" + err) });

      expect(error).toBe("something went wrong");
    });

    it("should not continue after an error but still execute side-effects", () => {
      let number = 1;
      new Observable<number>((subscriber) => {
        subscriber.error("");
        number++;
        subscriber.next(2);
      }).subscribe({
        next: (n) => (number += n),
        error: (err) => console.error,
      });

      expect(number).toBe(2);
    });

    it("should handle an asynchronous error as well", () => {
      vi.useFakeTimers();
      let number = 1;
      new Observable<number>((subscriber) => {
        setTimeout(() => subscriber.next(1), 100);
        setTimeout(() => subscriber.error(""), 200);
        setTimeout(() => subscriber.next(3), 300);
      }).subscribe({ next: (n) => (number += n), error: () => void true });
      vi.runAllTimers();
      expect(number).toBe(2);
    });
  });

  describe("complete handler", () => {
    it("should have a complete event", () => {
      let number = 1;
      new Observable((subscriber) => subscriber.complete()).subscribe({
        complete: () => number++,
      });
      expect(number).toBe(2);
    });

    it("should not complete upon error", () => {
      let number = 1;
      new Observable((subscriber) => subscriber.error("test")).subscribe({
        complete: () => number++,
      });
      expect(number).toBe(1);
    });

    it("should not do anything after complete", () => {
      let number = 1;
      new Observable<number>((subscriber) => {
        subscriber.complete();
        subscriber.next(1);
      }).subscribe({
        next: () => number++,
      });

      expect(number).toBe(1);
    });
  });

  describe("teardown", () => {
    it("should not run teardown without an unsubscribe", () => {
      let number = 1;
      new Observable<number>((subscriber) => {
        return () => number++;
      }).subscribe();

      expect(number).toBe(1);
    });

    it("should run on unsubscribe", () => {
      let number = 1;
      new Observable<number>((subscriber) => {
        return () => number++;
      })
        .subscribe()
        .unsubscribe();

      expect(number).toBe(2);
    });
    it("should run teardown on complete", () => {
      let number = 1;
      new Observable<number>((subscriber) => {
        subscriber.complete();

        return () => number++;
      }).subscribe();

      expect(number).toBe(2);
    });

    it("should teardown on error", () => {
      let number = 1;
      new Observable<number>((subscriber) => {
        subscriber.error("bad things");
        return () => number++;
      }).subscribe();

      expect(number).toBe(2);
    });

    it("should teardown only once", () => {
      let number = 1;
      new Observable<number>((subscriber) => {
        subscriber.complete();
        return () => number++;
      }).subscribe().unsubscribe;

      expect(number).toBe(2);
    });
  });
});
