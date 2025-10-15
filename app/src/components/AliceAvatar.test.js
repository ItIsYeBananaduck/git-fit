import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import AliceAvatar from './AliceAvatar.svelte';

describe('AliceAvatar', () => {
  it('renders the avatar container', () => {
    const { container } = render(AliceAvatar);
    expect(container.querySelector('.avatar-container')).toBeTruthy();
  });

  it('has floating animation', () => {
    const { container } = render(AliceAvatar);
    const style = container.querySelector('.avatar-container').getAttribute('style');
    expect(style).toContain('float');
  });

  it('includes accessories placeholder', () => {
    const { container } = render(AliceAvatar);
    expect(container.querySelector('.accessories')).toBeTruthy();
  });
});