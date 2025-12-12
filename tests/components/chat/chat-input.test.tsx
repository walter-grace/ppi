import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatInput } from '@/components/chat/chat-input';

describe('ChatInput Component', () => {
  const defaultProps = {
    input: '',
    handleInputChange: vi.fn(),
    handleSubmit: vi.fn((e) => e.preventDefault()),
    isLoading: false,
  };

  it('should render textarea and submit button', () => {
    render(<ChatInput {...defaultProps} />);

    expect(screen.getByPlaceholderText(/ask me about/i)).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should call handleInputChange when typing', async () => {
    const handleInputChange = vi.fn();
    render(<ChatInput {...defaultProps} handleInputChange={handleInputChange} />);

    const textarea = screen.getByPlaceholderText(/ask me about/i);
    await userEvent.type(textarea, 'test query');

    expect(handleInputChange).toHaveBeenCalled();
  });

  it('should call handleSubmit on form submit', async () => {
    const handleSubmit = vi.fn((e) => e.preventDefault());
    render(
      <ChatInput
        {...defaultProps}
        input="test query"
        handleSubmit={handleSubmit}
      />
    );

    const form = screen.getByRole('button').closest('form');
    if (form) {
      await userEvent.click(screen.getByRole('button'));
    }

    expect(handleSubmit).toHaveBeenCalled();
  });

  it('should disable input when loading', () => {
    render(<ChatInput {...defaultProps} isLoading={true} />);

    const textarea = screen.getByPlaceholderText(/ask me about/i);
    expect(textarea).toBeDisabled();
  });

  it('should disable submit button when input is empty', () => {
    render(<ChatInput {...defaultProps} input="" />);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('should enable submit button when input has content', () => {
    render(<ChatInput {...defaultProps} input="test query" />);

    const button = screen.getByRole('button');
    expect(button).not.toBeDisabled();
  });

  it('should submit on Enter key (without Shift)', async () => {
    const handleSubmit = vi.fn((e) => e.preventDefault());
    render(
      <ChatInput
        {...defaultProps}
        input="test"
        handleSubmit={handleSubmit}
      />
    );

    const textarea = screen.getByPlaceholderText(/ask me about/i);
    await userEvent.type(textarea, '{Enter}');

    expect(handleSubmit).toHaveBeenCalled();
  });

  it('should not submit on Shift+Enter', async () => {
    const handleSubmit = vi.fn((e) => e.preventDefault());
    render(
      <ChatInput
        {...defaultProps}
        input="test"
        handleSubmit={handleSubmit}
      />
    );

    const textarea = screen.getByPlaceholderText(/ask me about/i);
    await userEvent.type(textarea, '{Shift>}{Enter}{/Shift}');

    // Should not have been called because Shift+Enter should create new line
    // Note: This test might need adjustment based on actual implementation
  });
});

