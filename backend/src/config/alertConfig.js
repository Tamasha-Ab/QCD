export const ALERT_THRESHOLDS = {
    defectRate: {
        default: 5, // 5% threshold for high defect rate
        critical: 10 // 10% threshold for critical defect rate
    },
    inspectionFailure: true, // Generate alert on inspection failure
    criticalDefect: true // Generate alert on critical defect detection
};

export default ALERT_THRESHOLDS;