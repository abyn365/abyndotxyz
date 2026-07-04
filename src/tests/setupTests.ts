import { JSDOM } from 'jsdom';
import '@testing-library/jest-dom';

const jsdom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'http://localhost',
});

// Configure global DOM variables for testing-library
global.window = jsdom.window as unknown as typeof globalThis & Window;
global.document = jsdom.window.document;
global.navigator = jsdom.window.navigator;
global.HTMLElement = jsdom.window.HTMLElement;
global.SVGElement = jsdom.window.SVGElement;
