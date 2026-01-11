import { describe, it, expect } from 'vitest';
import { api } from '../services/api';

describe('API Service', () => {
  it('has correct base URL configuration', () => {
    expect(api.defaults.baseURL).toBeDefined();
  });

  it('has axios instance configured', () => {
    expect(api).toBeDefined();
    expect(typeof api.get).toBe('function');
    expect(typeof api.post).toBe('function');
  });
});
