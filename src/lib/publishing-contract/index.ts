/**
 * Zeig Publishing Contract — public entry point.
 *
 * Framework-agnostic content contract, mirrored 1:1 from the VeloxOps
 * Publishing Contract (only the category taxonomy, image roots, byline default,
 * and CTA default are site-specific). No website/Astro imports anywhere in this
 * module. The website is a CONSUMER of this contract, not its owner.
 */

export * from './version';
export * from './policy';
export * from './taxonomy';
export * from './blocks';
export * from './refinements';
export * from './knowledge';
export * from './authors';
export * from './integrity';
