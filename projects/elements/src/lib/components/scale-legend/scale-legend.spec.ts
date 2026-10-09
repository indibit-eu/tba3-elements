import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { Tba3ScaleLegendComponent } from './scale-legend';

describe('Tba3ScaleLegendComponent', () => {
  it('zeigt „Skala" und vier Pillen mit Bereichstexten aus den thresholds', () => {
    const fixture = TestBed.createComponent(Tba3ScaleLegendComponent);
    fixture.componentRef.setInput('thresholds', [85, 60, 75]);
    fixture.componentRef.setInput('ariaLabel', 'Skala Mindeststandard erreicht');
    fixture.detectChanges();
    const list = fixture.nativeElement.querySelector('ul') as HTMLElement;
    expect(list.getAttribute('aria-label')).toBe('Skala Mindeststandard erreicht');
    const items = [...list.querySelectorAll('li')].map((li) =>
      li.textContent?.replace(/\s+/g, ' ').trim(),
    );
    expect(items[0]).toBe('Skala');
    expect(items.slice(1)).toEqual(['▼▼ < 60 %', '▼ 60–75 %', '75–85 %', '▲ ≥ 85 %']);
    expect(list.querySelectorAll('li i.fa-circle-dot')).toHaveLength(1);
  });
});
