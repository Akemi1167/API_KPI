import { BadRequestException } from '@nestjs/common';
import { KpiEventKind } from '../enums/kpi-event-kind.enum';
import { KpiRating } from '../enums/kpi-rating.enum';
import { calculateKpiScore, validateEventPoints } from './kpi-calculate.util';

describe('calculateKpiScore', () => {
  it('should return base score when there are no events', () => {
    const result = calculateKpiScore(100, []);

    expect(result.finalScore).toBe(100);
    expect(result.bonusPoints).toBe(0);
    expect(result.penaltyPoints).toBe(0);
    expect(result.rating).toBe(KpiRating.EXCELLENT);
    expect(result.rewardPercent).toBe(200);
  });

  it('should not cap bonus points', () => {
    const result = calculateKpiScore(90, [
      { eventKind: KpiEventKind.BONUS, totalPoints: 6 },
      { eventKind: KpiEventKind.BONUS, totalPoints: 8 },
    ]);

    expect(result.rawBonusPoints).toBe(14);
    expect(result.bonusPoints).toBe(14);
    expect(result.finalScore).toBe(104);
    expect(result.rating).toBe(KpiRating.EXCELLENT);
    expect(result.rewardPercent).toBe(200);
  });

  it('should apply penalty points directly', () => {
    const result = calculateKpiScore(95, [
      { eventKind: KpiEventKind.PENALTY, totalPoints: -5 },
    ]);

    expect(result.penaltyPoints).toBe(-5);
    expect(result.finalScore).toBe(90);
    expect(result.rating).toBe(KpiRating.PASS);
    expect(result.rewardPercent).toBe(100);
  });

  it('should combine bonus and penalty points', () => {
    const result = calculateKpiScore(90, [
      { eventKind: KpiEventKind.BONUS, totalPoints: 4 },
      { eventKind: KpiEventKind.PENALTY, totalPoints: -3 },
    ]);

    expect(result.finalScore).toBe(91);
    expect(result.rating).toBe(KpiRating.PASS);
    expect(result.rewardPercent).toBe(100);
  });

  it('should rate good for scores from 95 to 99', () => {
    const result = calculateKpiScore(97, []);

    expect(result.finalScore).toBe(97);
    expect(result.rating).toBe(KpiRating.GOOD);
    expect(result.rewardPercent).toBe(150);
  });

  it('should rate fair for scores from 70 to 79', () => {
    const result = calculateKpiScore(75, []);

    expect(result.finalScore).toBe(75);
    expect(result.rating).toBe(KpiRating.FAIR);
    expect(result.rewardPercent).toBe(50);
  });

  it('should return fail when final score is below 70', () => {
    const result = calculateKpiScore(85, [
      { eventKind: KpiEventKind.PENALTY, totalPoints: -20 },
    ]);

    expect(result.finalScore).toBe(65);
    expect(result.rating).toBe(KpiRating.FAIL);
    expect(result.rewardPercent).toBe(0);
  });
});

describe('validateEventPoints', () => {
  it('should reject negative bonus points', () => {
    expect(() => validateEventPoints(KpiEventKind.BONUS, -1)).toThrow(
      BadRequestException,
    );
  });

  it('should reject positive penalty points', () => {
    expect(() => validateEventPoints(KpiEventKind.PENALTY, 1)).toThrow(
      BadRequestException,
    );
  });
});
