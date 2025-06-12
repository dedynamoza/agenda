"use client";

import type React from "react";

import { useState, useCallback, useMemo, useEffect } from "react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";
import { useInView } from "react-intersection-observer";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, User, X } from "lucide-react";
import { useEmployeeFilter } from "@/hooks/use-employee-filter";

interface Employee {
  id: string;
  name: string;
  email?: string;
  position?: string;
}

interface EmployeeFilterSelectProps {
  className?: string;
}

export function EmployeeFilterSelect({ className }: EmployeeFilterSelectProps) {
  const { ref, inView } = useInView();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { selectedEmployee, setSelectedEmployee } = useEmployeeFilter();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ["employees-infinite", searchQuery],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams({
        page: pageParam.toString(),
        limit: "20",
        search: searchQuery,
      });
      const response = await fetch(`/api/employees/search?${params}`);
      if (!response.ok) throw new Error("Failed to fetch employees");
      return response.json();
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.nextPage : undefined;
    },
    initialPageParam: 1,
  });

  const employees = useMemo(() => {
    return data?.pages.flatMap((page) => page.employees) || [];
  }, [data]);

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleSelect = useCallback(
    (employee: Employee) => {
      setSelectedEmployee(employee);
      setOpen(false);
    },
    [setSelectedEmployee]
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setSelectedEmployee(null);
    },
    [setSelectedEmployee]
  );

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  return (
    <div className={cn("w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[244px] justify-between bg-white/20 backdrop-blur-sm border border-white/20 text-white cursor-pointer 
            hover:bg-white/30 hover:text-white"
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <User className="h-4 w-4 text-white flex-shrink-0" />
              {selectedEmployee ? (
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="truncate font-medium">
                    {selectedEmployee.name}
                  </span>
                </div>
              ) : (
                <span className="text-white">Pilih Nama</span>
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {selectedEmployee && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-white/30 hover:text-white cursor-pointer"
                  onClick={handleClear}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
              <ChevronsUpDown className="h-4 w-4" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Cari nama..."
              value={searchQuery}
              onValueChange={handleSearchChange}
              className="h-9"
            />
            <CommandList className="max-h-[300px] overflow-y-auto">
              {isLoading && (
                <div className="p-4 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Loading...
                  </p>
                </div>
              )}

              {isError && (
                <CommandEmpty>
                  <div className="text-center py-4">
                    <p className="text-sm text-destructive">
                      Failed to load employees
                    </p>
                  </div>
                </CommandEmpty>
              )}

              {!isLoading && !isError && employees.length === 0 && (
                <CommandEmpty>
                  <div className="text-center py-4">
                    <User className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Nama tidak ditemukan
                    </p>
                  </div>
                </CommandEmpty>
              )}

              {employees.length > 0 && (
                <CommandGroup>
                  {employees.map((employee) => (
                    <CommandItem
                      key={employee.id}
                      value={employee.id}
                      onSelect={() => handleSelect(employee)}
                      className="flex items-center justify-between p-3 cursor-pointer"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {employee.name}
                          </p>
                          {employee.email && (
                            <p className="text-xs text-muted-foreground truncate">
                              {employee.email}
                            </p>
                          )}
                        </div>
                      </div>
                      <Check
                        className={cn(
                          "h-4 w-4 flex-shrink-0",
                          selectedEmployee?.id === employee.id
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}

                  {/* Infinite scroll trigger */}
                  {hasNextPage && (
                    <div ref={ref} className="p-4 text-center">
                      {isFetchingNextPage ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mx-auto"></div>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Scroll untuk lihat lebih...
                        </p>
                      )}
                    </div>
                  )}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
