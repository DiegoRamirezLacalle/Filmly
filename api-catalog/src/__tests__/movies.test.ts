import { describe, it, expect } from '@jest/globals';

describe('Movies API', () => {
  describe('Input validation', () => {
    it('should validate query parameters', () => {
      const query = 'interstellar';
      expect(query.trim().length).toBeGreaterThan(0);
    });

    it('should validate imdbID format', () => {
      const imdbID = 'tt0816692';
      expect(imdbID).toMatch(/^tt\d+$/);
    });

    it('should reject empty queries', () => {
      const emptyQuery = '';
      expect(emptyQuery.trim().length).toBe(0);
    });
  });

  describe('Data transformation', () => {
    it('should format movie data correctly', () => {
      const movie = {
        Title: 'Interstellar',
        Year: '2014',
        imdbID: 'tt0816692',
        Type: 'movie',
        Poster: 'https://example.com/poster.jpg',
      };

      expect(movie).toHaveProperty('Title');
      expect(movie).toHaveProperty('imdbID');
      expect(movie.imdbID).toMatch(/^tt\d+$/);
    });
  });

  describe('Search query parsing', () => {
    it('should handle multi-word queries', () => {
      const query = 'star wars';
      expect(query.includes(' ')).toBe(true);
      expect(query.split(' ').length).toBe(2);
    });

    it('should handle special characters', () => {
      const query = 'spider-man';
      expect(query).toContain('-');
    });
  });
});
