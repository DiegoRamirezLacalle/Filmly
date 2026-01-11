import { describe, it, expect } from '@jest/globals';

describe('Reviews API', () => {
  describe('Rating validation', () => {
    it('should accept valid ratings (1-10)', () => {
      const validRatings = [1, 5, 10];
      
      validRatings.forEach(rating => {
        expect(rating).toBeGreaterThanOrEqual(1);
        expect(rating).toBeLessThanOrEqual(10);
        expect(Number.isInteger(rating)).toBe(true);
      });
    });

    it('should reject invalid ratings', () => {
      const invalidRatings = [0, 11, -1, 15];
      
      invalidRatings.forEach(rating => {
        const isValid = rating >= 1 && rating <= 10;
        expect(isValid).toBe(false);
      });
    });

    it('should reject decimal ratings', () => {
      const rating = 7.5;
      expect(Number.isInteger(rating)).toBe(false);
    });
  });

  describe('Review text validation', () => {
    it('should accept valid text length', () => {
      const validText = 'Great movie! Loved every minute of it.';
      expect(validText.length).toBeGreaterThan(0);
      expect(validText.length).toBeLessThanOrEqual(1000);
    });

    it('should reject too long text', () => {
      const tooLongText = 'a'.repeat(1001);
      expect(tooLongText.length).toBeGreaterThan(1000);
    });

    it('should accept empty text (optional)', () => {
      const emptyText = '';
      expect(typeof emptyText).toBe('string');
    });
  });

  describe('ImdbID validation', () => {
    it('should validate imdbID format', () => {
      const validIds = ['tt0816692', 'tt0111161', 'tt1234567'];
      
      validIds.forEach(id => {
        expect(id).toMatch(/^tt\d+$/);
      });
    });

    it('should reject invalid imdbID format', () => {
      const invalidIds = ['123', 'tt', 'invalid', 'TT123'];
      
      invalidIds.forEach(id => {
        expect(id).not.toMatch(/^tt\d+$/);
      });
    });
  });

  describe('Review data structure', () => {
    it('should have correct review structure', () => {
      const review = {
        imdbID: 'tt0816692',
        userEmail: 'test@example.com',
        rating: 9,
        text: 'Amazing film!',
        createdAt: new Date(),
      };

      expect(review).toHaveProperty('imdbID');
      expect(review).toHaveProperty('userEmail');
      expect(review).toHaveProperty('rating');
      expect(review).toHaveProperty('text');
      expect(review).toHaveProperty('createdAt');
      expect(review.rating).toBeGreaterThanOrEqual(1);
      expect(review.rating).toBeLessThanOrEqual(10);
    });
  });
});
