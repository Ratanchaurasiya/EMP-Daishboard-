import { ServiceRecord, ComputerServiceSummary, Computer, CompanyAsset, Employee } from '../types';
import { formatDateDisplay } from './formatters';

export function calculateComputerServiceSummary(
  computerId: string,
  allServices: ServiceRecord[]
): ComputerServiceSummary {
  const computerServices = allServices.filter(s => s.computerId === computerId);

  if (computerServices.length === 0) {
    return {
      totalServices: 0,
      lastServiceDate: null,
      servicesThisYear: 0,
      servicesThisMonth: 0,
      totalRepairCost: 0,
      mostCommonProblem: 'None',
      partsReplaced: [],
    };
  }

  // Sort descending by date
  const sortedServices = [...computerServices].sort((a, b) => {
    return new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime();
  });

  const lastService = sortedServices[0];
  const lastServiceDate = formatDateDisplay(lastService.serviceDate);

  // Date threshold calculations using current date
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  let servicesThisYear = 0;
  let servicesThisMonth = 0;
  let totalRepairCost = 0;
  const problemCounts: Record<string, number> = {};
  const partsList: string[] = [];

  computerServices.forEach(s => {
    totalRepairCost += Number(s.serviceCost) || 0;

    const sDate = new Date(s.serviceDate);
    if (!isNaN(sDate.getTime())) {
      if (sDate.getFullYear() === currentYear) {
        servicesThisYear++;
        if (sDate.getMonth() === currentMonth) {
          servicesThisMonth++;
        }
      }
    }

    // Problem counts
    const prob = s.problemCategory || 'Other';
    problemCounts[prob] = (problemCounts[prob] || 0) + 1;

    // Parts replaced
    if (s.partsReplaced && s.partsReplaced !== 'None' && s.partsReplaced.trim() !== '') {
      if (!partsList.includes(s.partsReplaced)) {
        partsList.push(s.partsReplaced);
      }
    }
  });

  // Find most common problem
  let mostCommonProblem = 'None';
  let maxCount = 0;
  Object.entries(problemCounts).forEach(([prob, count]) => {
    if (count > maxCount) {
      maxCount = count;
      mostCommonProblem = prob;
    }
  });

  return {
    totalServices: computerServices.length,
    lastServiceDate,
    servicesThisYear,
    servicesThisMonth,
    totalRepairCost,
    mostCommonProblem,
    partsReplaced: partsList,
  };
}

export interface DashboardMetrics {
  totalEmployees: number;
  employeesWithComputer: number;
  totalCompanyComputers: number;
  totalAssignedAssets: number;
  availableAssets: number;
  computersUnderService: number;
  totalServiceRecords: number;
}

export function calculateDashboardMetrics(
  employees: Employee[],
  computers: Computer[],
  assets: CompanyAsset[],
  services: ServiceRecord[]
): DashboardMetrics {
  // Employees with an assigned computer
  const assignedEmployeeIdsWithComputer = new Set(
    computers
      .filter(c => c.assignedEmployeeId && c.status === 'Assigned')
      .map(c => c.assignedEmployeeId)
  );

  const totalEmployees = employees.length;
  const employeesWithComputer = assignedEmployeeIdsWithComputer.size;
  const totalCompanyComputers = computers.length;

  // Assets counts
  const totalAssignedAssets = assets.filter(a => a.status === 'Assigned').length;
  const availableAssets = assets.filter(a => a.status === 'Available').length;

  // Computers under service
  const computersUnderService = computers.filter(c => c.status === 'Under Service').length;

  // Total service records
  const totalServiceRecords = services.length;

  return {
    totalEmployees,
    employeesWithComputer,
    totalCompanyComputers,
    totalAssignedAssets,
    availableAssets,
    computersUnderService,
    totalServiceRecords,
  };
}
