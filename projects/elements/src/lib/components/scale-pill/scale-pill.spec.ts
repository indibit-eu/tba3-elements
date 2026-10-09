import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { Tba3ScalePillComponent } from './scale-pill';

function render(inputs: { level: string; text: string; emphasis?: boolean; ariaLabel?: string }) {
  const fixture = TestBed.createComponent(Tba3ScalePillComponent);
  for (const [key, value] of Object.entries(inputs)) fixture.componentRef.setInput(key, value);
  fixture.detectChanges();
  return fixture.nativeElement.querySelector('span.tba3-rate-pill') as HTMLElement;
}

describe('Tba3ScalePillComponent', () => {
  it('rendert Glyphe, Text und Stufenfarben', () => {
    const pill = render({ level: 'high', text: '88 %', ariaLabel: '88 %, ab 85 %' });
    expect(pill.textContent).toContain('▲');
    expect(pill.textContent).toContain('88 %');
    expect(pill.getAttribute('aria-label')).toBe('88 %, ab 85 %');
    expect(pill.getAttribute('style')).toContain('var(--tba3-solution-rate-high)');
    expect(pill.getAttribute('style')).toContain('var(--tba3-solution-rate-high-bg)');
    expect(pill.classList.contains('fw-bold')).toBe(false);
  });

  it('trägt in der Mitte fa-circle-dot und bei emphasis fw-bold', () => {
    const pill = render({ level: 'mid', text: '80 %', emphasis: true });
    expect(pill.querySelector('i.fa-circle-dot')).not.toBeNull();
    expect(pill.classList.contains('fw-bold')).toBe(true);
    expect(pill.hasAttribute('aria-label')).toBe(false);
  });
});
