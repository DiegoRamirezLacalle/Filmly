import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ReviewForm from '../components/ReviewForm';

describe('ReviewForm', () => {
  it('renders form fields', () => {
    render(
      <ReviewForm 
        imdbID="tt0816692" 
        onSuccess={() => {}} 
        onCancel={() => {}} 
      />
    );
    
    expect(screen.getByText('Deja tu reseña')).toBeInTheDocument();
    expect(screen.getByLabelText(/Puntuación:/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Escribe tu opinión/)).toBeInTheDocument();
  });

  it('validates rating range', () => {
    render(
      <ReviewForm 
        imdbID="tt0816692" 
        onSuccess={() => {}} 
        onCancel={() => {}} 
      />
    );
    
    const slider = screen.getByLabelText(/Puntuación:/) as HTMLInputElement;
    expect(slider.min).toBe('1');
    expect(slider.max).toBe('10');
  });

  it('calls onCancel when cancel button is clicked', () => {
    const onCancel = vi.fn();
    render(
      <ReviewForm 
        imdbID="tt0816692" 
        onSuccess={() => {}} 
        onCancel={onCancel} 
      />
    );
    
    const cancelButton = screen.getByText('Cancelar');
    fireEvent.click(cancelButton);
    
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
