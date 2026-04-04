import {
  assertValid,
  validateRecentActivityQuery,
  validateRecordQuery,
  validateTrendQuery,
  validatePostCreate,
  validatePostUpdate
} from "./validation.js";

export function createDashboardService(recordModel) {
  return {
    async getSummary(query = {}) {
      assertValid(validateRecordQuery(query));

      const summary = await recordModel.getSummary(query);
      const categoryTotals = await recordModel.getCategoryTotals(query);
      const topCategory = await recordModel.getTopSpendingCategory(query);
      const growth = await recordModel.getMoMGrowth(query);

      return {
        ...summary,
        netBalance: summary.totalIncome - summary.totalExpenses,
        categoryTotals,
        topSpendingCategory: topCategory,
        growthMetrics: growth.length > 0 ? growth[0] : null
      };
    },
    async getTrends(query = {}) {
      assertValid(validateTrendQuery(query));

      return recordModel.getTrends(query);
    },
    async getRecentActivity(query = {}) {
      assertValid(validateRecentActivityQuery(query));

      return recordModel.getRecentActivity(query.limit);
    }
  };
}
