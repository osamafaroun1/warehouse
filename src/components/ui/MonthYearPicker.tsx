// MonthYearPicker
import { Component, createEffect, createSignal, For, onCleanup, onMount, Show, untrack } from 'solid-js';
import { Portal } from 'solid-js/web';
import { t } from '../../localization';
import { Icon } from '.';

interface MonthYearPickerProps {
    value: string | undefined;
    onChange: (value?: string) => void;
    loading?: boolean;
    minYear?: number;
    maxYear?: number;
    placeholder?: string;
    granularity?: 'year' | 'month' | 'day';
    dayPanelPosition?: 'below' | 'right';
}

const months = [
    { value: '01', short: 'Jan', long: 'January' },
    { value: '02', short: 'Feb', long: 'February' },
    { value: '03', short: 'Mar', long: 'March' },
    { value: '04', short: 'Apr', long: 'April' },
    { value: '05', short: 'May', long: 'May' },
    { value: '06', short: 'Jun', long: 'June' },
    { value: '07', short: 'Jul', long: 'July' },
    { value: '08', short: 'Aug', long: 'August' },
    { value: '09', short: 'Sep', long: 'September' },
    { value: '10', short: 'Oct', long: 'October' },
    { value: '11', short: 'Nov', long: 'November' },
    { value: '12', short: 'Dec', long: 'December' },
] as const;

const YEAR_PATTERN = /^(\d{4})$/;
const MONTH_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/;
const DAY_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

const MonthYearPicker: Component<MonthYearPickerProps> = (props) => {
    const [periodGranularity, setPeriodGranularity] = createSignal<'year' | 'month' | 'day'>(
        untrack(() => props.granularity ?? 'month'),
    );

    const granularity = () => periodGranularity();
    const dayPanelPosition = () => props.dayPanelPosition ?? 'below';
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = String(today.getMonth() + 1).padStart(2, '0');
    const currentDay = String(today.getDate()).padStart(2, '0');

    const minYear = () => props.minYear ?? 2000;
    const maxYear = () => props.maxYear ?? currentYear;

    const parsedValue = () => {
        const val = props.value;
        if (!val) {
            return { year: currentYear, month: currentMonth, day: currentDay };
        }

        let year: number, month: string, day: string;
        let match;

        if ((match = YEAR_PATTERN.exec(val))) {
            year = Number(match[1]);
            month = '01';
            day = '01';
        } else if ((match = MONTH_PATTERN.exec(val))) {
            year = Number(match[1]);
            month = match[2];
            day = '01';
        } else if ((match = DAY_PATTERN.exec(val))) {
            year = Number(match[1]);
            month = match[2];
            day = match[3];
        } else {
            year = currentYear;
            month = currentMonth;
            day = currentDay;
        }

        return { year, month, day };
    };

    const getYearFromValue = () => parsedValue().year;

    const normalizeYear = (year: number) => {
        const minimum = minYear();
        const maximum = maxYear();
        if (year < minimum) return minimum;
        if (maximum !== undefined && year > maximum) return maximum;
        return year;
    };

    // State
    const [isOpen, setIsOpen] = createSignal(false);
    const [displayedYear, setDisplayedYear] = createSignal(normalizeYear(getYearFromValue()));
    const [tempMonth, setTempMonth] = createSignal<string | null>(null);

    let pickerRef: HTMLDivElement | undefined;
    let popoverRef: HTMLDivElement | undefined;

    const [popoverPosition, setPopoverPosition] = createSignal({
        top: 0,
        left: 0,
        width: 290,
    });

    const getPopoverWidth = () => {
        const baseWidth = Math.max(pickerRef?.getBoundingClientRect().width || 290, 290);
        if (granularity() === 'day' && tempMonth() !== null && dayPanelPosition() === 'right') {
            return Math.min(baseWidth * 2 + 16, window.innerWidth - 16);
        }
        return baseWidth;
    };

    const updatePopoverPosition = () => {
        if (!pickerRef) return;

        const rect = pickerRef.getBoundingClientRect();
        const width = getPopoverWidth();
        let left = rect.left;
        if (left + width > window.innerWidth - 8) {
            left = window.innerWidth - width - 8;
        }
        if (left < 8) left = 8;

        setPopoverPosition({
            top: rect.bottom + 8,
            left,
            width,
        });
    };

    // Sync displayed year with external value
    createEffect(() => {
        const year = getYearFromValue();
        setDisplayedYear(normalizeYear(year));
    });

    const displayText = () => {
        const val = props.value;
        if (!val) return null;
        const { year, month, day } = parsedValue();
        const monthLong = months.find(m => m.value === month)?.long || '';

        if (granularity() === 'year') {
            return `${year}`;
        } else if (granularity() === 'month') {
            return `${monthLong} ${year}`;
        } else {
            return `${monthLong} ${day}, ${year}`;
        }
    };

    // --- Year selection ---
    const yearsInDecade = () => {
        const base = Math.floor(displayedYear() / 10) * 10;
        return Array.from({ length: 10 }, (_, i) => base + i);
    };

    const selectYear = (year: number) => {
        const normalized = normalizeYear(year);
        setDisplayedYear(normalized);
        props.onChange(String(normalized));
        setIsOpen(false);
    };

    const canGoToPreviousDecade = () => {
        const decadeStart = Math.floor(displayedYear() / 10) * 10;
        return decadeStart - 10 >= minYear();
    };

    const canGoToNextDecade = () => {
        const decadeEnd = Math.floor(displayedYear() / 10) * 10 + 9;
        const max = maxYear();
        return max === undefined || decadeEnd < max;
    };

    const previousDecade = () => {
        if (!canGoToPreviousDecade()) return;
        setDisplayedYear(y => normalizeYear(y - 10));
    };

    const nextDecade = () => {
        if (!canGoToNextDecade()) return;
        setDisplayedYear(y => normalizeYear(y + 10));
    };

    // --- Month selection ---
    const selectMonth = (month: string) => {
        if (granularity() === 'month') {
            props.onChange(`${displayedYear()}-${month}`);
            setIsOpen(false);
        } else if (granularity() === 'day') {
            setTempMonth(month);
            setTimeout(updatePopoverPosition, 0);
        }
    };

    // --- Day selection ---
    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month, 0).getDate();
    };

    const selectDay = (day: string) => {
        const year = displayedYear();
        const month = tempMonth();
        if (!month) return;
        props.onChange(`${year}-${month}-${day}`);
        setTempMonth(null);
        setIsOpen(false);
    };

    const goBackToMonthSelection = () => {
        setTempMonth(null);
        setTimeout(updatePopoverPosition, 0);
    };

    // --- Navigation ---
    const canGoToPreviousYear = () => {
        if (granularity() === 'year') return canGoToPreviousDecade();
        return displayedYear() > minYear();
    };

    const canGoToNextYear = () => {
        if (granularity() === 'year') return canGoToNextDecade();
        const maximum = maxYear();
        return maximum === undefined || displayedYear() < maximum;
    };

    const previousYear = () => {
        if (granularity() === 'year') {
            previousDecade();
            return;
        }
        if (!canGoToPreviousYear()) return;
        setDisplayedYear(y => y - 1);
        // If we're in day mode and a month was selected, clear it because the year changed
        if (granularity() === 'day') {
            setTempMonth(null);
            setTimeout(updatePopoverPosition, 0);
        }
    };

    const nextYear = () => {
        if (granularity() === 'year') {
            nextDecade();
            return;
        }
        if (!canGoToNextYear()) return;
        setDisplayedYear(y => y + 1);
        // If we're in day mode and a month was selected, clear it because the year changed
        if (granularity() === 'day') {
            setTempMonth(null);
            setTimeout(updatePopoverPosition, 0);
        }
    };

    const goToCurrentPeriod = () => {
        const normalizedCurrentYear = normalizeYear(currentYear);
        setDisplayedYear(normalizedCurrentYear);

        if (granularity() === 'year') {
            props.onChange(String(normalizedCurrentYear));
            setIsOpen(false);
        } else if (granularity() === 'month') {
            if (normalizedCurrentYear === currentYear) {
                props.onChange(`${currentYear}-${currentMonth}`);
                setIsOpen(false);
            }
        } else { // day
            if (normalizedCurrentYear === currentYear) {
                // Select the current day
                const dateStr = `${currentYear}-${currentMonth}-${currentDay}`;
                props.onChange(dateStr);
                setTempMonth(null);
                setIsOpen(false);
            } else {
                // If current year is not in range, just go to the year and clear any temp month
                setTempMonth(null);
                setTimeout(updatePopoverPosition, 0);
            }
        }
    };

    const isSelected = (month: string) => {
        if (granularity() === 'year') return false;
        if (granularity() === 'month') {
            return props.value === `${displayedYear()}-${month}`;
        }
        // For day mode: highlight the month if it matches the selected value's month AND year
        const { month: selMonth, year: selYear } = parsedValue();
        return selMonth === month && selYear === displayedYear();
    };

    const isCurrentPeriod = (month: string) => {
        return displayedYear() === currentYear && month === currentMonth;
    };

    // Reset tempMonth when popover closes
    createEffect(() => {
        if (!isOpen()) {
            setTempMonth(null);
        }
    });

    // --- Lifecycle ---
    onMount(() => {
        const handleOutsideClick = (event: MouseEvent) => {
            const target = event.target;
            if (target instanceof Node && !pickerRef?.contains(target) && !popoverRef?.contains(target)) {
                setIsOpen(false);
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (!isOpen()) return;
            if (event.key === 'Escape') {
                event.preventDefault();
                setIsOpen(false);
            }
            if (event.key === 'ArrowLeft') {
                event.preventDefault();
                previousYear();
            }
            if (event.key === 'ArrowRight') {
                event.preventDefault();
                nextYear();
            }
        };

        document.addEventListener('mousedown', handleOutsideClick);
        document.addEventListener('keydown', handleKeyDown);

        const handlePositionChange = () => {
            if (isOpen()) updatePopoverPosition();
        };

        window.addEventListener('resize', handlePositionChange);
        window.addEventListener('scroll', handlePositionChange, true);

        onCleanup(() => {
            document.removeEventListener('mousedown', handleOutsideClick);
            document.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('resize', handlePositionChange);
            window.removeEventListener('scroll', handlePositionChange, true);
        });
    });

    // --- Render helpers ---
    const showDayPanel = () => granularity() === 'day' && tempMonth() !== null;

    return (
        <div class='flex flex-col gap-2'>
            <div class='flex items-center gap-3'>
                <span class='text-sm font-medium text-zinc-700 dark:text-zinc-300'>
                    {t('mmp_select_period')}
                </span>
                <div class='flex rounded-lg border border-zinc-200 p-0.5 dark:border-white/10'>
                    <button
                        type='button'
                        class={`px-3 py-1.5 text-xs font-medium rounded transition ${
                            periodGranularity() === 'year'
                                ? 'bg-indigo-500 text-white shadow-sm'
                                : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-white/5'
                        }`}
                        onClick={() => {
                            props.onChange();
                            setPeriodGranularity('year');
                        }}
                    >
                        {t('mmp_year')}
                    </button>
                    <button
                        type='button'
                        class={`px-3 py-1.5 text-xs font-medium rounded transition ${
                            periodGranularity() === 'month'
                                ? 'bg-indigo-500 text-white shadow-sm'
                                : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-white/5'
                        }`}
                        onClick={() => {
                            props.onChange();
                            setPeriodGranularity('month');
                        }}
                    >
                        {t('mmp_month')}
                    </button>
                    <button
                        type='button'
                        class={`px-3 py-1.5 text-xs font-medium rounded transition ${
                            periodGranularity() === 'day'
                                ? 'bg-indigo-500 text-white shadow-sm'
                                : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-white/5'
                        }`}
                        onClick={() => {
                            props.onChange();
                            setPeriodGranularity('day');
                        }}
                    >
                        {t('mmp_day')}
                    </button>
                </div>
            </div>

            <div
                ref={(element) => {
                    pickerRef = element;
                }}
                class='relative w-full sm:max-w-xs'
            >
                {/* Trigger */}
                <button
                    id='payment-period'
                    type='button'
                    disabled={props.loading}
                    aria-haspopup='dialog'
                    aria-expanded={isOpen()}
                    aria-controls='payment-period-picker'
                    onClick={() => {
                        if (!isOpen()) updatePopoverPosition();
                        setIsOpen(open => !open);
                    }}
                    class='group flex h-11 w-full items-center justify-between rounded-xl border border-zinc-200 bg-white px-3.5 text-left shadow-sm transition-all duration-200 hover:border-zinc-300 hover:shadow focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-zinc-900 dark:hover:border-white/20'
                >
                    <span class='flex min-w-0 items-center gap-3'>
                        <span class='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'>
                            <Icon name='calendar_month' size={18} />
                        </span>

                        <Show
                            when={props.value}
                            fallback={
                                <span class='truncate text-sm text-zinc-400 dark:text-zinc-500'>
                                    {props.placeholder ?? t('mmp_select_period')}
                                </span>
                            }
                        >
                            <span class='flex min-w-0 flex-col'>
                                <span class='truncate text-sm font-medium text-zinc-900 dark:text-zinc-100'>
                                    {displayText()}
                                </span>
                                <span class='truncate text-xs text-zinc-400 dark:text-zinc-500'>
                                    {props.value}
                                </span>
                            </span>
                        </Show>
                    </span>

                    <Icon
                        name='expand_more'
                        size={16}
                        class={`shrink-0 text-zinc-400 transition-transform duration-200 ${
                            isOpen() ? 'rotate-180' : ''
                        }`}
                    />
                </button>

                {/* Popover */}
                <Show when={isOpen()}>
                    <Portal>
                        <div
                            ref={(element) => {
                                popoverRef = element;
                            }}
                            id='payment-period-picker'
                            role='dialog'
                            aria-label='Choose period'
                            style={{
                                top: `${popoverPosition().top}px`,
                                left: `${popoverPosition().left}px`,
                                width: `${popoverPosition().width}px`,
                            }}
                            class='fixed z-99999 origin-top rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl shadow-zinc-950/10 dark:border-white/10 dark:bg-zinc-900 dark:shadow-black/30'
                        >
                            {/* Year / Decade navigation */}
                            <div class='mb-4 flex items-center justify-between'>
                                <button
                                    type='button'
                                    aria-label='Previous year'
                                    disabled={!canGoToPreviousYear()}
                                    onClick={previousYear}
                                    class='flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-30 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-100'
                                >
                                    <Icon name='chevron_left' size={16} />
                                </button>

                                <span
                                    aria-live='polite'
                                    class='text-base font-semibold text-zinc-900 dark:text-zinc-100'
                                >
                                    {granularity() === 'year'
                                        ? `${Math.floor(displayedYear() / 10) * 10} – ${
                                            Math.floor(displayedYear() / 10) * 10 + 9
                                        }`
                                        : displayedYear()}
                                </span>

                                <button
                                    type='button'
                                    aria-label='Next year'
                                    disabled={!canGoToNextYear()}
                                    onClick={nextYear}
                                    class='flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-30 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-100'
                                >
                                    <Icon name='chevron_right' size={16} />
                                </button>
                            </div>

                            {/* Main content */}
                            <div
                                class={`flex ${
                                    showDayPanel() && dayPanelPosition() === 'right'
                                        ? 'flex-row gap-4'
                                        : 'flex-col gap-0'
                                }`}
                            >
                                {/* Month / Year grid */}
                                <div class={showDayPanel() && dayPanelPosition() === 'right' ? 'flex-1 min-w-0' : ''}>
                                    <Show
                                        when={granularity() === 'year'}
                                        fallback={
                                            <div class='grid grid-cols-3 gap-2'>
                                                <For each={months}>
                                                    {(month) => (
                                                        <button
                                                            type='button'
                                                            aria-label={`${month.long} ${displayedYear()}`}
                                                            aria-pressed={isSelected(month.value)}
                                                            onClick={() => selectMonth(month.value)}
                                                            class={`relative h-10 rounded-xl text-sm font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
                                                                isSelected(month.value) && granularity() === 'month'
                                                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 hover:bg-blue-700'
                                                                    : 'text-zinc-700 hover:bg-blue-50 hover:text-blue-700 dark:text-zinc-300 dark:hover:bg-blue-500/10 dark:hover:text-blue-300'
                                                            }`}
                                                        >
                                                            {month.short}
                                                            <Show
                                                                when={isCurrentPeriod(month.value)
                                                                    && !isSelected(month.value)}
                                                            >
                                                                <span
                                                                    aria-hidden='true'
                                                                    class='absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-blue-500'
                                                                />
                                                            </Show>
                                                        </button>
                                                    )}
                                                </For>
                                            </div>
                                        }
                                    >
                                        {/* Year grid */}
                                        <div class='grid grid-cols-4 gap-2'>
                                            <For each={yearsInDecade()}>
                                                {year => {
                                                    const isSelectedYear = props.value === String(year);
                                                    return (
                                                        <button
                                                            type='button'
                                                            onClick={() => selectYear(year)}
                                                            class={`h-10 rounded-xl text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
                                                                isSelectedYear
                                                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 hover:bg-blue-700'
                                                                    : 'text-zinc-700 hover:bg-blue-50 hover:text-blue-700 dark:text-zinc-300 dark:hover:bg-blue-500/10 dark:hover:text-blue-300'
                                                            }`}
                                                        >
                                                            {year}
                                                        </button>
                                                    );
                                                }}
                                            </For>
                                        </div>
                                    </Show>
                                </div>

                                {/* Day panel */}
                                <Show when={showDayPanel()}>
                                    <div
                                        class={dayPanelPosition() === 'right'
                                            ? 'flex-1 min-w-0 border-l border-zinc-200 pl-4 dark:border-white/10'
                                            : 'mt-4 border-t border-zinc-100 pt-4 dark:border-white/10'}
                                    >
                                        <div class='flex items-center justify-between mb-2'>
                                            <button
                                                type='button'
                                                onClick={goBackToMonthSelection}
                                                class='text-sm text-blue-600 hover:underline dark:text-blue-400'
                                            >
                                                ← {months.find(m => m.value === tempMonth())?.long}
                                            </button>
                                            <span class='text-xs text-zinc-500'>Select day</span>
                                        </div>
                                        <div class='grid grid-cols-7 gap-1'>
                                            <For
                                                each={Array.from(
                                                    { length: getDaysInMonth(displayedYear(), Number(tempMonth())) },
                                                    (_, i) => i + 1,
                                                )}
                                            >
                                                {day => {
                                                    const dayStr = String(day).padStart(2, '0');
                                                    const isSelectedDay =
                                                        props.value === `${displayedYear()}-${tempMonth()}-${dayStr}`;
                                                    return (
                                                        <button
                                                            type='button'
                                                            onClick={() => selectDay(dayStr)}
                                                            class={`h-9 w-full rounded-lg text-sm font-medium transition ${
                                                                isSelectedDay
                                                                    ? 'bg-blue-600 text-white'
                                                                    : 'hover:bg-blue-50 dark:hover:bg-blue-500/10'
                                                            }`}
                                                        >
                                                            {day}
                                                        </button>
                                                    );
                                                }}
                                            </For>
                                        </div>
                                    </div>
                                </Show>
                            </div>

                            {/* Footer */}
                            <div class='mt-4 flex items-center justify-between border-t border-zinc-100 pt-3 dark:border-white/10'>
                                <span class='text-xs text-zinc-400'>
                                    <Show
                                        when={maxYear() !== undefined}
                                        fallback={<span>From {minYear()}</span>}
                                    >
                                        <span>{minYear()} – {maxYear()}</span>
                                    </Show>
                                </span>

                                <Show
                                    when={currentYear >= minYear()
                                        && (maxYear() === undefined || currentYear <= maxYear()!)}
                                >
                                    <button
                                        type='button'
                                        onClick={goToCurrentPeriod}
                                        class='rounded-lg px-2 py-1 text-xs font-medium text-blue-600 transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:text-blue-400 dark:hover:bg-blue-500/10'
                                    >
                                        Today
                                    </button>
                                </Show>
                            </div>
                        </div>
                    </Portal>
                </Show>
            </div>

            <Show when={props.loading}>
                <div class='flex items-center gap-2 text-xs text-zinc-500'>
                    <span
                        aria-hidden='true'
                        class='h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-300 border-t-blue-600'
                    />
                    <span>{t('mmp_loading')}...</span>
                </div>
            </Show>
        </div>
    );
};

export default MonthYearPicker;
