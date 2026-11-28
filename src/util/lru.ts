/**
 * A Map that holds at most `max` entries and drops the least recently used one
 * past that. Reading an entry counts as using it. `onEvict` is handed what is
 * dropped, for a cache whose values hold GPU memory.
 */
export class LruMap<K, V> extends Map<K, V> {
  /**
   * Held between evictions, so it always stands just before the oldest entry.
   * A fresh `entries()` starts at the front, and V8 keeps every deleted entry
   * there as a hole until the table is rebuilt, so each eviction walked past
   * all the ones before it. A force layout changes every path each frame, and
   * a full path cache of 10000 spent more than ten times as long per new path
   * as one of 500.
   */
  private oldest: Iterator<[K, V]> | null = null;
  /** Changes since the held iterator last moved. See `touched`. */
  private sinceEvict = 0;

  constructor(
    private readonly max: number,
    private readonly onEvict?: (value: V, key: K) => void,
  ) {
    super();
  }

  override get(key: K): V | undefined {
    const value = super.get(key);
    if (value !== undefined) {
      // re-inserted, which keeps the map in least recently used order
      super.delete(key);
      super.set(key, value);
      this.touched();
    }
    return value;
  }

  override set(key: K, value: V): this {
    super.delete(key);
    super.set(key, value);
    if (this.size > this.max) {
      this.evict();
    } else {
      this.touched();
    }
    return this;
  }

  override delete(key: K): boolean {
    const had = super.delete(key);
    if (had) {
      this.touched();
    }
    return had;
  }

  override clear(): void {
    super.clear();
    this.oldest = null;
    this.sinceEvict = 0;
  }

  /**
   * Drops the least recently used entry. Everything the held iterator has
   * passed was dropped here, and an entry that is read moves to the end, so
   * the next one it gives is the oldest still held.
   */
  private evict(): void {
    let next = this.oldest?.next();
    if (!next || next.done) {
      // a finished iterator stays finished, whatever is added after
      this.oldest = super.entries();
      next = this.oldest.next();
    }
    this.sinceEvict = 0;
    const [oldest, dropped] = next.value as [K, V];
    super.delete(oldest);
    this.onEvict?.(dropped, oldest);
  }

  /**
   * Lets go of the held iterator once the map has changed as often as it holds
   * entries without evicting. V8 rebuilds the table as entries are read and
   * moved, and an iterator keeps every table built since it last moved, with
   * the entries in them, so a full cache that is only read, as the path cache
   * is on every frame of a settled scene, grew without bound. The next eviction
   * then starts a fresh iterator and walks one table's holes once.
   */
  private touched(): void {
    if (this.oldest !== null && ++this.sinceEvict > this.max) {
      this.oldest = null;
      this.sinceEvict = 0;
    }
  }
}

/** Keeps `value` as one variant of `key`, such as one flatness a path is traced at. */
export function setVariant<V>(cache: LruMap<string, Map<string, V>>, key: string, variant: string, value: V): void {
  const variants = cache.get(key);
  if (variants) {
    variants.set(variant, value);
  } else {
    cache.set(key, new Map([[variant, value]]));
  }
}
