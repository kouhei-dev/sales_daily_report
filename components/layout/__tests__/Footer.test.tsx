import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Footer } from '../Footer';

describe('Footer Component', () => {
  it('著作権情報を表示する', () => {
    // Act
    render(<Footer />);

    // Assert
    const copyrightText = screen.getByText(/営業日報システム/);
    expect(copyrightText).toBeInTheDocument();
    expect(copyrightText).toHaveTextContent('All rights reserved');
  });

  it('現在の年を表示する', () => {
    // Arrange
    const currentYear = new Date().getFullYear();

    // Act
    render(<Footer />);

    // Assert
    const yearText = screen.getByText(new RegExp(currentYear.toString()));
    expect(yearText).toBeInTheDocument();
  });

  it('適切なスタイリングが適用されている', () => {
    // Act
    const { container } = render(<Footer />);
    const footer = container.querySelector('footer');

    // Assert
    expect(footer).toBeInTheDocument();
    expect(footer).toHaveClass('border-t', 'border-gray-200', 'bg-white');
  });
});
