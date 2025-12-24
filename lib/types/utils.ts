// Description: Utility types and type helpers for common patterns

/**
 * Makes specified properties optional in a type
 * @example
 * type User = { id: string; name: string; email: string }
 * type PartialUser = Optional<User, 'name' | 'email'>
 * // Result: { id: string; name?: string; email?: string }
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Makes specified properties required in a type
 * @example
 * type User = { id: string; name?: string; email?: string }
 * type RequiredUser = RequireKeys<User, 'name' | 'email'>
 * // Result: { id: string; name: string; email: string }
 */
export type RequireKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Converts null to undefined in a type (useful for React props)
 * @example
 * type Data = { name: string | null }
 * type CleanData = NullToUndefined<Data>
 * // Result: { name: string | undefined }
 */
export type NullToUndefined<T> = {
  [K in keyof T]: T[K] extends null ? undefined : T[K] extends null | infer U ? U | undefined : T[K];
};

/**
 * Extract the awaited type from a Promise
 * @example
 * type FetchResult = Awaited<Promise<User>>
 * // Result: User
 */
export type Awaited<T> = T extends Promise<infer U> ? U : T;

/**
 * Create a type with specified fields from a union type
 * @example
 * type Status = 'pending' | 'completed' | 'failed'
 * type StatusRecord = RecordFromUnion<Status, { label: string }>
 * // Result: { pending: { label: string }, completed: { label: string }, failed: { label: string } }
 */
export type RecordFromUnion<K extends string | number | symbol, V> = Record<K, V>;

/**
 * Deep partial - makes all nested properties optional
 * @example
 * type User = { profile: { name: string; age: number } }
 * type PartialUser = DeepPartial<User>
 * // Result: { profile?: { name?: string; age?: number } }
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Extracts the value type from an array type
 * @example
 * type Users = User[]
 * type SingleUser = ArrayElement<Users>
 * // Result: User
 */
export type ArrayElement<T> = T extends (infer U)[] ? U : never;

/**
 * Create a type that requires at least one of the specified keys
 * @example
 * type Contact = AtLeastOne<{ email: string; phone: string; address: string }, 'email' | 'phone'>
 * // At least email or phone must be provided
 */
export type AtLeastOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];

/**
 * Create a type that requires exactly one of the specified keys
 * @example
 * type Auth = ExactlyOne<{ token: string; apiKey: string; oauth: string }>
 * // Must provide exactly one auth method
 */
export type ExactlyOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]: Required<Pick<T, K>> & Partial<Record<Exclude<Keys, K>, never>>;
  }[Keys];

/**
 * Type-safe Object.keys that preserves key types
 * @example
 * const obj = { name: 'John', age: 30 } as const
 * const keys = objectKeys(obj) // type: ('name' | 'age')[]
 */
export function objectKeys<T extends object>(obj: T): (keyof T)[] {
  return Object.keys(obj) as (keyof T)[];
}

/**
 * Type-safe Object.entries that preserves types
 * @example
 * const obj = { name: 'John', age: 30 }
 * const entries = objectEntries(obj) // type: ['name', string] | ['age', number][]
 */
export function objectEntries<T extends object>(obj: T): [keyof T, T[keyof T]][] {
  return Object.entries(obj) as [keyof T, T[keyof T]][];
}

/**
 * Assert that a value is never (exhaustive check for switch/if-else)
 * @example
 * function handleStatus(status: RecipeStatus) {
 *   switch (status) {
 *     case 'pending': return 'Pending'
 *     case 'completed': return 'Done'
 *     default: return assertNever(status) // TypeScript error if case is missing
 *   }
 * }
 */
export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${value}`);
}

/**
 * Create a branded type for nominal typing
 * @example
 * type UserId = Brand<string, 'UserId'>
 * type RecipeId = Brand<string, 'RecipeId'>
 * // UserId and RecipeId are not interchangeable even though both are strings
 */
export type Brand<T, B> = T & { __brand: B };
