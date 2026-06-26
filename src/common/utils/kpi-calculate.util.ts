import { BadRequestException } from '@nestjs/common';
import { KpiEventKind } from '../enums/kpi-event-kind.enum';
import { KpiRating } from '../enums/kpi-rating.enum';

export interface KpiEventPoints {
  eventKind: KpiEventKind;
  totalPoints: number;
}

export interface KpiScoreResult {
  baseScore: number;
  rawBonusPoints: number;
  bonusPoints: number;
  penaltyPoints: number;
  finalScore: number;
  rating: KpiRating;
  rewardPercent: number;
}

export function calculateKpiScore(
  baseScore: number,
  events: KpiEventPoints[],
): KpiScoreResult {
  const rawBonusPoints = events
    .filter((event) => event.eventKind === KpiEventKind.BONUS)
    .reduce((sum, event) => sum + event.totalPoints, 0);

  const bonusPoints = rawBonusPoints;

  const penaltyPoints = events
    .filter((event) => event.eventKind === KpiEventKind.PENALTY)
    .reduce((sum, event) => sum + event.totalPoints, 0);

  const finalScore = baseScore + bonusPoints + penaltyPoints;
  const { rating, rewardPercent } = resolveRating(finalScore);

  return {
    baseScore,
    rawBonusPoints,
    bonusPoints,
    penaltyPoints,
    finalScore,
    rating,
    rewardPercent,
  };
}

export function validateEventPoints(eventKind: KpiEventKind, points: number) {
  if (eventKind === KpiEventKind.BONUS && points < 0) {
    throw new BadRequestException('Điểm cộng phải là số không âm');
  }

  if (eventKind === KpiEventKind.PENALTY && points > 0) {
    throw new BadRequestException('Điểm trừ phải là số không dương');
  }
}

function resolveRating(finalScore: number): {
  rating: KpiRating;
  rewardPercent: number;
} {
  if (finalScore >= 100) {
    return { rating: KpiRating.EXCELLENT, rewardPercent: 200 };
  }

  if (finalScore >= 95) {
    return { rating: KpiRating.GOOD, rewardPercent: 150 };
  }

  if (finalScore >= 80) {
    return { rating: KpiRating.PASS, rewardPercent: 100 };
  }

  if (finalScore >= 70) {
    return { rating: KpiRating.FAIR, rewardPercent: 50 };
  }

  return { rating: KpiRating.FAIL, rewardPercent: 0 };
}
