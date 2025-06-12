import { create } from "zustand";

interface Employee {
  id: string;
  name: string;
  email?: string;
  position?: string;
}

interface EmployeeFilterState {
  selectedEmployee: Employee | null;
  setSelectedEmployee: (employee: Employee | null) => void;
  clearFilter: () => void;
}

export const useEmployeeFilter = create<EmployeeFilterState>((set) => ({
  selectedEmployee: null,
  setSelectedEmployee: (employee) => set({ selectedEmployee: employee }),
  clearFilter: () => set({ selectedEmployee: null }),
}));
