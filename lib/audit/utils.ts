/**
 * Helper to detect changes between old and new objects
 * This is a pure utility function, not a server action
 */
export function detectChanges<T extends Record<string, any>>(
  oldData: T | null,
  newData: T
): Record<string, { oldValue: any; newValue: any }> {
  const changes: Record<string, { oldValue: any; newValue: any }> = {}
  
  if (!oldData) {
    // All fields are new
    Object.keys(newData).forEach((key) => {
      if (newData[key] !== undefined && newData[key] !== null) {
        changes[key] = { oldValue: null, newValue: newData[key] }
      }
    })
    return changes
  }
  
  // Check for changes
  const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)])
  
  allKeys.forEach((key) => {
    const oldValue = oldData[key]
    const newValue = newData[key]
    
    // Skip undefined values and internal fields
    if (key === "updatedAt" || key === "createdAt") {
      return
    }
    
    // Compare values (handle dates, decimals, etc.)
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changes[key] = { oldValue, newValue }
    }
  })
  
  return changes
}
