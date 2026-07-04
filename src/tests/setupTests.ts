import { JSDOM } from 'jsdom';
import { expect } from 'bun:test';
import * as matchers from '@testing-library/jest-dom/matchers';
import { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';

const jsdom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'http://localhost',
});

// Configure global DOM variables for testing-library
global.window = jsdom.window as unknown as typeof globalThis & Window;
global.document = jsdom.window.document;
global.navigator = jsdom.window.navigator;
global.HTMLElement = jsdom.window.HTMLElement;
global.SVGElement = jsdom.window.SVGElement;

// 1. Extend Bun's runtime expect with jest-dom matchers
expect.extend(matchers);

// 2. Augment Bun's typings so the TypeScript compiler (tsc) recognizes the matchers
declare module "bun:test" {
  interface Matchers<T = unknown>
    extends TestingLibraryMatchers<typeof expect.stringContaining, T> {}
  interface AsymmetricMatchers extends TestingLibraryMatchers {}
}
