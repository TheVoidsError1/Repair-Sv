const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  error?: string;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const token = localStorage.getItem('authToken');

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        return {
          status: 'error',
          message: data.message || 'An error occurred',
          error: data.error,
        };
      }

      return {
        status: 'success',
        data: data.data || data,
        message: data.message,
      };
    } catch (error) {
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Authentication
  async login(email: string, password: string) {
    return this.request<{ token: string; user: any }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }

  // Personnel (Staff/Technician)
  async getPersonnel() {
    return this.request<any[]>('/api/personnel');
  }

  async getPersonnelById(id: string) {
    return this.request<any>(`/api/personnel/${id}`);
  }

  async createPersonnel(data: any) {
    return this.request<any>('/api/personnel', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePersonnel(id: string, data: any) {
    return this.request<any>(`/api/personnel/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePersonnel(id: string) {
    return this.request<void>(`/api/personnel/${id}`, {
      method: 'DELETE',
    });
  }

  // Customer
  async getCustomers() {
    return this.request<any[]>('/api/customers');
  }

  async getCustomerById(id: string) {
    return this.request<any>(`/api/customers/${id}`);
  }

  async searchCustomers(query: string = "") {
    const queryParam = query ? `?q=${encodeURIComponent(query)}` : "";
    return this.request<any[]>(`/api/customers/search${queryParam}`);
  }

  async getCustomerWithRepairs(id: string) {
    return this.request<any>(`/api/customers/${id}/with-repairs`);
  }

  async createCustomer(data: any) {
    return this.request<any>('/api/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCustomer(id: string, data: any) {
    return this.request<any>(`/api/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCustomer(id: string) {
    return this.request<void>(`/api/customers/${id}`, {
      method: 'DELETE',
    });
  }

  // Repair
  async getRepairs(page: number = 1, limit: number = 8) {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    const url = `${this.baseURL}/api/repairs?${queryParams.toString()}`;
    const token = localStorage.getItem('authToken');

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        return {
          status: 'error' as const,
          message: data.message || 'An error occurred',
          error: data.error,
        };
      }

      // Return both data and pagination
      return {
        status: 'success' as const,
        data: data.data || [],
        pagination: data.pagination,
        message: data.message,
      };
    } catch (error) {
      return {
        status: 'error' as const,
        message: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  async getRepairById(id: string) {
    return this.request<any>(`/api/repairs/${id}`);
  }

  async createRepair(data: any) {
    return this.request<any>('/api/repairs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateRepair(id: string, data: any) {
    return this.request<any>(`/api/repairs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteRepair(id: string) {
    return this.request<void>(`/api/repairs/${id}`, {
      method: 'DELETE',
    });
  }

  // Part (Inventory)
  async getParts() {
    return this.request<any[]>('/api/parts');
  }

  async getPartById(id: string) {
    return this.request<any>(`/api/parts/${id}`);
  }

  async createPart(data: any) {
    return this.request<any>('/api/parts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePart(id: string, data: any) {
    return this.request<any>(`/api/parts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePart(id: string) {
    return this.request<void>(`/api/parts/${id}`, {
      method: 'DELETE',
    });
  }

  // Warranty Claims
  async getWarrantyClaims() {
    return this.request<any[]>('/api/warranty');
  }

  async getWarrantyClaimById(id: string) {
    return this.request<any>(`/api/warranty/${id}`);
  }

  async createWarrantyClaim(data: {
    repairId: string;
    serialNumber?: string;
    claimReason: string;
    claimReasonTh: string;
  }) {
    return this.request<any>('/api/warranty', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateWarrantyClaimStatus(id: string, status: string) {
    return this.request<any>(`/api/warranty/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async updateWarrantyClaim(id: string, data: any) {
    return this.request<any>(`/api/warranty/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteWarrantyClaim(id: string) {
    return this.request<void>(`/api/warranty/${id}`, {
      method: 'DELETE',
    });
  }

  // Finance
  async getFinancialSummary(timeRange: string = '6m') {
    return this.request<{
      totalIncome: number;
      totalExpenses: number;
      netProfit: number;
      totalPartsCost: number; // ต้นทุนจริง
      totalPartsSalePrice: number; // ราคาขายอะไหล่
      partsMarkup: number; // กำไรจากอะไหล่
      partsMarkupPercentage: number; // % กำไรจากอะไหล่
      totalLaborCost: number;
      incomeChange: number;
      expensesChange: number;
      profitChange: number;
      profitMargin: number; // อัตรากำไร %
      totalStockValue: number; // มูลค่าสต็อก
      totalStockQuantity: number; // จำนวนสต็อกทั้งหมด
      averageProfitPerRepair: number; // กำไรเฉลี่ยต่องาน
      totalRepairs: number; // จำนวนงานที่เสร็จ
    }>(`/api/finance/summary?timeRange=${timeRange}`);
  }

  async getIncomeExpensesChart(timeRange: string = '6m') {
    return this.request<Array<{
      month: string;
      monthTh: string;
      income: number;
      expenses: number;
    }>>(`/api/finance/chart/income-expenses?timeRange=${timeRange}`);
  }

  async getExpenseBreakdown(timeRange: string = '6m') {
    return this.request<Array<{
      name: string;
      nameTh: string;
      value: number;
      amount: number;
    }>>(`/api/finance/chart/expense-breakdown?timeRange=${timeRange}`);
  }

  async getTransactions(timeRange: string = '6m', type: string = 'all', limit: number = 50) {
    return this.request<Array<{
      id: string;
      type: 'income' | 'expense';
      description: string;
      descriptionTh: string;
      amount: number;
      date: string;
      method: string;
      methodTh: string;
    }>>(`/api/finance/transactions?timeRange=${timeRange}&type=${type}&limit=${limit}`);
  }

  async getTodayRevenue() {
    return this.request<{
      todayRevenue: number;
      yesterdayRevenue: number;
      revenueChange: number;
    }>('/api/finance/today');
  }

  async getWeeklyIncomeExpenses() {
    return this.request<Array<{
      name: string;
      nameEn: string;
      income: number;
      expenses: number;
    }>>('/api/finance/chart/weekly');
  }
}

export const apiClient = new ApiClient(API_BASE_URL);