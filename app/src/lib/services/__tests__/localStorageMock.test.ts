import { describe, it, expect } from 'vitest';
import '../../../../vitest-setup-client';

describe('LocalStorage Mock', () => {
    it('should store and retrieve items', () => {
        console.log('localStorage state before test:', globalThis.localStorage);
        localStorage.setItem('key', 'value');
        expect(localStorage.getItem('key')).toBe('value');
    });

    it('should remove items', () => {
        console.log('localStorage state before test:', globalThis.localStorage);
        localStorage.setItem('key', 'value');
        localStorage.removeItem('key');
        expect(localStorage.getItem('key')).toBeNull();
    });

    it('should clear all items', () => {
        console.log('localStorage state before test:', globalThis.localStorage);
        localStorage.setItem('key1', 'value1');
        localStorage.setItem('key2', 'value2');
        localStorage.clear();
        expect(localStorage.getItem('key1')).toBeNull();
        expect(localStorage.getItem('key2')).toBeNull();
    });

    it('should return the correct length', () => {
        console.log('localStorage state before test:', globalThis.localStorage);
        localStorage.setItem('key1', 'value1');
        localStorage.setItem('key2', 'value2');
        expect(localStorage.length).toBe(2);
        localStorage.removeItem('key1');
        expect(localStorage.length).toBe(1);
    });

    it('should return the correct key by index', () => {
        console.log('localStorage state before test:', globalThis.localStorage);
        localStorage.setItem('key1', 'value1');
        localStorage.setItem('key2', 'value2');
        expect(localStorage.key(0)).toBe('key1');
        expect(localStorage.key(1)).toBe('key2');
    });
});