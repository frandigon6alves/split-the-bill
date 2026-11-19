/**
 * A plural message picks a form with Intl.PluralRules. `other` is always required; any other
 * CLDR category the language uses (`one`, `few`, `many`...) may be provided as well.
 */
export type PluralMessage = Partial<Record<Intl.LDMLPluralRule, string>> & { other: string };

export type Message = string | PluralMessage;

export type MessageParams = Record<string, string | number>;
