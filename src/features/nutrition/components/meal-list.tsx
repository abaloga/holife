import { motion, useReducedMotion } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { ListGroup, ListRow } from '@/components/common/list-row';
import { Badge } from '@/components/ui/badge';
import { formatGrams, formatNumber } from '@/lib/format';
import { listItem, staggerChildren } from '@/lib/motion';
import { formatInstant } from '@/lib/date';
import { MEAL_SLOTS } from '../schema';
import type { MealEntry } from '../api';
import { MealImage } from './meal-image';

interface MealListProps {
  meals: MealEntry[];
  timezone: string;
  onSelect: (meal: MealEntry) => void;
}

/** Meals grouped by part of day, in the order the day happens. */
export function MealList({ meals, timezone, onSelect }: MealListProps) {
  const reduceMotion = useReducedMotion();

  const groups: { label: string; meals: MealEntry[] }[] = MEAL_SLOTS.map((slot) => ({
    label: slot.label,
    meals: meals.filter((meal) => meal.slot === slot.value),
  })).filter((group) => group.meals.length > 0);

  // Meals saved before a slot was chosen still need somewhere to live.
  const ungrouped = meals.filter((meal) => meal.slot === null);
  if (ungrouped.length > 0) groups.push({ label: 'Other', meals: ungrouped });

  return (
    <motion.div
      variants={reduceMotion ? undefined : staggerChildren()}
      initial="hidden"
      animate="visible"
      className="space-y-5"
    >
      {groups.map((group) => (
        <div key={group.label}>
          <h3 className="mb-2 text-[0.8125rem] font-medium text-muted-foreground">{group.label}</h3>
          <ListGroup>
            {group.meals.map((meal) => (
              <motion.div key={meal.id} variants={reduceMotion ? undefined : listItem}>
                <MealRow meal={meal} timezone={timezone} onSelect={onSelect} />
              </motion.div>
            ))}
          </ListGroup>
        </div>
      ))}
    </motion.div>
  );
}

function MealRow({
  meal,
  timezone,
  onSelect,
}: {
  meal: MealEntry;
  timezone: string;
  onSelect: (meal: MealEntry) => void;
}) {
  return (
    <ListRow
      onActivate={() => onSelect(meal)}
      activateLabel={`Edit ${meal.name}`}
      leading={
        meal.image_path ? (
          <MealImage path={meal.image_path} className="size-10 shrink-0 rounded-lg object-cover" />
        ) : undefined
      }
      trailing={
        <div className="shrink-0 text-right">
          <p className="tnum text-[0.9375rem] font-semibold">
            {formatNumber(Math.round(Number(meal.calories)))}
          </p>
          <p className="text-[0.6875rem] text-muted-foreground">kcal</p>
        </div>
      }
    >
      <div className="flex items-center gap-1.5">
        <span className="truncate text-[0.9375rem] font-medium">{meal.name}</span>
        {meal.source === 'ai_estimate' && (
          <Badge variant="outline" title="Values started from an estimate">
            <Sparkles aria-hidden />
            <span className="sr-only">Estimated</span>
          </Badge>
        )}
      </div>
      <p className="tnum mt-0.5 truncate text-xs text-muted-foreground">
        {formatInstant(meal.eaten_at, timezone, 'HH:mm')} · P {formatGrams(Number(meal.protein_g))}
        {' · '}C {formatGrams(Number(meal.carbs_g))} · F {formatGrams(Number(meal.fat_g))}
      </p>
    </ListRow>
  );
}
