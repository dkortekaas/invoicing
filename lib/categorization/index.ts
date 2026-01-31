export {
  normalizeVendorName,
  findMatchingVendor,
  createVendorFromExpense,
  updateVendorUsage,
  searchVendors,
  type VendorMatch,
} from './vendor-matcher';

export {
  classifyExpense,
  getCategorySourceLabel,
  getExpenseCategoryLabel,
  type ClassificationResult,
} from './classifier';

export {
  recordCorrection,
  updateVendorCategory,
  getCorrectionStats,
  getMostLikelyCategoryForSupplier,
} from './learning-service';
