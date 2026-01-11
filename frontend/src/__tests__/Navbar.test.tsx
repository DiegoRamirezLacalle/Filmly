import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Navbar from '../components/Navbar';

describe('Navbar', () => {
  it('renders Filmly logo', () => {
    render(
      <Navbar 
        email={null} 
        onLogout={() => {}} 
        onGoSearch={() => {}}
        onGoLogin={() => {}}
        onGoSignup={() => {}}
        onGoMyList={() => {}}
      />
    );
    
    expect(screen.getByText('Filmly')).toBeInTheDocument();
  });

  it('renders login and signup buttons when not authenticated', () => {
    render(
      <Navbar 
        email={null} 
        onLogout={() => {}} 
        onGoSearch={() => {}}
        onGoLogin={() => {}}
        onGoSignup={() => {}}
        onGoMyList={() => {}}
      />
    );
    
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Signup')).toBeInTheDocument();
  });

  it('renders without crashing', () => {
    const { container } = render(
      <Navbar 
        email={null} 
        onLogout={() => {}} 
        onGoSearch={() => {}}
        onGoLogin={() => {}}
        onGoSignup={() => {}}
        onGoMyList={() => {}}
      />
    );
    expect(container).toBeTruthy();
  });
});
