"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar, TrendingUp } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { api } from "@/components/providers/trpc-provider";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

type ViewMode = "day" | "week" | "month";

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function formatDateISO(d: Date) {
  return d.toISOString().split("T")[0]!;
}

export function DashboardCalendar() {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<Date | null>(today);
  const [rangeStart, setRangeStart] = useState<Date | null>(null);
  const [rangeEnd, setRangeEnd] = useState<Date | null>(null);
  const [mode, setMode] = useState<ViewMode>("month");
  const [selectingRange, setSelectingRange] = useState(false);

  const year  = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const daysInMonth  = getDaysInMonth(year, month);
  const firstDayOfMonth = getFirstDayOfMonth(year, month);

  // Build calendar grid
  const calendarDays: (Date | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(new Date(year, month, d));

  // Query orders for selected date or range
  const dateFrom = rangeStart ? formatDateISO(rangeStart) : selectedDate ? formatDateISO(selectedDate) : undefined;
  const dateTo   = rangeEnd   ? formatDateISO(rangeEnd)   : selectedDate ? formatDateISO(selectedDate) : undefined;

  const { data: orders = [] } = api.orders.list.useQuery(
    { limit: 50, dateFrom, dateTo },
    { enabled: !!(dateFrom || dateTo) }
  );

  const totalValue = orders.reduce((s: number, o: any) => s + Number(o.total), 0);

  function prevMonth() {
    setViewDate(new Date(year, month - 1, 1));
  }

  function nextMonth() {
    setViewDate(new Date(year, month + 1, 1));
  }

  function handleDayClick(day: Date) {
    if (selectingRange) {
      if (!rangeStart || (rangeStart && rangeEnd)) {
        setRangeStart(day);
        setRangeEnd(null);
        setSelectedDate(null);
      } else {
        if (day < rangeStart) {
          setRangeEnd(rangeStart);
          setRangeStart(day);
        } else {
          setRangeEnd(day);
        }
        setSelectingRange(false);
      }
    } else {
      setSelectedDate(day);
      setRangeStart(null);
      setRangeEnd(null);
    }
  }

  function isInRange(day: Date) {
    if (!rangeStart || !rangeEnd) return false;
    return day >= rangeStart && day <= rangeEnd;
  }

  function isRangeEdge(day: Date) {
    return (rangeStart && isSameDay(day, rangeStart)) || (rangeEnd && isSameDay(day, rangeEnd));
  }

  const displayLabel = rangeStart && rangeEnd
    ? `${rangeStart.toLocaleDateString("pt-BR")} – ${rangeEnd.toLocaleDateString("pt-BR")}`
    : selectedDate
      ? selectedDate.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })
      : "Selecione uma data";

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm">Calendário de Vendas</span>
        </div>
        {/* Mode selector */}
        <div className="flex gap-1 bg-muted rounded-lg p-0.5">
          {(["day", "week", "month"] as ViewMode[]).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                "px-2.5 py-1 rounded-md text-xs font-medium transition-all",
                mode === m ? "bg-background shadow text-foreground" : "text-muted-foreground"
              )}
            >
              {m === "day" ? "Dia" : m === "week" ? "Semana" : "Mês"}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={prevMonth}
            className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-semibold text-sm">
            {MONTHS[month]} {year}
          </span>
          <button
            onClick={nextMonth}
            className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1">
          {WEEKDAYS.map(d => (
            <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} />;

            const isToday    = isSameDay(day, today);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const inRange    = isInRange(day);
            const isEdge     = isRangeEdge(day);

            return (
              <button
                key={day.toISOString()}
                onClick={() => handleDayClick(day)}
                className={cn(
                  "aspect-square rounded-lg text-xs font-medium transition-all flex items-center justify-center",
                  isSelected || isEdge
                    ? "bg-primary text-white font-bold"
                    : inRange
                      ? "bg-primary/20 text-primary"
                      : isToday
                        ? "bg-primary/10 text-primary font-bold ring-1 ring-primary/30"
                        : "hover:bg-muted text-foreground"
                )}
              >
                {day.getDate()}
              </button>
            );
          })}
        </div>

        {/* Range toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSelectingRange(v => !v);
              if (!selectingRange) {
                setSelectedDate(null);
                setRangeStart(null);
                setRangeEnd(null);
              }
            }}
            className={cn(
              "text-xs px-3 py-1.5 rounded-full border font-medium transition-all",
              selectingRange
                ? "bg-primary/10 border-primary/30 text-primary"
                : "border-border text-muted-foreground hover:bg-muted"
            )}
          >
            {selectingRange ? "Selecionando período..." : "Selecionar período"}
          </button>
          {(rangeStart || selectedDate) && (
            <button
              onClick={() => { setSelectedDate(today); setRangeStart(null); setRangeEnd(null); setSelectingRange(false); }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Hoje
            </button>
          )}
        </div>

        {/* Results */}
        <div className="bg-muted/40 rounded-xl p-3 space-y-2">
          <p className="text-xs text-muted-foreground capitalize">{displayLabel}</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-semibold">
                {orders.length} venda{orders.length !== 1 ? "s" : ""}
              </span>
            </div>
            <span className="text-lg font-bold text-primary">{formatCurrency(totalValue)}</span>
          </div>
          {orders.length > 0 && (
            <div className="space-y-1 pt-1 border-t border-border/50 max-h-32 overflow-y-auto">
              {orders.slice(0, 5).map((o: any) => (
                <div key={o.id} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">#{o.number} {o.customer?.name ? `· ${o.customer.name}` : ""}</span>
                  <span className="font-mono font-semibold">{formatCurrency(Number(o.total))}</span>
                </div>
              ))}
              {orders.length > 5 && (
                <p className="text-[10px] text-muted-foreground text-center">+{orders.length - 5} mais</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
