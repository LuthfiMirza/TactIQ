import { z } from 'zod';

export const PlayerQuerySchema = z.object({
  position: z.enum(['GK', 'DEF', 'MID', 'FWD']).optional(),
  league: z.string().max(100).optional(),
  search: z.string().max(100).optional(),
  minPassing: z.coerce
    .number({ invalid_type_error: 'minPassing must be a valid number between 0 and 100' })
    .int()
    .min(0, 'minPassing cannot be less than 0')
    .max(100, 'minPassing cannot exceed 100')
    .optional(),
  minPace: z.coerce
    .number({ invalid_type_error: 'minPace must be a valid number between 0 and 100' })
    .int()
    .min(0, 'minPace cannot be less than 0')
    .max(100, 'minPace cannot exceed 100')
    .optional(),
});
