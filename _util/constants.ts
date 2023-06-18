export enum MetadataKey {
  Alias = "metadata:is.alias",
  Negated = "metadata:is.negated",
  Deprecated = "metadata:is.deprecated",
}

export const AliasSymbol = Symbol.for(MetadataKey.Alias);
export const NegatedSymbol = Symbol.for(MetadataKey.Negated);
export const DeprecatedSymbol = Symbol.for(MetadataKey.Deprecated);
