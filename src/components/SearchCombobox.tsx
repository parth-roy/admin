import * as React from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface SearchComboboxProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
}

export function SearchCombobox({
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder = 'Search...',
  emptyText = 'No results found.',
  className,
}: SearchComboboxProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'h-9 justify-between font-normal text-sm border-slate-200 bg-white hover:bg-slate-50',
            !value && 'text-muted-foreground',
            className
          )}
        >
          <span className="truncate">{value || placeholder}</span>
          <div className="flex items-center ml-1 shrink-0 gap-1">
            {value && (
              <X
                className="h-3.5 w-3.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange('');
                  setOpen(false);
                }}
              />
            )}
            <ChevronsUpDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[220px] p-0 shadow-lg border-slate-200"
        align="start"
        sideOffset={4}
      >
        <Command>
          <CommandInput
            placeholder={searchPlaceholder}
            className="h-9 text-sm"
          />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option}
                  value={option}
                  onSelect={(selectedValue) => {
                    // cmdk lowercases the value, find the original
                    const original =
                      options.find(
                        (o) => o.toLowerCase() === selectedValue.toLowerCase()
                      ) ?? selectedValue;
                    onChange(original === value ? '' : original);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4 text-emerald-600',
                      value === option ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {option}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
